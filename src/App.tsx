// src/App.tsx
import ConsultaConvenios from "./ConsultaConvenios";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Users from "./Users";
import Login from "./Login";
import ChangePasswordModal from "./ChangePasswordModal";
import AgreementsList from "./AgreementsList";
import AgreementsForm from "./AgreementsForm";
import InstitucionesList from "./InstitucionesList";
import Contraprestaciones from "./Contraprestaciones";
import ContraprestacionesEvidencias from "./ContraprestacionesEvidencias";
import Reportes from "./Reportes";
import InformeSemestralPage from "./InformeSemestralPage";
import AreasVinculadasList from "./AreasVinculadasList";
import AgreementRenewalsPage from "./AgreementRenewalsPage";
import MovilidadesManager from "./MovilidadesManager"; // 🆕 AGREGAR ESTA LÍNEA
import React from "react";

// ✅ Nuevo componente: Layout principal dentro del Router
function MainLayout({
  session,
  role,
  fullName,
  mustChangePassword,
  onLogout,
}: {
  session: any;
  role: string;
  fullName: string;
  mustChangePassword: boolean;
  onLogout: () => void;
}) {
  const [activePage, setActivePage] = useState<
    | "agreementsList"
    | "agreementsForm"
    | "instituciones"
    | "institucionesForm"
    | "users"
    | "reportes"
    | "contraprestaciones"
    | "contraprestacionesEvidencias"
    | "areasVinculadas"
    | "consultaConvenios"  // 🆕 NUEVO
    | "movilidades"
  >("agreementsList");
  console.log("🏠 App - activePage actual:", activePage); // 🆕 AGREGAR
  const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);

  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8F9FA" }}>
      {/* Header institucional */}
      <div className="app-header" style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(135deg, #3D1A4F 0%, #5B2C6F 100%)",
        color: "white",
        padding: "1rem 2rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img 
            src="/Escudo SF.jpg" 
            alt="UNMSM" 
            style={{ height: "50px", width: "auto", borderRadius: "4px" }}
          />
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: "1.5rem", 
              fontWeight: 600,
              letterSpacing: "0.5px"
            }}>
              Sistema de Gestión de Convenios
            </h1>
            <p style={{ 
              margin: 0, 
              fontSize: "0.85rem", 
              opacity: 0.9,
              fontWeight: 300
            }}>
              Facultad de Medicina San Fernando - UNMSM
            </p>
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ 
              fontSize: "0.95rem", 
              fontWeight: 500,
              marginBottom: "0.25rem"
            }}>
              👋 {fullName || session.user.email}
            </div>
            <span className="user-badge" style={{
              background: "#FDB913",
              color: "#3D1A4F",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              {role === "admin"
                ? "Administrador"
                : role === "internal"
                ? "Usuario Interno"
                : "Usuario Externo"}
            </span>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              padding: "0.5rem 1.25rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 500,
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.3)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <i className="bi bi-box-arrow-right"></i>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ 
        marginTop: "90px",
        position: "fixed",
        left: 0,
        height: "calc(100vh - 90px)",
        overflowY: "auto"
      }}>
        <Sidebar
          setActivePage={setActivePage}
          onLogout={onLogout}
          role={role}
          userName={fullName || session.user.email}
        />
      </div>

      {/* Contenido principal */}
      <div style={{ 
        flex: 1, 
        marginLeft: "260px",
        marginTop: "90px",
        padding: "2rem",
        minHeight: "calc(100vh - 90px)"
      }}>
        {/* 📋 LISTA DE CONVENIOS */}
        {activePage === "agreementsList" && (
          <AgreementsList
            user={session.user}
            role={role}
            onEdit={(agreement) => {
              setSelectedAgreement(agreement);
              setActivePage("agreementsForm");
            }}
            onCreate={() => {
              setSelectedAgreement(null);
              setActivePage("agreementsForm");
            }}
            onOpenContraprestaciones={(id: string) => {
              setSelectedAgreementId(id);
              setActivePage("contraprestaciones");
            }}
            onOpenEvidencias={(id: string) => {
              setSelectedAgreementId(id);
              setActivePage("contraprestacionesEvidencias");
            }}
            onOpenInforme={(id: string) => {
              setSelectedAgreementId(id);
              navigate(`/informe/${id}`);
            }}
          />
        )}

        {/* Formulario de convenios */}
        {activePage === "agreementsForm" && (
          <AgreementsForm
            existingAgreement={selectedAgreement}
            onSave={() => {
              setActivePage("agreementsList");
              setSelectedAgreement(null);
            }}
            onCancel={() => {
              setActivePage("agreementsList");
              setSelectedAgreement(null);
            }}
          />
        )}

        {/* Contraprestaciones */}
        {activePage === "contraprestaciones" && selectedAgreementId && (
          <Contraprestaciones
            agreementId={selectedAgreementId}
            onBack={() => setActivePage("agreementsList")}
          />
        )}

        {/* Evidencias */}
        {activePage === "contraprestacionesEvidencias" && selectedAgreementId && (
          <ContraprestacionesEvidencias
            agreementId={selectedAgreementId}
            userId={session.user.id}
            role={role}
            onBack={() => setActivePage("agreementsList")}
          />
        )}

        {/* Instituciones */}
        {activePage === "instituciones" && <InstitucionesList role={role} />}

        {/* Usuarios */}
        {activePage === "users" && <Users />}

        {/* Reportes */}
        {activePage === "reportes" && <Reportes />}

        {/* Areas vinculadas */}
        {activePage === "areasVinculadas" && <AreasVinculadasList />}

        {/* Consulta de Convenios */}
        {activePage === "consultaConvenios" && (
          <ConsultaConvenios
            userId={session.user.id}
            role={role}
          />
        )}

        {/* 🌍 Movilidades Académicas - 🆕 NUEVO */}
        {activePage === "movilidades" && <MovilidadesManager />}
        
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, must_change_password, full_name")
          .eq("user_id", currentSession.user.id)  // ✅ Buscar por user_id
          .single();

        if (error) {
          console.error("Error cargando perfil:", error);
        }

        setRole(profile?.role || "");
        setFullName(profile?.full_name || "");
        if (profile?.must_change_password) setMustChangePassword(true);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      try {
        listener.subscription.unsubscribe();
      } catch (e) {
        // noop
      }
    };
  }, []);

  const handleLogin = async (user: any) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, must_change_password, full_name")
      .eq("user_id", user.id)  // ✅ Buscar por user_id
      .single();

    if (error) {
      console.error("Error cargando perfil (login):", error);
    }

    setRole(profile?.role || "");
    setFullName(profile?.full_name || "");
    setMustChangePassword(profile?.must_change_password || false);
    setSession({ user });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMustChangePassword(false);
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #3D1A4F 0%, #5B2C6F 100%)",
        color: "white",
        fontSize: "1.5rem",
        fontWeight: 500
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "1rem" }}>
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
          <p>Cargando Sistema de Convenios...</p>
        </div>
      </div>
    );
  }

  if (!session)
    return (
      <Login
        onLogin={handleLogin}
        onRequirePasswordChange={(user: any) => {
          setMustChangePassword(true);
          setSession({ user });
        }}
      />
    );

  if (mustChangePassword && session?.user) {
    return (
      <ChangePasswordModal
        user={session.user}
        onPasswordChanged={() => {
          setMustChangePassword(false);
          // Recargar el perfil para asegurar que el flag está limpio
          handleLogin(session.user);
        }}
      />
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/informe/:convenioId" element={<InformeSemestralPage />} />
        <Route path="/renewals/:agreementId" element={<AgreementRenewalsPage />} />
        <Route path="/areas-vinculadas" element={<AreasVinculadasList />} />
        <Route
          path="*"
          element={
            <MainLayout
              session={session}
              role={role}
              fullName={fullName}
              mustChangePassword={mustChangePassword}
              onLogout={handleLogout}
            />
          }
        />
      </Routes>
    </Router>
  );
}
// Force rebuild




























