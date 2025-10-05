// src/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { path: "/users", label: "👤 Usuarios" },
    { path: "/agreements", label: "📄 Convenios" },
  ];

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
      <h2 style={{ marginBottom: "30px" }}>⚙️ Dashboard</h2>
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          style={{
            color: location.pathname === link.path ? "#3b82f6" : "white",
            textDecoration: "none",
            marginBottom: "15px",
            fontWeight: "bold",
          }}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

