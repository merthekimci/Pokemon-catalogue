import { useState, useMemo, useRef, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { trainers } from "./data/trainers";
import { initialCards } from "./data/cards.js";
import TrainerDetail from "./components/TrainerDetail";
import CardDetail from "./components/CardDetail";
import TrainersList from "./components/TrainersList";
import SettingsPage from "./components/SettingsPage";

const TCG_LOGO = `${import.meta.env.BASE_URL}app-images/pokemon-trading-card-game-seeklogo.png`;

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
const rarityGlow = { C: "none", U: "0 0 8px rgba(0,200,150,0.3)", M: "0 0 12px rgba(123,97,255,0.4)", RR: "0 0 16px rgba(255,209,102,0.5)", R: "0 0 10px rgba(139,92,246,0.4)", SR: "0 0 16px rgba(236,72,153,0.5)" };

const STORAGE_KEY = "pokemon_katalog_cards";
const FAVORITES_KEY = "pokemon_katalog_favorites";
const THEME_KEY = "pokemon_katalog_theme";
const OWNER_KEY = "pokemon_katalog_owner";

function loadCards() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return initialCards;
}
function loadFavorites() {
  try { const s = localStorage.getItem(FAVORITES_KEY); if (s) return JSON.parse(s); } catch (_) {}
  return [];
}
function loadTheme() {
  try { return localStorage.getItem(THEME_KEY) || "light"; } catch (_) { return "light"; }
}
function loadOwner() {
  try { return localStorage.getItem(OWNER_KEY) || "Koleksiyoncu"; } catch (_) { return "Koleksiyoncu"; }
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
      color: (rarity === "RR" || rarity === "SR") ? "#07060b" : "#fff",
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
  const t = typeColors[card.type] || typeColors["Normal"];
  const isFav = favorites && favorites.includes(card.id);
  const trainer = card.trainer && trainers[card.trainer];

  return (
    <div
      className={`poke-card ${isSelected ? "selected" : ""}`}
      style={{ animationDelay: `${Math.min(index * 0.04, 0.8)}s`, padding: 4 }}
    >
      {compareMode && (
        <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10 }}>
          <input type="checkbox" className="holo-checkbox" checked={isSelected} onChange={() => onToggle(card.id)} />
        </div>
      )}

      {!compareMode && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(card); }}
          className="card-delete-btn"
          title="Kartı Sil"
          style={{
            position: "absolute", top: 8, left: 8, zIndex: 10,
            width: 24, height: 24,
            background: "rgba(247,37,133,0.15)",
            border: "1px solid rgba(247,37,133,0.3)",
            borderRadius: "50%",
            color: "#ff4d6d",
            fontSize: 11, fontWeight: 700,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ✕
        </button>
      )}

      <Link to={`/card/${card.id}`} style={{ textDecoration: "none", color: "inherit" }}
        onClick={() => { if (scrollRef) scrollRef.current = window.scrollY; }}>
      <div style={{ borderRadius: 10, background: "var(--bg-card)", padding: 6, display: "flex", flexDirection: "column", gap: 3 }}>

        {/* Name + HP row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 6px" }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 4 }}>
            {card.nameEN}
          </span>
          {card.hp > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: 12, color: t.bg }}>
                HP {card.hp}
              </span>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: t.bg, flexShrink: 0 }} />
            </span>
          )}
        </div>

        {/* Art frame */}
        <div style={{
          height: 120, borderRadius: 6, overflow: "hidden", position: "relative",
          border: `1px solid ${t.bg}33`,
          display: "flex", justifyContent: "center", alignItems: "center",
          background: "var(--bg-elevated)",
        }}>
          {card.img && !imgErr ? (
            <img src={card.img} alt={card.nameEN} onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              crossOrigin="anonymous" />
          ) : (
            <div style={{ fontSize: 48, opacity: 0.3 }}>{t.emoji}</div>
          )}
          {/* Copies badge */}
          <span style={{
            position: "absolute", top: 4, left: 4,
            background: "rgba(255,255,255,0.87)", borderRadius: 10,
            padding: "1px 6px", fontSize: 9, fontWeight: 700, color: "var(--text-primary)",
          }}>
            ×{card.copies}
          </span>
          {/* Favorite heart */}
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(card.id); }}
              style={{
                position: "absolute", top: 4, right: 4,
                width: 22, height: 22, borderRadius: 12,
                background: isFav ? "rgba(247,37,133,0.13)" : "rgba(255,255,255,0.87)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: isFav ? "#f72585" : "#c0bdd0",
                padding: 0,
              }}
            >
              {isFav ? "♥" : "♡"}
            </button>
          )}
        </div>

        {/* Trainer + kartNo row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 6px" }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {trainer ? trainer.name : "—"}
          </span>
          <span style={{ fontSize: 8, color: "var(--text-muted)", flexShrink: 0 }}>{card.kartNo}</span>
        </div>

        {/* Attack section */}
        {card.attack1 && (
          <div style={{ padding: "3px 6px", borderTop: "1px solid var(--card-section-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: t.bg, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{card.attack1}</span>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{card.dmg1 || "—"}</span>
            </div>
            {card.attack2 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: t.bg, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{card.attack2}</span>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{card.dmg2 || "—"}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer: weakness + retreat */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 6px", borderTop: "1px solid var(--card-section-border)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: 7, color: "var(--text-muted)", textTransform: "lowercase" }}>zayıflık</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-secondary)" }}>{card.weakness || "—"}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: 7, color: "var(--text-muted)", textTransform: "lowercase" }}>çekilme</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text-secondary)" }}>{card.retreat || "—"}</span>
          </div>
        </div>

        {/* Badge row */}
        <div style={{ display: "flex", gap: 4, padding: "2px 6px" }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", background: t.bg, borderRadius: 8, padding: "1px 6px" }}>
            {card.type}
          </span>
          <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", background: rarityColors[card.rarity] || "#5a566e", borderRadius: 8, padding: "1px 6px" }}>
            {card.rarity}
          </span>
        </div>

        {/* Market value */}
        {card.marketValue > 0 && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "var(--bg-elevated)", borderRadius: 6, padding: "3px 6px",
          }}>
            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Piyasa Değeri</span>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-primary)" }}>
              ${card.marketValue.toFixed(2)}
            </span>
          </div>
        )}

      </div>
      </Link>
    </div>
  );
}

