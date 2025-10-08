import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Sidebar from "./Sidebar";
import AgreementsList from "./AgreementsList";
import AgreementsForm from "./AgreementsForm";
import Users from "./Users";
import ChangePassword from "./ChangePassword";
import Login from "./Login";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [activePage, setActivePage] = useState<
    "agreementsList" | "agreementsForm" | "users"
  >("agreementsList");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar sesión
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, must_change_password")
          .eq("id", currentSession.user.id)
          .single();

        if (profile) {
          setRole(profile.role);
          setUserName(profile.full_name);
          setMustChangePassword(profile.must_change_password);
        }
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
      .select("role, full_name, must_change_password")
      .eq("id", user.id)
      .single();

    if (profile) {
      setRole(profile.role);
      setUserName(profile.full_name);
      setMustChangePassword(profile.must_change_password);
    }
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
        onLogout={handleLogout}
        setActivePage={setActivePage}
        role={role}
        userName={userName}
      />
      <div style={{ flex: 1, padding: "20px" }}>
        {activePage === "agreementsList" && (
          <AgreementsList user={session.user} role={role} />
        )}
        {activePage === "agreementsForm" && (
          <AgreementsForm user={session.user} role={role} />
        )}
        {activePage === "users" && <Users />}
      </div>
    </div>
  );
}









