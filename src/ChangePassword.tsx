import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function ChangePassword({
  user,
  onPasswordChanged,
}: {
  user: any;
  onPasswordChanged: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      // 🔐 1. Actualiza la contraseña en Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // 🧱 2. Marca que ya no necesita cambiar contraseña en `profiles`
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setMessage("✅ Contraseña actualizada correctamente.");
      onPasswordChanged(); // 🔁 Regresa al panel principal
    } catch (err: any) {
      console.error("❌ Error al cambiar contraseña:", err.message);
      setError(err.message || "Error al actualizar contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "100px auto",
        textAlign: "center",
        border: "1px solid #ddd",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
      }}
    >
      <h2>🔑 Cambiar Contraseña</h2>
      <p style={{ color: "#555", marginBottom: "20px" }}>
        Debes actualizar tu contraseña para continuar.
      </p>

      <form
        onSubmit={handleChangePassword}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          style={{
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px",
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Guardando..." : "Actualizar Contraseña"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "10px" }}>❌ {error}</p>}
      {message && <p style={{ color: "green", marginTop: "10px" }}>{message}</p>}
    </div>
  );
}

