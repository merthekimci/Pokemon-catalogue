import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { trainers } from "../data/trainers";
import { resolveCardImage } from "../data/tcgdex-map";
import { pokemonMeta } from "../data/pokemon-meta";
import PokeballIcon from "./PokeballIcon";

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
const rarityColors = { C: "var(--text-muted)", U: "#00c896", M: "#FFCB05", RR: "#ffd166", R: "#8b5cf6", SR: "#ec4899" };

// Translation-aware card field accessors (mirrors App.jsx helpers)
function tCard(card, field, lang = "tr") {
  return card?.translations?.[lang]?.[field]
    ?? card?.original?.[field]
    ?? card?.[field]
    ?? "";
}
function cardNum(card) { return card?.cardNumber ?? card?.kartNo ?? ""; }
function cardDmg(card, n) {
  return n === 1 ? (card?.damage1 ?? card?.dmg1 ?? "") : (card?.damage2 ?? card?.dmg2 ?? "");
}

const affiliationIcons = {
  flame: "🔥", leaf: "🌿", droplet: "💧", zap: "⚡", "map-pin": "📍",
  sparkles: "✨", ghost: "👻", fist: "👊",
};

// ─── 3D Card Tilt Hook ───
function useCardTilt({ sensitivity = 0.4, initialRotY = 0 } = {}) {
  const cardRef = useRef(null);
  const isActive = useRef(false);
  const rafId = useRef(null);
  const startPointer = useRef({ x: 0, y: 0 });
  const startRotation = useRef({ x: 0, y: 0 });
  const targetRotX = useRef(0);
  const targetRotY = useRef(initialRotY);
  const currentRotX = useRef(0);
  const currentRotY = useRef(initialRotY);

  const [tilt, setTilt] = useState({ rotX: 0, rotY: initialRotY });
  const [isInteracting, setIsInteracting] = useState(false);
  const [introPhase, setIntroPhase] = useState(initialRotY !== 0);

  const tick = useCallback(() => {
    const lerp = isActive.current ? 0.3 : 0.12;
    currentRotX.current += (targetRotX.current - currentRotX.current) * lerp;
    currentRotY.current += (targetRotY.current - currentRotY.current) * lerp;

    const settled = !isActive.current &&
      Math.abs(currentRotX.current - targetRotX.current) < 0.1 &&
      Math.abs(currentRotY.current - targetRotY.current) < 0.1;

    if (settled) {
      currentRotX.current = targetRotX.current;
      currentRotY.current = targetRotY.current;
      setTilt({ rotX: targetRotX.current, rotY: targetRotY.current });
      setIsInteracting(false);
      rafId.current = null;
      return;
    }

    setTilt({ rotX: currentRotX.current, rotY: currentRotY.current });
    rafId.current = requestAnimationFrame(tick);
  }, []);

  const startLoop = useCallback(() => {
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const handleStart = useCallback((clientX, clientY) => {
    isActive.current = true;
    startPointer.current = { x: clientX, y: clientY };
    startRotation.current = { x: currentRotX.current, y: currentRotY.current };
    setIsInteracting(true);
    startLoop();
  }, [startLoop]);

  const handleMove = useCallback((clientX, clientY) => {
    if (!isActive.current) return;
    const dx = clientX - startPointer.current.x;
    const dy = clientY - startPointer.current.y;
    const MAX_TILT = 35;
    targetRotY.current = Math.max(-MAX_TILT, Math.min(MAX_TILT, startRotation.current.y + dx * sensitivity));
    targetRotX.current = Math.max(-MAX_TILT, Math.min(MAX_TILT, startRotation.current.x - dy * sensitivity));
  }, [sensitivity]);

  const handleEnd = useCallback(() => {
    if (!isActive.current) return;
    isActive.current = false;
    targetRotX.current = 0;
    targetRotY.current = 0;
    startLoop();
  }, [startLoop]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onTouchMove = (e) => {
      if (!isActive.current) return;
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchmove', onTouchMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [handleMove]);

  // Intro flip: animate from initialRotY to 0 on mount
  useEffect(() => {
    if (initialRotY === 0) return;
    // Wait one frame so the initial rotY=180 renders, then trigger CSS transition to 0
    const frameId = requestAnimationFrame(() => {
      targetRotY.current = 0;
      currentRotY.current = initialRotY;
      setTilt({ rotX: 0, rotY: 0 });
    });
    const timer = setTimeout(() => {
      currentRotY.current = 0;
      targetRotY.current = 0;
      setIntroPhase(false);
    }, 1050);
    return () => { cancelAnimationFrame(frameId); clearTimeout(timer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlers = {
    onMouseDown: (e) => { e.preventDefault(); handleStart(e.clientX, e.clientY); },
    onMouseMove: (e) => handleMove(e.clientX, e.clientY),
    onMouseUp: () => handleEnd(),
    onMouseLeave: () => { if (isActive.current) handleEnd(); },
    onTouchStart: (e) => handleStart(e.touches[0].clientX, e.touches[0].clientY),
    onTouchEnd: () => handleEnd(),
  };

  return { cardRef, tilt, isInteracting, introPhase, handlers };
}

// ─── Sub-components ───

function StatCard({ label, value, orbColor }) {
  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: 12, padding: 14,
      border: "1px solid var(--border-dim)", display: "flex",
      flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Comic Neue', cursive" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {orbColor && <span style={{ width: 12, height: 12, borderRadius: "50%", background: orbColor, flexShrink: 0 }} />}
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Comic Neue', cursive" }}>{value}</span>
      </div>
    </div>
  );
}

function SectionTitle({ children, isDesktop }) {
  return (
    <h3 style={{
      fontFamily: "'Bangers', cursive", fontSize: isDesktop ? 22 : 20,
      fontWeight: 700, color: "var(--text-primary)", margin: 0,
    }}>{children}</h3>
  );
}

function SectionWrapper({ children, isDesktop, padding }) {
  return (
    <div style={{
      borderTop: "1px solid var(--border-dim)",
      padding: padding || (isDesktop ? "20px 0" : "16px 0 0 0"),
      display: "flex", flexDirection: "column",
      gap: isDesktop ? 12 : 10,
    }}>
      {children}
    </div>
  );
}

function RelationCard({ card, reason, isFoe, resolveImg }) {
  const tc = typeColors[tCard(card, "type")] || typeColors["Normal"];
  return (
    <Link to={`/card/${card.id}`} style={{
      flexShrink: 0, width: 120, textDecoration: "none",
      borderRadius: 12, overflow: "hidden",
      background: "var(--bg-card)",
      border: `1px solid ${isFoe ? "rgba(255,68,68,0.1)" : "var(--border-dim)"}`,
    }}>
      <div style={{ height: 80, background: `linear-gradient(135deg, ${tc.bg}15, ${tc.bg}05)`, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {resolveImg(card) ? (
          <img src={resolveImg(card)} alt={tCard(card, "name")} style={{ height: 60, objectFit: "contain" }} crossOrigin="anonymous" />
        ) : (
          <span style={{ fontSize: 32, opacity: 0.3 }}>{tc.emoji}</span>
        )}
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Comic Neue', cursive" }}>{tCard(card, "name")}</div>
        <div style={{ fontSize: 10, color: isFoe ? "#ff4444" : tc.bg, fontFamily: "'Comic Neue', cursive" }}>{reason}</div>
      </div>
    </Link>
  );
}

// ─── Physical Card (Desktop left column) ───
function PhysicalCard({ card, t, tilt, isInteracting, introPhase, holoX, holoY, holoIntensity, tiltMagnitude, cardRef, handlers }) {
  const weaknessStr = card.original?.weakness ?? card.weakness ?? "";
  const weaknessType = weaknessStr?.match(/^(\S+)/)?.[1];
  const weaknessColor = Object.entries(typeColors).find(([k]) => k === weaknessType)?.[1]?.bg || "var(--text-secondary)";

  return (
    <div style={{ perspective: 900, perspectiveOrigin: "50% 50%" }}>
      <div
        ref={cardRef}
        {...handlers}
        style={{
          width: 320,
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt.rotX}deg) rotateY(${tilt.rotY}deg)`,
          transition: introPhase ? "transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)" : isInteracting ? "none" : "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          willChange: "transform",
          cursor: introPhase ? "default" : isInteracting ? "grabbing" : "grab",
          userSelect: "none", WebkitUserSelect: "none",
          position: "relative",
          borderRadius: 16,
          boxShadow: isInteracting
            ? `0 ${10 + Math.abs(tilt.rotX) * 0.5}px ${20 + tiltMagnitude * 0.8}px rgba(0,0,0,0.25), 0 0 ${20 + tiltMagnitude}px ${t.glow}`
            : "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        {/* FRONT FACE */}
        <div style={{
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          borderRadius: 16, overflow: "hidden",
          background: t.bg, padding: 6, position: "relative",
          border: `1px solid ${t.bg}40`,
        }}>
          <div style={{
            borderRadius: 10, background: "var(--bg-cream)", padding: 8,
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            {/* Name Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px" }}>
              <span style={{ fontFamily: "'Bangers', cursive", fontWeight: 700, fontSize: 22, color: "#2a2838" }}>
                {tCard(card, "name")}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "'Bangers', cursive", fontWeight: 700, fontSize: 20, color: t.bg }}>
                  HP {card.hp}
                </span>
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: t.bg, display: "inline-block" }} />
              </div>
            </div>

            {/* Art Window */}
            <div style={{
              height: 220, borderRadius: 6, overflow: "hidden", position: "relative",
              border: `2px solid ${t.bg}66`,
              background: resolveCardImage(card) ? undefined : `radial-gradient(ellipse at 50% 80%, ${t.glow}, transparent 70%)`,
            }}>
              {resolveCardImage(card) ? (
                <img src={resolveCardImage(card)} alt={tCard(card, "name")}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  crossOrigin="anonymous" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 64, opacity: 0.4 }}>{t.emoji}</div>
              )}
              {/* Copy badge */}
              {card.copies > 1 && (
                <div style={{
                  position: "absolute", top: 8, left: 8,
                  background: "rgba(0,0,0,0.8)", borderRadius: 10, padding: "2px 8px",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "'Comic Neue', cursive" }}>x{card.copies}</span>
                </div>
              )}
              {/* Heart badge */}
              <div style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(0,0,0,0.27)", borderRadius: 15, width: 30, height: 30,
                display: "flex", justifyContent: "center", alignItems: "center",
              }}>
                <span style={{ fontSize: 16, opacity: 0.53 }}>♡</span>
              </div>
            </div>

            {/* Trainer Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2A75BB", fontFamily: "'Comic Neue', cursive" }}>
                {card.trainer ? (trainers[card.trainer]?.name || card.trainer) : "—"}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "'Comic Neue', cursive" }}>{cardNum(card)}</span>
            </div>

            {/* Attack Section */}
            {tCard(card, "attack1") && (
              <div style={{ padding: "6px 10px", borderTop: `1px solid ${t.bg}40`, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#2a2838", fontFamily: "'Comic Neue', cursive" }}>⚔ {tCard(card, "attack1")}</span>
                  <span style={{ fontFamily: "'Bangers', cursive", fontWeight: 700, fontSize: 18, color: "#2a2838" }}>{cardDmg(card, 1) || "—"}</span>
                </div>
                {tCard(card, "attack2") && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#2a2838", fontFamily: "'Comic Neue', cursive" }}>⚔ {tCard(card, "attack2")}</span>
                    <span style={{ fontFamily: "'Bangers', cursive", fontWeight: 700, fontSize: 18, color: "#2a2838" }}>{cardDmg(card, 2) || "—"}</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer: weakness / resistance / retreat */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "4px 10px", borderTop: `1px solid ${t.bg}40`,
            }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "'Comic Neue', cursive" }}>zayiflik</span>
                {card.weakness && card.weakness !== "-" ? (
                  <>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: weaknessColor, display: "inline-block" }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#2a2838", fontFamily: "'Comic Neue', cursive" }}>x2</span>
                  </>
                ) : <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>—</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "'Comic Neue', cursive" }}>dayaniklilik</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>—</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "'Comic Neue', cursive" }}>cekilme</span>
                {card.retreat && card.retreat !== "-" ? (
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--text-secondary)", display: "inline-block" }} />
                ) : <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>—</span>}
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", gap: 8, padding: "4px 10px", alignItems: "center" }}>
              <span style={{ background: t.bg, color: "#fff", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: "'Comic Neue', cursive" }}>
                {tCard(card, "type")}
              </span>
              <span style={{ background: rarityColors[card.rarity] || "var(--text-muted)", color: "#fff", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: "'Comic Neue', cursive" }}>
                {card.rarity}
              </span>
            </div>

            {/* Market Value */}
            {card.marketValue > 0 && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 10px", borderRadius: 8, background: `${t.bg}0D`,
              }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "'Comic Neue', cursive" }}>Piyasa Degeri</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#2a2838", fontFamily: "'Comic Neue', cursive" }}>${card.marketValue.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Holographic shine overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, borderRadius: 16,
            opacity: holoIntensity * 0.85,
            background: `
              radial-gradient(ellipse 80% 60% at ${holoX}% ${holoY}%, rgba(255,255,255,0.25), transparent 60%),
              linear-gradient(${105 + (tilt.rotY % 360) * 0.5}deg, rgba(42,117,187,0.15) 0%, rgba(255,203,5,0.15) 33%, rgba(204,0,0,0.15) 66%, rgba(42,117,187,0.15) 100%)
            `,
            mixBlendMode: "screen",
            transition: isInteracting ? "none" : "opacity 0.4s ease",
          }} />
        </div>

        {/* BACK FACE */}
        <div style={{
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)", position: "absolute", inset: 0,
          borderRadius: 16, overflow: "hidden", border: `2px solid ${t.bg}40`, background: "#c62828",
        }}>
          <img src={`${import.meta.env.BASE_URL}app-images/cardback.jpg`} alt="Card Back"
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function CardDetail({ cards, favorites, onToggleFavorite }) {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const card = cards.find((c) => String(c.id) === cardId);

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const { cardRef, tilt, isInteracting, introPhase, handlers } = useCardTilt({ sensitivity: 0.4, initialRotY: 180 });

  // Scroll to top on page load / card change
  useEffect(() => { window.scrollTo(0, 0); }, [cardId]);

  if (!card) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 18, color: "var(--text-primary)", marginBottom: 16 }}>Kart bulunamadi</p>
        <button onClick={() => navigate(-1)} style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border-dim)",
          color: "var(--text-primary)", borderRadius: 10, padding: "10px 20px",
          cursor: "pointer", fontWeight: 600, fontSize: 14,
        }}>← Geri Don</button>
      </div>
    );
  }

  const t = typeColors[tCard(card, "type")] || typeColors["Normal"];
  const isFavorite = favorites.includes(card.id);
  const trainer = card.trainer && trainers[card.trainer];
  const meta = pokemonMeta[card.id];

  // Holographic overlay calculations
  const rawRotY = ((tilt.rotY % 360) + 360) % 360;
  const rawRotX = ((tilt.rotX % 360) + 360) % 360;
  const normRotY = rawRotY > 180 ? tilt.rotY % 360 - 360 : tilt.rotY % 360;
  const normRotX = rawRotX > 180 ? tilt.rotX % 360 - 360 : tilt.rotX % 360;
  const holoX = 50 + (normRotY / 45) * 40;
  const holoY = 50 - (normRotX / 45) * 40;
  const tiltMagnitude = Math.sqrt(tilt.rotX ** 2 + tilt.rotY ** 2);
  const holoIntensity = isInteracting ? Math.min(tiltMagnitude / 30, 1) : 0;

  // Friends & foes resolution
  const friendCards = (meta?.friends || []).map(f => ({ ...f, card: cards.find(c => c.id === f.cardId) })).filter(f => f.card);
  const foeCards = (meta?.foes || []).map(f => ({ ...f, card: cards.find(c => c.id === f.cardId) })).filter(f => f.card);

  // Fallback: same-type cards if no friends defined
  const sameTypeCards = cards.filter((c) => tCard(c, "type") === tCard(card, "type") && c.id !== card.id).slice(0, 4);
  const displayFriends = friendCards.length > 0 ? friendCards : sameTypeCards.map(c => ({ card: c, reason: `${tCard(c, "type")} Tipi` }));

  const pad = isDesktop ? "24px 28px" : "16px";

  // ─── Info Panel (shared between layouts) ───
  const renderInfoPanel = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
      {/* Name Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1 style={{
          fontFamily: "'Bangers', cursive", fontSize: isDesktop ? 36 : 28,
          fontWeight: 700, margin: 0, color: "var(--text-primary)",
        }}>{tCard(card, "name")}</h1>
        <div style={{ fontSize: isDesktop ? 14 : 13, color: "var(--text-muted)", fontFamily: "'Comic Neue', cursive" }}>
          {meta?.japaneseName || `${cardNum(card)} · ${tCard(card, "stage")}`}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4, alignItems: "center" }}>
          <span style={{
            background: `${t.bg}1A`, color: t.bg, borderRadius: 6,
            padding: "4px 12px", fontSize: 12, fontWeight: 600, fontFamily: "'Comic Neue', cursive",
          }}>
            {tCard(card, "stage") || "Temel Pokemon"}
          </span>
          {card.hp > 0 && (
            <span style={{
              background: `${t.bg}1A`, color: t.bg, borderRadius: 6,
              padding: "4px 12px", fontSize: 14, fontWeight: 700, fontFamily: "'Bangers', cursive",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              HP {card.hp}
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: t.bg, display: "inline-block" }} />
            </span>
          )}
        </div>
      </div>

      {/* Favorite Button */}
      <div>
        <button onClick={() => onToggleFavorite(card.id)} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 20px", borderRadius: 12, cursor: "pointer",
          background: isFavorite ? "rgba(247,37,133,0.1)" : "var(--bg-elevated)",
          border: `1px solid ${isFavorite ? "rgba(247,37,133,0.3)" : "var(--border-dim)"}`,
          color: isFavorite ? "#f72585" : "var(--text-primary)",
          fontWeight: 600, fontSize: isDesktop ? 14 : 13, fontFamily: "'Comic Neue', cursive",
          transition: "all 0.2s ease",
        }}>
          <span style={{ fontSize: 18, color: "#f72585" }}>{isFavorite ? "♥" : "♡"}</span>
          {isFavorite ? "Favorilerden Cikar" : "Favorilere Ekle"}
        </button>
      </div>

      {/* Info Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr 1fr 1fr" : "1fr 1fr", gap: isDesktop ? 16 : 10 }}>
          <StatCard label="Tip" value={tCard(card, "type")} orbColor={t.bg} />
          <StatCard label="Nadirlik" value={`${rarityLabels[card.rarity] || card.rarity} (${card.rarity})`} />
          <StatCard label="Piyasa Degeri" value={`$${(card.marketValue || 0).toFixed(2)}`} />
          <StatCard label="Kopya Sayisi" value={`${card.copies} adet`} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr 1fr 1fr" : "1fr 1fr", gap: isDesktop ? 16 : 10 }}>
          <StatCard
            label="Zayiflik"
            value={(card.original?.weakness ?? card.weakness) && (card.original?.weakness ?? card.weakness) !== "-" ? (card.original?.weakness ?? card.weakness) : "—"}
            orbColor={(card.original?.weakness ?? card.weakness) && (card.original?.weakness ?? card.weakness) !== "-" ? (Object.entries(typeColors).find(([k]) => (card.original?.weakness ?? card.weakness ?? "").includes(k))?.[1]?.bg) : undefined}
          />
          <StatCard label="Dayaniklilik" value="—" />
          <StatCard
            label="Cekilme"
            value={card.retreat && card.retreat !== "-" ? `${card.retreat} Enerji` : "—"}
            orbColor={card.retreat && card.retreat !== "-" ? "var(--text-secondary)" : undefined}
          />
          <StatCard label="Kart Numarasi" value={cardNum(card)} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position: "relative", zIndex: 1, background: "var(--bg-deep)", minHeight: "100vh" }}>
      {/* ═══ HEADER ═══ */}
      {isDesktop ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "16px 28px 12px",
          background: "var(--bg-card)",
        }}>
          <PokeballIcon size={48} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Comic Neue', cursive" }}>
            <Link to="/" style={{ color: "#2A75BB", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Kartlarim</Link>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>/</span>
            <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>Kart Detayi</span>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => navigate(-1)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 10, cursor: "pointer",
            background: "var(--bg-elevated)", border: "1px solid var(--border-dim)",
            color: "var(--text-primary)", fontSize: 13, fontWeight: 600,
            fontFamily: "'Comic Neue', cursive",
          }}>
            ← Kartlarima Don
          </button>
        </div>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px",
          background: "var(--bg-card)", borderBottom: "1px solid var(--border-dim)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <button onClick={() => navigate(-1)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 20, color: "var(--text-primary)", padding: 0,
          }}>←</button>
          <span style={{ fontFamily: "'Bangers', cursive", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            Kart Detayi
          </span>
        </div>
      )}

      {/* ═══ CONTENT ═══ */}
      <div style={{
        maxWidth: isDesktop ? 1200 : 480,
        margin: "0 auto",
        padding: pad,
        display: "flex", flexDirection: "column",
        gap: isDesktop ? 28 : 20,
        paddingBottom: 100,
      }}>
        {/* ═══ HERO SECTION ═══ */}
        {isDesktop ? (
          <div style={{ display: "flex", gap: 32 }}>
            {/* LEFT: Physical Card */}
            <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <PhysicalCard
                card={card} t={t} tilt={tilt} isInteracting={isInteracting} introPhase={introPhase}
                holoX={holoX} holoY={holoY} holoIntensity={holoIntensity}
                tiltMagnitude={tiltMagnitude} cardRef={cardRef} handlers={handlers}
              />
            </div>
            {/* RIGHT: Info Panel */}
            {renderInfoPanel()}
          </div>
        ) : (
          <>
            {/* Mobile: Card Showcase */}
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              <div style={{ perspective: 900, perspectiveOrigin: "50% 50%" }}>
                <div
                  ref={cardRef}
                  {...handlers}
                  style={{
                    width: 260, height: 364,
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${tilt.rotX}deg) rotateY(${tilt.rotY}deg)`,
                    transition: introPhase ? "transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)" : isInteracting ? "none" : "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    willChange: "transform",
                    cursor: introPhase ? "default" : isInteracting ? "grabbing" : "grab",
                    userSelect: "none", WebkitUserSelect: "none",
                    position: "relative", borderRadius: 12,
                    boxShadow: isInteracting
                      ? `0 ${10 + Math.abs(tilt.rotX) * 0.5}px ${20 + tiltMagnitude * 0.8}px rgba(0,0,0,0.25), 0 0 ${20 + tiltMagnitude}px ${t.glow}`
                      : "0 20px 50px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08), 0 0 60px " + t.glow.replace("0.35", "0.06"),
                  }}
                >
                  {/* Front */}
                  <div style={{
                    backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                    borderRadius: 12, overflow: "hidden", width: "100%", height: "100%",
                    position: "relative",
                  }}>
                    {resolveCardImage(card) ? (
                      <img src={resolveCardImage(card)} alt={tCard(card, "name")}
                        style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12 }}
                        crossOrigin="anonymous" />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center",
                        background: `radial-gradient(ellipse at 50% 80%, ${t.glow}, var(--bg-card) 70%)`,
                        fontSize: 64, opacity: 0.4,
                      }}>{t.emoji}</div>
                    )}
                    {/* Holo overlay */}
                    <div style={{
                      position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, borderRadius: 12,
                      opacity: holoIntensity * 0.85,
                      background: `
                        radial-gradient(ellipse 80% 60% at ${holoX}% ${holoY}%, rgba(255,255,255,0.25), transparent 60%),
                        linear-gradient(${105 + (tilt.rotY % 360) * 0.5}deg, rgba(42,117,187,0.15) 0%, rgba(255,203,5,0.15) 33%, rgba(204,0,0,0.15) 66%, rgba(42,117,187,0.15) 100%)
                      `,
                      mixBlendMode: "screen",
                      transition: isInteracting ? "none" : "opacity 0.4s ease",
                    }} />
                  </div>
                  {/* Back */}
                  <div style={{
                    backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)", position: "absolute", inset: 0,
                    borderRadius: 12, overflow: "hidden", background: "#c62828",
                  }}>
                    <img src={`${import.meta.env.BASE_URL}app-images/cardback.jpg`} alt="Card Back"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: Info Panel */}
            {renderInfoPanel()}
          </>
        )}

        {/* ═══ ABILITY ═══ */}
        {tCard(card, "ability") && (
          <div style={{
            background: "rgba(255,203,5,0.08)", border: "1px solid rgba(255,203,5,0.2)",
            padding: "12px 14px", borderRadius: 12,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>✨ Yetenek</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{tCard(card, "ability")}</div>
          </div>
        )}

        {/* ═══ BIO ═══ */}
        {(tCard(card, "bio") || meta?.bio) && (
          <SectionWrapper isDesktop={isDesktop}>
            <SectionTitle isDesktop={isDesktop}>Biyografi</SectionTitle>
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border-dim)",
              borderRadius: isDesktop ? 14 : 12, padding: isDesktop ? 16 : 14,
            }}>
              <p style={{
                fontSize: isDesktop ? 14 : 13, lineHeight: 1.6, margin: 0,
                color: "var(--text-secondary)", fontFamily: "'Comic Neue', cursive",
              }}>{tCard(card, "bio") || meta.bio}</p>
            </div>
          </SectionWrapper>
        )}

        {/* ═══ LORE ═══ */}
        {(tCard(card, "lore") || meta?.lore) && (
          <SectionWrapper isDesktop={isDesktop}>
            <SectionTitle isDesktop={isDesktop}>Hikaye</SectionTitle>
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border-dim)",
              borderRadius: isDesktop ? 14 : 12, padding: isDesktop ? 16 : 14,
            }}>
              <p style={{
                fontSize: isDesktop ? 14 : 13, lineHeight: 1.6, margin: 0,
                color: "var(--text-secondary)", fontFamily: "'Comic Neue', cursive",
              }}>{tCard(card, "lore") || meta.lore}</p>
            </div>
          </SectionWrapper>
        )}

        {/* ═══ TRAINER ═══ */}
        {trainer && (
          <SectionWrapper isDesktop={isDesktop}>
            <SectionTitle isDesktop={isDesktop}>Egitmen Bilgisi</SectionTitle>
            <Link to={`/trainer/${card.trainer}`} style={{
              display: "flex", alignItems: "center", gap: isDesktop ? 14 : 12,
              padding: isDesktop ? 16 : 14,
              background: "var(--bg-card)", border: "1px solid var(--border-dim)",
              borderRadius: isDesktop ? 14 : 12, textDecoration: "none",
            }}>
              {trainer.picture && (
                <img src={`${import.meta.env.BASE_URL}${trainer.picture}`} alt={trainer.name}
                  style={{
                    width: isDesktop ? 56 : 48, height: isDesktop ? 56 : 48,
                    borderRadius: isDesktop ? 28 : 24, objectFit: "cover", objectPosition: "top",
                  }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: isDesktop ? 16 : 14, color: "var(--text-primary)", fontFamily: "'Comic Neue', cursive" }}>{trainer.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'Comic Neue', cursive" }}>{trainer.region} Bolgesi · {trainer.specialty}</div>
              </div>
              {isDesktop && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "8px 14px", borderRadius: 8,
                  background: "rgba(42,117,187,0.1)",
                  color: "#2A75BB", fontSize: 12, fontWeight: 600, fontFamily: "'Comic Neue', cursive",
                }}>
                  ↗ Profil
                </div>
              )}
            </Link>
          </SectionWrapper>
        )}

        {/* ═══ AFFILIATIONS ═══ */}
        {meta?.affiliations?.length > 0 && (
          <SectionWrapper isDesktop={isDesktop}>
            <SectionTitle isDesktop={isDesktop}>Baglantilar</SectionTitle>
            <div style={{ display: "flex", gap: isDesktop ? 10 : 8, flexWrap: "wrap" }}>
              {meta.affiliations.map((aff, i) => (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: isDesktop ? 6 : 5,
                  padding: isDesktop ? "6px 16px" : "5px 12px",
                  borderRadius: isDesktop ? 20 : 16,
                  background: `${aff.color}1A`,
                  color: aff.color, fontSize: 13, fontWeight: 600, fontFamily: "'Comic Neue', cursive",
                }}>
                  {affiliationIcons[aff.icon] || "✨"} {aff.label}
                </span>
              ))}
            </div>
          </SectionWrapper>
        )}

        {/* ═══ FRIENDS ═══ */}
        {displayFriends.length > 0 && (
          <SectionWrapper isDesktop={isDesktop}>
            <SectionTitle isDesktop={isDesktop}>Dostlar</SectionTitle>
            <div style={{ display: "flex", gap: isDesktop ? 14 : 10, overflowX: "auto", paddingBottom: 4 }}>
              {displayFriends.map((f, i) => (
                <RelationCard key={i} card={f.card} reason={f.reason} isFoe={false} resolveImg={resolveCardImage} />
              ))}
            </div>
          </SectionWrapper>
        )}

        {/* ═══ FOES ═══ */}
        {foeCards.length > 0 && (
          <SectionWrapper isDesktop={isDesktop}>
            <SectionTitle isDesktop={isDesktop}>Rakipler</SectionTitle>
            <div style={{ display: "flex", gap: isDesktop ? 14 : 10, overflowX: "auto", paddingBottom: 4 }}>
              {foeCards.map((f, i) => (
                <RelationCard key={i} card={f.card} reason={f.reason} isFoe={true} resolveImg={resolveCardImage} />
              ))}
            </div>
          </SectionWrapper>
        )}
      </div>
    </div>
  );
}
