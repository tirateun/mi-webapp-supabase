// src/App.tsx

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

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

/* =========================================================
   Layout principal
========================================================= */
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
    | "users"
    | "reportes"
    | "contraprestaciones"
    | "contraprestacionesEvidencias"
    | "areasVinculadas"
  >("agreementsList");

  const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(
    null
  );

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
          👋 Bienvenido,{" "}
          <strong>{fullName || session.user.email}</strong>{" "}
          <span style={{ color: "#555" }}>
            {role === "admin"
              ? "Administrador interno"
              : role === "internal"
              ? "Usuario interno"
              : "Usuario externo"}
          </span>
        </h2>

        {/* LISTA DE CONVENIOS */}
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
              navigate(`/informe/${id}`);
            }}
          />
        )}

        {/* FORMULARIO CONVENIOS */}
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

        {/* CONTRAPRESTACIONES */}
        {activePage === "contraprestaciones" && selectedAgreementId && (
          <Contraprestaciones
            agreementId={selectedAgreementId}
            onBack={() => setActivePage("agreementsList")}
          />
        )}

        {/* EVIDENCIAS */}
        {activePage === "contraprestacionesEvidencias" &&
          selectedAgreementId && (
            <ContraprestacionesEvidencias
              agreementId={selectedAgreementId}
              userId={session.user.id}
              role={role}
              onBack={() => setActivePage("agreementsList")}
            />
          )}

        {activePage === "instituciones" && (
          <InstitucionesList role={role} />
        )}

        {activePage === "users" && <Users />}

        {activePage === "reportes" && <Reportes />}

        {activePage === "areasVinculadas" && <AreasVinculadasList />}
      </div>
    </div>
  );
}

/* =========================================================
   App principal
========================================================= */
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  /* =============================
     CARGA SESIÓN INICIAL
  ============================== */
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, must_change_password, full_name")
          .eq("user_id", currentSession.user.id) // ✅ FIX CLAVE
          .single();

        if (error) {
          console.error("Error cargando profile:", error);
        }

        setRole(profile?.role || "");
        setFullName(profile?.full_name || "");
        setMustChangePassword(!!profile?.must_change_password);
      }

      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  /* =============================
     LOGIN
  ============================== */
  const handleLogin = async (user: any) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, must_change_password, user_id")
      .eq("user_id", user.id) // ✅ FIX CLAVE
      .single();

    if (error) {
      console.error("Error en handleLogin:", error);
      return;
    }

    setRole(profile.role || "");
    setFullName(profile.full_name || "");
    setMustChangePassword(!!profile.must_change_password);
    setSession({ user });
  };

  /* =============================
     LOGOUT
  ============================== */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMustChangePassword(false);
  };

  /* =============================
     RENDER
  ============================== */
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
        <Route
          path="/renewals/:agreementId"
          element={<AgreementRenewalsPage />}
        />
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





























