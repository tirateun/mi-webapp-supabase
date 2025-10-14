import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Sidebar from "./Sidebar";
import Users from "./Users";
import Login from "./Login";
import ChangePassword from "./ChangePassword";
import AgreementsList from "./AgreementsList";
import AgreementsForm from "./AgreementsForm";
import Instituciones from "./Instituciones";
import InstitucionesForm from "./InstitucionesForm";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [activePage, setActivePage] = useState<
    "agreementsList" | "agreementsForm" | "users" | "instituciones" | "institucionesForm"
  >("agreementsList");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<any | null>(null);
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
        onRequirePasswordChange={(user) => {
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
          <span style={{ color: "#555" }}>({role === "admin" ? "Administrador interno" : role === "interno" ? "Usuario interno" : "Usuario externo"})</span>
        </h2>

        {activePage === "agreementsList" && (
          <AgreementsList
            user={session.user}
            role={role}
            onEdit={(agreement) => {
              setEditingAgreement(agreement);
              setActivePage("agreementsForm");
            }}
            onCreate={() => {
              setEditingAgreement(null);
              setActivePage("agreementsForm");
            }}
          />
        )}

        {activePage === "agreementsForm" && (
          <AgreementsForm
            existingAgreement={editingAgreement}
            onSave={() => {
              setActivePage("agreementsList");
              setEditingAgreement(null);
            }}
            onCancel={() => {
              setActivePage("agreementsList");
              setEditingAgreement(null);
            }}
          />
        )}

        {activePage === "instituciones" && <Instituciones />}
        {activePage === "institucionesForm" && (
          <InstitucionesForm
            onSave={() => setActivePage("instituciones")}
            onCancel={() => setActivePage("instituciones")}
          />
        )}
        {activePage === "users" && <Users />}
      </div>
    </div>
  );
}





















