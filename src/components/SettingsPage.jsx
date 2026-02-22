const TCG_LOGO = `${import.meta.env.BASE_URL}app-images/pokemon-trading-card-game-seeklogo.png`;

export default function SettingsPage({ theme, onThemeChange, ownerName, onOwnerNameChange }) {
  const sectionStyle = {
    background: "var(--bg-card)", border: "1px solid var(--border-dim)",
    borderRadius: 16, padding: 20, marginBottom: 16,
  };

  return (
    <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 16px 10px",
        background: "var(--bg-card)",
      }}>
        <img src={TCG_LOGO} alt="" style={{ height: 28, width: "auto" }} />
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
          Ayarlar
        </span>
      </div>

      <div style={{ padding: "20px 16px" }}>
        {/* Theme Section */}
        <div style={sectionStyle}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700,
            margin: "0 0 4px", color: "var(--text-primary)",
          }}>Tema Seçimi</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px" }}>
            Uygulamanın görünümünü özelleştirin
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {/* Dark Theme Card */}
            <button onClick={() => onThemeChange("dark")} style={{
              flex: 1, borderRadius: 14, padding: 0, cursor: "pointer",
              background: "var(--bg-elevated)",
              border: theme === "dark" ? "2px solid #0d9488" : "1px solid var(--border-dim)",
              overflow: "hidden", textAlign: "left",
            }}>
              <div style={{
                height: 90, background: "#07060b", display: "flex", flexDirection: "column",
                justifyContent: "center", padding: 12, gap: 4,
              }}>
                <div style={{ width: "70%", height: 6, background: "#1a1825", borderRadius: 3 }} />
                <div style={{ width: "50%", height: 6, background: "#1a1825", borderRadius: 3 }} />
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  <div style={{ width: 20, height: 20, background: "#13121a", borderRadius: 4 }} />
                  <div style={{ width: 20, height: 20, background: "#13121a", borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: theme === "dark" ? "5px solid #0d9488" : "2px solid var(--text-muted)",
                  background: theme === "dark" ? "#0d9488" : "transparent",
                  display: "inline-block", flexShrink: 0,
                }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Karanlık</span>
              </div>
            </button>

            {/* Light Theme Card */}
            <button onClick={() => onThemeChange("light")} style={{
              flex: 1, borderRadius: 14, padding: 0, cursor: "pointer",
              background: "var(--bg-elevated)",
              border: theme === "light" ? "2px solid #0d9488" : "1px solid var(--border-dim)",
              overflow: "hidden", textAlign: "left",
            }}>
              <div style={{
                height: 90, background: "#f5f5f7", display: "flex", flexDirection: "column",
                justifyContent: "center", padding: 12, gap: 4,
              }}>
                <div style={{ width: "70%", height: 6, background: "#e0dfe8", borderRadius: 3 }} />
                <div style={{ width: "50%", height: 6, background: "#e0dfe8", borderRadius: 3 }} />
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  <div style={{ width: 20, height: 20, background: "#ffffff", borderRadius: 4, border: "1px solid #e0dfe8" }} />
                  <div style={{ width: 20, height: 20, background: "#ffffff", borderRadius: 4, border: "1px solid #e0dfe8" }} />
                </div>
              </div>
              <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: theme === "light" ? "5px solid #0d9488" : "2px solid var(--text-muted)",
                  background: theme === "light" ? "#0d9488" : "transparent",
                  display: "inline-block", flexShrink: 0,
                }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Aydınlık</span>
              </div>
            </button>
          </div>
        </div>

        {/* Owner Section */}
        <div style={sectionStyle}>
          <h2 style={{
            fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700,
            margin: "0 0 4px", color: "var(--text-primary)",
          }}>Koleksiyon Sahibi</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px" }}>
            Koleksiyonunuzun sahibi olarak görünecek isim
          </p>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 16, color: "var(--text-muted)", pointerEvents: "none",
            }}>👤</span>
            <input
              className="holo-input"
              style={{ width: "100%", paddingLeft: 38 }}
              value={ownerName}
              onChange={(e) => onOwnerNameChange(e.target.value)}
              placeholder="İsminizi girin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
