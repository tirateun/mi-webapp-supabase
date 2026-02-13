// RenewalModal.tsx - Con validaciones de seguridad

import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function RenewalModal({ agreement, onClose, onRenew }: any) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hasRecentRenewal, setHasRecentRenewal] = useState(false);

  // Verificar si ya hay renovaciones recientes
  useEffect(() => {
    const checkRecentRenewals = async () => {
      const { data, error } = await supabase
        .from("agreement_renewals")
        .select("id, changed_at, new_expiration_date")
        .eq("agreement_id", agreement.id)
        .order("changed_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const lastRenewal = data[0];
        const daysSinceRenewal = Math.floor(
          (Date.now() - new Date(lastRenewal.changed_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceRenewal < 7) {
          setHasRecentRenewal(true);
          setWarnings([
            `⚠️ Este convenio fue renovado hace ${daysSinceRenewal} día(s).`,
            `Última renovación termina el: ${new Date(lastRenewal.new_expiration_date).toLocaleDateString("es-PE")}`
          ]);
        }
      }
    };

    checkRecentRenewals();
  }, [agreement.id]);

  // Validar fechas en tiempo real
  useEffect(() => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const currentExpiration = agreement.expiration_date ? new Date(agreement.expiration_date) : null;

      // ERROR 1: Fecha fin antes de fecha inicio
      if (end <= start) {
        newErrors.push("❌ La fecha de fin debe ser POSTERIOR a la fecha de inicio");
      }

      // ERROR 2: Duración menor a 6 meses
      const diffMonths = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (diffMonths < 6) {
        newErrors.push("❌ La duración mínima de renovación es 6 meses");
      }

      // ERROR 3: Duración mayor a 10 años
      const diffYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (diffYears > 10) {
        newErrors.push("❌ La duración máxima de renovación es 10 años");
      }

      // WARNING 1: Fecha inicio muy antes de la expiración actual
      if (currentExpiration && start < currentExpiration) {
        const daysDiff = Math.floor((currentExpiration.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        newWarnings.push(`⚠️ La fecha de inicio es ${daysDiff} día(s) ANTES de la expiración actual (${currentExpiration.toLocaleDateString("es-PE")})`);
      }

      // WARNING 2: Gap muy grande entre expiración actual y fecha inicio
      if (currentExpiration && start > currentExpiration) {
        const gapDays = Math.floor((start.getTime() - currentExpiration.getTime()) / (1000 * 60 * 60 * 24));
        if (gapDays > 90) {
          newWarnings.push(`⚠️ Hay un gap de ${gapDays} días entre la expiración actual y la renovación`);
        }
      }

      // WARNING 3: Fecha en el pasado
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) {
        const daysAgo = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        newWarnings.push(`⚠️ La fecha de inicio es ${daysAgo} día(s) en el pasado`);
      }
    }

    setErrors(newErrors);
    setWarnings(hasRecentRenewal ? warnings : newWarnings);
  }, [startDate, endDate, agreement.expiration_date, hasRecentRenewal]);

  const handleRenew = async () => {
    // Validación final
    if (!startDate || !endDate) {
      alert("❌ Completa ambas fechas");
      return;
    }

    if (errors.length > 0) {
      alert("❌ Corrige los errores antes de continuar:\n\n" + errors.join("\n"));
      return;
    }

    // Confirmación con resumen
    const start = new Date(startDate);
    const end = new Date(endDate);
    const years = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor(((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) % 365) / 30);

    let confirmMsg = `📋 CONFIRMAR RENOVACIÓN\n\n`;
    confirmMsg += `Convenio: ${agreement.name}\n\n`;
    confirmMsg += `📅 Fecha de firma: ${start.toLocaleDateString("es-PE")}\n`;
    confirmMsg += `📅 Fecha de término: ${end.toLocaleDateString("es-PE")}\n`;
    confirmMsg += `⏱️ Duración: ${years} año(s)${months > 0 ? ` y ${months} mes(es)` : ""}\n\n`;

    if (warnings.length > 0) {
      confirmMsg += `⚠️ ADVERTENCIAS:\n${warnings.join("\n")}\n\n`;
    }

    confirmMsg += `¿Confirmar renovación?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    setLoading(true);

    try {
      // 1. Crear renovación
      const { data: renewal, error: renewalError } = await supabase
        .from("agreement_renewals")
        .insert({
          agreement_id: agreement.id,
          old_expiration_date: agreement.expiration_date,
          new_expiration_date: endDate,
          renewal_signature_date: startDate,
        })
        .select()
        .single();

      if (renewalError) throw renewalError;

      // 2. Generar años
      const { data: lastYear } = await supabase
        .from("agreement_years")
        .select("year_number")
        .eq("agreement_id", agreement.id)
        .order("year_number", { ascending: false })
        .limit(1)
        .single();

      let year = (lastYear?.year_number ?? 0) + 1;

      const yearRows: any[] = [];
      let cursor = new Date(start);

      while (true) {
        const yearStart = new Date(cursor);
        const yearEnd = new Date(yearStart);
        yearEnd.setFullYear(yearEnd.getFullYear() + 1);
        yearEnd.setDate(yearEnd.getDate() - 1);

        if (yearEnd > end) {
          yearEnd.setTime(end.getTime());
        }

        yearRows.push({
          agreement_id: agreement.id,
          renewal_id: renewal.id,
          year_number: year,
          year_start: yearStart.toISOString().slice(0, 10),
          year_end: yearEnd.toISOString().slice(0, 10),
        });

        if (yearEnd >= end) break;

        cursor = new Date(yearEnd);
        cursor.setDate(cursor.getDate() + 1);
        year++;
      }

      // 3. Insertar años en la BD
      const { error: yearsError } = await supabase
        .from("agreement_years")
        .insert(yearRows);

      if (yearsError) throw yearsError;

      alert("✅ Renovación registrada exitosamente");
      onRenew();
      onClose();
    } catch (err: any) {
      alert("❌ Error al renovar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          
          {/* HEADER */}
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">🔄 Renovar Convenio</h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          {/* BODY */}
          <div className="modal-body p-4">
            
            {/* Info del convenio */}
            <div className="alert alert-info mb-3">
              <strong>📄 Convenio:</strong> {agreement.name}<br />
              <strong>📅 Vence actualmente:</strong> {agreement.expiration_date ? new Date(agreement.expiration_date).toLocaleDateString("es-PE") : "Sin fecha"}
            </div>

            {/* Advertencias de renovación reciente */}
            {hasRecentRenewal && (
              <div className="alert alert-warning mb-3">
                <strong>⚠️ ATENCIÓN:</strong>
                {warnings.map((w, idx) => <div key={idx}>{w}</div>)}
              </div>
            )}

            {/* Formulario */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">
                  📅 Fecha de firma de renovación <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${startDate && errors.length > 0 ? 'is-invalid' : ''}`}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                />
                <small className="text-muted">Fecha en que se firmó la renovación</small>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">
                  📅 Fecha de término <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${endDate && errors.length > 0 ? 'is-invalid' : ''}`}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={loading}
                />
                <small className="text-muted">Fecha en que terminará el convenio renovado</small>
              </div>
            </div>

            {/* Resumen de duración */}
            {startDate && endDate && errors.length === 0 && (
              <div className="alert alert-success mb-3">
                <strong>✅ Duración de renovación:</strong>{" "}
                {(() => {
                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  const years = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
                  const months = Math.floor(((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) % 365) / 30);
                  return `${years} año(s)${months > 0 ? ` y ${months} mes(es)` : ""}`;
                })()}
              </div>
            )}

            {/* Errores */}
            {errors.length > 0 && (
              <div className="alert alert-danger mb-3">
                <strong>❌ ERRORES:</strong>
                <ul className="mb-0 mt-2">
                  {errors.map((e, idx) => <li key={idx}>{e}</li>)}
                </ul>
              </div>
            )}

            {/* Advertencias */}
            {!hasRecentRenewal && warnings.length > 0 && errors.length === 0 && (
              <div className="alert alert-warning mb-0">
                <strong>⚠️ ADVERTENCIAS:</strong>
                <ul className="mb-0 mt-2">
                  {warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                </ul>
              </div>
            )}

          </div>

          {/* FOOTER */}
          <div className="modal-footer bg-light">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              className="btn btn-primary"
              onClick={handleRenew}
              disabled={loading || !startDate || !endDate || errors.length > 0}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Renovando...
                </>
              ) : (
                "🔄 Renovar Convenio"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}