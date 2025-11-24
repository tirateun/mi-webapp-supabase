// src/App.tsx

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import InformeSemestralPage from "./InformeSemestralPage";
import AreasVinculadasList from "./AreasVinculadasList";
import AgreementRenewalsPage from "./AgreementRenewalsPage";

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
  >("agreementsList");

  const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);

  // ✅ Ahora SÍ podemos usar useNavigate aquí
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        setActivePage={setActivePage}
        onLogout={onLogout}
        role={role}
        userName={fullName || session.user.email}
      />

      <div style={{ flex: 1, padding: "20px" }}>
        <h2 style={{ marginBottom: "20px" }}>
          👋 Bienvenido, <strong>{fullName || session.user.email}</strong>{" "}
          <span style={{ color: "#555" }}>
            {role === "admin"
              ? "Administrador interno"
              : role === "internal"
              ? "Usuario interno"
              : "Usuario externo"}
          </span>
        </h2>

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
              navigate(`/informe/${id}`); // ✅ Ahora funciona
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
      </div>
    </div>
  );
}

// ✅ Importa useNavigate aquí solo si lo usas dentro de MainLayout
import { useNavigate } from "react-router-dom";

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
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, must_change_password, full_name")
          .eq("id", currentSession.user.id)
          .single();

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
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, must_change_password, full_name")
      .eq("id", user.id)
      .single();

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

  if (loading) return <p>Cargando...</p>;

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




























