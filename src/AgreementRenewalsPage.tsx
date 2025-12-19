// src/AgreementRenewalsPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useParams, useNavigate } from "react-router-dom";

interface Renewal {
  id: string;
  agreement_id: string;
  old_expiration_date: string | null;
  new_expiration_date: string | null;
  changed_at: string | null;
  changed_by?: string | null;
}

export default function AgreementRenewalsPage() {
  const params = useParams<{ agreementId: string }>();
  const agreementId = params.agreementId;
  const navigate = useNavigate();

  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form fields
  const [renewalDate, setRenewalDate] = useState<string>("");
  const [years, setYears] = useState<number>(1);

  // Calculated
  const [oldExpiration, setOldExpiration] = useState<string | null>(null);
  const [newExpiration, setNewExpiration] = useState<string | null>(null);

  // User
  const [userId, setUserId] = useState<string | null>(null);

  // Info del convenio
  const [signatureDate, setSignatureDate] = useState<string | null>(null);
  const [currentMaxYear, setCurrentMaxYear] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUserId(data.session?.user?.id ?? null);
      } catch (err) {
        console.error("Error obteniendo sesión:", err);
        setUserId(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!agreementId) return;
    loadRenewals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementId]);

  async function loadRenewals() {
    setLoading(true);

    try {
      // 1) Obtener info del convenio
      const { data: agreementData, error: agreementError } = await supabase
        .from("agreements")
        .select("expiration_date, signature_date")
        .eq("id", agreementId)
        .single();

      if (agreementError) {
        console.error("Error loading agreement:", agreementError);
      } else {
        setSignatureDate(agreementData?.signature_date ?? null);
      }

      // 2) Obtener el año máximo actual en agreement_years
      const { data: yearsData, error: yearsError } = await supabase
        .from("agreement_years")
        .select("year_number")
        .eq("agreement_id", agreementId)
        .order("year_number", { ascending: false })
        .limit(1);

      if (!yearsError && yearsData && yearsData.length > 0) {
        setCurrentMaxYear(yearsData[0].year_number);
      } else {
        setCurrentMaxYear(0);
      }

      // 3) Obtener renovaciones
      const { data: renewalsData, error } = await supabase
        .from("agreement_renewals")
        .select("*")
        .eq("agreement_id", agreementId)
        .order("changed_at", { ascending: false });

      if (error) {
        console.error("Error cargando renovaciones:", error);
        setRenewals([]);
        setLoading(false);
        return;
      }

      setRenewals((renewalsData || []) as Renewal[]);

      // 4) Determinar fecha de vencimiento actual
      if (Array.isArray(renewalsData) && renewalsData.length > 0) {
        setOldExpiration(renewalsData[0].new_expiration_date ?? null);
      } else {
        setOldExpiration(
          agreementData && agreementData.expiration_date
            ? String(agreementData.expiration_date)
            : null
        );
      }
    } catch (err) {
      console.error("❌ Error en loadRenewals:", err);
      setRenewals([]);
      setOldExpiration(null);
    } finally {
      setLoading(false);
    }
  }

  // Recalcular newExpiration cuando cambian fecha o años
  useEffect(() => {
    if (!renewalDate) {
      setNewExpiration(null);
      return;
    }
    const d = new Date(renewalDate);
    d.setFullYear(d.getFullYear() + Number(years));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setNewExpiration(`${year}-${month}-${day}`);
  }, [renewalDate, years]);

  // 🆕 Autocompletar fecha de renovación cuando se abre el modal
  useEffect(() => {
    if (showModal && oldExpiration && !renewalDate) {
      // Calcular día siguiente al vencimiento actual
      const expDate = new Date(oldExpiration);
      expDate.setDate(expDate.getDate() + 1);
      
      const year = expDate.getFullYear();
      const month = String(expDate.getMonth() + 1).padStart(2, "0");
      const day = String(expDate.getDate()).padStart(2, "0");
      const nextDay = `${year}-${month}-${day}`;
      
      setRenewalDate(nextDay);
    }
  }, [showModal, oldExpiration, renewalDate]);

  async function saveRenewal() {
    if (!agreementId) {
      alert("No se ha seleccionado convenio.");
      return;
    }
    if (!renewalDate) {
      alert("Selecciona la fecha de renovación.");
      return;
    }
    if (!years || years < 1) {
      alert("Selecciona la duración en años.");
      return;
    }
    if (!newExpiration) {
      alert("No se pudo calcular la nueva fecha de vencimiento.");
      return;
    }

    setSaving(true);

    try {
      // 1️⃣ Insertar el registro de renovación
      const { error: renewalError } = await supabase
        .from("agreement_renewals")
        .insert({
          agreement_id: agreementId,
          old_expiration_date: oldExpiration,
          new_expiration_date: newExpiration,
          changed_by: userId,
        });

      if (renewalError) {
        console.error("Error insertando renovación:", renewalError);
        alert("Error al guardar la renovación.");
        setSaving(false);
        return;
      }

      // 2️⃣ CREAR LOS AÑOS RENOVADOS en agreement_years
      const newYears: any[] = [];
      const startYear = currentMaxYear + 1;
      let currentStartDate = new Date(renewalDate);

      for (let i = 0; i < years; i++) {
        const yearNumber = startYear + i;
        
        // Fecha de inicio del año
        const yearStart = new Date(currentStartDate);
        
        // Fecha de fin: 1 año después, menos 1 día
        const yearEnd = new Date(currentStartDate);
        yearEnd.setFullYear(yearEnd.getFullYear() + 1);
        yearEnd.setDate(yearEnd.getDate() - 1);

        // Formatear fechas
        const formatDate = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        };

        newYears.push({
          agreement_id: agreementId,
          year_number: yearNumber,
          year_start: formatDate(yearStart),
          year_end: formatDate(yearEnd),
        });

        // Preparar fecha de inicio para el siguiente año
        currentStartDate = new Date(yearEnd);
        currentStartDate.setDate(currentStartDate.getDate() + 1);
      }

      console.log("📅 Creando años:", newYears);

      const { error: yearsError } = await supabase
        .from("agreement_years")
        .insert(newYears);

      if (yearsError) {
        console.error("❌ Error creando años:", yearsError);
        alert(
          "⚠️ La renovación se guardó, pero hubo un error al crear los años. Por favor, contáctale al administrador."
        );
        setSaving(false);
        await loadRenewals();
        return;
      }

      // 3️⃣ Actualizar duration_years y estado del convenio
      // ⚠️ IMPORTANTE: expiration_date es una columna generada
      // Se calcula como: signature_date + duration_years
      // Entonces actualizamos duration_years, no expiration_date
      
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaVencimiento = new Date(newExpiration);
      fechaVencimiento.setHours(0, 0, 0, 0);
      
      const nuevoEstado = fechaVencimiento >= hoy ? 'ACTIVO' : 'VENCIDO';
      
      // Calcular nueva duración total en años
      // Desde signature_date hasta newExpiration
      if (!signatureDate) {
        console.error("❌ No se puede calcular duration_years sin signature_date");
        alert("Error: No se encontró la fecha de firma del convenio.");
        setSaving(false);
        return;
      }
      
      const fechaFirma = new Date(signatureDate);
      const fechaVence = new Date(newExpiration);
      const diffYears = fechaVence.getFullYear() - fechaFirma.getFullYear();
      
      console.log(`📅 Calculando nueva duración:`, {
        signature_date: signatureDate,
        new_expiration: newExpiration,
        duration_years: diffYears,
        estado: nuevoEstado
      });
      
      const { error: updateError } = await supabase
        .from("agreements")
        .update({
          duration_years: diffYears,
          estado: nuevoEstado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agreementId);

      if (updateError) {
        console.error("❌ Error actualizando convenio:", updateError);
        alert("⚠️ La renovación y los años se guardaron, pero hubo un error al actualizar el convenio.");
      } else {
        console.log(`✅ Convenio actualizado - Duration: ${diffYears} años, Estado: ${nuevoEstado}`);
      }

      // ✅ Éxito
      await loadRenewals();
      setShowModal(false);
      setRenewalDate("");
      setYears(1);
      alert(
        `✅ Renovación registrada exitosamente.\n\n📅 Se crearon ${years} año${
          years > 1 ? "s" : ""
        } adicional${years > 1 ? "es" : ""} (Año ${startYear} al ${
          startYear + years - 1
        }).`
      );
    } catch (err) {
      console.error("❌ Error en saveRenewal:", err);
      alert("Error inesperado al guardar la renovación.");
    } finally {
      setSaving(false);
    }
  }

  const handleGoToContraprestaciones = () => {
    if (agreementId) {
      navigate(`/contraprestaciones/${agreementId}`);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "#6c757d",
            color: "white",
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          ← Volver
        </button>
      </div>

      <h1 style={{ fontSize: 32, marginBottom: 10 }}>
        🔄 Renovaciones del Convenio
      </h1>

      {currentMaxYear > 0 && (
        <div
          style={{
            background: "#e7f3ff",
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
            border: "1px solid #2196F3",
          }}
        >
          <strong>ℹ️ Información:</strong> El convenio tiene actualmente{" "}
          <strong>{currentMaxYear} año{currentMaxYear > 1 ? "s" : ""}</strong>{" "}
          registrados. Al renovar, se crearán años adicionales.
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: "#1e88e5",
            color: "white",
            padding: "12px 20px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          ➕ Registrar nueva renovación
        </button>
      </div>

      <h2 style={{ marginTop: 30, marginBottom: 15 }}>📜 Historial</h2>

      {loading ? (
        <p>Cargando...</p>
      ) : renewals.length === 0 ? (
        <div
          style={{
            background: "#f8f9fa",
            padding: 20,
            borderRadius: 8,
            textAlign: "center",
            color: "#6c757d",
          }}
        >
          No existen renovaciones registradas para este convenio.
        </div>
      ) : (
        <div
          style={{
            background: "white",
            border: "1px solid #dee2e6",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {renewals.map((r, index) => (
            <div
              key={r.id}
              style={{
                padding: 16,
                borderBottom:
                  index < renewals.length - 1 ? "1px solid #dee2e6" : "none",
                background: index % 2 === 0 ? "white" : "#f8f9fa",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontSize: 24,
                    display: "inline-block",
                    width: 30,
                  }}
                >
                  {index === 0 ? "🆕" : "📅"}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, marginBottom: 4 }}>
                    <strong>Anterior:</strong>{" "}
                    <span style={{ color: "#dc3545" }}>
                      {r.old_expiration_date ?? "—"}
                    </span>{" "}
                    →{" "}
                    <strong>Nueva:</strong>{" "}
                    <span style={{ color: "#28a745" }}>
                      {r.new_expiration_date ?? "—"}
                    </span>
                  </div>
                  <div style={{ color: "#6c757d", fontSize: 13 }}>
                    🕐 Registrado:{" "}
                    {r.changed_at
                      ? new Date(r.changed_at).toLocaleString("es-PE")
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 32,
              borderRadius: 12,
              width: 480,
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: 24 }}>
              🔄 Nueva Renovación
            </h3>

            <div
              style={{
                background: "#fff3cd",
                padding: 12,
                borderRadius: 6,
                marginBottom: 20,
                fontSize: 14,
                border: "1px solid #ffc107",
              }}
            >
              <strong>📌 Nota:</strong> Se crearán automáticamente{" "}
              <strong>{years}</strong> año{years > 1 ? "s" : ""} adicional
              {years > 1 ? "es" : ""} (Año {currentMaxYear + 1} al{" "}
              {currentMaxYear + years}) para contraprestaciones.
            </div>

            <label
              style={{
                display: "block",
                marginTop: 16,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Fecha de inicio de renovación *
            </label>
            <input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                fontSize: 15,
                border: "1px solid #ced4da",
                borderRadius: 6,
              }}
            />

            <label
              style={{
                display: "block",
                marginTop: 16,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Duración de la renovación *
            </label>
            <select
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              style={{
                width: "100%",
                padding: 10,
                fontSize: 15,
                border: "1px solid #ced4da",
                borderRadius: 6,
              }}
            >
              {[1, 2, 3, 4, 5].map((y) => (
                <option key={y} value={y}>
                  {y} año{y > 1 ? "s" : ""}
                </option>
              ))}
            </select>

            <div
              style={{
                marginTop: 20,
                padding: 16,
                background: "#d4edda",
                borderRadius: 8,
                border: "1px solid #28a745",
              }}
            >
              <div style={{ fontSize: 14, color: "#155724" }}>
                <strong>📅 Nueva fecha de vencimiento:</strong>
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#155724",
                  marginTop: 4,
                }}
              >
                {newExpiration ?? "—"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                onClick={saveRenewal}
                disabled={saving}
                style={{
                  flex: 1,
                  background: saving ? "#6c757d" : "#28a745",
                  color: "white",
                  padding: 12,
                  borderRadius: 8,
                  border: "none",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "⏳ Guardando..." : "✅ Guardar renovación"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                style={{
                  flex: 1,
                  background: "#e9ecef",
                  color: "#495057",
                  padding: 12,
                  borderRadius: 8,
                  border: "none",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


