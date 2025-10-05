import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import Sidebar from "./Sidebar";
import Users from "./Users";
import Agreements from "./Agreements";
import ChangePassword from "./ChangePassword";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activePage, setActivePage] = useState<"users" | "agreements">("users");
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      // 🚨 Detectar si el usuario tiene la contraseña provisional
      // Aquí asumimos que si el email contiene "Temporal" o un flag de metadata,
      // puedes adaptarlo según tu base de datos o un campo `force_password_change`.
      const checkProvisional = async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("must_change_password")
          .eq("id", session.user.id)
          .single();

        if (!error && data?.must_change_password) {
          setMustChangePassword(true);
        }
      };
      checkProvisional();
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (!session) return <Login onLogin={(user) => setSession(user)} />;
  if (mustChangePassword)
    return <ChangePassword onPasswordChanged={() => setMustChangePassword(false)} />;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar onLogout={handleLogout} setActivePage={setActivePage} />
      <div style={{ flex: 1, padding: "20px" }}>
        {activePage === "users" ? <Users /> : <Agreements />}
      </div>
    </div>
  );
}



