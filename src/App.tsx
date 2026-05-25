// src/App.tsx — con soporte PWA móvil
import ConsultaConvenios from "./ConsultaConvenios";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Users from "./Users";
import Login from "./Login";
import ChangePassword from "./ChangePassword";
import AgreementsList from "./AgreementsList";
import AgreementsForm from "./AgreementsForm";
import InstitucionesList from "./InstitucionesList";
import Contraprestaciones from "./Contraprestaciones";
import ContraprestacionesEvidencias from "./ContraprestacionesEvidencias";
import Reportes from "./Reportes";
import AreasVinculadasList from "./AreasVinculadasList";
import AgreementRenewalsPage from "./AgreementRenewalsPage";
import MovilidadesManager from "./MovilidadesManager";
import InformesPage from "./InformesPage";
import React from "react";
import ChatBot from "./ChatBot";
// ── Imports móvil ────────────────────────────────────────────
import { useIsMobile } from "./hooks/useIsMobile";
import { MobileHeader } from "./components/layout/MobileHeader";

// ─── Tipos ────────────────────────────────────────────────────
type ActivePage =
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
  | "movilidades";

// ─── Título de cada sección ───────────────────────────────────
const PAGE_TITLES: Record<ActivePage, string> = {
  agreementsList:               "Convenios",
  agreementsForm:               "Convenio",
  instituciones:                "Instituciones",
  institucionesForm:            "Instituciones",
  users:                        "Usuarios",
  reportes:                     "Reportes",
  contraprestaciones:           "Contraprestaciones",
  contraprestacionesEvidencias: "Evidencias",
  areasVinculadas:              "Áreas Vinculadas",
  consultaConvenios:            "Convenios",
  movilidades:                  "Movilidades",
};

// ─── Normalizar role al tipo que espera MobileHeader ─────────
function toMobileRole(role: string): "admin" | "interno" | "consulta" {
  if (role === "admin")    return "admin";
  if (role === "internal") return "interno";
  return "consulta";
}

