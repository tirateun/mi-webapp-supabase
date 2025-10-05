import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import Users from "./Users";

export default function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // ✅ Detectar si ya hay sesión iniciada
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // ✅ Escuchar cambios de autenticación (login / logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔐 Si no hay sesión → mostrar Login
  if (!session) {
    return <Login />;
  }

  // 👤 Si hay sesión → mostrar lista de usuarios
  return <Users />;
}
