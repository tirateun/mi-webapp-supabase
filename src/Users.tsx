import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("internal");
  const [cargo, setCargo] = useState(""); // 🆕 NUEVO CAMPO
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 📌 Cargar usuarios existentes desde la tabla profiles
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*") // 🆕 Ya incluye cargo automáticamente
      .order("updated_at", { ascending: false });
    
    if (!error) setUsers(data || []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 📌 Crear nuevo usuario con contraseña temporal y flag de cambio
  const handleAddUser = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

     // 🆕 AGREGAR ESTOS LOGS
    console.log("📤 Datos a enviar:", {
      email,
      password: "Temporal123!",
      full_name: fullName,
      role,
      cargo
    });
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("No hay sesión activa.");

      // Contraseña temporal generada automáticamente
      const tempPassword = "Temporal123!";
      const body = {
        email,
        password: tempPassword,
        full_name: fullName,
        role,
        cargo: cargo || null,
      };
  
      console.log("📤 Body JSON:", JSON.stringify(body)); // 🆕 AGREGAR
  
       // ✅ 1. Llamar a la Edge Function `create-user`
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email,
            password: tempPassword,
            full_name: fullName,
            role,
            cargo: cargo || null, // 🆕 Incluir cargo en la creación
          }),
        }
      );

      const result = await response.json();
      console.log("📥 Respuesta:", result); // 🆕 AGREGAR
      if (!response.ok) throw new Error(result.error || "Error en create-user");

      setSuccess(
        `✅ Usuario creado exitosamente. Contraseña temporal: ${tempPassword}`
      );

      // 🆕 Limpiar todos los campos incluyendo cargo
      setFullName("");
      setEmail("");
      setRole("internal");
      setCargo("");
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  // 🧹 Eliminar usuario completamente (Auth + profiles)
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
  
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
  
      if (!token) throw new Error("No hay sesión activa o token disponible");
  
      console.log("🧩 Enviando user_id:", userId);
  
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );
  
      const result = await response.json();
      console.log("Respuesta de la función:", result);
  
      if (!response.ok) throw new Error(result.error || "Error desconocido");
  
      alert("✅ Usuario eliminado correctamente");
      fetchUsers();
    } catch (err: any) {
      console.error("Error al eliminar usuario:", err);
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
          <option value="internal">Interno</option>
          <option value="admin">Administrador</option>
        </select>
        
        {/* 🆕 NUEVO CAMPO: CARGO */}
        <input
          type="text"
          placeholder="Cargo (ej: Coordinador de Convenios)"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          style={{ margin: "5px", padding: "8px", width: "100%" }}
          maxLength={100}
        />
        <small style={{ marginLeft: "5px", color: "#666", fontSize: "12px" }}>
          Cargo o puesto del usuario (opcional)
        </small>
        
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
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Cargo</th> {/* 🆕 NUEVA COLUMNA */}
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              ¿Debe cambiar contraseña?
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Actualizado
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "10px" }}> {/* 🆕 Cambiar colspan a 7 */}
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
                  {u.role === 'admin' ? 'Administrador' : 'Interno'}
                </td>
                {/* 🆕 NUEVA COLUMNA: MOSTRAR CARGO */}
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.cargo || '-'}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.must_change_password ? "✅ Sí" : "❌ No"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {u.updated_at
                    ? new Date(u.updated_at).toLocaleString()
                    : "-"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  <button
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}




