import { useState } from "react";
import Login from "./Login";
import Users from "./Users";
import Agreements from "./Agreements";
import Sidebar from "./Sidebar";
import ChangePassword from "./ChangePassword";
import { supabase } from "./supabaseClient";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false); // ✅ Nuevo estado
  const [activePage, setActivePage] = useState<"users" | "agreements">("users");

  // 🔐 Manejo de login
  const handleLogin = (user: any) => {
    setSession(user);
    setRequirePasswordChange(false);
  };

  // 🚨 Si necesita cambiar la contraseña
  const handleRequirePasswordChange = (user: any) => {
    setSession(user);
    setRequirePasswordChange(true); // ✅ Ir a ChangePassword
  };

  // 🔑 Cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRequirePasswordChange(false);
  };

  // 🧩 Renderizado condicional
  if (!session) {
    // Si no hay sesión → pantalla de login
    return <Login onLogin={handleLogin} onRequirePasswordChange={handleRequirePasswordChange} />;
  }

  if (requirePasswordChange) {
    // Si debe cambiar la contraseña → pantalla ChangePassword
    return <ChangePassword user={session} onLogout={handleLogout} />;
  }

  // 🏠 Pantalla principal
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar onLogout={handleLogout} setActivePage={setActivePage} />

      <main style={{ flex: 1, padding: "20px" }}>
        {activePage === "users" && <Users />}
        {activePage === "agreements" && <Agreements />}
      </main>
    </div>
  );
}




