import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Sidebar from "./Sidebar";
import Users from "./Users";
import Agreements from "./Agreements";
import Login from "./Login";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activePage, setActivePage] = useState<"users" | "agreements">("users");

  // Verificar sesión activa
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (!session) {
    return <Login onLogin={(user) => setSession(user)} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} setActivePage={setActivePage} />

      {/* Contenido principal */}
      <div
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          background: "#f8fafc",
        }}
      >
        {activePage === "users" && <Users />}
        {activePage === "agreements" && <Agreements />}
      </div>
    </div>
  );
}



