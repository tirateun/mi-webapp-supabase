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

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 150);
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError("❌ Credenciales incorrectas o usuario no registrado.");
        return;
      }

      // 🔹 Asegurar que el usuario esté disponible después del login
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user || data?.user;

      if (!user) {
        setError("⚠️ No se pudo iniciar sesión. Intenta nuevamente.");
        return;
      }

      // 🔹 Verificar si debe cambiar contraseña
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error al obtener perfil:", profileError);
        setError("⚠️ No se pudo verificar tu perfil.");
        return;
      }

      if (profile?.must_change_password) {
        onRequirePasswordChange(user);
      } else {
        onLogin(user);
      }
    } catch (err: any) {
      console.error("Error inesperado en login:", err);
      setError("⚠️ Ocurrió un error inesperado. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert(
      "Para recuperar tu contraseña, contacta al correo proymed@unmsm.edu.pe con el administrador del sistema."
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row bg-gray-50"
      style={{ fontFamily: "Segoe UI, sans-serif" }}
    >
      {/* 🔹 Panel izquierdo con ilustración */}
      <div
        className={`hidden md:flex w-1/2 bg-blue-100 items-center justify-center transition-all duration-700 ease-out ${
          fadeIn ? "opacity-100" : "opacity-0"
        }`}
      >
        <img
          src="/Fondo 2022 47111 UNMSM.png"
          alt="Gestión de Convenios"
          className="max-w-md drop-shadow-lg"
        />
      </div>

      {/* 🔹 Panel derecho con formulario */}
      <div
        className={`flex flex-col justify-center items-center w-full md:w-1/2 p-8 transition-all duration-700 ${
          fadeIn ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
        }`}
      >
        <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-800 mb-1 text-center">
            Bienvenido 👋
          </h1>
          <p className="text-gray-600 text-center mb-8 text-sm">
            Facultad de Medicina – Universidad Nacional Mayor de San Marcos
          </p>

          <form onSubmit={handleLogin}>
            <label className="block text-gray-600 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="usuario@unmsm.edu.pe"
              className="w-full p-2 mb-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
              onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
            />

            <label className="block text-gray-600 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="********"
              className="w-full p-2 mb-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
              onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
            />

            {error && (
              <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
            )}

            <div className="flex justify-between items-center mb-4 text-sm">
              <label className="flex items-center text-gray-600">
                <input type="checkbox" className="mr-2" /> Recordarme
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition-all ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <footer className="mt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Facultad de Medicina UNMSM – Proyecto de Modernización
          </footer>
        </div>
      </div>
    </div>
  );
}










