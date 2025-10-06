import { useState } from "react";

interface SidebarProps {
  onLogout: () => void;
  setActivePage: (page: "agreements" | "users") => void;
  role: string;
}

export default function Sidebar({ onLogout, setActivePage, role }: SidebarProps) {
  const [active, setActive] = useState("agreements");

  const handlePageChange = (page: "agreements" | "users") => {
    setActive(page);
    setActivePage(page);
  };

  return (
    <div
      style={{
        width: "250px",
        background: "#1e293b",
        color: "white",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            borderBottom: "1px solid #334155",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          ⚕️ Gestión de Convenios
        </div>

        <nav style={{ marginTop: "20px" }}>
          <button
            onClick={() => handlePageChange("agreements")}
            style={{
              display: "block",
              width: "100%",
              padding: "12px 16px",
              background: active === "agreements" ? "#3b82f6" : "transparent",
              color: "white",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              fontWeight: active === "agreements" ? "bold" : "normal",
            }}
          >
            📑 Convenios
          </button>

          {role === "admin" && (
            <button
              onClick={() => handlePageChange("users")}
              style={{
                display: "block",
                width: "100%",
                padding: "12px 16px",
                background: active === "users" ? "#3b82f6" : "transparent",
                color: "white",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: active === "users" ? "bold" : "normal",
              }}
            >
              👤 Usuarios
            </button>
          )}
        </nav>
      </div>

      <div style={{ padding: "20px", borderTop: "1px solid #334155" }}>
        <button
          onClick={onLogout}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "10px 16px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </div>
  );
}