// ─── Barra de navegación inferior móvil ──────────────────────
// Definida aquí porque usa setActivePage (nav por estado, no por URL)
function MobileBottomBar({
  activePage,
  setActivePage,
  role,
}: {
  activePage: ActivePage;
  setActivePage: (p: ActivePage) => void;
  role: string;
}) {
  const [showMore, setShowMore] = useState(false);
  const isConsulta = ["consulta", "Consulta"].includes(role);
  const isAdmin    = role === "admin";

  // Ítems principales de la barra
  const mainItems = [
    {
      id: "agreementsList" as ActivePage,
      consultaId: "consultaConvenios" as ActivePage, // página alternativa para rol consulta
      label: "Convenios",
      icon: (a: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={a ? "#00B4D8" : "#8BA4C0"} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12l2 2 4-4"/>
          <path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9"/>
        </svg>
      ),
    },
    {
      id: "movilidades" as ActivePage,
      label: "Movilidades",
      icon: (a: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={a ? "#00B4D8" : "#8BA4C0"} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      ),
    },
    {
      id: "contraprestaciones" as ActivePage,
      label: "Contrapr.",
      icon: (a: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={a ? "#00B4D8" : "#8BA4C0"} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6"  y1="20" x2="6"  y2="14"/>
        </svg>
      ),
    },
    {
      id: "instituciones" as ActivePage,
      label: "Instituciones",
      icon: (a: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={a ? "#00B4D8" : "#8BA4C0"} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
  ];

  // Ítems del drawer "Más"
  const moreItems = [
    { id: "reportes" as ActivePage, label: "Reportes", emoji: "📊", show: !isConsulta },
    { id: "users"   as ActivePage, label: "Usuarios",  emoji: "👥", show: isAdmin },
  ].filter(i => i.show);

  const isActive = (item: typeof mainItems[0]): boolean =>
    activePage === item.id ||
    !!(item.consultaId && activePage === item.consultaId);

  const go = (page: ActivePage) => {
    setActivePage(page);
    setShowMore(false);
  };

  // Estilos inline (sin Tailwind ni CSS externo)
  const css = {
    nav: {
      position: "fixed" as const, bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "#0B1F4B",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      display: "flex", alignItems: "center", justifyContent: "space-around",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
    },
    item: (active: boolean): React.CSSProperties => ({
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "10px 4px 8px", gap: 3, cursor: "pointer",
      position: "relative", minHeight: 60,
      border: "none", background: "none", outline: "none",
      opacity: active ? 1 : 0.65,
      WebkitTapHighlightColor: "transparent",
      transition: "opacity 0.15s",
    }),
    indicator: {
      position: "absolute" as const, top: 0, left: "50%",
      transform: "translateX(-50%)",
      width: 32, height: 3, background: "#00B4D8",
      borderRadius: "0 0 3px 3px",
    },
    label: (active: boolean): React.CSSProperties => ({
      fontSize: 10, fontWeight: active ? 700 : 400,
      color: active ? "#00B4D8" : "#8BA4C0",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    overlay: {
      position: "fixed" as const, inset: 0, zIndex: 49,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)",
    },
    drawer: {
      position: "fixed" as const, bottom: 0, left: 0, right: 0, zIndex: 60,
      background: "#1A3773", borderRadius: "20px 20px 0 0",
      padding: "12px 0 calc(80px + env(safe-area-inset-bottom, 0px))",
      boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
    },
  };

  return (
    <>
      {showMore && <div style={css.overlay} onClick={() => setShowMore(false)} />}

      {showMore && (
        <div style={css.drawer}>
          <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, margin: "0 auto 20px" }} />
          {moreItems.map(item => (
            <button key={item.id} onClick={() => go(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px",
                cursor: "pointer", border: "none", background: "none", width: "100%",
                WebkitTapHighlightColor: "transparent" }}>
              <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{item.emoji}</span>
              <span style={{ fontSize: 15, color: "#fff", fontWeight: 500,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <nav style={css.nav} aria-label="Navegación principal">
        {mainItems.map(item => {
          const active = isActive(item);
          // Consulta ve su vista de solo lectura; los demás la vista completa
          const target = isConsulta && item.id === "agreementsList"
            ? ("consultaConvenios" as ActivePage)
            : item.id;
          return (
            <button key={item.id} style={css.item(active)}
              onClick={() => go(target)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}>
              {active && <div style={css.indicator} />}
              {item.icon(active)}
              <span style={css.label(active)}>{item.label}</span>
            </button>
          );
        })}

        {moreItems.length > 0 && (
          <button style={css.item(showMore)}
            onClick={() => setShowMore(v => !v)}
            aria-label="Más opciones" aria-expanded={showMore}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={showMore ? "#00B4D8" : "#8BA4C0"} strokeWidth="2">
              <circle cx="5"  cy="12" r="1.5" fill={showMore ? "#00B4D8" : "#8BA4C0"} stroke="none"/>
              <circle cx="12" cy="12" r="1.5" fill={showMore ? "#00B4D8" : "#8BA4C0"} stroke="none"/>
              <circle cx="19" cy="12" r="1.5" fill={showMore ? "#00B4D8" : "#8BA4C0"} stroke="none"/>
            </svg>
            <span style={css.label(showMore)}>Más</span>
          </button>
        )}
      </nav>
    </>
  );
}

// ─── MainLayout ───────────────────────────────────────────────
function MainLayout({
  session, role, fullName, mustChangePassword, onLogout,
}: {
  session: any; role: string; fullName: string;
  mustChangePassword: boolean; onLogout: () => void;
}) {
  const isMobile   = useIsMobile();
  const navigate   = useNavigate();
  const mobileRole = toMobileRole(role);

  const [activePage, setActivePage] = useState<ActivePage>(
    ["consulta", "Consulta"].includes(role) ? "consultaConvenios" : "agreementsList"
  );
  const [selectedAgreement,   setSelectedAgreement]   = useState<any | null>(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);

  // Páginas que muestran el botón ← en móvil
  const SUB_PAGES: ActivePage[] = [
    "agreementsForm",
    "contraprestaciones",
    "contraprestacionesEvidencias",
  ];
  const isSubPage = SUB_PAGES.includes(activePage);

  // Volver desde subpágina
  const handleBack = () => setActivePage("agreementsList");

  // Abrir chatbot en móvil (el ChatBot ya es un widget flotante)
  const handleChatbot = () => {
    const btn = document.querySelector<HTMLButtonElement>("[data-chatbot-trigger]");
    btn?.click();
  };

  // ── Contenido de página (compartido desktop / móvil) ─────────
  const pageContent = (
    <>
      {activePage === "agreementsList" && (
        <AgreementsList
          user={session.user} role={role}
          onEdit={(agreement) => { setSelectedAgreement(agreement); setActivePage("agreementsForm"); }}
          onCreate={() => { setSelectedAgreement(null); setActivePage("agreementsForm"); }}
          onOpenContraprestaciones={(id: string) => { setSelectedAgreementId(id); setActivePage("contraprestaciones"); }}
          onOpenInforme={(id: string) => navigate(`/informes/${id}`)}
          onOpenEvidencias={(id: string) => { setSelectedAgreementId(id); setActivePage("contraprestacionesEvidencias"); }}
        />
      )}
      {activePage === "agreementsForm" && (
        <AgreementsForm
          existingAgreement={selectedAgreement}
          onSave={() => { setActivePage("agreementsList"); setSelectedAgreement(null); }}
          onCancel={() => { setActivePage("agreementsList"); setSelectedAgreement(null); }}
        />
      )}
      {activePage === "contraprestaciones" && selectedAgreementId && (
        <Contraprestaciones
          agreementId={selectedAgreementId}
          onBack={() => setActivePage("agreementsList")}
        />
      )}
      {activePage === "contraprestacionesEvidencias" && selectedAgreementId && (
        <ContraprestacionesEvidencias
          agreementId={selectedAgreementId}
          userId={session.user.id}
          role={role}
          onBack={() => setActivePage("agreementsList")}
        />
      )}
      {activePage === "instituciones"     && <InstitucionesList role={role} />}
      {activePage === "users"             && <Users />}
      {activePage === "reportes"          && <Reportes />}
      {activePage === "areasVinculadas"   && <AreasVinculadasList />}
      {activePage === "consultaConvenios" && <ConsultaConvenios userId={session.user.id} role={role} />}
      {activePage === "movilidades"       && <MovilidadesManager />}
    </>
  );

  // ═══════════════════════════════════════════════════════════
  // VISTA MÓVIL
  // ═══════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        minHeight: "100dvh",
        background: "#F0F6FC",
        overflowX: "hidden",
      }}>
        {/* Cabecera móvil */}
        <MobileHeader
          title={PAGE_TITLES[activePage]}
          subtitle="FM San Fernando · UNMSM"
          onBack={isSubPage ? handleBack : undefined}
          role={mobileRole}
          onChatbot={handleChatbot}
          isHome={activePage === "agreementsList" || activePage === "consultaConvenios"}
        />

        {/* Contenido scrolleable */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          // Espacio para la barra inferior + safe area del iPhone
          paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          WebkitOverflowScrolling: "touch",
        }}>
          {pageContent}
        </main>

        {/* Barra de navegación inferior */}
        <MobileBottomBar
          activePage={activePage}
          setActivePage={setActivePage}
          role={role}
        />

        {/* ChatBot flotante (ya se posiciona solo) */}
        <ChatBot />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // VISTA DESKTOP — sin cambios respecto al original
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8F9FA" }}>

      {/* Header institucional */}
      <div className="app-header" style={{
        position: "fixed", top: 0, left: 0, right: 0,
        background: "linear-gradient(135deg, #3D1A4F 0%, #5B2C6F 100%)",
        color: "white", padding: "1rem 2rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 1000, display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/Escudo SF.jpg" alt="UNMSM"
            style={{ height: "50px", width: "auto", borderRadius: "4px" }} />
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, letterSpacing: "0.5px" }}>
              Sistema de Gestión de Convenios
            </h1>
            <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.9, fontWeight: 300 }}>
              Facultad de Medicina San Fernando - UNMSM
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 500, marginBottom: "0.25rem" }}>
              👋 {fullName || session.user.email}
            </div>
            <span className="user-badge" style={{
              background: "#FDB913", color: "#3D1A4F",
              padding: "0.25rem 0.75rem", borderRadius: "20px",
              fontSize: "0.75rem", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.5px",
            }}>
              {role === "admin"
                ? "Administrador"
                : ["consulta", "Consulta"].includes(role) ? "Consulta"
                : role === "internal" ? "Usuario Interno"
                : "Usuario Externo"}
            </span>
          </div>
          <button onClick={onLogout} style={{
            background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
            color: "white", padding: "0.5rem 1.25rem", borderRadius: "8px",
            cursor: "pointer", fontSize: "0.9rem", fontWeight: 500,
            transition: "all 0.3s ease", display: "flex", alignItems: "center", gap: "0.5rem",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            <i className="bi bi-box-arrow-right"></i>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ marginTop: "90px", position: "fixed", left: 0, height: "calc(100vh - 90px)", overflowY: "auto" }}>
        <Sidebar
          setActivePage={setActivePage}
          onLogout={onLogout}
          role={role}
          userName={fullName || session.user.email}
        />
      </div>

      {/* Contenido principal */}
      <div style={{ flex: 1, marginLeft: "260px", marginTop: "90px", padding: "2rem", minHeight: "calc(100vh - 90px)" }}>
        {pageContent}
      </div>

      <ChatBot />
    </div>
  );
}

