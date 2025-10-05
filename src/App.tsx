import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Users from "./Users";
import Agreements from "./Agreements";
import { supabase } from "./supabaseClient";

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Si no hay sesión, muestra login
  if (!session) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>🔐 Iniciar sesión</h2>
        <p>Esta aplicación requiere autenticación de Supabase.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "20px" }}>
        <h1>🏥 Dashboard de Convenios</h1>
        <Users />
        <Agreements />
      </div>
    </div>
  );
}

export default App;









