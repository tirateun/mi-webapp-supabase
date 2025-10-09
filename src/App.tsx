import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Sidebar from "./Sidebar";
import Users from "./Users";
import Login from "./Login";
import ChangePassword from "./ChangePassword";
import AgreementsList from "./AgreementsList";
import AgreementsForm from "./AgreementsForm";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [activePage, setActivePage] = useState<
    "agreementsList" | "agreementsForm" | "users"
  >("agreementsList");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Obtener sesión y rol
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

  // 🔹 Si no hay sesión, mostrar login
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

  // 🔹 Si debe cambiar contraseña
  if (mustChangePassword && session?.user) {
    return (
      <ChangePassword
        user={session.user}
        onPasswordChanged={() => setMustChangePassword(false)}
      />
    );
  }

  // 🔹 Si está logueado
  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        onLogout={handleLogout}
        setActivePage={setActivePage}
        role={role}
        userName={session.user.email}
      />
      <div style={{ flex: 1, padding: "20px" }}>
        {activePage === "agreementsList" && (
          <AgreementsList user={session.user} role={role} />
        )}
        {activePage === "agreementsForm" && (
          <AgreementsForm
            user={session.user}
            onSave={() => setActivePage("agreementsList")}
            onCancel={() => setActivePage("agreementsList")}
          />
        )}
        {activePage === "users" && <Users />}
      </div>
    </div>
  );
}











