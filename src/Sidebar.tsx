import React from "react";

interface SidebarProps {
  onLogout: () => Promise<void>;
  setActivePage: (page: "agreementsList" | "agreementsForm" | "users" | "instituciones") => void;
  role: string;
  userName: string;
}

export default function Sidebar({ onLogout, setActivePage, role, userName }: SidebarProps) {
  return (
    <div
      style={{
        width: "240px",
        backgroundColor: "#1e3a8a",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "100vh",
      }}
    >
      <div>
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
          <h2 style={{ marginBottom: "5px", fontSize: "18px" }}>👤 {userName}</h2>
          <p style={{ fontSize: "14px", color: "#d1d5db" }}>{role.toUpperCase()}</p>
        </div>

        <nav style={{ padding: "10px" }}>
          <button
            onClick={() => setActivePage("agreementsList")}
            style={buttonStyle}
          >
            📄 Ver convenios
          </button>

          <button
            onClick={() => setActivePage("agreementsForm")}
            style={buttonStyle}
          >
            📝 Crear convenio
          </button>

          {role === "admin" && (
            <>
              <button
                onClick={() => setActivePage("users")}
                style={buttonStyle}
              >
                👥 Usuarios
              </button>

              <button
                onClick={() => setActivePage("instituciones")}
                style={buttonStyle}
              >
                🏛️ Instituciones
              </button>
            </>
          )}
        </nav>
      </div>

      <div style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            backgroundColor: "#ef4444",
            border: "none",
            color: "white",
            padding: "10px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "10px",
  marginBottom: "8px",
  border: "none",
  background: "transparent",
  color: "white",
  cursor: "pointer",
  borderRadius: "6px",
  fontSize: "15px",
  transition: "background 0.2s",
};







