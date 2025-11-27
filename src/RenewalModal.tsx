// RenewalModal.tsx actualizado
// Nota: Ajustado para crear automáticamente los años en agreement_years
// al renovar un convenio.

import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function RenewalModal({ agreement, onClose, onRenew }: any) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRenew = async () => {
    if (!startDate || !endDate) return alert("Completa las fechas");

    setLoading(true);

    try {
      // 1. Crear renovación
      const { data: renewal, error: renewalError } = await supabase
        .from("agreement_renewals")
        .insert({
          agreement_id: agreement.id,
          start_date: startDate,
          end_date: endDate,
        })
        .select()
        .single();

      if (renewalError) throw renewalError;

      // 2. Calcular años
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Calcular años exactos respetando fecha de inicio y fin
      let cursor = new Date(startDate);
      const yearRows = [];
      while (cursor <= end) {
        const yearStart = new Date(cursor);
        const nextYear = new Date(yearStart);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        nextYear.setDate(nextYear.getDate() - 1);

        const yearEnd = nextYear > end ? end : nextYear;

        yearRows.push({
          agreement_id: agreement.id,
          renewal_id: renewal.id,
          year_number: yearRows.length + 1,
          year_start: yearStart.toISOString().slice(0, 10),
          year_end: yearEnd.toISOString().slice(0, 10),
        });

        cursor = new Date(yearEnd);
        cursor.setDate(cursor.getDate() + 1);
      }

      // 3. Insertar años
      const { error: yearsError } = await supabase
        .from("agreement_years")
        .insert(yearRows);

      if (yearsError) throw yearsError;

      onRenew();
      onClose();
    } catch (err: any) {
      alert("Error al renovar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show" style={{ display: "block" }}>
      <div className="modal-dialog">
        <div className="modal-content p-3">
          <h5 className="mb-3">Renovar convenio</h5>

          <label>Fecha inicio</label>
          <input
            type="date"
            className="form-control mb-2"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label>Fecha fin</label>
          <input
            type="date"
            className="form-control mb-3"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleRenew} disabled={loading}>
              {loading ? "Guardando..." : "Renovar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}