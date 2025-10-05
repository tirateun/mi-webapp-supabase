import { supabase } from "./supabaseClient";

export default function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <div
      style={{
        width: "250px",
        height: "100vh",
        background: "#1e293b",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{ width: "100px", borderRadius: "8px", marginBottom: "10px" }}
          />
          <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>Mi WebApp</h2>
        </div>

        <nav>
          <a
            href="#usuarios"
            style={{
              display: "block",
              padding: "10px 15px",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
              marginBottom: "5px",
            }}
          >
            👥 Usuarios
          </a>
          <a
            href="#convenios"
            style={{
              display: "block",
              padding: "10px 15px",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
            }}
          >
            📑 Convenios
          </a>
        </nav>
      </div>

      <button
        onClick={onLogout}
        style={{
          padding: "10px",
          background: "#ef4444",
          border: "none",
          borderRadius: "6px",
          color: "white",
          cursor: "pointer",
        }}
      >
        🔒 Cerrar sesión
      </button>
    </div>
  );
}



