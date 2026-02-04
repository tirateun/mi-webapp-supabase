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
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("user_id", data.user.id)  // ✅ Buscar por user_id (columna que apunta a auth.users)
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
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        position: "relative",
      }}
    >
      {/* Overlay oscuro para mejor contraste */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(61, 26, 79, 0.75)",
          backdropFilter: "blur(3px)",
        }}
      />

      {/* Card de login */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          padding: "3rem 2.5rem",
          borderRadius: "20px",
          width: "420px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
          animation: "fadeInUp 0.6s ease-out",
        }}
      >
        {/* Logo y header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "120px",
              height: "120px",
              margin: "0 auto 1.5rem",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px rgba(91, 44, 111, 0.3)",
              padding: "10px",
            }}
          >
            <img
              src="/Escudo SF.jpg"
              alt="Logo UNMSM"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          </div>

          <h2
            style={{
              color: "#3D1A4F",
              marginBottom: "0.5rem",
              fontSize: "1.75rem",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            Iniciar sesión
          </h2>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#6C757D",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Gestión de Convenios
          </p>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#ADB5BD",
              marginTop: "0.25rem",
            }}
          >
            Facultad de Medicina San Fernando
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
                color: "#3D1A4F",
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
                padding: "0.875rem 1rem",
                borderRadius: "10px",
                border: "2px solid #E9ECEF",
                outline: "none",
                fontSize: "0.95rem",
                transition: "all 0.3s ease",
                backgroundColor: "#F8F9FA",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#5B2C6F";
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(91, 44, 111, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E9ECEF";
                e.currentTarget.style.backgroundColor = "#F8F9FA";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
                color: "#3D1A4F",
              }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                borderRadius: "10px",
                border: "2px solid #E9ECEF",
                outline: "none",
                fontSize: "0.95rem",
                transition: "all 0.3s ease",
                backgroundColor: "#F8F9FA",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#5B2C6F";
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(91, 44, 111, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E9ECEF";
                e.currentTarget.style.backgroundColor = "#F8F9FA";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                backgroundColor: "#f8d7da",
                color: "#721c24",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                fontSize: "0.9rem",
                marginBottom: "1.5rem",
                border: "1px solid #f5c6cb",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Botón de login */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "1rem",
              background: loading 
                ? "#ADB5BD" 
                : "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: loading ? "none" : "0 4px 15px rgba(91, 44, 111, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(91, 44, 111, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(91, 44, 111, 0.3)";
              }
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #ffffff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Ingresando...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i>
                Ingresar
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #E9ECEF",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "0.8rem",
              color: "#6C757D",
              margin: 0,
            }}
          >
            © 2025 UNMSM - Facultad de Medicina San Fernando
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#ADB5BD",
              margin: "0.25rem 0 0 0",
            }}
          >
            Sistema de Gestión de Convenios - Unidad de Cooperación, Relaciones Interinstitucionales y Gestión de Proyectos
          </p>
        </div>
      </div>

      {/* CSS para animaciones */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}