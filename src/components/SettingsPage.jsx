import PokeballIcon from "./PokeballIcon";

export default function SettingsPage({ theme, onThemeChange, ownerName, onOwnerNameChange, phone, deviceId, onShowPhoneModal, onPhoneChange }) {
  const sectionStyle = {
    background: "var(--bg-card)", border: "1px solid var(--border-dim)",
    borderRadius: 16, padding: 20, marginBottom: 16,
  };

  return (
    <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", paddingBottom: 100, background: "var(--bg-deep)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 16px 10px",
        background: "var(--bg-card)",
      }}>
        <PokeballIcon size={28} />
        <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: 24, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          Ayarlar
        </h2>
      </div>

      <div style={{ padding: "20px 16px" }}>
        {/* Theme Section */}
        <div style={sectionStyle}>
          <h2 style={{
            fontFamily: "'Bangers', cursive", fontSize: 20, fontWeight: 700,
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
              border: theme === "dark" ? "2px solid #FFCB05" : "1px solid var(--border-dim)",
              overflow: "hidden", textAlign: "left",
            }}>
              <div style={{
                height: 90, background: "#1A3F6F", display: "flex", flexDirection: "column",
                justifyContent: "center", padding: 12, gap: 4,
              }}>
                <div style={{ width: "70%", height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 3 }} />
                <div style={{ width: "50%", height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 3 }} />
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  <div style={{ width: 20, height: 20, background: "rgba(255,255,255,0.15)", borderRadius: 4 }} />
                  <div style={{ width: 20, height: 20, background: "rgba(255,255,255,0.15)", borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: theme === "dark" ? "5px solid #FFCB05" : "2px solid var(--text-muted)",
                  background: theme === "dark" ? "#FFCB05" : "transparent",
                  display: "inline-block", flexShrink: 0,
                }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Karanlık</span>
              </div>
            </button>

            {/* Light Theme Card */}
            <button onClick={() => onThemeChange("light")} style={{
              flex: 1, borderRadius: 14, padding: 0, cursor: "pointer",
              background: "var(--bg-elevated)",
              border: theme === "light" ? "2px solid #FFCB05" : "1px solid var(--border-dim)",
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
                  border: theme === "light" ? "5px solid #FFCB05" : "2px solid var(--text-muted)",
                  background: theme === "light" ? "#FFCB05" : "transparent",
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
            fontFamily: "'Bangers', cursive", fontSize: 20, fontWeight: 700,
            margin: "0 0 4px", color: "var(--text-primary)",
          }}>Koleksiyon Sahibi</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px" }}>
            Koleksiyonunuzun sahibi olarak görünecek isim
          </p>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              pointerEvents: "none", display: "inline-flex",
            }}>
              <svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="46" stroke="var(--text-muted)" strokeWidth="8" fill="none"/>
                <path d="M4 50 H40" stroke="var(--text-muted)" strokeWidth="8"/>
                <path d="M60 50 H96" stroke="var(--text-muted)" strokeWidth="8"/>
                <circle cx="50" cy="50" r="12" stroke="var(--text-muted)" strokeWidth="8" fill="var(--bg-card)"/>
                <path d="M4 50 A46 46 0 0 0 96 50" fill="var(--text-muted)" opacity="0.15"/>
              </svg>
            </span>
            <input
              className="holo-input"
              style={{ width: "100%", paddingLeft: 38 }}
              value={ownerName}
              onChange={(e) => onOwnerNameChange(e.target.value)}
              placeholder="İsminizi girin"
            />
          </div>
        </div>

        {/* Cloud Sync Section */}
        <div style={sectionStyle}>
          <h2 style={{
            fontFamily: "'Bangers', cursive", fontSize: 20, fontWeight: 700,
            margin: "0 0 4px", color: "var(--text-primary)",
          }}>Bulut Senkronizasyonu</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px" }}>
            Koleksiyonunuzu birden fazla cihazda senkronize edin
          </p>
          {deviceId && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Comic Neue', cursive" }}>
                Cihaz ID
              </span>
              <div style={{
                fontSize: 12, fontFamily: "monospace", color: "var(--text-secondary)",
                background: "var(--bg-elevated)", borderRadius: 8, padding: "8px 12px",
                marginTop: 4, wordBreak: "break-all", userSelect: "all",
              }}>
                {deviceId}
              </div>
            </div>
          )}
          {phone ? (
            <div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Comic Neue', cursive" }}>
                  Telefon Numarası
                </span>
                <div style={{
                  fontSize: 12, fontFamily: "monospace", color: "var(--text-secondary)",
                  background: "var(--bg-elevated)", borderRadius: 8, padding: "8px 12px",
                  marginTop: 4, wordBreak: "break-all", userSelect: "all",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ color: "var(--holo-1)", fontSize: 14 }}>&#x2714;</span>
                  {phone}
                </div>
              </div>
              <button
                className="btn-accent"
                style={{ fontSize: 12, padding: "6px 14px" }}
                onClick={() => onPhoneChange("")}
              >
                Bağlantıyı Kes
              </button>
            </div>
          ) : (
            <button className="btn-glow" onClick={onShowPhoneModal}>
              Telefon Numarasıyla Bağlan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
