import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsListProps {
  user: any;
  role: string;
  onEdit: (agreement: any) => void;
  onCreate: () => void;
}

export default function AgreementsList({ user, role, onEdit, onCreate }: AgreementsListProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Nueva variable de control para forzar recarga
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    fetchAgreements();
  }, [refresh]); // ✅ se vuelve a ejecutar cuando cambia "refresh"

  const fetchAgreements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agreements")
      .select(`
        id,
        name,
        institucion_id,
        instituciones (nombre),
        convenio,
        pais,
        internal_responsible,
        external_responsible,
        signature_date,
        duration_years
      `)
      .order("signature_date", { ascending: false });

    if (error) {
      console.error("❌ Error al cargar convenios:", error);
    } else {
      setAgreements(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este convenio?")) return;

    const { error } = await supabase.from("agreements").delete().eq("id", id);

    if (error) {
      console.error("❌ Error al eliminar:", error);
      alert("❌ Error al eliminar el convenio");
    } else {
      alert("✅ Convenio eliminado correctamente");
      setRefresh((prev) => !prev); // ✅ recargar lista
    }
  };

  if (loading) return <p className="text-center mt-10">Cargando convenios...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-blue-800 mb-4">📜 Lista de Convenios</h2>

      <button
        onClick={onCreate}
        className="mb-4 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
      >
        ➕ Nuevo Convenio
      </button>

      {agreements.length === 0 ? (
        <p>No hay convenios registrados.</p>
      ) : (
        <table className="min-w-full border border-gray-300 text-sm bg-white">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border px-3 py-2">Nombre</th>
              <th className="border px-3 py-2">Institución</th>
              <th className="border px-3 py-2">Tipo</th>
              <th className="border px-3 py-2">País</th>
              <th className="border px-3 py-2">Fecha Firma</th>
              <th className="border px-3 py-2">Duración</th>
              <th className="border px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {agreements.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="border px-3 py-2">{a.name}</td>
                <td className="border px-3 py-2">
                  {a.instituciones?.nombre || "—"}
                </td>
                <td className="border px-3 py-2">{a.convenio}</td>
                <td className="border px-3 py-2">{a.pais}</td>
                <td className="border px-3 py-2">
                  {new Date(a.signature_date).toLocaleDateString("es-PE")}
                </td>
                <td className="border px-3 py-2">{a.duration_years} año(s)</td>
                <td className="border px-3 py-2 text-center">
                  <button
                    onClick={() => onEdit(a)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}










