interface SidebarProps {
  setActivePage: (
    page: "agreementsList" | "agreementsForm" | "users" | "instituciones"
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
    <div
      style={{
        width: "240px",
        background: "#1e3a8a",
        color: "white",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>
        Gestión de Convenios
      </h2>
      <p style={{ fontSize: "14px", marginBottom: "20px" }}>{userName}</p>

      <button
        onClick={() => setActivePage("agreementsList")}
        style={btnStyle}
      >
        📋 Lista de Convenios
      </button>

      <button
        onClick={() => setActivePage("agreementsForm")}
        style={btnStyle}
      >
        📝 Crear Convenio
      </button>

      <button
        onClick={() => setActivePage("instituciones")}
        style={btnStyle}
      >
        🏛️ Instituciones
      </button>

      {role === "admin" && (
        <button
          onClick={() => setActivePage("users")}
          style={btnStyle}
        >
          👥 Usuarios
        </button>
      )}

      <div style={{ flexGrow: 1 }}></div>

      <button
        onClick={onLogout}
        style={{ ...btnStyle, background: "#ef4444" }}
      >
        🚪 Cerrar sesión
      </button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "white",
  padding: "10px 0",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "15px",
  transition: "all 0.2s",
};
