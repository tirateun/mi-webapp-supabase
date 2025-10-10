import { useState } from "react";
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
      className="min-h-screen flex flex-col items-center justify-start bg-gray-50"
      style={{ fontFamily: "Segoe UI, sans-serif" }}
    >
      {/* Banner institucional */}
      <div className="w-full">
        <img
          src="/Fondo 2022 47111 UNMSM.png"
          alt="Banner institucional UNMSM"
          className="w-full h-64 object-cover shadow-lg"
        />
      </div>

      {/* Título */}
      <div className="text-center mt-10 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Facultad de Medicina San Fernando UNMSM
        </h1>
        <p className="text-gray-600 text-sm">
          Unidad de Cooperación, relaciones interinstitucionales y Gestión de Proyectos UCRIGP
        </p>
      </div>

      {/* Formulario */}
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-lg rounded-2xl mt-8 p-8 w-80 sm:w-96 flex flex-col border border-gray-200"
      >
        <h2 className="text-xl font-semibold text-center mb-6 text-gray-700">
          Iniciar sesión
        </h2>

        <label className="text-gray-600 mb-1">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="usuario@correo.com"
          className="p-2 mb-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
          onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
        />

        <label className="text-gray-600 mb-1">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="********"
          className="p-2 mb-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
          onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
        />

        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition-all ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <button
          type="button"
          onClick={handleForgotPassword}
          className="mt-3 text-blue-600 text-sm hover:underline text-center"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>

      {/* Pie institucional */}
      <footer className="mt-8 mb-6 text-gray-500 text-xs text-center">
        © {new Date().getFullYear()} Facultad de Medicina UNMSM – Proyecto de Modernización
      </footer>
    </div>
  );
}







