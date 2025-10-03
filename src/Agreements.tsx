import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function Agreements() {
  const [agreements, setAgreements] = useState<any[]>([]);

  const fetchAgreements = async () => {
    const { data, error } = await supabase.from("agreements").select("*");
    if (!error) setAgreements(data || []);
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  return (
    <div id="convenios">
      <h2>📑 Lista de Convenios</h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
        }}
      >
        <thead>
          <tr style={{ background: "#f1f1f1" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Nombre</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Hospital</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Responsable Externo
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Fecha Firma
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Años Duración
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Fecha Vencimiento
            </th>
          </tr>
        </thead>
        <tbody>
          {agreements.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: "10px" }}>
                No hay convenios registrados.
              </td>
            </tr>
          ) : (
            agreements.map((a) => (
              <tr key={a.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.name}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.hospital}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.external_responsible}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.signature_date}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.duration_years}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.expiration_date}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
