import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // 🧠 Añadido para manejar rutas
import Sidebar from "./Sidebar";
import Users from "./Users";
import Login from "./Login";
import ChangePassword from "./ChangePassword";
import AgreementsList from "./AgreementsList";
import AgreementsForm from "./AgreementsForm";
import Instituciones from "./Instituciones";
import InstitucionesForm from "./InstitucionesForm";
import Contraprestaciones from "./Contraprestaciones";
import ContraprestacionesEvidencias from "./ContraprestacionesEvidencias";
import Reportes from "./Reportes";
import InstitucionesList from "./InstitucionesList";
import InformeSemestralPage from "./InformeSemestralPage"; // ✅ Nueva página agregada

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [activePage, setActivePage] = useState<
    | "agreementsList"
    | "agreementsForm"
    | "users"
    | "instituciones"
    | "institucionesForm"
    | "contraprestaciones"
    | "contraprestacionesEvidencias"
    | "reportes"
  >("agreementsList");

  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Carga inicial de sesión y perfil
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
      listener.subscription.unsubscribe();
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

  // 🧭 Aquí comienza el Router
  return (
    <Router>
      <Routes>
        {/* Nueva ruta completa para informes semestrales */}
        <Route path="/informe/:convenioId" element={<InformeSemestralPage />} />

        {/* Resto de la app bajo el layout principal */}
        <Route
          path="*"
          element={
            <div style={{ display: "flex" }}>
              <Sidebar
                setActivePage={setActivePage}
                onLogout={handleLogout}
                role={role}
                userName={fullName || session.user.email}
              />
              <div style={{ flex: 1, padding: "20px" }}>
                <h2 style={{ marginBottom: "20px" }}>
                  👋 Bienvenido, <strong>{fullName || session.user.email}</strong>{" "}
                  <span style={{ color: "#555" }}>
                    (
                    {role === "admin"
                      ? "Administrador interno"
                      : role === "internal"
                      ? "Usuario interno"
                      : "Usuario externo"}
                    )
                  </span>
                </h2>

                {/* 📋 LISTA DE CONVENIOS */}
                {activePage === "agreementsList" && (
                  <AgreementsList
                    user={session.user}
                    role={role}
                    onEdit={(agreement: any) => {
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
                  />
                )}

                {/* 📝 FORMULARIO DE CONVENIOS */}
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

                {/* 🔹 CONTRAPRESTACIONES */}
                {activePage === "contraprestaciones" && selectedAgreementId && (
                  <Contraprestaciones
                    agreementId={selectedAgreementId}
                    onBack={() => setActivePage("agreementsList")}
                  />
                )}

                {/* 📂 EVIDENCIAS */}
                {activePage === "contraprestacionesEvidencias" && selectedAgreementId && (
                  <ContraprestacionesEvidencias
                    agreementId={selectedAgreementId}
                    userId={session.user.id}
                    role={role}
                    onBack={() => setActivePage("agreementsList")}
                  />
                )}

                {/* 🏢 INSTITUCIONES */}
                {activePage === "instituciones" && <InstitucionesList role={role} />}

                {/* 👥 USUARIOS */}
                {activePage === "users" && <Users />}

                {/* 📊 REPORTES */}
                {activePage === "reportes" && <Reportes />}
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

























