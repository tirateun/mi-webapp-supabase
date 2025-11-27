// RenewalHistory.tsx (actualizado para integrarse con agreement_years)
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Renewal {
  id: string;
  agreement_id: string;
  renewal_year: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function RenewalHistory({ agreementId }: { agreementId: string }) {
  const [history, setHistory] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agreementId) fetchRenewals();
  }, [agreementId]);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("agreement_renewals")
        .select("id, agreement_id, renewal_year, start_date, end_date, created_at")
        .eq("agreement_id", agreementId)
        .order("renewal_year", { ascending: true });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Error cargando historial de renovaciones:", err);
      alert("Error al cargar historial de renovaciones.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-3 shadow-sm">
      <div className="card-body">
        <h5 className="card-title">📜 Historial de Renovaciones</h5>

        {loading ? (
          <div>Cargando...</div>
        ) : history.length === 0 ? (
          <p className="text-muted">No hay renovaciones registradas.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Año de renovación</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Registrado</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id}>
                    <td>{r.renewal_year}</td>
                    <td>{new Date(r.start_date).toLocaleDateString("es-PE")}</td>
                    <td>{new Date(r.end_date).toLocaleDateString("es-PE")}</td>
                    <td>{new Date(r.created_at).toLocaleDateString("es-PE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

