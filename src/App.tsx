// src/App.tsx

import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

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

/* =======================
   Layout principal
======================= */
function MainLayout({
  session,
  role,
  fullName,
  onLogout,
}: {
  session: any;
  role: string;
  fullName: string;
  onLogout: () => void;
}) {
  const navigate = useNavigate();

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

  const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        setActivePage={setActivePage}
        onLogout={onLogout}
        role={role}
        userName={fullName || session.user.email}
      />

      <div style={{ flex: 1, padding: 20 }}>
        <h2 style={{ marginBottom: 20 }}>
          👋 Bienvenido, <strong>{fullName || session.user.email}</strong>{" "}
          <span style={{ color: "#555" }}>
            {role === "admin"
              ? "Administrador"
              : role === "internal"
              ? "Usuario interno"
              : "Usuario externo"}
          </span>
        </h2>

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

        {activePage === "agreementsForm" && (
          <AgreementsForm
            existingAgreement={selectedAgreement}
            onSave={() => setActivePage("agreementsList")}
            onCancel={() => setActivePage("agreementsList")}
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

        {activePage === "instituciones" && <InstitucionesList role={role} />}
        {activePage === "users" && <Users />}
        {activePage === "reportes" && <Reportes />}
        {activePage === "areasVinculadas" && <AreasVinculadasList />}
      </div>
    </div>
  );
}

/* =======================
   App principal
======================= */
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, full_name, must_change_password")
          .eq("user_id", currentSession.user.id) // 🔴 CLAVE
          .single();

        if (!error && profile) {
          setRole(profile.role);
          setFullName(profile.full_name || "");
          setMustChangePassword(!!profile.must_change_password);
        }
      }

      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) return <p>Cargando...</p>;

  if (!session) return <Login />;

  if (mustChangePassword) {
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
        <Route
          path="*"
          element={
            <MainLayout
              session={session}
              role={role}
              fullName={fullName}
              onLogout={handleLogout}
            />
          }
        />
      </Routes>
    </Router>
  );
}






























