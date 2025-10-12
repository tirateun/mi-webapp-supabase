import React from "react";

interface SidebarProps {
  setActivePage: (
    page:
      | "agreementsList"
      | "agreementsForm"
      | "users"
      | "instituciones"
      | "institucionesForm"
  ) => void;
  onLogout: () => void;
  role: string;
  userName: string;
}

export default function Sidebar({ setActivePage, onLogout, role, userName }: SidebarProps) {
  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#1e3a8a",
        color: "white",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px",
      }}
    >
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>
          Panel Principal
        </h2>
        <button
          onClick={() => setActivePage("agreementsList")}
          style={buttonStyle}
        >
          📄 Convenios
        </button>
        <button
          onClick={() => setActivePage("agreementsForm")}
          style={buttonStyle}
        >
          ➕ Crear Convenio
        </button>
        <button
          onClick={() => setActivePage("instituciones")}
          style={buttonStyle}
        >
          🏢 Ver Instituciones
        </button>
        <button
          onClick={() => setActivePage("institucionesForm")}
          style={buttonStyle}
        >
          🏛️ Crear Institución
        </button>
        {role === "admin" && (
          <button onClick={() => setActivePage("users")} style={buttonStyle}>
            👥 Usuarios
          </button>
        )}
      </div>

      <div>
        <p style={{ fontSize: "12px", marginBottom: "10px" }}>
          Usuario: <b>{userName}</b>
        </p>
        <button
          onClick={onLogout}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "6px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  background: "transparent",
  color: "white",
  border: "none",
  textAlign: "left",
  padding: "10px 0",
  cursor: "pointer",
  fontSize: "15px",
  width: "100%",
};
