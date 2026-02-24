import { useState, useMemo, useRef, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { trainers } from "./data/trainers";
import { resolveCardImage } from "./data/tcgdex-map";
import TrainerDetail from "./components/TrainerDetail";
import CardDetail from "./components/CardDetail";
import TrainersList from "./components/TrainersList";
import SettingsPage from "./components/SettingsPage";

import PokeballIcon from "./components/PokeballIcon";

// Translation-aware card field accessor.
// Reads from translations[lang][field], falls back to original[field], then card[field] (backward compat).
function tCard(card, field, lang = "tr") {
  return card?.translations?.[lang]?.[field]
    ?? card?.original?.[field]
    ?? card?.[field]
    ?? "";
}

// Backward-compatible card number accessor (new: cardNumber, old: kartNo)
function cardNum(card) {
  return card?.cardNumber ?? card?.kartNo ?? "";
}

// Backward-compatible damage accessor (new: damage1/damage2, old: dmg1/dmg2)
function cardDmg(card, n) {
  return n === 1
    ? (card?.damage1 ?? card?.dmg1 ?? "")
    : (card?.damage2 ?? card?.dmg2 ?? "");
}

// Merge incoming cards with existing collection — increment copies for duplicates
function mergeNewCards(existingCards, newCards) {
  const incoming = Array.isArray(newCards) ? newCards : [newCards];
  const updated = existingCards.map((c) => ({ ...c }));
  const toAppend = [];

  for (const nc of incoming) {
    const ncNum = cardNum(nc);
    const idx = ncNum ? updated.findIndex((c) => cardNum(c) === ncNum) : -1;
    if (idx !== -1) {
      updated[idx] = { ...updated[idx], copies: updated[idx].copies + (nc.copies || 1) };
    } else {
      const pendingIdx = toAppend.findIndex((c) => ncNum && cardNum(c) === ncNum);
      if (pendingIdx !== -1) {
        toAppend[pendingIdx] = { ...toAppend[pendingIdx], copies: toAppend[pendingIdx].copies + (nc.copies || 1) };
      } else {
        toAppend.push(nc);
      }
    }
  }
  return [...updated, ...toAppend];
}

/* ── Type colors with neon glow variants ── */
const typeColors = {
  "Ot":       { bg: "#00c853", glow: "rgba(0,200,83,0.35)", dark: "#0a2e16", emoji: "🌿" },
  "Ateş":     { bg: "#ff4444", glow: "rgba(255,68,68,0.35)", dark: "#2e0a0a", emoji: "🔥" },
  "Su":       { bg: "#2196f3", glow: "rgba(33,150,243,0.35)", dark: "#0a1a2e", emoji: "💧" },
  "Elektrik": { bg: "#ffd600", glow: "rgba(255,214,0,0.35)", dark: "#2e2a0a", emoji: "⚡" },
  "Dövüş":    { bg: "#ff6d00", glow: "rgba(255,109,0,0.35)", dark: "#2e1a0a", emoji: "👊" },
  "Çelik":    { bg: "#78909c", glow: "rgba(120,144,156,0.35)", dark: "#1a1e22", emoji: "⚙️" },
  "Normal":   { bg: "#a1887f", glow: "rgba(161,136,127,0.35)", dark: "#221e1c", emoji: "⭐" },
  "Destekçi": { bg: "#ab47bc", glow: "rgba(171,71,188,0.35)", dark: "#1e0a22", emoji: "🃏" },
  "Karanlık": { bg: "#455a64", glow: "rgba(69,90,100,0.35)", dark: "#0e1215", emoji: "🌑" },
  "Psişik":   { bg: "#ab47bc", glow: "rgba(168,85,247,0.35)", dark: "#1e0a22", emoji: "🔮" },
};

const rarityLabels = { C: "Common", U: "Uncommon", M: "Holo Rare", RR: "Double Rare", R: "Rare", SR: "Secret Rare" };
const rarityOrder = { C: 1, U: 2, R: 3, M: 4, RR: 5, SR: 6 };
const rarityColors = { C: "#5a566e", U: "#00c896", M: "#7b61ff", RR: "#ffd166", R: "#8b5cf6", SR: "#ec4899" };
const rarityGlow = { C: "none", U: "0 0 8px rgba(0,200,150,0.3)", M: "0 0 12px rgba(255,203,5,0.4)", RR: "0 0 16px rgba(255,209,102,0.5)", R: "0 0 10px rgba(139,92,246,0.4)", SR: "0 0 16px rgba(236,72,153,0.5)" };

const PHONE_KEY = "pokemon_katalog_phone";
const DEVICE_KEY = "pokemon_katalog_device_id";

function loadPhone() {
  try { return localStorage.getItem(PHONE_KEY) || ""; } catch (_) { return ""; }
}

function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id); }
    return id;
  } catch (_) { return ""; }
}

function SyncIndicator({ status }) {
  const configs = {
    loading: { color: "var(--brand-yellow)", dot: "#FFCB05", label: "Yükleniyor..." },
    syncing: { color: "var(--brand-yellow)", dot: "#FFCB05", label: "Senkronize ediliyor..." },
    synced:  { color: "var(--brand-blue)", dot: "#2A75BB", label: "Senkronize edildi" },
    error:        { color: "#f72585", dot: "#f72585", label: "Senkronizasyon hatası" },
    device_error: { color: "#f72585", dot: "#f72585", label: "Cihaz uyuşmazlığı" },
  };
  const cfg = configs[status];
  if (!cfg) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 10, fontFamily: "'Comic Neue', cursive", color: cfg.color,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: cfg.dot,
        boxShadow: (status === "syncing" || status === "loading") ? `0 0 8px ${cfg.dot}` : "none",
        animation: (status === "syncing" || status === "loading") ? "glowPulse 1.2s ease-in-out infinite" : "none",
      }} />
      {cfg.label}
    </span>
  );
}

