// src/Sidebar.tsx
import React from "react";

interface SidebarProps {
  onLogout: () => void;
  setActivePage: (page: "agreements" | "users") => void;
}

export default function Sidebar({ onLogout, setActivePage }: SidebarProps) {
  return (
    <div
      style={{
        width: "250px",
        background: "#1e3a8a",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
      }}
    >
      {/* Encabezado con escudos */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <img
          src="/Escudo_UNMSM.jpg"
          alt="Escudo UNMSM"
          style={{ width: "80px", borderRadius: "50%", marginBottom: "10px" }}
        />
        <img
          src="/Escudo_SF.jpg"
          alt="Escudo Facultad"
          style={{ width: "80px", borderRadius: "50%" }}
        />
        <h3 style={{ marginTop: "10px", fontSize: "16px" }}>Gestión de Convenios</h3>
      </div>

      {/* Menú */}
      <button
        onClick={() => setActivePage("agreements")}
        style={{
          width: "100%",
          padding: "10px",
          background: "transparent",
          border: "none",
          color: "white",
          textAlign: "left",
          cursor: "pointer",
          marginBottom: "10px",
          fontSize: "16px",
        }}
      >
        📑 Convenios
      </button>

      <button
        onClick={() => setActivePage("users")}
        style={{
          width: "100%",
          padding: "10px",
          background: "transparent",
          border: "none",
          color: "white",
          textAlign: "left",
          cursor: "pointer",
          marginBottom: "20px",
          fontSize: "16px",
        }}
      >
        👤 Usuarios
      </button>

      {/* Cerrar sesión */}
      <button
        onClick={onLogout}
        style={{
          marginTop: "auto",
          padding: "10px",
          background: "#dc2626",
          border: "none",
          borderRadius: "8px",
          color: "white",
          cursor: "pointer",
          width: "100%",
        }}
      >
        🚪 Cerrar sesión
      </button>
    </div>
  );
}


