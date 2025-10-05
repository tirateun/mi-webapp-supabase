import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h2>🔐 Iniciar sesión</h2>
      <p>Esta aplicación requiere autenticación de Supabase.</p>
      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ margin: "10px", padding: "10px", width: "250px" }}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ margin: "10px", padding: "10px", width: "250px" }}
      />
      <br />
      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "10px 20px",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        {loading ? "Ingresando..." : "Entrar"}
      </button>

      {error && <p style={{ color: "red" }}>❌ {error}</p>}
    </div>
  );
}

