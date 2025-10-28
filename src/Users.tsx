// src/Users.tsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("internal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentRole, setCurrentRole] = useState(""); // 🔹 Para saber si el usuario actual es admin

  // 📌 Cargar usuarios existentes desde la tabla profiles
  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (!error) setUsers(data || []);
  };

  // 📌 Obtener rol del usuario actual - Versión corregida
  const fetchCurrentUserRole = async () => {
    const {  userData } = await supabase.auth.getUser();
    if (userData?.user) {
      // ✅ CORREGIDO: Desestructurar `data` y `error` del resultado de `.single()`
      const {  profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      // Opcional: manejar el error si no se encuentra el perfil o hay otro problema
      if (profileError) {
        console.error("Error obteniendo el perfil del usuario:", profileError);
        setCurrentRole("");
        return; // Salir de la función si hay error
      }

      // `profile` ahora contiene el objeto `{ role: "..." }` o es `null` si no se encontró
      setCurrentRole(profile?.role || "");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCurrentUserRole();
  }, []);

  // 📌 Crear nuevo usuario con contraseña temporal - Versión corregida
  const handleAddUser = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // ✅ Obtener el token de sesión actual - Desestructuración explícita
      const { data, error: sessionError } = await supabase.auth.getSession();

      // ✅ Verificar que haya una sesión activa y un token válido
      if (sessionError || !data.session || !data.session.access_token) {
        console.error("❌ No hay sesión activa o el token es inválido:", data, sessionError);
        alert("❌ No hay sesión activa. Por favor, inicia sesión como administrador.");
        return;
      }

      const token = data.session.access_token;
      if (!token) throw new Error("No hay sesión activa.");

      const tempPassword = "Temporal123!";

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email,
            password: tempPassword,
            full_name: fullName,
            role,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error en create-user");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ must_change_password: true })
        .eq("email", email);

      if (updateError) throw updateError;

      setSuccess(
        `✅ Usuario creado exitosamente. Contraseña temporal: ${tempPassword}`
      );
      setFullName("");
      setEmail("");
      setRole("internal");
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  // 🗑️ Eliminar usuario completamente (auth + profiles) - Versión corregida y segura
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

    try {
      // ✅ Obtener el token de sesión actual - Desestructuración explícita
      const { data, error: sessionError } = await supabase.auth.getSession();

      // ✅ Verificar que haya una sesión activa y un token válido
      if (sessionError || !data.session || !data.session.access_token) {
        console.error("❌ No hay sesión activa o el token es inválido:", data, sessionError);
        alert("❌ No hay sesión activa. Por favor, inicia sesión como administrador.");
        return;
      }

      // Opcional: Puedes verificar si el token no está expirado mirando `data.session.expires_at`
      const now = new Date().getTime() / 1000; // Timestamp actual en segundos
      if (data.session.expires_at && data.session.expires_at < now) {
        console.error("❌ La sesión ha expirado.");
        alert("❌ La sesión ha expirado. Por favor, vuelve a iniciar sesión.");
        // Aquí puedes redirigir al login si lo deseas
        return;
      }

      console.log("Enviando token:", data.session.access_token); // Para depurar
      console.log("Enviando user_id:", userId); // Para depurar

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // ✅ CORREGIDO: Usar el token de sesión
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      const dataRes = await res.json();
      if (!res.ok) {
        console.error("Respuesta de la función:", dataRes); // Para depurar
        throw new Error(dataRes.error || "Error desconocido");
      }

      alert("✅ Usuario eliminado correctamente");
      fetchUsers(); // Refresca la lista de usuarios
    } catch (err: any) {
      console.error("Error al eliminar usuario:", err); // Muestra el error en consola
      alert("❌ Error al eliminar usuario: " + err.message);
    }
  };

  return (
    <div id="usuarios">
      <h2>👤 Lista de Usuarios</h2>

      {/* Formulario para agregar nuevo usuario */}
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "10px",
          maxWidth: "500px",
        }}
      >
        <h3>➕ Agregar Usuario</h3>
        <input
          type="text"
          placeholder="Nombre completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={{ margin: "5px", padding: "8px", width: "100%" }}
        />
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ margin: "5px", padding: "8px", width: "100%" }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ margin: "5px", padding: "8px", width: "100%" }}
        >
          <option value="admin">Administrador</option>
          <option value="internal">Interno</option>
          <option value="external">Externo</option>
        </select>
        <button
          onClick={handleAddUser}
          disabled={loading}
          style={{
            marginTop: "10px",
            padding: "10px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>

        {error && <p style={{ color: "red" }}>❌ {error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
      </div>

      {/* Tabla de usuarios */}
      <h3 style={{ marginTop: "30px" }}>Usuarios Registrados</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
        }}
      >
        <thead>
          <tr style={{ background: "#f1f1f1" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Nombre</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Correo</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Rol</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              ¿Debe cambiar contraseña?
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Actualizado
            </th>
            {currentRole === "admin" && (
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: "10px" }}>
                No hay usuarios registrados.
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.full_name}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.email}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.role}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.must_change_password ? "✅ Sí" : "❌ No"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.updated_at
                    ? new Date(u.updated_at).toLocaleString()
                    : "-"}
                </td>
                {currentRole === "admin" && (
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    <button
                      // ✅ CORREGIDO: Usa u.id
                      onClick={() => handleDeleteUser(u.id)}
                      style={{
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}


