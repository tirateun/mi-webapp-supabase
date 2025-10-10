import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface LoginProps {
  onLogin: (user: any) => void;
  onRequirePasswordChange: (user: any) => void;
}

export default function Login({ onLogin, onRequirePasswordChange }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 150);
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("❌ Credenciales incorrectas o usuario no registrado.");
      setLoading(false);
      return;
    }

    const user = data.user;
    const { data: profile } = await supabase
      .from("profiles")
      .select("must_change_password")
      .eq("id", user.id)
      .single();

    if (profile?.must_change_password) {
      onRequirePasswordChange(user);
    } else {
      onLogin(user);
    }

    setLoading(false);
  };

  // 🔹 Recuperar contraseña real vía Supabase
  const handleForgotPassword = async () => {
    if (!email) {
      alert("Por favor, ingresa tu correo para recuperar la contraseña.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError("❌ No se pudo enviar el correo de recuperación.");
    } else {
      setMessage("📧 Se envió un correo para restablecer tu contraseña.");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600"
      style={{ fontFamily: "Segoe UI, sans-serif" }}
    >
      {/* Banner institucional */}
      <div className="w-full max-w-4xl mb-6">
        <img
          src="/Fondo 2022 47111 UNMSM.png"
          alt="Banner institucional UNMSM"
          className="w-full h-52 sm:h-64 object-cover rounded-b-lg shadow-lg"
        />
      </div>

      {/* Formulario con animación */}
      <div
        className={`bg-white shadow-2xl rounded-2xl w-80 sm:w-96 p-8 text-center transform transition-all duration-700 ease-out ${
          fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Facultad de Medicina UNMSM
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          Unidad de Cooperación, Relaciones Interinstitucionales y Gestión de Proyectos
        </p>

        <form onSubmit={handleLogin}>
          <label className="text-gray-700 mb-1 text-left block">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="usuario@correo.com"
            className="w-full p-2 mb-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
          />

          <label className="text-gray-700 mb-1 text-left block">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="********"
            className="w-full p-2 mb-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
          />

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {message && <p className="text-green-600 text-sm mb-3">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-700 text-white py-2 rounded-md font-medium hover:bg-blue-800 transition ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <button
          onClick={handleForgotPassword}
          className="mt-4 text-blue-700 text-sm hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {/* Footer institucional */}
      <footer className="mt-6 text-gray-200 text-xs text-center">
        © {new Date().getFullYear()} Facultad de Medicina UNMSM — Unidad de Cooperación
      </footer>
    </div>
  );
}









