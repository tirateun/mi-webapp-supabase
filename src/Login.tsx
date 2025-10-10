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
      "Para recuperar tu contraseña, contacta con el administrador del sistema o revisa tu correo registrado."
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Lado izquierdo con imagen institucional */}
      <div className="hidden md:flex w-1/2 bg-blue-900 text-white flex-col justify-center items-center relative">
        <img
          src="/Fondo 2022 471 UNMSM.png"
          alt="Imagen institucional"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="relative z-10 text-center p-10">
          <img
            src="/Escudo SF.jpg"
            alt="Logo UNMSM"
            className="mx-auto mb-4 w-24"
          />
          <img
            src="/Escudo UNMSM.jpg"
            alt="Logo HEVES"
            className="mx-auto mb-4 w-24"
          />
          <h1 className="text-3xl font-bold mb-2">
            Gestión de Convenios Académicos
          </h1>
          <p className="text-sm text-gray-100">
            Facultad de Medicina - Universidad Nacional Mayor de San Marcos
          </p>
        </div>
      </div>

      {/* Lado derecho: formulario */}
      <div className="flex w-full md:w-1/2 justify-center items-center">
        <form
          onSubmit={handleLogin}
          className="bg-white p-10 rounded-xl shadow-xl w-80 animate-fadeIn"
        >
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
            Iniciar sesión
          </h2>

          <label className="block mb-2 text-gray-600">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="usuario@correo.com"
          />

          <label className="block mb-2 text-gray-600">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="********"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-all ${
              loading ? "opacity-70" : ""
            }`}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full mt-3 text-blue-600 text-sm hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      </div>
    </div>
  );
}