function CompareView({ cards, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 1000, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'Rajdhani', sans-serif", color: "#e8e6f0" }}>
            &#x2694; Kart Karşılaştırma
          </h2>
          <button className="btn-danger" onClick={onClose}>&#x2715; Kapat</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, 1fr)`, gap: 16 }}>
          {cards.map((card) => {
            const t = typeColors[card.type] || typeColors["Normal"];
            return (
              <div key={card.id} style={{
                border: `2px solid ${t.bg}`, borderRadius: 16, overflow: "hidden",
                background: `linear-gradient(180deg, ${t.dark}, var(--bg-card))`,
                boxShadow: `0 0 20px ${t.glow}`,
              }}>
                <div style={{ padding: 16, display: "flex", justifyContent: "center",
                  background: `radial-gradient(ellipse at 50% 80%, ${t.glow}, transparent 70%)` }}>
                  {card.img ? (
                    <img src={card.img} alt={card.nameEN}
                      style={{ maxHeight: 110, objectFit: "contain", filter: `drop-shadow(0 4px 16px ${t.glow})` }}
                      crossOrigin="anonymous" />
                  ) : (
                    <div style={{ fontSize: 48, padding: 20 }}>{t.emoji}</div>
                  )}
                </div>
                <div style={{ padding: "0 14px 14px" }}>
                  <div style={{ textAlign: "center", marginBottom: 10 }}>
                    <TypeBadge type={card.type} size="lg" />
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: "8px 0 2px", fontFamily: "'Rajdhani', sans-serif", color: "#e8e6f0" }}>
                      {card.nameEN}
                    </h3>
                    <div style={{ fontSize: 11, color: "#5a566e" }}>{card.kartNo}</div>
                  </div>
                  {[["HP", card.hp > 0 ? card.hp : "-"], ["Aşama", card.stage],
                    ["Nadirlik", `${card.rarity} (${rarityLabels[card.rarity] || ""})`],
                    ["Zayıflık", card.weakness], ["Çekilme", card.retreat], ["Kopya", `×${card.copies}`],
                    ["Piyasa Değeri", `$${(card.marketValue || 0).toFixed(2)}`],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                      <span style={{ color: "#5a566e" }}>{l}</span>
                      <span style={{ fontWeight: 700, color: l === "HP" && v >= 150 ? "#ff4d6d" : l === "Piyasa Değeri" ? "#00f5d4" : "#e8e6f0" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: "#8b87a0" }}>Saldırılar</div>
                    {card.attack1 && <div style={{ fontSize: 11, color: "#8b87a0" }}>{card.attack1}: <b style={{ color: "#ff4d6d" }}>{card.dmg1 || "—"}</b></div>}
                    {card.attack2 && <div style={{ fontSize: 11, color: "#8b87a0" }}>{card.attack2}: <b style={{ color: "#ff4d6d" }}>{card.dmg2 || "—"}</b></div>}
                  </div>
                  {card.ability && (
                    <div style={{ marginTop: 6, background: "rgba(123,97,255,0.1)", border: "1px solid rgba(123,97,255,0.2)",
                      padding: "4px 8px", borderRadius: 8, fontSize: 11, color: "#c4b5fd" }}>
                      &#x2728; {card.ability}
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

function PhotoUploadModal({ onClose, onAdd, nextId }) {
  const [phase, setPhase] = useState("upload");
  const [preview, setPreview] = useState(null);
  const [imageBase64, setImageBase64] = useState("");
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [extractedCards, setExtractedCards] = useState([]);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null);

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
        id: nextId + i,
        hp: +c.hp || 0,
        copies: +c.copies || 1,
        marketValue: +c.marketValue || 0,
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

  const removeCard = (idx) =>
    setExtractedCards((prev) => prev.filter((_, i) => i !== idx));

  const confirmAdd = () => {
    const cleaned = extractedCards.map((c) => ({
      ...c,
      hp: +c.hp || 0,
      copies: +c.copies || 1,
      marketValue: +c.marketValue || 0,
    }));
    onAdd(cleaned);
    onClose();
  };

  const lbl = { fontSize: 12, fontWeight: 600, color: "#8b87a0", marginBottom: 4, display: "block" };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 700, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <img
            src={TCG_LOGO}
            alt=""
            style={{
              height: 28, width: "auto",
              filter: "drop-shadow(0 0 6px rgba(123,97,255,0.4))",
            }}
          />
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'Rajdhani', sans-serif", color: "#e8e6f0" }}>
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
                capture="environment"
                onChange={(e) => handleFile(e.target.files[0])}
                style={{ display: "none" }}
              />
              {preview ? (
                <img src={preview} alt="Preview" style={{ maxHeight: 280, maxWidth: "100%", borderRadius: 12, objectFit: "contain" }} />
              ) : (
                <div>
                  <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>&#x1F4F7;</div>
                  <div style={{ color: "#8b87a0", fontSize: 14, fontWeight: 600 }}>
                    Kart fotografini surukleyin veya tiklayin
                  </div>
                  <div style={{ color: "#5a566e", fontSize: 12, marginTop: 6 }}>
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
            <div style={{ color: "#8b87a0", fontSize: 14, fontWeight: 600 }}>
              Kartlar analiz ediliyor...
            </div>
            <div style={{ color: "#5a566e", fontSize: 12, marginTop: 6 }}>
              Bu islem birkaç saniye surebilir
            </div>
          </div>
        )}

        {/* ── Review Phase ── */}
        {phase === "review" && (
          <>
            <div style={{ color: "#8b87a0", fontSize: 13, marginBottom: 14 }}>
              {extractedCards.length} kart bulundu. Bilgileri kontrol edip duzenleyebilirsiniz.
            </div>
            <div style={{ maxHeight: "55vh", overflowY: "auto", paddingRight: 4 }}>
              {extractedCards.map((card, idx) => (
                <div key={idx} className="review-card-row">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: "#e8e6f0", fontFamily: "'Rajdhani', sans-serif", fontSize: 16 }}>
                      #{idx + 1} {card.nameEN || "—"}
                    </span>
                    <button className="btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => removeCard(idx)}>&#x2715;</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={lbl}>Ad</label>
                      <input className="holo-input" style={{ width: "100%" }} value={card.nameEN} onChange={(e) => updateCard(idx, "nameEN", e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Tur</label>
                      <select className="holo-select" style={{ width: "100%" }} value={card.type} onChange={(e) => updateCard(idx, "type", e.target.value)}>
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
                      <label style={lbl}>Asama</label>
                      <select className="holo-select" style={{ width: "100%" }} value={card.stage} onChange={(e) => updateCard(idx, "stage", e.target.value)}>
                        {["Temel", "1. Aşama", "2. Aşama", "Mega ex", "Temel ex", "Destekçi", "Eşya", "Araç", "Stadyum"].map((v) => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Kart No</label>
                      <input className="holo-input" style={{ width: "100%" }} value={card.kartNo} onChange={(e) => updateCard(idx, "kartNo", e.target.value)} />
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="btn-glow"
                      style={{ padding: "4px 12px", fontSize: 11 }}
                      onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    >
                      {expandedIdx === idx ? "▲ Detaylari Gizle" : "▼ Detaylar"}
                    </button>
                    {expandedIdx === idx && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                        {[["Saldiri 1", "attack1"], ["Hasar 1", "dmg1"], ["Saldiri 2", "attack2"], ["Hasar 2", "dmg2"],
                          ["Zayiflik", "weakness"], ["Cekilme", "retreat"], ["Yetenek", "ability"],
                        ].map(([l, k]) => (
                          <div key={k}><label style={lbl}>{l}</label>
                            <input className="holo-input" style={{ width: "100%" }} value={card[k]} onChange={(e) => updateCard(idx, k, e.target.value)} />
                          </div>
                        ))}
                        <div><label style={lbl}>Kopya</label>
                          <input className="holo-input" style={{ width: "100%" }} type="number" value={card.copies} onChange={(e) => updateCard(idx, "copies", e.target.value)} />
                        </div>
                        <div><label style={lbl}>Piyasa Degeri (USD)</label>
                          <input className="holo-input" style={{ width: "100%" }} type="number" step="0.01" value={card.marketValue} onChange={(e) => updateCard(idx, "marketValue", e.target.value)} placeholder="0.00" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
  const t = typeColors[card.type] || typeColors["Normal"];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 420, width: "100%", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{
          fontSize: 22, fontWeight: 700, marginBottom: 16,
          fontFamily: "'Rajdhani', sans-serif", color: "#e8e6f0",
        }}>
          🗑️ Kartı Sil
        </h2>

        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          marginBottom: 20, padding: 16,
          background: `radial-gradient(ellipse at 50% 80%, ${t.glow}, transparent 70%)`,
          borderRadius: 12,
        }}>
          {card.img && (
            <img src={card.img} alt={card.nameEN}
              style={{
                maxHeight: 120, objectFit: "contain",
                filter: `drop-shadow(0 4px 16px ${t.glow})`,
                marginBottom: 12,
              }} crossOrigin="anonymous" />
          )}
          <div style={{
            fontWeight: 700, fontSize: 18, color: "#e8e6f0",
            fontFamily: "'Rajdhani', sans-serif",
          }}>
            {card.nameEN}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <TypeBadge type={card.type} />
            <RarityBadge rarity={card.rarity} />
          </div>
        </div>

        <p style={{ color: "#8b87a0", fontSize: 14, marginBottom: 24 }}>
          Bu kartı koleksiyonunuzdan silmek istediğinize emin misiniz?
          <br />
          <span style={{ color: "#ff4d6d", fontSize: 12 }}>Bu işlem geri alınamaz.</span>
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

function SummaryView({ stats, cards, favorites }) {
  const navigate = useNavigate();

  const widgetStyle = {
    background: "var(--bg-card)", border: "1px solid var(--border-dim)",
    borderRadius: 16, padding: 16, marginBottom: 0,
  };
  const headerRow = {
    display: "flex", alignItems: "center", gap: 8, marginBottom: 8, width: "100%",
  };
  const headerIcon = (color) => ({ fontSize: 18, color, flexShrink: 0 });
  const headerTitle = {
    fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700,
    color: "var(--text-primary)",
  };
  const bigNum = (color) => ({
    fontFamily: "'Rajdhani', sans-serif", fontSize: 28, fontWeight: 800, color,
  });
  const subText = { fontSize: 11, color: "var(--text-muted)" };
  const chipBase = {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600,
  };

  return (
    <div style={{
      position: "relative", zIndex: 1,
      padding: "20px 16px 100px", maxWidth: 600, margin: "0 auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <img src={TCG_LOGO} alt="" style={{ height: 28, width: "auto" }} />
        <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Özet</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* W-Value */}
        <div style={widgetStyle}>
          <div style={headerRow}>
            <span style={headerIcon("#0d9488")}>💰</span>
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
            <span style={headerIcon("#0d9488")}>🃏</span>
            <span style={headerTitle}>Kartlarım</span>
            <div style={{ flex: 1 }} />
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>›</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={bigNum("var(--text-primary)")}>{stats.total}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>kart</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {Object.entries(stats.rarityCounts || {}).sort((a, b) => (rarityOrder[a[0]] || 0) - (rarityOrder[b[0]] || 0)).map(([r, count]) => (
              <span key={r} style={{ ...chipBase, background: `${rarityColors[r]}15`, color: rarityColors[r] }}>
                {r}: {count}
              </span>
            ))}
          </div>
        </div>

        {/* W-Favs */}
        <div style={widgetStyle}>
          <div style={headerRow}>
            <span style={headerIcon("#f72585")}>♥</span>
            <span style={headerTitle}>Favoriler</span>
            <div style={{ flex: 1 }} />
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>›</span>
          </div>
          <div style={bigNum("#f72585")}>{stats.favoritesCount}</div>
          <div style={subText}>favori olarak işaretlenen kartlar</div>
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
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {stats.topCard.img && (
                <img src={stats.topCard.img} alt={stats.topCard.nameEN}
                  style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 8 }}
                  crossOrigin="anonymous" />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Rajdhani', sans-serif", color: "var(--text-primary)" }}>
                  {stats.topCard.nameEN}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {stats.topCard.rarity} · {stats.topCard.type}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Rajdhani', sans-serif", color: "#0d9488" }}>
                  ${(stats.topCard.marketValue || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* W-Types */}
        <div style={widgetStyle}>
          <div style={headerRow}>
            <span style={headerIcon("#0d9488")}>📊</span>
            <span style={headerTitle}>Tür Dağılımı</span>
            <div style={{ flex: 1 }} />
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>›</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
    transition: "color 0.2s ease", fontFamily: "'DM Sans', sans-serif",
    fontSize: 10, fontWeight: 600,
    color: active ? "#0d9488" : "#8b87a0",
    height: "100%",
  });

  const indicator = (
    <span style={{
      width: 28, height: 2,
      background: "#0d9488", borderRadius: 2, flexShrink: 0,
    }} />
  );

  /* Simple SVG icons matching lucide design */
  const iconChart = (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>;
  const iconLayers = (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
  const iconPlus = (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>;
  const iconUsers = (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  const iconSettings = (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;

  return (
    <nav className="bottom-tab-bar" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      height: 60, display: "flex", alignItems: "stretch",
      justifyContent: "space-around",
      background: "#ffffffEB",
      borderTop: "1px solid #e0dfe8",
    }}>
      <Link to="/ozet" style={tabStyle(isOzet)}>
        {iconChart(isOzet ? "#0d9488" : "#8b87a0")}
        <span>Özet</span>
        {isOzet && indicator}
      </Link>

      <Link to="/" style={tabStyle(isHome)}>
        {iconLayers(isHome ? "#0d9488" : "#8b87a0")}
        <span>Kartlarım</span>
        {isHome && indicator}
      </Link>

      <button onClick={onAddClick} style={{
        ...tabStyle(false),
        color: "#00f5d4",
      }}>
        {iconPlus("#00f5d4")}
        <span>Kart Ekle</span>
      </button>

      <Link to="/egitmenler" style={tabStyle(isTrainers)}>
        {iconUsers(isTrainers ? "#0d9488" : "#8b87a0")}
        <span>Eğitmenler</span>
        {isTrainers && indicator}
      </Link>

      <Link to="/ayarlar" style={tabStyle(isSettings)}>
        {iconSettings(isSettings ? "#0d9488" : "#8b87a0")}
        <span>Ayarlar</span>
        {isSettings && indicator}
      </Link>
    </nav>
  );
}

/* ── Main App ── */

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

export default function App() {
  const [cards, setCards] = useState(loadCards);
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
  const [favorites, setFavorites] = useState(loadFavorites);
  const [theme, setTheme] = useState(loadTheme);
  const [ownerName, setOwnerName] = useState(loadOwner);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const scrollRef = useRef(0);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)); } catch (_) {}
  }, [cards]);

  useEffect(() => {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); } catch (_) {}
  }, [favorites]);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem(OWNER_KEY, ownerName); } catch (_) {}
  }, [ownerName]);

  const toggleFavorite = (cardId) =>
    setFavorites((prev) => prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]);

  const filtered = useMemo(() => {
    let r = cards.filter((c) => {
      const q = search.toLowerCase();
      return (
        (!q || c.nameEN.toLowerCase().includes(q) || c.kartNo.includes(q)) &&
        (typeFilter === "Tümü" || c.type === typeFilter) &&
        (rarityFilter === "Tümü" || c.rarity === rarityFilter) &&
        (!showFavoritesOnly || favorites.includes(c.id))
      );
    });
    const dir = sortDir === "asc" ? 1 : -1;
    r.sort((a, b) => {
      let cmp;
      if (sortBy === "rarity") {
        cmp = (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
      } else if (sortBy === "dmg1" || sortBy === "dmg2" || sortBy === "retreat") {
        cmp = (parseFloat(a[sortBy]) || 0) - (parseFloat(b[sortBy]) || 0);
      } else if (typeof a[sortBy] === "number") {
        cmp = a[sortBy] - b[sortBy];
      } else {
        cmp = String(a[sortBy]).localeCompare(String(b[sortBy]));
      }
      return cmp * dir;
    });
    return r;
  }, [cards, search, typeFilter, rarityFilter, sortBy, sortDir, showFavoritesOnly, favorites]);

  const toggle = (id) =>
    setCompareList((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : p));

  const handleDeleteCard = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setDeleteTarget(null);
  };

  const stats = useMemo(() => {
    const types = {};
    const rarityCounts = {};
    let topCard = null;
    cards.forEach((c) => {
      types[c.type] = (types[c.type] || 0) + 1;
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
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border-dim)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 10px" }}>
          <img src={TCG_LOGO} alt="Pokémon TCG" style={{ height: 28, width: "auto" }} />
        </div>
        <div className="type-filter-row" style={{ display: "flex", gap: 6, padding: "0 16px 10px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {Object.entries(stats.types).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
            const isActive = typeFilter === type;
            return (
              <span key={type} className={`type-chip ${isActive ? "active" : ""}`}
                onClick={() => setTypeFilter(typeFilter === type ? "Tümü" : type)}
                style={{
                  flexShrink: 0,
                  background: isActive ? "#0d948815" : "var(--bg-elevated)",
                  color: isActive ? "#0d9488" : "var(--text-secondary)",
                  borderColor: isActive ? "#0d948850" : "var(--border-dim)",
                  border: `1px solid ${isActive ? "#0d948850" : "var(--border-dim)"}`,
                  borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                }}>
                {type} ({count})
              </span>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: "flex", gap: 8, alignItems: "center",
        padding: "8px 16px",
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border-dim)",
      }}>
        <input className="holo-input" placeholder="&#x1F50D; Kart ara..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, height: 36, padding: "0 12px", fontSize: 12 }} />
        <button
          onClick={() => setShowFavoritesOnly((f) => !f)}
          title="Yalnızca Favoriler"
          style={{
            width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border-subtle)",
            background: showFavoritesOnly ? "rgba(247,37,133,0.12)" : "var(--bg-elevated)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: "#f72585", flexShrink: 0,
          }}
        >
          ♥
        </button>
        <button
          onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
          title={`Sırala: ${sortDir === "asc" ? "Artan" : "Azalan"}`}
          style={{
            width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border-subtle)",
            background: "var(--bg-elevated)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: "var(--text-primary)", flexShrink: 0,
          }}
        >
          ↕
        </button>
        <button
          onClick={() => {
            const rarities = ["Tümü", ...Object.keys(rarityLabels)];
            const idx = rarities.indexOf(rarityFilter);
            setRarityFilter(rarities[(idx + 1) % rarities.length]);
          }}
          title={`Filtre: ${rarityFilter === "Tümü" ? "Tümü" : rarityFilter}`}
          style={{
            width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border-subtle)",
            background: rarityFilter !== "Tümü" ? "rgba(13,148,136,0.12)" : "var(--bg-elevated)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: rarityFilter !== "Tümü" ? "#0d9488" : "var(--text-primary)", flexShrink: 0,
          }}
        >
          ☰
        </button>
      </div>

      {/* Card Grid */}
      <div style={{ position: "relative", zIndex: 1, padding: "14px 16px", background: "var(--bg-deep)", minHeight: "100vh" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
          {filtered.length} kart gösteriliyor
        </div>
        {filtered.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "60px 20px", textAlign: "center",
          }}>
            <img
              src={TCG_LOGO}
              alt=""
              style={{
                width: 180, height: "auto", opacity: 0.15,
                filter: "grayscale(0.5)", marginBottom: 20,
                userSelect: "none", pointerEvents: "none",
              }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
              Aramanızla eşleşen kart bulunamadı.
            </p>
          </div>
        ) : (
          <div className="card-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px 10px",
          }}>
            {filtered.map((c, i) => (
              <CardTile key={c.id} card={c} compareMode={compareMode}
                isSelected={compareList.includes(c.id)} onToggle={toggle} index={i} scrollRef={scrollRef}
                onDelete={setDeleteTarget} favorites={favorites} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        )}
      </div>

      {showCompare && <CompareView cards={cards.filter((c) => compareList.includes(c.id))} onClose={() => setShowCompare(false)} />}
      <div className="bottom-tab-bar-spacer" />
    </>
  );

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <div className="grain-overlay" />
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at 20% 0%, rgba(123,97,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(0,245,212,0.04) 0%, transparent 50%)",
      }} />
      <Routes>
        <Route path="/" element={<CatalogueView scrollRef={scrollRef}>{catalogueContent}</CatalogueView>} />
        <Route path="/trainer/:trainerSlug" element={<TrainerDetail cards={cards} typeColors={typeColors} />} />
        <Route path="/ozet" element={<SummaryView stats={stats} cards={cards} favorites={favorites} />} />
        <Route path="/card/:cardId" element={<CardDetail cards={cards} favorites={favorites} onToggleFavorite={toggleFavorite} typeColors={typeColors} />} />
        <Route path="/egitmenler" element={<TrainersList cards={cards} typeColors={typeColors} />} />
        <Route path="/ayarlar" element={<SettingsPage theme={theme} onThemeChange={setTheme} ownerName={ownerName} onOwnerNameChange={setOwnerName} />} />
      </Routes>
      <BottomTabBar onAddClick={() => setShowAdd(true)} />
      {showAdd && <PhotoUploadModal onClose={() => setShowAdd(false)} onAdd={(newCards) => setCards((p) => [...p, ...(Array.isArray(newCards) ? newCards : [newCards])])} nextId={Math.max(0, ...cards.map((c) => c.id)) + 1} />}
      {deleteTarget && <DeleteConfirmModal card={deleteTarget} onConfirm={handleDeleteCard} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}
