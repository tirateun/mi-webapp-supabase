import { useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("❌ Credenciales incorrectas o usuario no registrado.");
    } else if (data.user) {
      navigate("/dashboard"); // o la ruta principal que uses
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-700 p-6">
      <div className="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden max-w-4xl w-full">
        {/* Imagen lateral */}
        <div className="hidden md:flex md:w-1/2 bg-gray-100 items-center justify-center p-8">
          <img
            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
            alt="Login Illustration"
            className="w-3/4"
          />
        </div>

        {/* Formulario */}
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Iniciar sesión
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ejemplo@correo.com"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="********"
                required
              />
            </div>

            {error && (
              <p className="text-red-600 text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-300 transform hover:scale-[1.02]"
            >
              Ingresar
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            ¿No tienes una cuenta?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-blue-600 font-semibold cursor-pointer hover:underline"
            >
              Regístrate
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}















