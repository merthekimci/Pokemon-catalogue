import { useParams, useNavigate, Link } from "react-router-dom";
import { trainers } from "../data/trainers";

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
const rarityColors = { C: "#5a566e", U: "#00c896", M: "#7b61ff", RR: "#ffd166", R: "#8b5cf6", SR: "#ec4899" };

function TypeBadge({ type }) {
  const t = typeColors[type] || typeColors["Normal"];
  return (
    <span style={{
      background: `${t.bg}1A`, color: t.bg, borderRadius: 6, fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", fontSize: 12,
    }}>
      {t.emoji} {type}
    </span>
  );
}

function RarityBadge({ rarity }) {
  return (
    <span style={{
      background: rarityColors[rarity] || "#5a566e", color: "#fff",
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    }}>
      {rarity} — {rarityLabels[rarity] || rarity}
    </span>
  );
}

export default function CardDetail({ cards, favorites, onToggleFavorite, typeColors: tc }) {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const card = cards.find((c) => String(c.id) === cardId);

  if (!card) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 18, color: "var(--text-primary)", marginBottom: 16 }}>Kart bulunamadı</p>
        <button onClick={() => navigate(-1)} style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border-dim)",
          color: "var(--text-primary)", borderRadius: 10, padding: "10px 20px",
          cursor: "pointer", fontWeight: 600, fontSize: 14,
        }}>← Geri Dön</button>
      </div>
    );
  }

  const t = typeColors[card.type] || typeColors["Normal"];
  const isFavorite = favorites.includes(card.id);
  const trainer = card.trainer && trainers[card.trainer];

  const statCell = (label, value) => (
    <div style={{
      background: "var(--bg-elevated)", borderRadius: 10, padding: "12px 14px",
      border: "1px solid var(--border-dim)",
    }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Rajdhani', sans-serif" }}>{value}</div>
    </div>
  );

  const sameTypeCards = cards.filter((c) => c.type === card.type && c.id !== card.id).slice(0, 4);

  return (
    <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", paddingBottom: 100, background: "var(--bg-deep)", minHeight: "100vh" }}>
      {/* Header */}
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
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
          Kart Detayı
        </span>
      </div>

      {/* Large Card */}
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{
          borderRadius: 14, overflow: "hidden",
          border: `2px solid ${t.bg}40`, background: "var(--bg-card)",
        }}>
          <div style={{
            padding: "5px 8px", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
              {card.nameEN}
            </span>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: 14,
              color: card.hp >= 150 ? "#ff4d6d" : card.hp >= 100 ? "#d4a800" : "#0d9488",
            }}>
              HP {card.hp}
            </span>
          </div>
          <div style={{
            height: 200, display: "flex", justifyContent: "center", alignItems: "center",
            background: `radial-gradient(ellipse at 50% 80%, ${t.glow}, transparent 70%)`,
            borderTop: `2px solid ${t.bg}66`, borderBottom: `2px solid ${t.bg}66`,
            borderRadius: 5, margin: "0 6px",
          }}>
            {card.img ? (
              <img src={card.img} alt={card.nameEN}
                style={{ maxHeight: 170, maxWidth: "90%", objectFit: "contain", filter: `drop-shadow(0 4px 16px ${t.glow})` }}
                crossOrigin="anonymous" />
            ) : (
              <div style={{ fontSize: 64, opacity: 0.4 }}>{t.emoji}</div>
            )}
          </div>
          {card.attack1 && (
            <div style={{ padding: "5px 8px", borderTop: `1px solid ${t.bg}30` }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                ⚔ {card.attack1} — <b style={{ color: "#ff4d6d" }}>{card.dmg1 || "—"}</b>
              </div>
              {card.attack2 && (
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                  ⚔ {card.attack2} — <b style={{ color: "#ff4d6d" }}>{card.dmg2 || "—"}</b>
                </div>
              )}
            </div>
          )}
          <div style={{ padding: "4px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            <TypeBadge type={card.type} />
            <RarityBadge rarity={card.rarity} />
          </div>
          {card.marketValue > 0 && (
            <div style={{
              margin: "4px 8px 8px", padding: "4px 8px", borderRadius: 6,
              background: `${t.bg}0D`, display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Piyasa Değeri</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0d9488", fontFamily: "'Rajdhani', sans-serif" }}>
                ${card.marketValue.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Name + Info */}
      <div style={{ padding: "16px 16px 0" }}>
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif", fontSize: 28, fontWeight: 700,
          margin: "0 0 4px", color: "var(--text-primary)",
        }}>{card.nameEN}</h1>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
          {card.kartNo} · {card.stage}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <TypeBadge type={card.type} />
          <span style={{
            background: `${t.bg}1A`, color: t.bg, borderRadius: 6, fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 10px", fontSize: 12,
          }}>
            HP {card.hp}
          </span>
        </div>

        {/* Favorite Button */}
        <button onClick={() => onToggleFavorite(card.id)} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 16px", borderRadius: 10, cursor: "pointer",
          background: isFavorite ? "rgba(247,37,133,0.1)" : "var(--bg-elevated)",
          border: `1px solid ${isFavorite ? "rgba(247,37,133,0.3)" : "var(--border-dim)"}`,
          color: isFavorite ? "#f72585" : "var(--text-primary)",
          fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.2s ease", width: "100%", justifyContent: "center",
        }}>
          {isFavorite ? "♥ Favorilerden Çıkar" : "♡ Favorilere Ekle"}
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {statCell("Tip", card.type)}
          {statCell("Nadirlik", `${card.rarity} — ${rarityLabels[card.rarity] || ""}`)}
          {statCell("Piyasa Değeri", `$${(card.marketValue || 0).toFixed(2)}`)}
          {statCell("Kopya", `×${card.copies}`)}
          {statCell("Zayıflık", card.weakness || "—")}
          {statCell("Dayanıklılık", "—")}
          {statCell("Çekilme", card.retreat || "—")}
          {statCell("Kart No", card.kartNo)}
        </div>
      </div>

      {/* Ability */}
      {card.ability && (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{
            background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.2)",
            padding: "12px 14px", borderRadius: 12,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>✨ Yetenek</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{card.ability}</div>
          </div>
        </div>
      )}

      {/* Trainer Section */}
      {trainer && (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: 16 }}>
            <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 10px" }}>
              Eğitmen Bilgisi
            </h3>
            <Link to={`/trainer/${card.trainer}`} style={{
              display: "flex", alignItems: "center", gap: 12, padding: 14,
              background: "var(--bg-card)", border: "1px solid var(--border-dim)",
              borderRadius: 12, textDecoration: "none",
            }}>
              {trainer.picture && (
                <img src={`${import.meta.env.BASE_URL}${trainer.picture}`} alt={trainer.name}
                  style={{ width: 48, height: 48, borderRadius: 24, objectFit: "cover", objectPosition: "top" }} />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{trainer.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{trainer.region} · {trainer.specialty}</div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Related Cards */}
      {sameTypeCards.length > 0 && (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: 16 }}>
            <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 10px" }}>
              Benzer Kartlar
            </h3>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {sameTypeCards.map((c) => (
                <Link key={c.id} to={`/card/${c.id}`} style={{
                  flexShrink: 0, width: 100, textAlign: "center", textDecoration: "none",
                  background: "var(--bg-card)", border: "1px solid var(--border-dim)",
                  borderRadius: 10, padding: 8,
                }}>
                  {c.img && <img src={c.img} alt={c.nameEN} style={{ width: 60, height: 60, objectFit: "contain" }} crossOrigin="anonymous" />}
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Rajdhani', sans-serif", marginTop: 4 }}>
                    {c.nameEN}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
  );
}
