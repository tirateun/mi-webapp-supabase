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

  // 🔹 Manejo de login
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

  // 🔹 Cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMustChangePassword(false);
  };

  // 🔹 Estado de carga
  if (loading) return <p style={{ textAlign: "center", marginTop: "30px" }}>Cargando...</p>;

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

  // 🔹 Si debe cambiar la contraseña
  if (mustChangePassword && session?.user) {
    return (
      <ChangePassword
        user={session.user}
        onPasswordChanged={() => setMustChangePassword(false)}
      />
    );
  }

  // 🔹 Vista principal (logueado)
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        onLogout={handleLogout}
        setActivePage={setActivePage}
        role={role}
        userName={session.user.email}
      />

      <div style={{ flex: 1, padding: "20px", background: "#f8fafc" }}>
        {activePage === "agreementsList" && (
          <AgreementsList
            user={session.user}
            onSave={() => setActivePage("agreementsList")}
            onCancel={() => setActivePage("agreementsList")}
          />
        )}

        {activePage === "agreementsForm" && (
          <AgreementsForm
            onSave={() => setActivePage("agreementsList")}
            onCancel={() => setActivePage("agreementsList")}
          />
        )}

        {activePage === "users" && <Users />}

        {activePage === "instituciones" && <Instituciones />}
      </div>
    </div>
  );
}















