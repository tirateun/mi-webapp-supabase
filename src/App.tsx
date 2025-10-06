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
  const [userRole, setUserRole] = useState<string>(""); // 👈 Rol del usuario
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar sesión activa y obtener el rol
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
          setUserRole(profile.role);
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

  // 🔹 Manejar inicio de sesión
  const handleLogin = async (user: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, must_change_password")
      .eq("id", user.id)
      .single();

    if (profile) {
      setUserRole(profile.role);
      setMustChangePassword(profile.must_change_password || false);
    }

    setSession({ user });
  };

  // 🔹 Cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMustChangePassword(false);
    setUserRole("");
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
      <Sidebar onLogout={handleLogout} setActivePage={setActivePage} role={userRole} />
      <div style={{ flex: 1, padding: "20px" }}>
        {activePage === "agreements" && <Agreements user={session.user} role={userRole} />}
        {activePage === "users" && userRole === "admin" && <Users />}
      </div>
    </div>
  );
}




