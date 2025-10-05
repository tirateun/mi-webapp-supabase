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

  // 🔹 Cargar sesión activa
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session;
      setSession(currentSession);
      if (currentSession?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("must_change_password")
          .eq("id", currentSession.user.id)
          .single();

        if (profile?.must_change_password) {
          setMustChangePassword(true);
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
      .select("must_change_password")
      .eq("id", user.id)
      .single();

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
      <Sidebar onLogout={handleLogout} setActivePage={setActivePage} />
      <div style={{ flex: 1, padding: "20px" }}>
        {activePage === "agreements" ? <Agreements /> : <Users />}
      </div>
    </div>
  );
}



