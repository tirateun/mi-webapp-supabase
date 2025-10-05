// src/ChangePassword.tsx
import { useState } from "react";
import { supabase } from "./supabaseClient";

interface ChangePasswordProps {
  onPasswordChanged: () => void;
}

export default function ChangePassword({ onPasswordChanged }: ChangePasswordProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess("✅ Contraseña actualizada exitosamente.");
      setPassword("");
      setConfirm("");
      onPasswordChanged();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>🔐 Cambiar contraseña</h2>
      <p>Por seguridad, debes actualizar tu contraseña provisional.</p>

      <input
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "10px", margin: "5px 0" }}
      />
      <input
        type="password"
        placeholder="Confirmar contraseña"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        style={{ width: "100%", padding: "10px", margin: "5px 0" }}
      />

      <button
        onClick={handleChangePassword}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        {loading ? "Actualizando..." : "Actualizar contraseña"}
      </button>

      {error && <p style={{ color: "red" }}>❌ {error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
}
