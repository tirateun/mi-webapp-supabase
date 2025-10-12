import React from "react";

interface SidebarProps {
  setActivePage: (page: "agreementsList" | "agreementsForm" | "users" | "instituciones") => void;
  onLogout: () => void;
  role: string;
  userName: string;
}

export default function Sidebar({ setActivePage, onLogout, role, userName }: SidebarProps) {
  return (
    <div
      style={{
        width: "250px",
        minHeight: "100vh",
        background: "#1e3a8a",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px 10px",
      }}
    >
      {/* 🔹 Encabezado */}
      <div>
        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
            fontSize: "20px",
            fontWeight: "bold",
            color: "#fbbf24",
          }}
        >
          Plataforma UNMSM
        </h2>

        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            marginBottom: "25px",
            color: "#cbd5e1",
          }}
        >
          {userName}
        </p>

        {/* 🔹 Menú principal */}
        <nav>
          <button
            onClick={() => setActivePage("agreementsList")}
            style={menuButton}
          >
            📑 Ver convenios
          </button>

          <button
            onClick={() => setActivePage("agreementsForm")}
            style={menuButton}
          >
            📝 Crear convenio
          </button>

          <button
            onClick={() => setActivePage("instituciones")}
            style={menuButton}
          >
            🏛️ Instituciones
          </button>

          {role === "admin" && (
            <button
              onClick={() => setActivePage("users")}
              style={menuButton}
            >
              👥 Usuarios
            </button>
          )}
        </nav>
      </div>

      {/* 🔹 Pie de menú */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "15px" }}>
        <button
          onClick={onLogout}
          style={{
            ...menuButton,
            background: "#dc2626",
            fontWeight: "bold",
          }}
        >
          🚪 Cerrar sesión
        </button>

        <p
          style={{
            fontSize: "12px",
            textAlign: "center",
            marginTop: "15px",
            color: "#93c5fd",
          }}
        >
          Facultad de Medicina UNMSM
        </p>
      </div>
    </div>
  );
}

// 🎨 Estilo base para botones del menú
const menuButton: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "10px 15px",
  marginBottom: "8px",
  border: "none",
  borderRadius: "8px",
  background: "transparent",
  color: "white",
  cursor: "pointer",
  transition: "all 0.2s ease",
  fontSize: "15px",
};

Object.assign(menuButton, {
  hover: {
    background: "#2563eb",
  },
});
