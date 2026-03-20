import { useState } from "react";

interface SidebarProps {
  setActivePage: (
    page:
      | "agreementsList"
      | "agreementsForm"
      | "instituciones"
      | "institucionesForm"
      | "users"
      | "reportes"
      | "contraprestaciones"
      | "contraprestacionesEvidencias"
      | "areasVinculadas"
      | "consultaConvenios"
      | "movilidades"
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
  const [activePage, setActivePageState] = useState<string>("agreementsList");

  console.log("📍 Sidebar - activePage actual:", activePage);

  const handlePageChange = (page: any) => {
    console.log("🔄 Cambiando página a:", page);
    setActivePageState(page);
    setActivePage(page);
  };

  return (
    <aside
      style={{
        width: "260px",
        background: "#5B2C6F",
        color: "white",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
      }}
    >
      <div style={{ flex: 1, padding: "1.5rem 0" }}>
        <nav style={{ display: "flex", flexDirection: "column" }}>
          {/* 🔍 ROL CONSULTA - Solo Consultar Convenios */}
          {["consulta", "Consulta"].includes(role) && (
            <SidebarItem
              icon="🔍"
              label="Consultar Convenios"
              active={activePage === "consultaConvenios"}
              onClick={() => handlePageChange("consultaConvenios")}
            />
          )}

          {/* ROLES ADMIN E INTERNO - Menú completo */}
          {["admin", "Admin", "Administrador", "internal", "interno", "Interno"].includes(role) && (
            <>
              {/* 📜 Convenios */}
              <SidebarItem
                icon="📜"
                label="Convenios"
                active={activePage === "agreementsList"}
                onClick={() => handlePageChange("agreementsList")}
              />
              {/* 🔍 Consultar Convenios */}
              <SidebarItem
                icon="🔍"
                label="Consultar Convenios"
                active={activePage === "consultaConvenios"}
                onClick={() => handlePageChange("consultaConvenios")}
              />
              {/* 🏢 Instituciones */}
              <SidebarItem
                icon="🏢"
                label="Instituciones"
                active={activePage === "instituciones"}
                onClick={() => handlePageChange("instituciones")}
              />

              {/* 🔗 Áreas Vinculadas */}
              <SidebarItem
                icon="🔗"
                label="Áreas Vinculadas"
                active={activePage === "areasVinculadas"}
                onClick={() => handlePageChange("areasVinculadas")}
              />

              {/* 🌍 Movilidades Académicas */}
              <SidebarItem
                icon="🌍"
                label="Movilidades"
                active={activePage === "movilidades"}
                onClick={() => handlePageChange("movilidades")}
              />

              {/* Sección Admin */}
              {role === "admin" && (
                <>
                  <div
                    style={{
                      margin: "1rem 0 0.5rem 1.5rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      color: "#FDB913",
                      opacity: 0.9,
                    }}
                  >
                    Administración
                  </div>

                  {/* 👥 Usuarios */}
                  <SidebarItem
                    icon="👥"
                    label="Usuarios"
                    active={activePage === "users"}
                    onClick={() => handlePageChange("users")}
                  />

                  {/* 📊 Reportes */}
                  <SidebarItem
                    icon="📊"
                    label="Reportes"
                    active={activePage === "reportes"}
                    onClick={() => handlePageChange("reportes")}
                  />
                </>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Footer con info del usuario */}
      <div
        style={{
          padding: "1.5rem",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FDB913 0%, #E5A612 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#3D1A4F",
            }}
          >
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "white",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {userName}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.7)",
                textTransform: "capitalize",
              }}
            >
              {role === "admin" 
                ? "Administrador" 
                : ["consulta", "Consulta"].includes(role)
                ? "Consulta"
                : "Usuario Interno"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Componente reutilizable para items del sidebar
function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: active
          ? "rgba(253, 185, 19, 0.15)"
          : isHovered
          ? "rgba(255,255,255,0.1)"
          : "transparent",
        color: active ? "#FDB913" : "rgba(255,255,255,0.9)",
        border: "none",
        borderLeft: active ? "3px solid #FDB913" : "3px solid transparent",
        textAlign: "left",
        padding: "0.85rem 1.5rem",
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontWeight: active ? 600 : 500,
        fontSize: "0.95rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        width: "100%",
      }}
    >
      <span style={{ fontSize: "1.25rem", width: "24px", textAlign: "center" }}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
// Force redeploy