import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Sidebar from "./Sidebar";
import Agreements from "./Agreements";
import Users from "./Users";
import ChangePassword from "./ChangePassword";
import Login from "./Login";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [activePage, setActivePage] = useState<"agreements" | "users">("agreements");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar sesión activa al iniciar
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

        if (profile) {
          setRole(profile.role);
          if (profile.must_change_password) {
            setMustChangePassword(true);
          }
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

  // 🔹 Manejo de login
  const handleLogin = async (user: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, must_change_password")
      .eq("id", user.id)
      .single();

    if (profile) {
      setRole(profile.role);
      setMustChangePassword(profile.must_change_password || false);
    }

    setSession({ user });
  };

  // 🔹 Cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMustChangePassword(false);
    setRole("");
  };

  if (loading) return <p>Cargando...</p>;

  // 🔹 Si no hay sesión activa → mostrar login
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
      <Sidebar onLogout={handleLogout} setActivePage={setActivePage} role={role} />
      <div style={{ flex: 1, padding: "20px" }}>
        {activePage === "agreements" && <Agreements role={role} />}
        {activePage === "users" && <Users />}
      </div>
    </div>
  );
}






