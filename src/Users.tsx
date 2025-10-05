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

  // 🔹 Cargar usuarios desde la tabla profiles
  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      console.error("Error cargando usuarios:", error.message);
    } else {
      setUsers(data || []);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔹 Crear nuevo usuario con contraseña provisional
  const handleAddUser = async () => {
    if (!email || !fullName) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const provisionalPassword = "Temporal123!";

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("No hay sesión activa. Inicia sesión como administrador.");

      console.log("🔑 Token de sesión:", token);

      // Llamar a la función Edge de Supabase para crear usuario
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
            password: provisionalPassword,
            full_name: fullName,
            role,
            user_metadata: {
              must_change_password: true, // 👈 marca para forzar cambio al primer login
            },
          }),
        }
      );

      const resultText = await response.text();
      console.log("📦 Respuesta bruta:", resultText);

      let result: any;
      try {
        result = JSON.parse(resultText);
      } catch {
        throw new Error("Respuesta inválida del servidor.");
      }

      if (!response.ok) throw new Error(result.error || "Error al crear usuario.");

      setSuccess(`✅ Usuario creado con contraseña provisional: ${provisionalPassword}`);
      setFullName("");
      setEmail("");
      setRole("internal");
      fetchUsers();
    } catch (err: any) {
      console.error("❌ Error al crear usuario:", err.message);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div id="usuarios">
      <h2>👤 Lista de Usuarios</h2>

      {/* Formulario para crear usuario */}
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
          placeholder="Correo electrónico"
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
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Actualizado</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: "10px" }}>
                No hay usuarios registrados.
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{u.full_name}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{u.email}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{u.role}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.updated_at ? new Date(u.updated_at).toLocaleString() : "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
