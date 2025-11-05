import { FaNetworkWired } from "react-icons/fa"; // 🧩 Ícono para Áreas Vinculadas

interface SidebarProps {
  setActivePage: (
    page:
      | "agreementsList"
      | "agreementsForm"
      | "instituciones"
      | "users"
      | "reportes"
      | "areasVinculadas" // 👈 Nuevo
  ) => void;
  onLogout: () => void;
  role: string;
  userName: string;
}

export default function Sidebar({
  setActivePage,
  onLogout,
  role,
  userName,
}: SidebarProps) {
  return (
    <aside
      style={{
        width: "240px",
        background: "#1e3a8a",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <div>
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          🏛️ Convenios UNMSM
        </h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* 📜 Convenios */}
          <button onClick={() => setActivePage("agreementsList")} style={buttonStyle}>
            📜 Convenios
          </button>

          {/* 🏢 Instituciones */}
          <button onClick={() => setActivePage("instituciones")} style={buttonStyle}>
            🏢 Instituciones
          </button>

          {/* 🧩 Áreas Vinculadas */}
          <button
            onClick={() => setActivePage("areasVinculadas")}
            style={{
              ...buttonStyle,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaNetworkWired style={{ fontSize: "16px", color: "#93c5fd" }} />
            Áreas Vinculadas
          </button>

          {/* 👥 Usuarios y 📊 Reportes solo para admin */}
          {role === "admin" && (
            <>
              <button onClick={() => setActivePage("users")} style={buttonStyle}>
                👥 Usuarios
              </button>

              <button onClick={() => setActivePage("reportes")} style={buttonStyle}>
                📊 Reportes
              </button>
            </>
          )}
        </nav>
      </div>

      <div>
        <p
          style={{
            fontSize: "0.85rem",
            marginBottom: "8px",
            color: "#dbeafe",
          }}
        >
          {userName}
        </p>
        <button
          onClick={onLogout}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            width: "100%",
            cursor: "pointer",
            fontWeight: "500",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

const buttonStyle: React.CSSProperties = {
  background: "transparent",
  color: "white",
  border: "none",
  textAlign: "left",
  padding: "8px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  fontWeight: "500",
  fontSize: "0.95rem",
};

