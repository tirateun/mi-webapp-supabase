// src/RenewalModal.tsx
import { useState } from "react";
import { supabase } from "./supabaseClient";

interface RenewalModalProps {
  agreementId: string;
  currentExpiration: string | null;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}

export default function RenewalModal({
  agreementId,
  currentExpiration,
  onSaved,
  onCancel,
}: RenewalModalProps) {
  const [newDate, setNewDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!newDate) {
      setError("Debe seleccionar una nueva fecha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1) Insertar en historial de renovaciones
      const { error: insertError } = await supabase
        .from("agreement_renewals")
        .insert({
          agreement_id: agreementId,
          previous_expiration: currentExpiration,
          new_expiration: newDate,
        });

      if (insertError) throw insertError;

      // 2) Actualizar fecha de expiración del convenio
      const { error: updateError } = await supabase
        .from("agreements")
        .update({
          expiration_date: newDate,
        })
        .eq("id", agreementId);

      if (updateError) throw updateError;

      // 3) Ejecutar callback para refrescar AgreementsList
      await onSaved();
    } catch (e: any) {
      setError(e.message || "Error al guardar la renovación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Renovar convenio</h2>

        <p>Fecha actual de vencimiento: <b>{currentExpiration || "—"}</b></p>

        <label>Nueva fecha de vencimiento:</label>
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <div className="modal-buttons">
          <button onClick={onCancel} disabled={loading}>
            Cancelar
          </button>

          <button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}


