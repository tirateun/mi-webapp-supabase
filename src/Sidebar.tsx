interface SidebarProps {
  onLogout: () => void;
  setActivePage: (page: "agreements" | "users") => void;
  userName: string;
  role: string;
}

export default function Sidebar({ onLogout, setActivePage, userName, role }: SidebarProps) {
  return (
    <div
      style={{
        width: "220px",
        backgroundColor: "#1e293b",
        color: "white",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px",
      }}
    >
      <div>
        <h2 style={{ color: "#38bdf8", textAlign: "center" }}>🌟 Gestión de Convenios</h2>
        <p style={{ textAlign: "center", fontSize: "14px", color: "#cbd5e1" }}>
          {userName} ({role})
        </p>

        <hr style={{ border: "1px solid #334155", margin: "15px 0" }} />

        <button
          onClick={() => setActivePage("agreements")}
          style={{
            background: "none",
            border: "none",
            color: "white",
            padding: "10px",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          📄 Convenios
        </button>

        <button
          onClick={() => setActivePage("users")}
          style={{
            background: "none",
            border: "none",
            color: "white",
            padding: "10px",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          👥 Usuarios
        </button>
      </div>

      <button
        onClick={onLogout}
        style={{
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
          padding: "10px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        🔒 Cerrar sesión
      </button>
    </div>
  );
}






