import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin, onRequirePasswordChange }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("❌ Credenciales incorrectas o usuario no registrado.");
    } else if (data?.user) {
      onLogin(data.user);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gray-100"
      style={{
        backgroundImage: `url('/Fondo 2022 47111 UNMSM.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-white bg-opacity-95 rounded-2xl shadow-2xl p-10 w-[400px]">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Iniciar sesión
        </h2>

        <form onSubmit={handleLogin}>
          <label className="block mb-3">
            <span className="text-gray-700">Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="usuario@unmsm.edu.pe"
            />
          </label>

          <label className="block mb-4">
            <span className="text-gray-700">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="text-red-600 text-center mb-4 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          © UNMSM - Sistema de Registro Hospitalario
        </p>
      </div>
    </div>
  );
}

