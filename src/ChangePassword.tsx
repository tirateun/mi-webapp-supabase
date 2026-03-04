import { useState } from "react";
import { supabase } from "./supabaseClient";

interface ChangePasswordProps {
  user: any;
  onPasswordChanged: () => void;
}

export default function ChangePassword({ user, onPasswordChanged }: ChangePasswordProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirm) {
      setMessage("❌ Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage("❌ Error al actualizar contraseña.");
    } else {
      // 🔹 Actualizamos el campo must_change_password a false
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ 
          must_change_password: false,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);  // ✅ CORRECTO: user_id apunta a auth.users.id

      if (updateProfileError) {
        console.error('Error al actualizar perfil:', updateProfileError);
        setMessage("⚠️ Contraseña cambiada pero hubo un error en el perfil.");
      } else {
        setMessage("✅ Contraseña cambiada correctamente.");
      }
      
      setTimeout(onPasswordChanged, 1500);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>🔑 Cambiar Contraseña</h2>
      <p>Por favor, actualiza tu contraseña temporal.</p>

      <input
        type="password"
        placeholder="Nueva contraseña"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{ display: "block", margin: "10px auto", padding: "8px" }}
      />
      <input
        type="password"
        placeholder="Confirmar contraseña"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        style={{ display: "block", margin: "10px auto", padding: "8px" }}
      />

      <button
        onClick={handleChangePassword}
        disabled={loading}
        style={{
          background: "#10b981",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "10px 20px",
          cursor: "pointer",
        }}
      >
        {loading ? "Actualizando..." : "Guardar nueva contraseña"}
      </button>

      {message && <p style={{ marginTop: "15px" }}>{message}</p>}
    </div>
  );
}

