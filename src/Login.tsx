import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin, onRequirePasswordChange }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      setError("❌ Credenciales incorrectas o usuario no registrado.");
      return;
    }

    if (data?.user) {
      // 🔑 SIEMPRE usar profiles.user_id = auth.users.id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("user_id", data.user.id)
        .single();

      setLoading(false);

      if (profileError || !profile) {
        setError("❌ Error cargando perfil del usuario.");
        return;
      }

      if (profile.must_change_password) {
        onRequirePasswordChange(data.user);
      } else {
        onLogin(data.user);
      }
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundImage: "url('/Fondo 2022 47111 UNMSM.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          padding: "40px",
          borderRadius: "15px",
          width: "380px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src="/Escudo SF.jpg"
            alt="Logo UNMSM"
            style={{ width: "160px", marginBottom: "10px" }}
          />
          <h2 style={{ color: "#1A2C59", marginBottom: "10px" }}>
            Iniciar sesión
          </h2>
          <p style={{ fontSize: "14px", color: "#444" }}>
            GESTIÓN DE CONVENIOS INSTITUCIONALES
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontWeight: "bold",
                fontSize: "14px",
                marginBottom: "5px",
                color: "#1A2C59",
              }}
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@unmsm.edu.pe"
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontWeight: "bold",
                fontSize: "14px",
                marginBottom: "5px",
                color: "#1A2C59",
              }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#1A2C59",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p
          style={{
            fontSize: "12px",
            textAlign: "center",
            color: "#555",
            marginTop: "20px",
          }}
        >
          © UNMSM - Facultad de Medicina San Fernando
        </p>
      </div>
    </div>
  );
}


