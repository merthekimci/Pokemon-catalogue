import { useParams, useNavigate, Link } from 'react-router-dom';
import { trainers } from '../data/trainers';

export default function TrainerDetail({ cards, typeColors }) {
  const { trainerSlug } = useParams();
  const navigate = useNavigate();

  const trainer = trainers[trainerSlug];

  if (!trainer) {
    return (
      <div className="trainer-detail-page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <p style={{ fontSize: 20, marginBottom: 24, color: '#e8e6f0' }}>Eğitmen bulunamadı</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(123,97,255,0.15)',
            border: '1px solid rgba(123,97,255,0.3)',
            color: '#c4b5fd',
            borderRadius: 12,
            padding: '10px 20px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          ← Kataloğa Dön
        </button>
      </div>
    );
  }

  const associatedCards = cards
    ? cards.filter((card) => card.trainer === trainerSlug)
    : [];

  return (
    <div className="trainer-detail-page">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'rgba(123,97,255,0.15)',
          border: '1px solid rgba(123,97,255,0.3)',
          color: '#c4b5fd',
          borderRadius: 12,
          padding: '10px 20px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14,
          fontFamily: "'Rajdhani', sans-serif",
          marginBottom: 32,
          display: 'inline-block',
          transition: 'all 0.25s ease',
        }}
        onMouseEnter={(e) => { e.target.style.background = 'rgba(123,97,255,0.25)'; e.target.style.boxShadow = '0 0 16px rgba(123,97,255,0.35)'; }}
        onMouseLeave={(e) => { e.target.style.background = 'rgba(123,97,255,0.15)'; e.target.style.boxShadow = 'none'; }}
      >
        ← Kataloğa Dön
      </button>

      {/* Hero Section */}
      <div className="trainer-hero">
        {trainer.picture && (
          <img
            src={`${import.meta.env.BASE_URL}${trainer.picture}`}
            alt={trainer.name}
            className="trainer-portrait"
          />
        )}

        <div className="trainer-info">
          <h1>{trainer.name}</h1>

          {trainer.japaneseName && (
            <p className="trainer-japanese">{trainer.japaneseName}</p>
          )}

          <div className="trainer-meta">
            {trainer.region && (
              <span style={{
                background: 'rgba(0,245,212,0.12)',
                border: '1px solid rgba(0,245,212,0.3)',
                color: '#00f5d4',
              }}>
                {trainer.region}
              </span>
            )}
            {trainer.specialty && (
              <span style={{
                background: 'rgba(255,209,102,0.12)',
                border: '1px solid rgba(255,209,102,0.3)',
                color: '#ffd166',
              }}>
                {trainer.specialty}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Biography Section */}
      {trainer.bio && (
        <div className="trainer-section">
          <h2>Biyografi</h2>
          <p>{trainer.bio}</p>
        </div>
      )}

      {/* Lore Section */}
      {trainer.lore && (
        <div className="trainer-section">
          <h2>Hikaye</h2>
          <p>{trainer.lore}</p>
        </div>
      )}

      {/* Associated Cards Section */}
      <div className="trainer-section">
        <h2>{trainer.name} Kartları ({associatedCards.length})</h2>

        {associatedCards.length > 0 ? (
          <div className="trainer-cards-grid">
            {associatedCards.map((card) => {
              const tc = typeColors ? typeColors[card.type] : null;
              return (
                <Link
                  key={card.id}
                  to="/"
                  className="trainer-card-mini"
                >
                  {card.img && (
                    <img
                      src={card.img}
                      alt={card.nameEN}
                      crossOrigin="anonymous"
                    />
                  )}
                  <div className="mini-name">{card.nameEN}</div>
                  {tc && (
                    <span style={{
                      background: `${tc.bg}22`,
                      border: `1px solid ${tc.bg}44`,
                      color: tc.bg,
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: "'Rajdhani', sans-serif",
                    }}>
                      {tc.emoji} {card.type}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#8b87a0', fontSize: 14, margin: 0 }}>
            Bu eğitmene ait kart bulunamadı.
          </p>
        )}
      </div>
    </div>
  );
}
