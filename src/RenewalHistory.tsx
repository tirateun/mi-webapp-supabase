import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface RenewalHistoryProps {
  agreementId: string;
  onClose: () => void;
}

interface RenewalRecord {
  id: string;
  old_expiration_date: string | null;
  new_expiration_date: string | null;
  changed_at: string;
}

export default function RenewalHistory({ agreementId, onClose }: RenewalHistoryProps) {
  const [records, setRecords] = useState<RenewalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("agreement_renewals")
        .select("id, old_expiration_date, new_expiration_date, changed_at")
        .eq("agreement_id", agreementId)
        .order("changed_at", { ascending: false });

      if (!error && data) setRecords(data as RenewalRecord[]);
      setLoading(false);
    };

    loadHistory();
  }, [agreementId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded shadow-md w-[500px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Historial de Renovaciones</h2>

        {loading ? (
          <div>Cargando...</div>
        ) : records.length === 0 ? (
          <div className="text-gray-600">No hay renovaciones registradas.</div>
        ) : (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Anterior</th>
                <th className="border p-2">Nueva</th>
                <th className="border p-2">Fecha de cambio</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="border p-2">{r.old_expiration_date || "—"}</td>
                  <td className="border p-2 font-semibold">{r.new_expiration_date}</td>
                  <td className="border p-2">{new Date(r.changed_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-end mt-4">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
