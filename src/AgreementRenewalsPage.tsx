import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Renewal {
  id: string;
  old_expiration_date: string | null;
  new_expiration_date: string | null;
  changed_at: string | null;
  changed_by: string | null;
}

export default function AgreementRenewalsPage() {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [agreementName, setAgreementName] = useState<string>("");
  const agreementId = new URLSearchParams(window.location.search).get("agreementId");

  // -------------------------------
  // Cargar renovaciones del acuerdo
  // -------------------------------
  useEffect(() => {
    if (!agreementId) return;

    const load = async () => {
      // traer nombre convenio
      const { data: ag } = await supabase
        .from("agreements")
        .select("name")
        .eq("id", agreementId)
        .single();

      if (ag?.name) setAgreementName(ag.name);

      // traer renovaciones
      const { data } = await supabase
        .from("agreement_renewals")
        .select("*")
        .eq("agreement_id", agreementId)
        .order("changed_at", { ascending: false });

      setRenewals(data || []);
    };

    load();
  }, [agreementId]);

  // -------------------------------
  // Abrir formulario independiente
  // -------------------------------
  const openStandaloneRenewalForm = () => {
    if (!agreementId) return;
    window.open(
      `/renewal.html?agreementId=${agreementId}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div style={{ padding: "40px", maxWidth: "850px", margin: "0 auto" }}>
      <h1>Renovaciones del Convenio</h1>
      <h2>{agreementName}</h2>

      <button
        style={{
          padding: "10px 15px",
          background: "#1E88E5",
          color: "white",
          border: "none",
          borderRadius: "6px",
          marginTop: "20px",
          cursor: "pointer"
        }}
        onClick={openStandaloneRenewalForm}
      >
        ➕ Registrar nueva renovación
      </button>

      <h3 style={{ marginTop: "40px" }}>Historial</h3>

      {renewals.length === 0 && <p>No existen renovaciones.</p>}

      {renewals.map(r => (
        <div
          key={r.id}
          style={{
            padding: "18px",
            border: "1px solid #CCC",
            borderRadius: "6px",
            marginBottom: "15px",
            background: "#fafafa"
          }}
        >
          <p><strong>Antigua fecha:</strong> {r.old_expiration_date ?? "—"}</p>
          <p><strong>Nueva fecha:</strong> {r.new_expiration_date ?? "—"}</p>
          <p><strong>Registrado:</strong> {r.changed_at?.substring(0, 10)}</p>
        </div>
      ))}
    </div>
  );
}