// ─── App principal (sin cambios) ──────────────────────────────
export default function App() {
  const [session,            setSession]            = useState<any>(null);
  const [role,               setRole]               = useState<string>("");
  const [fullName,           setFullName]           = useState<string>("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading,            setLoading]            = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, must_change_password, full_name")
          .eq("user_id", currentSession.user.id)
          .single();

        if (error) console.error("Error cargando perfil:", error);

        setRole(profile?.role || "");
        setFullName(profile?.full_name || "");
        if (profile?.must_change_password) setMustChangePassword(true);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) { setRole(""); setFullName(""); }
    });

    return () => { try { listener.subscription.unsubscribe(); } catch (e) { /* noop */ } };
  }, []);

  // Safety net: reintenta si el role no cargó
  useEffect(() => {
    if (!loading && session?.user && !role) {
      const retry = setTimeout(async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, must_change_password")
          .eq("user_id", session.user.id)
          .single();
        if (profile?.role) {
          setRole(profile.role);
          setFullName(profile.full_name || "");
          if (profile.must_change_password) setMustChangePassword(true);
        }
      }, 600);
      return () => clearTimeout(retry);
    }
  }, [loading, session, role]);

  const handleLogin = async (user: any) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, must_change_password, full_name")
      .eq("user_id", user.id)
      .single();

    if (error) console.error("Error cargando perfil (login):", error);

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
        display: "flex", justifyContent: "center", alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #3D1A4F 0%, #5B2C6F 100%)",
        color: "white", fontSize: "1.5rem", fontWeight: 500,
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
      <ChangePassword
        user={session.user}
        onPasswordChanged={() => setMustChangePassword(false)}
      />
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/renewals/:agreementId" element={<AgreementRenewalsPage />} />
        <Route path="/areas-vinculadas"      element={<AreasVinculadasList />} />
        <Route
          path="/informes/:convenioId"
          element={<InformesPage user={session.user} role={role} />}
        />
        <Route
          path="*"
          element={
            <MainLayout
              session={session} role={role} fullName={fullName}
              mustChangePassword={mustChangePassword} onLogout={handleLogout}
            />
          }
        />
      </Routes>
    </Router>
  );
}