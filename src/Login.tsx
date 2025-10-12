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
      {/* Lado izquierdo con ilustración */}
      <div className="hidden md:flex md:w-1/2 bg-blue-100 items-center justify-center">
        <img
          src="/Fondo 2022 47111 UNMSM.png"
          alt="Ilustración de bienvenida"
          className="w-4/5 max-w-lg drop-shadow-md"
        />
      </div>

      {/* Lado derecho con formulario */}
      <div
        className={`flex flex-col justify-center items-center md:w-1/2 w-full p-8 transition-all duration-700 ${
          fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
            Bienvenido 👋
          </h2>
          <p className="text-gray-500 text-center mb-8 text-sm">
            Inicia sesión con tu correo institucional y contraseña.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-gray-600 mb-1 block text-sm">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="usuario@unmsm.edu.pe"
                className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
              />
            </div>

            <div>
              <label className="text-gray-600 mb-1 block text-sm">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="********"
                className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="accent-blue-600" />
                Recordarme
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
              className={`w-full mt-3 bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-all ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="text-gray-400 text-xs text-center mt-8">
            © {new Date().getFullYear()} Facultad de Medicina UNMSM — Gestión de Convenios
          </p>
        </div>
      </div>
    </div>
  );
}









