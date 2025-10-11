interface SidebarProps {
  onLogout: () => void;
  setActivePage: (
    page:
      | "agreementsList"
      | "agreementsForm"
      | "users"
      | "instituciones"
      | "institucionesForm"
  ) => void;
  role: string;
  userName: string;
}

export default function Sidebar({
  onLogout,
  setActivePage,
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
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            padding: "20px",
            fontWeight: "bold",
            textAlign: "center",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          Sistema de Convenios
        </div>

        <ul style={{ listStyle: "none", padding: "0" }}>
          <li
            onClick={() => setActivePage("agreementsList")}
            style={{
              padding: "12px 20px",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            📄 Ver Convenios
          </li>
          <li
            onClick={() => setActivePage("agreementsForm")}
            style={{
              padding: "12px 20px",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            📝 Crear Convenio
          </li>

          <li
            onClick={() => setActivePage("instituciones")}
            style={{
              padding: "12px 20px",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            🏛️ Ver Instituciones
          </li>
          <li
            onClick={() => setActivePage("institucionesForm")}
            style={{
              padding: "12px 20px",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            ➕ Crear Institución
          </li>

          {role === "admin" && (
            <li
              onClick={() => setActivePage("users")}
              style={{
                padding: "12px 20px",
                cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              👥 Usuarios
            </li>
          )}
        </ul>
      </div>

      <div
        style={{
          padding: "15px",
          borderTop: "1px solid rgba(255,255,255,0.2)",
          textAlign: "center",
          fontSize: "0.9em",
        }}
      >
        <p style={{ marginBottom: "10px", fontStyle: "italic" }}>{userName}</p>
        <button
          onClick={onLogout}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            padding: "8px 15px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}







