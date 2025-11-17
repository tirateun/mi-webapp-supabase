import { useState } from "react";
import { supabase } from "./supabaseClient";

interface RenewalModalProps {
  agreementId: string;
  currentExpiration: string | null;
  onClose: () => void;
  onRenewed: () => void;
}

export default function RenewalModal({ agreementId, currentExpiration, onClose, onRenewed }: RenewalModalProps) {
  const [newExpiration, setNewExpiration] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRenew = async () => {
    if (!newExpiration) {
      setErrorMsg("Debe ingresar una nueva fecha de vencimiento.");
      return;
    }
    setLoading(true);

    // Insertar renovación en la tabla agreement_renewals
    const { error } = await supabase.from("agreement_renewals").insert({
      agreement_id: agreementId,
      old_expiration_date: currentExpiration,
      new_expiration_date: newExpiration,
    });

    if (error) {
      setErrorMsg("Error al guardar renovación.");
      setLoading(false);
      return;
    }

    // Actualizar expiration_date en agreements
    const { error: updateError } = await supabase
      .from("agreements")
      .update({ expiration_date: newExpiration })
      .eq("id", agreementId);

    if (updateError) {
      setErrorMsg("Renovación guardada, pero no se pudo actualizar el convenio.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onRenewed();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
      <div className="bg-white p-4 rounded shadow-md w-96">
        <h2 className="text-xl font-bold mb-3">Renovar Convenio</h2>

        <div className="mb-3">
          <label className="font-semibold">Fecha actual de vencimiento:</label>
          <div className="border p-2 rounded bg-gray-100 mt-1">{currentExpiration || "No registrada"}</div>
        </div>

        <div className="mb-3">
          <label className="font-semibold">Nueva fecha de vencimiento:</label>
          <input
            type="date"
            className="border rounded p-2 w-full mt-1"
            value={newExpiration}
            onChange={(e) => setNewExpiration(e.target.value)}
          />
        </div>

        {errorMsg && <div className="text-red-600 text-sm mb-2">{errorMsg}</div>}

        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose} disabled={loading}>
            Cancelar
          </button>

          <button
            onClick={handleRenew}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Guardando..." : "Renovar"}
          </button>
        </div>
      </div>
    </div>
  );
}
