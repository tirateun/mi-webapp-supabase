import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({
  onLogin,
  onRequirePasswordChange,
}: {
  onLogin: (user: any) => void;
  onRequirePasswordChange: (user: any) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    // 🧠 Verificar si el usuario debe cambiar la contraseña
    // Para esto, en tu base de datos (tabla `profiles`) debe existir una columna "must_change_password" (boolean)
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("must_change_password")
      .eq("id", user?.id)
      .single();

    if (profileError) {
      console.error("Error al verificar perfil:", profileError);
    }

    // ✅ Si es su primer login, redirigir a pantalla de cambio de contraseña
    if (profileData?.must_change_password) {
      onRequirePasswordChange(user);
    } else {
      onLogin(user);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "100px auto",
        textAlign: "center",
        border: "1px solid #ddd",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
      }}
    >
      <h2>🔐 Iniciar Sesión</h2>
      <form
        onSubmit={handleLogin}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "10px" }}>❌ {error}</p>}
    </div>
  );
}




