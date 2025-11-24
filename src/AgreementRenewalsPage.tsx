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

  // estado tipado correctamente
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  useEffect(() => {
    // obtener id de usuario (si hay sesión)
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

  // Load renewals + expiration
  useEffect(() => {
    if (!agreementId) return;
    loadRenewals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementId]);

  async function loadRenewals() {
    setLoading(true);

    try {
      // 1) obtener expiration_date del convenio
      const { data: agreementData, error: agreementError } = await supabase
        .from("agreements")
        .select("expiration_date")
        .eq("id", agreementId)
        .single();

      if (agreementError) {
        console.error("Error loading agreement:", agreementError);
      }

      // 2) obtener renovaciones
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

      // tipar el resultado y guardarlo
      setRenewals((renewalsData || []) as Renewal[]);

      // 3) determinar la última fecha de vencimiento: si hay renovaciones usamos la más reciente (first), si no usamos agreement.expiration_date
      if (Array.isArray(renewalsData) && renewalsData.length > 0) {
        setOldExpiration(renewalsData[0].new_expiration_date ?? null);
      } else {
        setOldExpiration((agreementData && agreementData.expiration_date) ? String(agreementData.expiration_date) : null);
      }
    } catch (err) {
      console.error("❌ Error en loadRenewals:", err);
      setRenewals([]);
      setOldExpiration(null);
    } finally {
      setLoading(false);
    }
  }

  // recalcular newExpiration cuando cambian fecha o años
  useEffect(() => {
    if (!renewalDate) {
      setNewExpiration(null);
      return;
    }
    const d = new Date(renewalDate);
    d.setFullYear(d.getFullYear() + Number(years));
    // almacenamos YYYY-MM-DD
    setNewExpiration(d.toISOString().split("T")[0]);
  }, [renewalDate, years]);

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

    try {
      const { error } = await supabase.from("agreement_renewals").insert({
        agreement_id: agreementId,
        old_expiration_date: oldExpiration,
        new_expiration_date: newExpiration,
        changed_by: userId,
      });

      if (error) {
        console.error("Error insertando renovación:", error);
        alert("Error al guardar la renovación.");
        return;
      }

      // ✅ ACTUALIZAR LA FECHA DE VENCIMIENTO EN agreements
      const { error: updateError } = await supabase
        .from("agreements")
        .update({ expiration_date: newExpiration })
        .eq("id", agreementId);

      if (updateError) {
        console.error("Error actualizando fecha de vencimiento:", updateError);
        alert("Error al actualizar la fecha de vencimiento del convenio.");
        return;
      }

      // refrescar lista y cerrar modal
      await loadRenewals();
      setShowModal(false);
      setRenewalDate("");
      setYears(1);
    } catch (err) {
      console.error(err);
      alert("Error al guardar la renovación.");
    }
  }

  // ✅ Función para ir a contraprestaciones con el agreementId correcto
  const handleGoToContraprestaciones = () => {
    if (agreementId) {
      navigate(`/contraprestaciones/${agreementId}`);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>Renovaciones del Convenio</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: "#1e88e5",
            color: "white",
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          ➕ Registrar nueva renovación
        </button>
        
        <button
          onClick={handleGoToContraprestaciones}
          style={{
            backgroundColor: "#4caf50",
            color: "white",
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          📋 Registrar contraprestaciones
        </button>
      </div>

      <h2 style={{ marginTop: 30 }}>Historial</h2>

      {loading ? (
        <p>Cargando...</p>
      ) : renewals.length === 0 ? (
        <p>No existen renovaciones.</p>
      ) : (
        <ul>
          {renewals.map((r) => (
            <li key={r.id} style={{ marginBottom: 12 }}>
              <strong>Anterior:</strong> {r.old_expiration_date ?? "—"} →{" "}
              <strong>Nueva:</strong> {r.new_expiration_date ?? "—"}
              <div style={{ color: "#666", fontSize: 12 }}>
                Registrado: {r.changed_at ? new Date(r.changed_at).toLocaleString() : "—"}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ background: "white", padding: 28, borderRadius: 10, width: 420 }}>
            <h3>Nueva Renovación</h3>

            <label style={{ display: "block", marginTop: 12 }}>Fecha de renovación *</label>
            <input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              style={{ width: "100%", padding: 8, marginTop: 6 }}
            />

            <label style={{ display: "block", marginTop: 12 }}>Duración (años) *</label>
            <select
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              style={{ width: "100%", padding: 8, marginTop: 6 }}
            >
              {[1, 2, 3, 4, 5].map((y) => (
                <option key={y} value={y}>
                  {y} año{y > 1 ? "s" : ""}
                </option>
              ))}
            </select>

            <p style={{ marginTop: 12 }}>
              <strong>Nuevo vencimiento:</strong> {newExpiration ?? "—"}
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={saveRenewal} style={{ flex: 1, background: "green", color: "white", padding: 10, borderRadius: 6, border: "none" }}>
                Guardar
              </button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, background: "#ddd", padding: 10, borderRadius: 6, border: "none" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



