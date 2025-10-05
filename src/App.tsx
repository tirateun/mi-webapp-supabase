import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Sidebar from "./Sidebar";
import Users from "./Users";
import Agreements from "./Agreements";
import Login from "./Login";

export default function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // ✅ Obtener sesión actual
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    // 🔄 Escuchar cambios en la sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!session) return <Login />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f8" }}>
      <Sidebar onLogout={handleLogout} />

      <div style={{ flex: 1, padding: "30px" }}>
        <h1
          style={{
            textAlign: "center",
            fontSize: "24px",
            marginBottom: "30px",
            color: "#333",
          }}
        >
          🚀 Panel Principal
        </h1>

        <section id="usuarios">
          <Users />
        </section>

        <section id="convenios" style={{ marginTop: "60px" }}>
          <Agreements />
        </section>
      </div>
    </div>
  );
}


