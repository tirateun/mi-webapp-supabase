export default function Sidebar() {
  return (
    <div
      style={{
        width: "220px",
        background: "#1e293b",
        color: "white",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
      }}
    >
      <h2 style={{ marginBottom: "20px", textAlign: "center" }}>📑 Convenios</h2>
      <a
        href="#convenios"
        style={{
          color: "white",
          textDecoration: "none",
          marginBottom: "10px",
          padding: "10px",
          borderRadius: "8px",
          background: "#3b82f6",
          textAlign: "center",
        }}
      >
        Convenios
      </a>
      <a
        href="#usuarios"
        style={{
          color: "white",
          textDecoration: "none",
          marginBottom: "10px",
          padding: "10px",
          borderRadius: "8px",
          background: "#3b82f6",
          textAlign: "center",
        }}
      >
        Usuarios
      </a>
    </div>
  );
}
