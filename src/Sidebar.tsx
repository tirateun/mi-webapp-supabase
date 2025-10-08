import React from "react";

interface SidebarProps {
  onLogout: () => void;
  setActivePage: (page: "agreementsList" | "agreementsForm" | "users") => void;
  role: string;
  userName: string;
}

export default function Sidebar({
  onLogout,
  setActivePage,
  role,
  userName,
}: SidebarProps) {
  return (
    <div
      style={{
        width: "240px",
        backgroundColor: "#1E293B",
        color: "white",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px",
      }}
    >
      <div>
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>🏥 Convenios</h2>
        <button
          style={buttonStyle}
          onClick={() => setActivePage("agreementsList")}
        >
          📄 Ver convenios
        </button>

        {role === "admin" && (
          <>
            <button
              style={buttonStyle}
              onClick={() => setActivePage("agreementsForm")}
            >
              ➕ Crear convenio
            </button>

            <button
              style={buttonStyle}
              onClick={() => setActivePage("users")}
            >
              👥 Usuarios
            </button>
          </>
        )}
      </div>

      <div style={{ textAlign: "center" }}>
        <p>👤 {userName}</p>
        <button
          style={{
            ...buttonStyle,
            backgroundColor: "#DC2626",
            marginTop: "10px",
          }}
          onClick={onLogout}
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#334155",
  color: "white",
  border: "none",
  padding: "10px",
  borderRadius: "8px",
  marginBottom: "10px",
  cursor: "pointer",
  textAlign: "left",
};







