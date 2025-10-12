import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Sidebar from "./Sidebar";
import Users from "./Users";
import Login from "./Login";
import ChangePassword from "./ChangePassword";
import AgreementsList from "./AgreementsList";
import AgreementsForm from "./AgreementsForm";
import Instituciones from "./Instituciones";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [activePage, setActivePage] = useState<
    "agreementsList" | "agreementsForm" | "users" | "instituciones"
  >("agreementsList");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Obtener sesión y rol
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, must_change_password")
          .eq("id", currentSession.user.id)
          .single();

        setRole(profile?.role || "");
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
      .select("role, must_change_password")
      .eq("id", user.id)
      .single();

    setRole(profile?.role || "");
    setMustChangePassword(profile?.must_change_password || false);
    setSession({ user });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMustChangePassword(false);
  };

  if (loading) return <p>Cargando...</p>;

  // No hay sesión
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

  // Debe cambiar contraseña
  if (mustChangePassword && session?.user) {
    return (
      <ChangePassword
        user={session.user}
        onPasswordChanged={() => setMustChangePassword(false)}
      />
    );
  }

  // Contenido principal
  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        setActivePage={setActivePage}
        onLogout={handleLogout}
        role={role}
        userName={session.user.email}
      />

      <div style={{ flex: 1, padding: "20px" }}>
        {activePage === "agreementsList" && (
          <AgreementsList
            user={session.user}
            role={role}
            onEdit={(agreement: any) => {
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
        {activePage === "users" && <Users />}
      </div>
    </div>
  );
}


