function PhoneModal({ onSave, onClose, allowClose = true }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const digits = value.replace(/\D/g, "");
    if (!/^5[0-9]{9}$/.test(digits)) {
      setError("Geçerli bir Türkiye numarası girin: 5XX XXX XX XX (başında 0 olmadan)");
      return;
    }
    onSave("+90" + digits);
  };

  const content = (
    <div className="modal-content" style={{ maxWidth: 400, width: "100%" }}>
      <h2 style={{
        fontFamily: "'Bangers', cursive", fontSize: 22, fontWeight: 700,
        margin: "0 0 8px", color: "#fff",
      }}>
        {allowClose ? "Bulut Senkronizasyonu" : "Haydi Başlayalım!"}
      </h2>
      <p style={{ fontSize: 15, color: "rgba(255, 255, 255, 0.9)", margin: "0 0 20px", fontFamily: "'Comic Neue', cursive", fontWeight: 600 }}>
        {allowClose
          ? "Koleksiyonunuzu cihazlar arasında senkronize etmek için telefon numaranızı girin."
          : "Yeni bir koleksiyon yaratmak veya kayıtlı koleksiyonunuzu yüklemek için telefon numaranızı girin."}
      </p>
      <input
        className="holo-input"
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(""); }}
        placeholder="5XX XXX XX XX"
        type="tel"
        style={{ width: "100%", marginBottom: 8, boxSizing: "border-box" }}
        autoFocus
      />
      {error && (
        <p style={{ color: "#f72585", fontSize: 14, margin: "0 0 12px", fontFamily: "'Comic Neue', cursive", fontWeight: 600 }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button className={allowClose ? "btn-glow" : "btn-accent"} style={{ flex: 1, ...(!allowClose && { fontFamily: "'Bangers', cursive", fontSize: 30 }) }} onClick={handleSubmit}>
          {allowClose ? "Kaydet" : "Başla"}
        </button>
        {allowClose && <button className="btn-accent" onClick={onClose}>İptal</button>}
      </div>
    </div>
  );

  if (!allowClose) return content;
  return <div className="modal-overlay">{content}</div>;
}


/* ── Sub-components ── */

function TypeBadge({ type, size }) {
  const t = typeColors[type] || typeColors["Normal"];
  const isLg = size === "lg";
  return (
    <span style={{
      background: t.bg,
      color: "#fff",
      borderRadius: 20,
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: isLg ? "4px 14px" : "3px 10px",
      fontSize: isLg ? 13 : 11,
      boxShadow: `0 0 10px ${t.glow}`,
      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      letterSpacing: "0.02em",
    }}>
      {t.emoji} {type}
    </span>
  );
}

function RarityBadge({ rarity }) {
  return (
    <span style={{
      background: rarityColors[rarity] || "#5a566e",
      color: (rarity === "RR" || rarity === "SR") ? "#1A3F6F" : "#fff",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      boxShadow: rarityGlow[rarity],
      letterSpacing: "0.03em",
    }}>
      {rarity}
    </span>
  );
}

function CardTile({ card, compareMode, isSelected, onToggle, index, scrollRef, onDelete, favorites, onToggleFavorite }) {
  const [imgErr, setImgErr] = useState(false);
  const t = typeColors[tCard(card, "type")] || typeColors["Normal"];
  const isFav = favorites && favorites.includes(card.id);
  const trainer = card.trainer && trainers[card.trainer];

  return (
    <div
      className={`poke-card ${isSelected ? "selected" : ""}`}
      style={{ animationDelay: `${Math.min(index * 0.04, 0.8)}s` }}
    >
      {compareMode && (
        <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10 }}>
          <input type="checkbox" className="holo-checkbox" checked={isSelected} onChange={() => onToggle(card.id)} />
        </div>
      )}

      <Link to={`/card/${card.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}
        onClick={() => { if (scrollRef) scrollRef.current = window.scrollY; }}>

        {/* Image area */}
        <div style={{
          aspectRatio: "5/7", overflow: "hidden", position: "relative",
          borderRadius: "16px 16px 0 0",
          display: "flex", justifyContent: "center", alignItems: "center",
          background: "var(--bg-elevated)",
        }}>
          {resolveCardImage(card) && !imgErr ? (
            <img src={resolveCardImage(card)} alt={tCard(card, "name")} onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              crossOrigin="anonymous" />
          ) : (
            <div style={{ fontSize: 48, opacity: 0.3 }}>{t.emoji}</div>
          )}
          {/* Copy badge — bottom-right of image */}
          {card.copies > 1 && (
            <span style={{
              position: "absolute", bottom: 8, right: 8, zIndex: 5,
              background: "rgba(0,0,0,0.7)", color: "#fff",
              borderRadius: 10, padding: "2px 8px",
              fontSize: 11, fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
              x{card.copies}
            </span>
          )}
        </div>

        {/* Info section */}
        <div style={{
          padding: "10px 14px 14px",
          borderTop: `1px solid ${t.bg}33`,
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          {/* Name row */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{
              fontFamily: "'Bangers', cursive", fontWeight: 700, fontSize: 15,
              color: "var(--text-primary)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              flex: 1,
            }}>
              {tCard(card, "name")}
            </span>
          </div>

          {/* Trainer link */}
          {trainer && card.trainer && (
            <div style={{ fontSize: 11, lineHeight: "1.4" }}>
              <Link
                to={`/trainer/${card.trainer}`}
                onClick={(e) => { e.stopPropagation(); if (scrollRef) scrollRef.current = window.scrollY; }}
                style={{
                  fontFamily: "'Comic Neue', cursive", fontWeight: 400,
                  color: "var(--accent)", textDecoration: "none",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  display: "block",
                }}
              >
                {trainer.name}
              </Link>
            </div>
          )}

          {/* Badges row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#fff",
              background: t.bg, borderRadius: 20, padding: "3px 10px",
            }}>
              {tCard(card, "type")}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#fff",
              background: rarityColors[card.rarity] || "#5a566e",
              borderRadius: 20, padding: "3px 10px",
            }}>
              {card.rarity}
            </span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>
              {cardNum(card)}
            </span>
          </div>

          {/* HP row */}
          {card.hp > 0 && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "rgba(255,203,5,0.05)",
              border: "1px solid rgba(255,203,5,0.15)",
              borderRadius: 8, padding: "6px 10px",
            }}>
              <span style={{ fontSize: 11, fontFamily: "'Comic Neue', cursive", color: "var(--text-muted)" }}>HP</span>
              <span style={{ fontFamily: "'Bangers', cursive", fontSize: 13, fontWeight: 700, color: "var(--holo-1)" }}>
                {card.hp}
              </span>
            </div>
          )}

          {/* Market value row */}
          {card.marketValue > 0 && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "rgba(255,203,5,0.05)",
              border: "1px solid rgba(255,203,5,0.15)",
              borderRadius: 8, padding: "6px 10px",
            }}>
              <span style={{ fontSize: 11, fontFamily: "'Comic Neue', cursive", color: "var(--text-muted)" }}>Piyasa Değeri</span>
              <span style={{ fontFamily: "'Bangers', cursive", fontSize: 13, fontWeight: 700, color: "var(--holo-1)" }}>
                ${card.marketValue.toFixed(2)}
              </span>
            </div>
          )}
        </div>

      </Link>

      {/* Action bar — favorite + delete */}
      {(onToggleFavorite || (!compareMode && onDelete)) && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px 12px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(card.id); }}
              style={{
                flex: 1,
                background: isFav ? "rgba(247,37,133,0.15)" : "rgba(255,255,255,0.04)",
                border: isFav ? "1px solid rgba(247,37,133,0.35)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "6px 0",
                color: isFav ? "#f72585" : "#c0bdd0",
                fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {isFav ? "♥" : "♡"}
            </button>
          )}
          {!compareMode && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(card); }}
              className="card-delete-btn"
              title="Kartı Sil"
              style={{
                flex: 1,
                background: "rgba(247,37,133,0.07)",
                border: "1px solid rgba(247,37,133,0.2)",
                borderRadius: 8, padding: "6px 0",
                color: "#ff4d6d",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CompareView({ cards, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 1000, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'Bangers', cursive", color: "var(--text-primary)" }}>
            &#x2694; Kart Karşılaştırma
          </h2>
          <button className="btn-danger" onClick={onClose}>&#x2715; Kapat</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, 1fr)`, gap: 16 }}>
          {cards.map((card) => {
            const t = typeColors[tCard(card, "type")] || typeColors["Normal"];
            return (
              <div key={card.id} style={{
                border: `2px solid ${t.bg}`, borderRadius: 16, overflow: "hidden",
                background: `linear-gradient(180deg, ${t.dark}, var(--bg-card))`,
                boxShadow: `0 0 20px ${t.glow}`,
              }}>
                <div style={{ padding: 16, display: "flex", justifyContent: "center",
                  background: `radial-gradient(ellipse at 50% 80%, ${t.glow}, transparent 70%)` }}>
                  {resolveCardImage(card) ? (
                    <img src={resolveCardImage(card)} alt={tCard(card, "name")}
                      style={{ maxHeight: 110, objectFit: "contain", filter: `drop-shadow(0 4px 16px ${t.glow})` }}
                      crossOrigin="anonymous" />
                  ) : (
                    <div style={{ fontSize: 48, padding: 20 }}>{t.emoji}</div>
                  )}
                </div>
                <div style={{ padding: "0 14px 14px" }}>
                  <div style={{ textAlign: "center", marginBottom: 10 }}>
                    <TypeBadge type={tCard(card, "type")} size="lg" />
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: "8px 0 2px", fontFamily: "'Bangers', cursive", color: "var(--text-primary)" }}>
                      {tCard(card, "name")}
                    </h3>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>{cardNum(card)}</div>
                  </div>
                  {[["HP", card.hp > 0 ? card.hp : "-"], ["Aşama", tCard(card, "stage")],
                    ["Nadirlik", `${card.rarity} (${rarityLabels[card.rarity] || ""})`],
                    ["Zayıflık", card.weakness ?? card.original?.weakness], ["Çekilme", card.retreat], ["Kopya", `×${card.copies}`],
                    ["Piyasa Değeri", `$${(card.marketValue || 0).toFixed(2)}`],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 14, fontWeight: 600 }}>
                      <span style={{ color: "var(--text-muted)" }}>{l}</span>
                      <span style={{ fontWeight: 700, color: l === "HP" && v >= 150 ? "#ff4d6d" : l === "Piyasa Değeri" ? "#FFCB05" : "var(--text-primary)" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "var(--text-secondary)" }}>Saldırılar</div>
                    {tCard(card, "attack1") && <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{tCard(card, "attack1")}: <b style={{ color: "#ff4d6d" }}>{cardDmg(card, 1) || "—"}</b></div>}
                    {tCard(card, "attack2") && <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{tCard(card, "attack2")}: <b style={{ color: "#ff4d6d" }}>{cardDmg(card, 2) || "—"}</b></div>}
                  </div>
                  {tCard(card, "ability") && (
                    <div style={{ marginTop: 6, background: "rgba(255,203,5,0.1)", border: "1px solid rgba(255,203,5,0.2)",
                      padding: "4px 8px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#FFCB05" }}>
                      &#x2728; {tCard(card, "ability")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PhotoUploadModal({ onClose, onAdd }) {
  const [phase, setPhase] = useState("upload");
  const [preview, setPreview] = useState(null);
  const [imageBase64, setImageBase64] = useState("");
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [extractedCards, setExtractedCards] = useState([]);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [imgErrs, setImgErrs] = useState({});

  const resolveReviewCardImage = (card) => {
    // Prefer card.img set by TCGdex name lookup in the API
    if (card.img) return card.img;
    const fromMap = resolveCardImage(card);
    if (fromMap) return fromMap;
    // Only construct ME02 URL when the card is confirmed to be from ME02 (set total = 080).
    // Cards from other sets (e.g. 073/182) must not use ME02 position URLs — they map
    // to completely different Pokémon in that set.
    const parts = cardNum(card)?.split("/");
    const num = parts?.[0]?.trim();
    const setTotal = parts?.[1]?.trim();
    if (!num || isNaN(+num) || setTotal !== "080") return "";
    return `https://assets.tcgdex.net/en/me/me02/${num.padStart(3, "0")}/high.png`;
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Lutfen bir gorsel dosyasi secin.");
      return;
    }
    if (file.size > 15_000_000) {
      setError("Dosya boyutu 15MB'dan kucuk olmali.");
      return;
    }
    setError("");
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setPreview(dataUrl);
      setImageBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const analyzeImage = async () => {
    if (!imageBase64) return;
    setPhase("analyzing");
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analiz basarisiz");
      if (!data.cards || data.cards.length === 0) {
        setError("Fotograf uzerinde kart bulunamadi. Tekrar deneyin.");
        setPhase("upload");
        return;
      }
      const withIds = data.cards.map((c, i) => ({
        ...c,
        id: Date.now() + i,
        hp: +c.hp || 0,
        copies: +c.copies || 1,
        marketValue: +c.marketValue || 0,
        // Ensure nested objects exist for new schema
        original: c.original || {},
        translations: c.translations || { en: {}, tr: {} },
      }));
      setExtractedCards(withIds);
      setPhase("review");
    } catch (err) {
      setError(err.message);
      setPhase("upload");
    }
  };

  const updateCard = (idx, field, value) =>
    setExtractedCards((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );

  // Update a nested translation field: updateCardTranslation(idx, "tr", "type", "Ot")
  const updateCardTranslation = (idx, lang, field, value) =>
    setExtractedCards((prev) =>
      prev.map((c, i) =>
        i === idx
          ? { ...c, translations: { ...c.translations, [lang]: { ...c.translations?.[lang], [field]: value } } }
          : c
      )
    );

  const removeCard = (idx) =>
    setExtractedCards((prev) => prev.filter((_, i) => i !== idx));

  const confirmAdd = () => {
    const now = new Date().toISOString();
    const cleaned = extractedCards.map((c) => ({
      ...c,
      addedAt: c.addedAt || now,
      hp: +c.hp || 0,
      copies: +c.copies || 1,
      marketValue: +c.marketValue || 0,
    }));
    onAdd(cleaned);
    onClose();
  };

  const lbl = { fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4, display: "block" };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 700, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <PokeballIcon size={28} style={{ filter: "drop-shadow(0 0 6px rgba(255,203,5,0.4))" }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'Bangers', cursive", color: "var(--text-primary)" }}>
            Fotoğraftan Kart Ekle
          </h2>
        </div>

        {/* ── Upload Phase ── */}
        {phase === "upload" && (
          <>
            <div
              className={`upload-zone ${isDragging ? "dragging" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById("card-photo-input").click()}
            >
              <input
                id="card-photo-input"
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files[0])}
                style={{ display: "none" }}
              />
              {preview ? (
                <img src={preview} alt="Preview" style={{ maxHeight: 280, maxWidth: "100%", borderRadius: 12, objectFit: "contain" }} />
              ) : (
                <div>
                  <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>&#x1F4F7;</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 16, fontWeight: 700 }}>
                    Kart fotografini surukleyin veya tiklayin
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 600, marginTop: 6 }}>
                    Tek kart veya kart sayfasi fotografi yukleyebilirsiniz
                  </div>
                </div>
              )}
            </div>
            {error && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(247,37,133,0.1)", border: "1px solid rgba(247,37,133,0.3)", borderRadius: 10, color: "#ff4d6d", fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn-glow" onClick={onClose}>Iptal</button>
              {preview && (
                <button className="btn-emerald" onClick={analyzeImage}>&#x1F50D; Analiz Et</button>
              )}
            </div>
          </>
        )}

        {/* ── Analyzing Phase ── */}
        {phase === "analyzing" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="spinner" />
            <div style={{ color: "var(--text-secondary)", fontSize: 16, fontWeight: 700 }}>
              Kartlar analiz ediliyor...
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 600, marginTop: 6 }}>
              Bu islem birkaç saniye surebilir
            </div>
          </div>
        )}

        {/* ── Review Phase ── */}
        {phase === "review" && (
          <>
            <div style={{ color: "var(--text-secondary)", fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
              {extractedCards.length} kart bulundu. Eklemek istediklerinizi onaylayın, istemeyenleri reddedin.
            </div>
            <div style={{ maxHeight: "55vh", overflowY: "auto", paddingRight: 4 }}>
              {extractedCards.map((card, idx) => {
                const t = typeColors[tCard(card, "type")] || typeColors["Normal"];
                const imgSrc = resolveReviewCardImage(card);
                return (
                  <div key={idx} className="review-card-row">
                    {/* Approve/reject header row with card image */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Card image */}
                      <div style={{
                        width: 64, flexShrink: 0,
                        aspectRatio: "5/7",
                        borderRadius: 8,
                        overflow: "hidden",
                        background: "var(--bg-elevated)",
                        display: "flex", justifyContent: "center", alignItems: "center",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}>
                        {imgSrc && !imgErrs[idx] ? (
                          <img
                            src={imgSrc}
                            alt={tCard(card, "name")}
                            crossOrigin="anonymous"
                            onError={() => setImgErrs((prev) => ({ ...prev, [idx]: true }))}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        ) : (
                          <div style={{ fontSize: 28, opacity: 0.3 }}>{t.emoji}</div>
                        )}
                      </div>
                      {/* Card info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bangers', cursive", fontSize: 17, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {tCard(card, "name") || "—"}
                        </div>
                        {card.original?.name && card.original.name !== tCard(card, "name") && (
                          <div style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600, marginTop: 1, fontStyle: "italic" }}>
                            {card.original.name}
                          </div>
                        )}
                        <div style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 600, marginTop: 2 }}>{cardNum(card) || "—"}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                          <span style={{ background: t.bg, color: t.text, fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "2px 7px" }}>{tCard(card, "type")}</span>
                          {card.rarity && <span style={{ background: "rgba(255,255,255,0.08)", color: "#c4bfda", fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "2px 7px" }}>{card.rarity}</span>}
                          {card.hp > 0 && <span style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", fontSize: 10, borderRadius: 6, padding: "2px 7px" }}>HP {card.hp}</span>}
                        </div>
                      </div>
                      {/* Approve / Reject */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "5px 10px" }}>
                          <span style={{ color: "#10b981", fontSize: 13, fontWeight: 700 }}>&#x2713;</span>
                          <span style={{ color: "#10b981", fontSize: 11, fontWeight: 600 }}>Onayla</span>
                        </div>
                        <button
                          className="btn-danger"
                          style={{ padding: "5px 10px", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}
                          onClick={() => removeCard(idx)}
                        >
                          <span>&#x2715;</span> Reddet
                        </button>
                      </div>
                    </div>
                    {/* Collapsible edit fields */}
                    <div style={{ marginTop: 10 }}>
                      <button
                        className="btn-glow"
                        style={{ padding: "4px 12px", fontSize: 11 }}
                        onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                      >
                        {expandedIdx === idx ? "▲ Düzenlemeyi Gizle" : "▼ Düzenle"}
                      </button>
                      {expandedIdx === idx && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                            <div>
                              <label style={lbl}>Ad (Orijinal)</label>
                              <input className="holo-input" style={{ width: "100%", opacity: 0.7 }} value={card.original?.name ?? ""} readOnly title="Karttaki orijinal ad" />
                            </div>
                            <div>
                              <label style={lbl}>Ad (TR)</label>
                              <input className="holo-input" style={{ width: "100%" }} value={tCard(card, "name", "tr")} onChange={(e) => updateCardTranslation(idx, "tr", "name", e.target.value)} />
                            </div>
                            <div>
                              <label style={lbl}>Ad (EN)</label>
                              <input className="holo-input" style={{ width: "100%" }} value={tCard(card, "name", "en")} onChange={(e) => updateCardTranslation(idx, "en", "name", e.target.value)} />
                            </div>
                            <div>
                              <label style={lbl}>Tür (TR)</label>
                              <select className="holo-select" style={{ width: "100%" }} value={tCard(card, "type", "tr")} onChange={(e) => updateCardTranslation(idx, "tr", "type", e.target.value)}>
                                {Object.keys(typeColors).map((t) => <option key={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={lbl}>HP</label>
                              <input className="holo-input" style={{ width: "100%" }} type="number" value={card.hp} onChange={(e) => updateCard(idx, "hp", e.target.value)} />
                            </div>
                            <div>
                              <label style={lbl}>Nadirlik</label>
                              <select className="holo-select" style={{ width: "100%" }} value={card.rarity} onChange={(e) => updateCard(idx, "rarity", e.target.value)}>
                                {Object.entries(rarityLabels).map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={lbl}>Aşama (TR)</label>
                              <select className="holo-select" style={{ width: "100%" }} value={tCard(card, "stage", "tr")} onChange={(e) => updateCardTranslation(idx, "tr", "stage", e.target.value)}>
                                {["Temel", "1. Aşama", "2. Aşama", "Mega ex", "Temel ex", "Destekçi", "Eşya", "Araç", "Stadyum"].map((v) => <option key={v}>{v}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={lbl}>Kart No</label>
                              <input className="holo-input" style={{ width: "100%" }} value={cardNum(card)} onChange={(e) => updateCard(idx, "cardNumber", e.target.value)} />
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            {[["Saldırı 1 (TR)", "attack1"], ["Saldırı 2 (TR)", "attack2"], ["Yetenek (TR)", "ability"]].map(([l, k]) => (
                              <div key={k}><label style={lbl}>{l}</label>
                                <input className="holo-input" style={{ width: "100%" }} value={tCard(card, k, "tr")} onChange={(e) => updateCardTranslation(idx, "tr", k, e.target.value)} />
                              </div>
                            ))}
                            <div><label style={lbl}>Hasar 1</label>
                              <input className="holo-input" style={{ width: "100%" }} value={cardDmg(card, 1)} onChange={(e) => updateCard(idx, "damage1", e.target.value)} />
                            </div>
                            <div><label style={lbl}>Hasar 2</label>
                              <input className="holo-input" style={{ width: "100%" }} value={cardDmg(card, 2)} onChange={(e) => updateCard(idx, "damage2", e.target.value)} />
                            </div>
                            <div><label style={lbl}>Zayıflık</label>
                              <input className="holo-input" style={{ width: "100%" }} value={card.original?.weakness ?? card.weakness ?? ""} onChange={(e) => updateCard(idx, "weakness", e.target.value)} />
                            </div>
                            <div><label style={lbl}>Çekilme</label>
                              <input className="holo-input" style={{ width: "100%" }} value={card.retreat ?? ""} onChange={(e) => updateCard(idx, "retreat", e.target.value)} />
                            </div>
                            <div><label style={lbl}>Kopya</label>
                              <input className="holo-input" style={{ width: "100%" }} type="number" value={card.copies} onChange={(e) => updateCard(idx, "copies", e.target.value)} />
                            </div>
                            <div><label style={lbl}>Piyasa Değeri (USD)</label>
                              <input className="holo-input" style={{ width: "100%" }} type="number" step="0.01" value={card.marketValue} onChange={(e) => updateCard(idx, "marketValue", e.target.value)} placeholder="0.00" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {error && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(247,37,133,0.1)", border: "1px solid rgba(247,37,133,0.3)", borderRadius: 10, color: "#ff4d6d", fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn-glow" onClick={onClose}>Iptal</button>
              {extractedCards.length > 0 && (
                <button className="btn-emerald" onClick={confirmAdd}>
                  &#x2795; {extractedCards.length} Kart Ekle
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DeleteConfirmModal({ card, onConfirm, onClose }) {
  const t = typeColors[tCard(card, "type")] || typeColors["Normal"];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 420, width: "100%", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{
          fontSize: 22, fontWeight: 700, marginBottom: 16,
          fontFamily: "'Bangers', cursive", color: "var(--text-primary)",
        }}>
          🗑️ Kartı Sil
        </h2>

        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          marginBottom: 20, padding: 16,
          background: `radial-gradient(ellipse at 50% 80%, ${t.glow}, transparent 70%)`,
          borderRadius: 12,
        }}>
          {resolveCardImage(card) && (
            <img src={resolveCardImage(card)} alt={tCard(card, "name")}
              style={{
                maxHeight: 120, objectFit: "contain",
                filter: `drop-shadow(0 4px 16px ${t.glow})`,
                marginBottom: 12,
              }} crossOrigin="anonymous" />
          )}
          <div style={{
            fontWeight: 700, fontSize: 18, color: "var(--text-primary)",
            fontFamily: "'Bangers', cursive",
          }}>
            {tCard(card, "name")}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <TypeBadge type={tCard(card, "type")} />
            <RarityBadge rarity={card.rarity} />
          </div>
        </div>

        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
          {card.copies > 1
            ? <>Bu kartın <strong style={{ color: "var(--text-primary)" }}>{card.copies} kopyası</strong> var. 1 kopya silinecek.</>
            : <>Bu kartı koleksiyonunuzdan silmek istediğinize emin misiniz?<br /><span style={{ color: "#ff4d6d", fontSize: 12 }}>Bu işlem geri alınamaz.</span></>
          }
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn-glow" onClick={onClose}>İptal</button>
          <button className="btn-danger" onClick={() => onConfirm(card.id)}>
            🗑️ Sil
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryView({ stats, cards, favorites, portrait, setPortrait }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portraitError, setPortraitError] = useState("");

  const resizeImage = (file, maxSize) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handlePortraitUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setPortraitError("Dosya çok büyük (maks. 10MB)");
      return;
    }
    setPortraitError("");
    setPortraitLoading(true);
    try {
      const { base64, mimeType } = await resizeImage(file, 512);
      const res = await fetch("/api/portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Sunucu hatası");
      }
      const data = await res.json();
      setPortrait(`data:image/png;base64,${data.portraitBase64}`);
    } catch (err) {
      setPortraitError(err.message || "Bağlantı hatası");
    } finally {
      setPortraitLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const widgetStyle = {
    background: "var(--bg-card)", border: "1px solid var(--border-dim)",
    borderRadius: 16, padding: 14, marginBottom: 0,
    aspectRatio: "1 / 1", overflow: "hidden",
    display: "flex", flexDirection: "column",
  };
  const headerRow = {
    display: "flex", alignItems: "center", gap: 6, marginBottom: 6, width: "100%",
  };
  const headerIcon = (color) => ({ fontSize: 20, color, flexShrink: 0 });
  const headerTitle = {
    fontFamily: "'Bangers', cursive", fontSize: 18, fontWeight: 700,
    color: "var(--text-primary)",
  };
  const bigNum = (color) => ({
    fontFamily: "'Bangers', cursive", fontSize: 32, fontWeight: 800, color,
  });
  const subText = { fontSize: 15, fontWeight: 600, color: "var(--text-muted)" };
  const chipBase = {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 8px", borderRadius: 8, fontSize: 14, fontWeight: 700,
  };

  return (
    <div style={{
      position: "relative", zIndex: 1, background: "var(--bg-deep)", minHeight: "100vh",
      padding: "0 0 100px", maxWidth: 600, margin: "0 auto",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 16px 10px",
        background: "var(--bg-card)",
      }}>
        <PokeballIcon size={28} />
        <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: 24, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>KOLEKSİYONUM</h2>
      </div>

      <div style={{ padding: "20px 16px" }}>
      {/* Portrait Widget */}
      <div
        style={{
          background: "var(--bg-card)", border: "1px solid var(--border-dim)",
          borderRadius: 16, overflow: "hidden", marginBottom: 12,
          width: "100%", aspectRatio: "1 / 1", position: "relative",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: !portrait && !portraitLoading ? "pointer" : "default",
        }}
        onClick={() => { if (!portrait && !portraitLoading) fileInputRef.current?.click(); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handlePortraitUpload}
        />
        {portraitLoading ? (
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12, animation: "pulse 1.5s ease-in-out infinite" }}>🎨</div>
            <div style={{ fontFamily: "'Bangers', cursive", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
              Anime portreniz oluşturuluyor...
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-muted)", marginTop: 4 }}>Bu işlem 30 saniye kadar sürebilir</div>
          </div>
        ) : portrait ? (
          <>
            <img
              src={portrait}
              alt="Koleksiyoncu portresi"
              style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setPortrait(null); }}
              style={{
                position: "absolute", top: 10, right: 10, zIndex: 2,
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title="Porteyi kaldır"
            >✕</button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12, color: "var(--text-muted)" }}>📷</div>
            <div style={{ fontFamily: "'Bangers', cursive", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
              Koleksiyoncu Portresi
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-muted)", marginTop: 4 }}>
              Fotoğraf yüklemek için dokunun
            </div>
            {portraitError && (
              <div style={{ fontSize: 16, fontWeight: 600, color: "#f44336", marginTop: 8 }}>{portraitError}</div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* W-Value */}
        <div style={widgetStyle}>
          <div style={headerRow}>
            <span style={headerIcon("#2A75BB")}>💰</span>
            <span style={headerTitle}>Koleksiyon Değeri</span>
            <div style={{ flex: 1 }} />
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>›</span>
          </div>
          <div style={bigNum("var(--text-primary)")}>${stats.totalValue.toFixed(2)}</div>
          <div style={subText}>{stats.total} kartın toplam piyasa değeri</div>
        </div>

        {/* W-Cards */}
        <div style={widgetStyle}>
          <div style={headerRow}>
            <span style={headerIcon("#2A75BB")}>🃏</span>
            <span style={headerTitle}>Kartlarım</span>
            <div style={{ flex: 1 }} />
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>›</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={bigNum("var(--text-primary)")}>{stats.total}</span>
            <span style={{ fontSize: 18, fontWeight: 500, color: "var(--text-muted)" }}>kart</span>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
            {Object.entries(stats.rarityCounts || {}).sort((a, b) => (rarityOrder[a[0]] || 0) - (rarityOrder[b[0]] || 0)).map(([r, count]) => (
              <span key={r} style={{ ...chipBase, background: `${rarityColors[r]}15`, color: rarityColors[r] }}>
                {r}: {count}
              </span>
            ))}
          </div>
        </div>

        {/* W-TopCard */}
        {stats.topCard && (
          <div style={{ ...widgetStyle, cursor: "pointer" }} onClick={() => navigate(`/card/${stats.topCard.id}`)}>
            <div style={headerRow}>
              <span style={headerIcon("#d4a800")}>🏆</span>
              <span style={headerTitle}>En Değerli Kart</span>
              <div style={{ flex: 1 }} />
              <span style={{ color: "var(--text-muted)", fontSize: 14 }}>›</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", gap: 6 }}>
              {resolveCardImage(stats.topCard) && (
                <img src={resolveCardImage(stats.topCard)} alt={tCard(stats.topCard, "name")}
                  style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 6 }}
                  crossOrigin="anonymous" />
              )}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 18, fontFamily: "'Bangers', cursive", color: "var(--text-primary)", lineHeight: 1.2 }}>
                  {tCard(stats.topCard, "name")}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>
                  {stats.topCard.rarity} · {tCard(stats.topCard, "type")}
                </div>
                <div style={{ fontWeight: 700, fontSize: 18, fontFamily: "'Bangers', cursive", color: "#2A75BB" }}>
                  ${(stats.topCard.marketValue || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* W-Types */}
        <div style={widgetStyle}>
          <div style={headerRow}>
            <span style={headerIcon("#2A75BB")}>📊</span>
            <span style={headerTitle}>Tür Dağılımı</span>
            <div style={{ flex: 1 }} />
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>›</span>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {Object.entries(stats.types).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const tc = typeColors[type] || typeColors["Normal"];
              return (
                <span key={type} style={{ ...chipBase, background: `${tc.bg}15`, color: tc.bg }}>
                  {tc.emoji} {type} ({count})
                </span>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function BottomTabBar({ onAddClick }) {
  const location = useLocation();
  const p = location.pathname;
  const isOzet = p === "/ozet";
  const isHome = p === "/" || p.startsWith("/card/");
  const isTrainers = p === "/egitmenler" || p.startsWith("/trainer");
  const isSettings = p === "/ayarlar";

  const tabStyle = (active) => ({
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 3, flex: 1, cursor: "pointer", background: "transparent",
    border: "none", textDecoration: "none", position: "relative",
    transition: "color 0.2s ease", fontFamily: "'Comic Neue', cursive",
    fontSize: 10, fontWeight: 600,
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
    height: "100%",
  });

  const iconLayers = (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
  const iconChart = (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>;
  const iconUsers = (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 1-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  const iconSettings = (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;

  return (
    <nav className="bottom-tab-bar" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      height: 60, display: "flex", alignItems: "center",
      justifyContent: "space-around",
      background: "rgba(255, 255, 255, 0.12)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
    }}>
      <Link to="/ozet" className={`tab-nav-btn${isOzet ? " active" : ""}`} style={tabStyle(isOzet)}>
        {iconChart("#fff")}
        <span>Özet</span>
      </Link>

      <Link to="/" className={`tab-nav-btn${isHome ? " active" : ""}`} style={tabStyle(isHome)}>
        {iconLayers("#fff")}
        <span>Kartlarım</span>
      </Link>

      <button className="tab-add-btn" onClick={onAddClick} style={{
        ...tabStyle(false),
        fontSize: 18,
        transform: "scale(1.2)",
      }}>
        <span>Kart Ekle</span>
      </button>

      <Link to="/egitmenler" className={`tab-nav-btn${isTrainers ? " active" : ""}`} style={tabStyle(isTrainers)}>
        {iconUsers("#fff")}
        <span>Eğitmenler</span>
      </Link>

      <Link to="/ayarlar" className={`tab-nav-btn${isSettings ? " active" : ""}`} style={tabStyle(isSettings)}>
        {iconSettings("#fff")}
        <span>Ayarlar</span>
      </Link>
    </nav>
  );
}

/* ── Main App ── */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function CatalogueView({ scrollRef, children }) {
  useEffect(() => {
    if (scrollRef.current > 0) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollRef.current);
      });
    }
  }, []);
  return <>{children}</>;
}

// Wrapper to force remount on card change (triggers intro flip animation)
function CardDetailWrapper(props) {
  const { cardId } = useParams();
  return <CardDetail key={cardId} {...props} />;
}

export default function App() {
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tümü");
  const [rarityFilter, setRarityFilter] = useState("Tümü");
  const [sortBy, setSortBy] = useState("rarity");
  const [sortDir, setSortDir] = useState("desc");
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [theme, setTheme] = useState("light");
  const [ownerName, setOwnerName] = useState("Koleksiyoncu");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [phone, setPhone] = useState(loadPhone);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [deviceError, setDeviceError] = useState("");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [portrait, setPortrait] = useState(null);
  const scrollRef = useRef(0);
  const phoneRef = useRef(phone);
  const skipSaveRef = useRef(false);
  const portraitDirtyRef = useRef(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Keep phone in localStorage so it survives page refresh
  useEffect(() => {
    phoneRef.current = phone;
    try { localStorage.setItem(PHONE_KEY, phone); } catch (_) {}
  }, [phone]);

  // Apply theme to document
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  // Fetch collection from server when phone changes
  useEffect(() => {
    if (!phone) {
      setCards([]);
      setFavorites([]);
      setTheme("dark");
      setOwnerName("Koleksiyoncu");
      setSyncStatus("idle");
      skipSaveRef.current = false;
      return;
    }
    skipSaveRef.current = true;
    setSyncStatus("loading");
    setDeviceError("");
    const deviceId = getDeviceId();
    fetch(`/api/collection?phone=${encodeURIComponent(phone)}&device_id=${encodeURIComponent(deviceId)}`)
      .then((r) => {
        if (r.status === 403) {
          setPhone("");
          setDeviceError("Bu numara başka bir cihaza bağlı. Lütfen kendi numaranızı girin.");
          setSyncStatus("idle");
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (!json) return;
        if (json.exists && json.data) {
          // Auto-migrate: strip PokeAPI sprite URLs so tcgdexImageMap takes over
          const rawCards = json.data.cards ?? [];
          const migratedCards = rawCards.map((c) =>
            c.img && c.img.includes("githubusercontent.com/PokeAPI")
              ? { ...c, img: "" }
              : c
          );
          setCards(migratedCards);
          setFavorites(json.data.favorites ?? []);
          setTheme(json.data.theme ?? "light");
          setOwnerName(json.data.owner_name ?? "Koleksiyoncu");
          setPortrait(json.data.portrait ?? null);
        }
        setSyncStatus("idle");
      })
      .catch(() => setSyncStatus("error"))
      .finally(() => { skipSaveRef.current = false; });
  }, [phone]);

  // Debounced save to server on any collection change
  useEffect(() => {
    if (skipSaveRef.current || !phoneRef.current) return;
    const t = setTimeout(() => {
      setSyncStatus("syncing");
      fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneRef.current,
          owner_name: ownerName,
          theme,
          catalogue: cards.map((c) => ({
            card_number: cardNum(c),
            collector_id: c.id,
            copies: c.copies,
            trainer: c.trainer || "ash-ketchum",
            added_at: c.addedAt,
          })),
          favorites,
          device_id: getDeviceId(),
          ...(portraitDirtyRef.current ? { portrait } : {}),
        }),
      })
        .then((r) => {
          if (r.status === 403) { setSyncStatus("device_error"); return; }
          if (!r.ok) throw new Error();
          portraitDirtyRef.current = false;
          setSyncStatus("synced");
        })
        .catch(() => setSyncStatus("error"));
    }, 3000);
    return () => clearTimeout(t);
  }, [cards, favorites, theme, ownerName, portrait]);

  // Auto-reset "synced" indicator after 3 seconds
  useEffect(() => {
    if (syncStatus === "synced") {
      const t = setTimeout(() => setSyncStatus("idle"), 3000);
      return () => clearTimeout(t);
    }
  }, [syncStatus]);

  const updatePortrait = (val) => {
    portraitDirtyRef.current = true;
    setPortrait(val);
  };

  const toggleFavorite = (cardId) =>
    setFavorites((prev) => prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]);

  const filtered = useMemo(() => {
    let r = cards.filter((c) => {
      const q = search.toLowerCase();
      const name = tCard(c, "name").toLowerCase();
      const num = cardNum(c);
      return (
        (!q || name.includes(q) || num.includes(q)) &&
        (typeFilter === "Tümü" || tCard(c, "type") === typeFilter) &&
        (rarityFilter === "Tümü" || c.rarity === rarityFilter) &&
        (!showFavoritesOnly || favorites.includes(c.id))
      );
    });
    const dir = sortDir === "asc" ? 1 : -1;
    r.sort((a, b) => {
      let cmp;
      if (sortBy === "rarity") {
        cmp = (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
      } else if (sortBy === "name") {
        cmp = tCard(a, "name").localeCompare(tCard(b, "name"));
      } else if (sortBy === "addedAt") {
        cmp = new Date(a.addedAt || 0).getTime() - new Date(b.addedAt || 0).getTime();
      } else if (sortBy === "damage1" || sortBy === "damage2" || sortBy === "retreat") {
        cmp = (parseFloat(cardDmg(a, sortBy === "damage1" ? 1 : 2) || a[sortBy]) || 0)
            - (parseFloat(cardDmg(b, sortBy === "damage1" ? 1 : 2) || b[sortBy]) || 0);
      } else if (typeof a[sortBy] === "number") {
        cmp = a[sortBy] - b[sortBy];
      } else {
        cmp = String(a[sortBy] ?? "").localeCompare(String(b[sortBy] ?? ""));
      }
      return cmp * dir;
    });
    return r;
  }, [cards, search, typeFilter, rarityFilter, sortBy, sortDir, showFavoritesOnly, favorites]);

  const toggle = (id) =>
    setCompareList((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : p));

  const handleDeleteCard = (id) => {
    setCards((prev) =>
      prev
        .map((c) => c.id === id ? { ...c, copies: c.copies - 1 } : c)
        .filter((c) => c.copies > 0)
    );
    setDeleteTarget(null);
  };

  const stats = useMemo(() => {
    const types = {};
    const rarityCounts = {};
    let topCard = null;
    cards.forEach((c) => {
      const ctype = tCard(c, "type");
      types[ctype] = (types[ctype] || 0) + 1;
      rarityCounts[c.rarity] = (rarityCounts[c.rarity] || 0) + 1;
      if (!topCard || (c.marketValue || 0) > (topCard.marketValue || 0)) topCard = c;
    });
    return {
      total: cards.length,
      copies: cards.reduce((s, c) => s + c.copies, 0),
      maxHP: Math.max(...cards.map((c) => c.hp), 0),
      totalValue: cards.reduce((s, c) => s + (c.marketValue || 0) * c.copies, 0),
      types,
      rarityCounts,
      topCard,
      favoritesCount: favorites.length,
    };
  }, [cards, favorites]);

  const catalogueContent = (
    <>
      {/* Header */}
      <div className="catalogue-header" style={{
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: isMobile ? "14px 16px 10px" : "16px 28px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <PokeballIcon size={28} />
            <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: 24, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Kartlarım</h2>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="catalogue-control-bar" style={{
        display: "flex", gap: isMobile ? 8 : 10, alignItems: "center",
        padding: isMobile ? "8px 16px" : "10px 28px",
      }}>
        {/* Search input — fixed small width */}
        <div style={{
          width: 140,
          height: isMobile ? 36 : 38,
          background: "var(--bg-elevated)", borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", gap: 6,
          padding: "0 12px",
          flexShrink: 0,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara..."
            style={{
              background: "transparent", border: "none", outline: "none",
              color: "var(--text-primary)", fontSize: isMobile ? 12 : 13, fontFamily: "'Comic Neue', cursive",
              width: "100%",
            }}
          />
        </div>

        {/* Filters button */}
        <button
          onClick={() => { setShowFilters(f => !f); setShowSort(false); }}
          title="Filtrele"
          style={{
            height: isMobile ? 36 : 38,
            background: showFilters ? "rgba(255,203,5,0.15)" : "var(--bg-elevated)",
            borderRadius: 10,
            border: `1px solid ${showFilters ? "rgba(255,203,5,0.4)" : "rgba(255,255,255,0.06)"}`,
            display: "flex", alignItems: "center", gap: isMobile ? 0 : 6,
            padding: isMobile ? "0 10px" : "0 14px",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showFilters ? "#FFCB05" : "var(--text-primary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/>
            <circle cx="12" cy="4" r="2"/><line x1="21" y1="12" x2="12" y2="12"/>
            <line x1="8" y1="12" x2="3" y2="12"/><circle cx="10" cy="12" r="2"/>
            <line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/>
            <circle cx="14" cy="20" r="2"/>
          </svg>
          {!isMobile && (
            <span style={{ fontSize: 13, fontFamily: "'Comic Neue', cursive", fontWeight: 600, color: showFilters ? "#FFCB05" : "var(--text-primary)" }}>
              Filtrele
            </span>
          )}
        </button>

        {/* Sort button */}
        {(() => {
          const sortActive = showSort;
          return (
            <button
              onClick={() => { setShowSort(s => !s); setShowFilters(false); }}
              title="Sırala"
              style={{
                height: isMobile ? 36 : 38,
                background: sortActive ? "rgba(255,203,5,0.15)" : "var(--bg-elevated)",
                borderRadius: 10,
                border: `1px solid ${sortActive ? "rgba(255,203,5,0.4)" : "rgba(255,255,255,0.06)"}`,
                display: "flex", alignItems: "center", gap: isMobile ? 0 : 6,
                padding: isMobile ? "0 10px" : "0 14px",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={sortActive ? "#FFCB05" : "var(--text-primary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8L7 4L11 8"/><line x1="7" y1="4" x2="7" y2="20"/>
                <path d="M21 16L17 20L13 16"/><line x1="17" y1="20" x2="17" y2="4"/>
              </svg>
              {!isMobile && (
                <span style={{ fontSize: 13, fontFamily: "'Comic Neue', cursive", fontWeight: 600, color: sortActive ? "#FFCB05" : "var(--text-primary)" }}>
                  Sırala
                </span>
              )}
            </button>
          );
        })()}

        {/* Favorites button */}
        <button
          onClick={() => setShowFavoritesOnly(v => !v)}
          title={showFavoritesOnly ? "Tüm kartlar" : "Sadece favoriler"}
          style={{
            width: isMobile ? 36 : 38,
            height: isMobile ? 36 : 38,
            background: showFavoritesOnly ? "rgba(255,80,120,0.15)" : "var(--bg-elevated)",
            borderRadius: 10,
            border: `1px solid ${showFavoritesOnly ? "rgba(255,80,120,0.4)" : "rgba(255,255,255,0.06)"}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {showFavoritesOnly ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff5078" stroke="#ff5078" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          )}
        </button>

        <div style={{ flex: 1 }} />

        {!isMobile && (
          <button
            onClick={() => { setCompareMode(!compareMode); if (compareMode && compareList.length >= 2) setShowCompare(true); }}
            style={{
              background: compareMode ? "rgba(255,203,5,0.15)" : "var(--bg-elevated)",
              borderRadius: 10,
              border: `1px solid ${compareMode ? "rgba(255,203,5,0.4)" : "rgba(255,255,255,0.1)"}`,
              display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
              cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={compareMode ? "#FFCB05" : "var(--text-primary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="m16 16 3.5 3.5"/><path d="M9.5 6.5 21 18v3h-3L6.5 9.5"/>
              <path d="M11 5l-6 6"/><path d="m8 8-3.5-3.5"/>
            </svg>
            <span style={{ fontSize: 13, fontFamily: "'Comic Neue', cursive", fontWeight: 600, color: compareMode ? "#FFCB05" : "var(--text-primary)" }}>
              Karşılaştır
            </span>
          </button>
        )}
        {!isMobile && (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #00c896, #00f5d4)",
              display: "flex", alignItems: "center", gap: 6, padding: "9px 20px",
              cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A3F6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
            </svg>
            <span style={{ fontSize: 13, fontFamily: "'Comic Neue', cursive", fontWeight: 700, color: "#1A3F6F" }}>
              Fotoğraf ile Ekle
            </span>
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div style={{
          padding: isMobile ? "12px 16px" : "14px 28px",
          background: "var(--bg-card)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap",
        }}>
          {/* Rarity dropdown */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Comic Neue', cursive", flexShrink: 0 }}>Nadirlik</span>
            <select
              value={rarityFilter}
              onChange={e => setRarityFilter(e.target.value)}
              className="holo-select"
              style={{ height: 34, fontSize: 13, fontFamily: "'Comic Neue', cursive", borderRadius: 8, padding: "0 10px" }}
            >
              <option value="Tümü">Tümü</option>
              {Object.keys(rarityLabels).map(r => (
                <option key={r} value={r}>{rarityLabels[r]}</option>
              ))}
            </select>
          </div>
          {/* Type dropdown */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Comic Neue', cursive", flexShrink: 0 }}>Tip</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="holo-select"
              style={{ height: 34, fontSize: 13, fontFamily: "'Comic Neue', cursive", borderRadius: 8, padding: "0 10px" }}
            >
              <option value="Tümü">Tümü</option>
              {Object.entries(stats.types).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <option key={type} value={type}>{type} ({count})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Sort Panel */}
      {showSort && (
        <div style={{
          padding: isMobile ? "12px 16px" : "14px 28px",
          background: "var(--bg-card)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Comic Neue', cursive" }}>Sırala:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="holo-select"
            style={{ height: 34, fontSize: 13, fontFamily: "'Comic Neue', cursive", borderRadius: 8, padding: "0 10px" }}
          >
            <option value="rarity">Nadirlik</option>
            <option value="hp">HP</option>
            <option value="name">İsim</option>
            <option value="marketValue">Değer</option>
            <option value="addedAt">Eklenme Tarihi</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
            title={sortDir === "asc" ? "Artan" : "Azalan"}
            style={{
              width: 34, height: 34, borderRadius: 8,
              background: "var(--bg-elevated)",
              border: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: sortDir === "asc" ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}>
              <path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>
            </svg>
          </button>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Comic Neue', cursive" }}>
            {sortDir === "asc" ? "Artan" : "Azalan"}
          </span>
        </div>
      )}

      {/* Card Grid */}
      <div style={{ position: "relative", zIndex: 1, padding: isMobile ? "12px 16px" : "20px 28px", background: "var(--bg-deep)", minHeight: "100vh" }}>
        {syncStatus === "loading" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 16 }}>
            <div className="spinner" />
            <p style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "'Comic Neue', cursive", margin: 0 }}>
              Koleksiyon yükleniyor...
            </p>
          </div>
        ) : cards.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center", gap: 16 }}>
            <PokeballIcon size={80} style={{ opacity: 0.12, filter: "grayscale(0.5)", userSelect: "none", pointerEvents: "none" }} />
            <p style={{ color: "var(--text-primary)", fontSize: 15, fontFamily: "'Bangers', cursive", fontWeight: 700, margin: 0 }}>
              Henüz kart yok
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "'Comic Neue', cursive", margin: 0, maxWidth: 260 }}>
              İlk kartınızı eklemek için kamera butonuna dokunun.
            </p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: isMobile ? 11 : 12, fontFamily: "'Comic Neue', cursive", color: "var(--text-muted)", marginBottom: isMobile ? 14 : 16 }}>
              {filtered.length} kart gösteriliyor
            </div>
            {filtered.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center", gap: 12 }}>
                <p style={{ color: "var(--text-muted)", fontSize: 14, fontFamily: "'Comic Neue', cursive", margin: 0 }}>
                  {showFavoritesOnly ? "Henüz favori kart yok." : "Aramanızla eşleşen kart bulunamadı."}
                </p>
              </div>
            ) : (
              <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: isMobile ? 12 : 18 }}>
                {filtered.map((c, i) => (
                  <CardTile key={c.id} card={c} compareMode={compareMode}
                    isSelected={compareList.includes(c.id)} onToggle={toggle} index={i} scrollRef={scrollRef}
                    onDelete={setDeleteTarget} favorites={favorites} onToggleFavorite={toggleFavorite} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showCompare && <CompareView cards={cards.filter((c) => compareList.includes(c.id))} onClose={() => setShowCompare(false)} />}
      <div className="bottom-tab-bar-spacer" />
    </>
  );

  if (!phone) {
    return (
      <div data-theme="dark" style={{
        minHeight: "100vh", background: "url('/app-images/pokemon-tcg-gradient-blue-bg2.png') center/cover no-repeat #1A3F6F",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: 20,
      }}>
        <img src={`${import.meta.env.BASE_URL}app-images/pokemon-trading-card-game-seeklogo.png`} alt="Pokémon TCG" style={{ width: 160, height: "auto", marginBottom: 12 }} />
        <h1 style={{
          fontFamily: "'Bangers', cursive", fontSize: 20, fontWeight: 700,
          color: "#ffffff", margin: "0 0 32px", textShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}>
          Pokémon Kart Kataloğu
        </h1>
        {deviceError && (
          <p style={{
            color: "#f72585", fontSize: 13, fontFamily: "'Comic Neue', cursive",
            margin: "0 0 16px", maxWidth: 360, textAlign: "center",
          }}>
            {deviceError}
          </p>
        )}
        <PhoneModal
          allowClose={false}
          onSave={(p) => { setDeviceError(""); setPhone(p); setShowPhoneModal(false); navigate("/ozet"); }}
          onClose={() => {}}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <div className="bg-image" />
      <Routes>
        <Route path="/" element={<CatalogueView scrollRef={scrollRef}>{catalogueContent}</CatalogueView>} />
        <Route path="/trainer/:trainerSlug" element={<TrainerDetail cards={cards} typeColors={typeColors} />} />
        <Route path="/ozet" element={<SummaryView stats={stats} cards={cards} favorites={favorites} portrait={portrait} setPortrait={updatePortrait} />} />
        <Route path="/card/:cardId" element={<CardDetailWrapper cards={cards} favorites={favorites} onToggleFavorite={toggleFavorite} typeColors={typeColors} />} />
        <Route path="/egitmenler" element={<TrainersList cards={cards} typeColors={typeColors} />} />
        <Route path="/ayarlar" element={<SettingsPage theme={theme} onThemeChange={setTheme} ownerName={ownerName} onOwnerNameChange={setOwnerName} phone={phone} deviceId={getDeviceId()} onShowPhoneModal={() => setShowPhoneModal(true)} onPhoneChange={(p) => { setPhone(p); if (!p) { setCards([]); setFavorites([]); setTheme("dark"); setOwnerName("Koleksiyoncu"); } }} />} />
      </Routes>
      <BottomTabBar onAddClick={() => setShowAdd(true)} />
      {showAdd && <PhotoUploadModal onClose={() => setShowAdd(false)} onAdd={(newCards) => setCards((prev) => mergeNewCards(prev, newCards))} />}
      {deleteTarget && <DeleteConfirmModal card={deleteTarget} onConfirm={handleDeleteCard} onClose={() => setDeleteTarget(null)} />}
      {showPhoneModal && <PhoneModal onSave={(p) => { setPhone(p); setShowPhoneModal(false); }} onClose={() => setShowPhoneModal(false)} />}
    </div>
  );
}
