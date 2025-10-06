interface SidebarProps {
  onLogout: () => void;
  setActivePage: (page: "agreements" | "users") => void;
  userRole: string; // 👈 nuevo
}

export default function Sidebar({ onLogout, setActivePage, userRole }: SidebarProps) {
  return (
    <div
      style={{
        width: "240px",
        background: "#1e293b",
        color: "white",
        height: "100vh",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>📁 Panel</h2>

      <button
        onClick={() => setActivePage("agreements")}
        style={{
          background: "transparent",
          color: "white",
          border: "none",
          textAlign: "left",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        📑 Convenios
      </button>

      {userRole === "admin" && ( // 👈 solo admins
        <button
          onClick={() => setActivePage("users")}
          style={{
            background: "transparent",
            color: "white",
            border: "none",
            textAlign: "left",
            padding: "10px",
            cursor: "pointer",
          }}
        >
          👤 Usuarios
        </button>
      )}

      <div style={{ flexGrow: 1 }}></div>

      <button
        onClick={onLogout}
        style={{
          background: "#ef4444",
          color: "white",
          border: "none",
          padding: "10px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        🚪 Cerrar sesión
      </button>
    </div>
  );
}



