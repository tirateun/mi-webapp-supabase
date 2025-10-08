import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Sidebar from "./Sidebar";
import Agreements from "./Agreements";
import AgreementsForm from "./AgreementsForm";
import Users from "./Users";
import ChangePassword from "./ChangePassword";
import Login from "./Login";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activePage, setActivePage] = useState<
    "agreementsList" | "agreementsForm" | "users"
  >("agreementsList");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");

  // 🔹 Cargar sesión activa
  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("must_change_password, role, full_name")
          .eq("id", currentSession.user.id)
          .single();

        if (profile) {
          setRole(profile.role || "");
          setUserName(profile.full_name || "");
          if (profile.must_change_password) setMustChangePassword(true);
        }
      }
      setLoading(false);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (user: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("must_change_password, role, full_name")
      .eq("id", user.id)
      .single();

    setMustChangePassword(profile?.must_change_password || false);
    setRole(profile?.role || "");
    setUserName(profile?.full_name || "");
    setSession({ user });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMustChangePassword(false);
    setRole("");
    setUserName("");
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

  // 🔹 Si el usuario debe cambiar la contraseña
  if (mustChangePassword && session?.user) {
    return (
      <ChangePassword
        user={session.user}
        onPasswordChanged={() => setMustChangePassword(false)}
      />
    );
  }

  // 🔹 Si está logueado normalmente
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
          <Agreements user={session.user} role={role} />
        )}
        {activePage === "agreementsForm" && (
          <AgreementsForm user={session.user} role={role} />
        )}
        {activePage === "users" && <Users />}
      </div>
    </div>
  );
}











