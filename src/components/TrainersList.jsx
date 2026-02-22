import { Link } from "react-router-dom";
import { trainers } from "../data/trainers";

const TCG_LOGO = `${import.meta.env.BASE_URL}app-images/pokemon-trading-card-game-seeklogo.png`;

export default function TrainersList({ cards, typeColors }) {
  return (
    <div style={{ position: "relative", zIndex: 1, padding: "0 0 100px", maxWidth: 600, margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 16px 10px",
        background: "var(--bg-card)",
      }}>
        <img src={TCG_LOGO} alt="" style={{ height: 28, width: "auto" }} />
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif", fontSize: 18, fontWeight: 700,
          margin: 0, color: "var(--text-primary)",
        }}>Eğitmenler</h1>
      </div>

      {/* Trainer Grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 14, padding: "20px 16px",
      }}>
        {Object.entries(trainers).map(([slug, trainer]) => {
          const trainerCardCount = cards.filter((c) => c.trainer === slug).length;
          return (
            <Link key={slug} to={`/trainer/${slug}`} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              textDecoration: "none", textAlign: "center",
              background: "var(--bg-card)", border: "1px solid var(--border-dim)",
              borderRadius: 16, padding: 16, transition: "all 0.25s ease",
            }}>
              {trainer.picture && (
                <img
                  src={`${import.meta.env.BASE_URL}${trainer.picture}`}
                  alt={trainer.name}
                  style={{
                    width: 80, height: 80, borderRadius: "50%",
                    objectFit: "cover", objectPosition: "top",
                    marginBottom: 10,
                    border: "2px solid var(--border-dim)",
                  }}
                />
              )}
              <div style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 15,
                color: "var(--text-primary)", marginBottom: 2,
              }}>
                {trainer.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                {trainer.region}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 600,
                color: trainerCardCount > 0 ? "#0d9488" : "var(--text-muted)",
              }}>
                {trainerCardCount} kart
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
