import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function AgreementRenewalsPage() {
  const { agreementId } = useParams<{ agreementId: string }>();

  const [renewals, setRenewals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [oldExpirationDate, setOldExpirationDate] = useState("");
  const [newExpirationDate, setNewExpirationDate] = useState("");

  // ==========================
  // Cargar renovaciones
  // ==========================
  const loadRenewals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agreement_renewals")
      .select("*")
      .eq("agreement_id", agreementId)
      .order("changed_at", { ascending: false });

    if (!error && data) {
      setRenewals(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRenewals();
  }, [agreementId]);

  // ==========================
  // Registrar renovación
  // ==========================
  const saveRenewal = async () => {
    if (!newExpirationDate) {
      alert("Debe ingresar la nueva fecha de vencimiento.");
      return;
    }

    const { error } = await supabase.from("agreement_renewals").insert({
      agreement_id: agreementId,
      old_expiration_date: oldExpirationDate || null,
      new_expiration_date: newExpirationDate,
    });

    if (error) {
      console.log(error);
      alert("Error al registrar la renovación.");
      return;
    }

    setShowModal(false);
    setOldExpirationDate("");
    setNewExpirationDate("");

    loadRenewals(); // refrescar
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1 style={{ fontSize: "40px", fontWeight: "700", color: "#1b2b42" }}>
        Renovaciones del Convenio
      </h1>

      {/* ======================== */}
      {/* Botón para abrir modal */}
      {/* ======================== */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          marginTop: "20px",
          backgroundColor: "#1d7af3",
          color: "white",
          padding: "12px 22px",
          borderRadius: "8px",
          border: "1px solid #0f4db8",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        ➕ Registrar nueva renovación
      </button>

      {/* ======================== */}
      {/* Modal */}
      {/* ======================== */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "12px",
              width: "400px",
            }}
          >
            <h2>Nueva Renovación</h2>

            <label>Fecha de vencimiento actual</label>
            <input
              type="date"
              value={oldExpirationDate}
              onChange={(e) => setOldExpirationDate(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />

            <br />
            <br />

            <label>Nueva fecha de vencimiento *</label>
            <input
              type="date"
              value={newExpirationDate}
              onChange={(e) => setNewExpirationDate(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />

            <br />
            <br />

            <button
              onClick={saveRenewal}
              style={{
                background: "green",
                color: "white",
                padding: "10px 18px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Guardar
            </button>

            <button
              onClick={() => setShowModal(false)}
              style={{
                background: "#ccc",
                padding: "10px 18px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* HISTORIAL */}
      {/* ======================== */}
      <h2 style={{ marginTop: "40px" }}>Historial</h2>

      {loading ? (
        <p>Cargando...</p>
      ) : renewals.length === 0 ? (
        <p>No existen renovaciones.</p>
      ) : (
        <table style={{ marginTop: "10px", width: "600px" }}>
          <thead>
            <tr>
              <th>Fecha anterior</th>
              <th>Nueva fecha</th>
              <th>Registrado el</th>
            </tr>
          </thead>
          <tbody>
            {renewals.map((r) => (
              <tr key={r.id}>
                <td>{r.old_expiration_date || "-"}</td>
                <td>{r.new_expiration_date}</td>
                <td>{new Date(r.changed_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


