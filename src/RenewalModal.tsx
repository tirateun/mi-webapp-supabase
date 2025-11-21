// Updated RenewalModal.tsx with contraprestaciones duplication logic
import { useState } from "react";
import { supabase } from "./supabaseClient";

interface RenewalModalProps {
  agreementId: string;
  currentExpiration: string | null;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}

export default function RenewalModal({ agreementId, currentExpiration, onSaved, onCancel }: RenewalModalProps) {
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
      // 1) Insert renewal history
      const { error: renewalErr, data: renewalData } = await supabase
        .from("agreement_renewals")
        .insert({
          agreement_id: agreementId,
          previous_expiration: currentExpiration,
          new_expiration: newDate,
        })
        .select("id")
        .single();

      if (renewalErr) throw renewalErr;
      const renewalId = renewalData?.id;

      // 2) Fetch existing contraprestaciones to duplicate
      const { data: oldContra, error: fetchErr } = await supabase
        .from("contraprestaciones")
        .select("id, tipo, descripcion, unidades_comprometidas")
        .eq("agreement_id", agreementId);

      if (fetchErr) throw fetchErr;

      // 3) Insert duplicated contraprestaciones as new batch
      const duplicatedData = (oldContra || []).map((c) => ({
        agreement_id: agreementId,
        tipo: c.tipo,
        descripcion: c.descripcion,
        unidades_comprometidas: c.unidades_comprometidas,
        renewal_ref: renewalId,
      }));

      if (duplicatedData.length > 0) {
        const { error: insertNewErr } = await supabase
          .from("contraprestaciones")
          .insert(duplicatedData);

        if (insertNewErr) throw insertNewErr;
      }

      // 4) Update agreement expiration
      const { error: updateErr } = await supabase
        .from("agreements")
        .update({ expiration_date: newDate })
        .eq("id", agreementId);

      if (updateErr) throw updateErr;

      await onSaved();
    } catch (e: any) {
      setError(e.message || "Error al procesar renovación.");
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
        <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />

        {error && <p className="error">{error}</p>}

        <div className="modal-buttons">
          <button onClick={onCancel} disabled={loading}>Cancelar</button>
          <button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}



