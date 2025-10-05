export default function Sidebar({
  onLogout,
  setActivePage,
}: {
  onLogout: () => void;
  setActivePage: (page: "users" | "agreements") => void;
}) {
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
            src="/Escudo UNMSM.jpg"
            alt="Escudo UNMSM"
            style={{ width: "60px", borderRadius: "50%", marginBottom: "10px" }}
          />
          <img
            src="/Escudo SF.jpg"
            alt="Escudo SF"
            style={{ width: "60px", borderRadius: "50%", marginLeft: "10px" }}
          />
          <h2 style={{ fontSize: "16px", fontWeight: "bold", marginTop: "10px" }}>
            Facultad de Medicina - UNMSM
          </h2>
        </div>

        <nav>
          <button
            onClick={() => setActivePage("users")}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 15px",
              color: "white",
              textAlign: "left",
              background: "transparent",
              border: "none",
              borderRadius: "6px",
              marginBottom: "5px",
              cursor: "pointer",
            }}
          >
            👥 Usuarios
          </button>

          <button
            onClick={() => setActivePage("agreements")}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 15px",
              color: "white",
              textAlign: "left",
              background: "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            📑 Convenios
          </button>
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

