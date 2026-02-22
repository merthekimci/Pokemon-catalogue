import { useParams, useNavigate, Link } from 'react-router-dom';
import { trainers } from '../data/trainers';

export default function TrainerDetail({ cards, typeColors }) {
  const { trainerSlug } = useParams();
  const navigate = useNavigate();

  const trainer = trainers[trainerSlug];

  if (!trainer) {
    return (
      <div style={{ background: "var(--bg-deep)", minHeight: "100vh", padding: "60px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 18, color: "var(--text-primary)", marginBottom: 16 }}>Eğitmen bulunamadı</p>
        <button onClick={() => navigate(-1)} style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border-dim)",
          color: "var(--text-primary)", borderRadius: 10, padding: "10px 20px",
          cursor: "pointer", fontWeight: 600, fontSize: 14,
        }}>← Geri Dön</button>
      </div>
    );
  }

  const associatedCards = cards
    ? cards.filter((card) => card.trainer === trainerSlug)
    : [];

  return (
    <div style={{ background: "var(--bg-deep)", minHeight: "100vh", position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 16px",
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border-dim)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 20, color: "var(--text-primary)", padding: 0,
        }}>←</button>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
          {trainer.name}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 16px 100px", maxWidth: 600, margin: "0 auto" }}>

        {/* Hero Section */}
        <div style={{
          background: "var(--bg-card)", borderRadius: 16,
          border: "1px solid var(--border-dim)", overflow: "hidden", marginBottom: 20,
        }}>
          {trainer.picture && (
            <img
              src={`${import.meta.env.BASE_URL}${trainer.picture}`}
              alt={trainer.name}
              style={{
                width: "100%", height: 200, objectFit: "cover", objectPosition: "top",
                borderRadius: "12px 12px 0 0", display: "block",
              }}
            />
          )}
          <div style={{ padding: "14px 16px 0" }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>
              {trainer.name}
            </div>
            {trainer.japaneseName && (
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
                {trainer.japaneseName}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, padding: "12px 16px 16px" }}>
            {trainer.region && (
              <span style={{
                background: "#0d94881A", color: "#0d9488",
                borderRadius: 14, padding: "5px 14px", fontSize: 12, fontWeight: 600,
              }}>
                {trainer.region}
              </span>
            )}
            {trainer.specialty && (
              <span style={{
                background: "#7b61ff1A", color: "#7b61ff",
                borderRadius: 14, padding: "5px 14px", fontSize: 12, fontWeight: 600,
              }}>
                {trainer.specialty}
              </span>
            )}
          </div>
        </div>

        {/* Biography */}
        {trainer.bio && (
          <div style={{
            background: "var(--bg-card)", borderRadius: 14,
            border: "1px solid var(--border-dim)", padding: 16, marginBottom: 20,
          }}>
            <h2 style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700,
              color: "var(--text-primary)", margin: "0 0 10px",
            }}>Biyografi</h2>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>
              {trainer.bio}
            </p>
          </div>
        )}

        {/* Lore */}
        {trainer.lore && (
          <div style={{
            background: "var(--bg-card)", borderRadius: 14,
            border: "1px solid var(--border-dim)", padding: 16, marginBottom: 20,
          }}>
            <h2 style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700,
              color: "var(--text-primary)", margin: "0 0 10px",
            }}>Hikaye</h2>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>
              {trainer.lore}
            </p>
          </div>
        )}

        {/* Associated Cards */}
        <div style={{
          background: "var(--bg-card)", borderRadius: 14,
          border: "1px solid var(--border-dim)", padding: 16,
        }}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700,
            color: "var(--text-primary)", margin: "0 0 12px",
          }}>{trainer.name} Kartları ({associatedCards.length})</h2>

          {associatedCards.length > 0 ? (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
            }}>
              {associatedCards.map((card) => {
                const tc = typeColors ? typeColors[card.type] : null;
                return (
                  <Link
                    key={card.id}
                    to={`/card/${card.id}`}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 6, textDecoration: "none",
                    }}
                  >
                    <div style={{
                      width: 70, height: 70, borderRadius: 35, overflow: "hidden",
                      background: "var(--bg-elevated)", flexShrink: 0,
                    }}>
                      {card.img && (
                        <img
                          src={card.img}
                          alt={card.nameEN}
                          crossOrigin="anonymous"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)", textAlign: "center" }}>
                      {card.nameEN}
                    </span>
                    {tc && (
                      <span style={{
                        background: tc.bg, color: tc.bg === "#ffd600" ? "#2a2838" : "#fff",
                        borderRadius: 8, padding: "2px 8px", fontSize: 9, fontWeight: 700,
                      }}>
                        {card.type}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
              Bu eğitmene ait kart bulunamadı.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
