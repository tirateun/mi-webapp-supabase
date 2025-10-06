import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Sidebar from "./Sidebar";
import Agreements from "./Agreements";
import Users from "./Users";
import ChangePassword from "./ChangePassword";
import Login from "./Login";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activePage, setActivePage] = useState<"agreements" | "users">("agreements");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  // 🔹 Cargar sesión activa
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("must_change_password, role, full_name")
          .eq("id", currentSession.user.id)
          .single();

        if (profile) {
          setMustChangePassword(profile.must_change_password);
          setUserRole(profile.role);
          setUserName(profile.full_name);
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
      .select("must_change_password, role, full_name")
      .eq("id", user.id)
      .single();

    if (profile) {
      setMustChangePassword(profile.must_change_password);
      setUserRole(profile.role);
      setUserName(profile.full_name);
    }

    setSession({ user });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMustChangePassword(false);
    setUserRole("");
    setUserName("");
  };

  if (loading) return <p>Cargando...</p>;

  // 🔹 Si no hay sesión → mostrar login
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

  // 🔹 App principal
  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        onLogout={handleLogout}
        setActivePage={setActivePage}
        userName={userName}
        role={userRole}
      />
      <div style={{ flex: 1, padding: "20px", backgroundColor: "#f8fafc" }}>
        {activePage === "agreements" && <Agreements user={session.user} role={userRole} />}
        {activePage === "users" && <Users />}
      </div>
    </div>
  );
}





