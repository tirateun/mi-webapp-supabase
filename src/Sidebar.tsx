import { supabase } from "./supabaseClient";

interface SidebarProps {
  onLogout: () => void;
  setActivePage: (page: "agreements" | "users") => void;
  userName?: string;
  role?: string;
}

export default function Sidebar({ onLogout, setActivePage, userName, role }: SidebarProps) {
  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#1e293b",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "2px 0 8px rgba(0,0,0,0.2)",
      }}
    >
      {/* 🔹 Header con logo y nombre del sistema */}
      <div style={{ padding: "20px", borderBottom: "1px solid #334155", textAlign: "center" }}>
        <img
          src="/logo.png"
          alt="Logo"
          style={{ width: "80px", height: "80px", borderRadius: "50%", marginBottom: "10px" }}
        />
        <h2 style={{ fontSize: "18px", margin: 0 }}>Gestión de Convenios</h2>
      </div>

      {/* 🔹 Navegación */}
      <div>
        <button
          onClick={() => setActivePage("agreements")}
          style={buttonStyle}
        >
          📄 Convenios
        </button>
        {role === "admin" && (
          <button
            onClick={() => setActivePage("users")}
            style={buttonStyle}
          >
            👥 Usuarios
          </button>
        )}
      </div>

      {/* 🔹 Información del usuario y botón logout */}
      <div style={{ padding: "20px", borderTop: "1px solid #334155" }}>
        <p style={{ marginBottom: "10px", fontSize: "14px" }}>
          <strong>{userName || "Usuario"}</strong> <br />
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{role || "Rol no definido"}</span>
        </p>
        <button
          onClick={onLogout}
          style={{
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "10px",
            width: "100%",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🔒 Cerrar sesión
        </button>
      </div>
    </div>
  );
}

const buttonStyle = {
  display: "block",
  width: "100%",
  background: "none",
  border: "none",
  color: "white",
  textAlign: "left" as const,
  padding: "15px 20px",
  cursor: "pointer",
  fontSize: "16px",
  borderBottom: "1px solid #334155",
  transition: "background 0.2s",
};





