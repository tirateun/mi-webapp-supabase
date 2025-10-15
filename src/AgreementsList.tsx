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
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("agreements").select("*").order("id", { ascending: false });
    if (error) {
      console.error("Error al cargar convenios:", error);
      setError("No se pudieron cargar los convenios");
    } else {
      setAgreements(data || []);
    }
    setLoading(false);
  };

  const filteredAgreements = agreements.filter((a) =>
    a.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-center">Cargando convenios...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Listado de Convenios</h2>
        {role === "admin" && (
          <button
            onClick={onCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
          >
            + Nuevo Convenio
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar convenio por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-full"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Nombre</th>
              <th className="border p-2">Institución</th>
              <th className="border p-2">País</th>
              <th className="border p-2">Responsable interno</th>
              <th className="border p-2">Responsable externo</th>
              <th className="border p-2">Fecha inicio</th>
              <th className="border p-2">Fecha fin</th>
              <th className="border p-2">Duración</th>
              <th className="border p-2">Tipo de convenio</th> {/* ✅ Nuevo campo */}
              <th className="border p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgreements.length > 0 ? (
              filteredAgreements.map((agreement) => (
                <tr key={agreement.id} className="hover:bg-gray-100">
                  <td className="border p-2 text-center">{agreement.id}</td>
                  <td className="border p-2">{agreement.nombre}</td>
                  <td className="border p-2">{agreement.institucion}</td>
                  <td className="border p-2">{agreement.pais}</td>
                  <td className="border p-2">{agreement.responsable_interno}</td>
                  <td className="border p-2">{agreement.responsable_externo}</td>
                  <td className="border p-2 text-center">{agreement.fecha_inicio}</td>
                  <td className="border p-2 text-center">{agreement.fecha_fin}</td>
                  <td className="border p-2 text-center">{agreement.duracion}</td>
                  <td className="border p-2">
                    {agreement.tipo_convenio?.length
                      ? agreement.tipo_convenio.join(", ")
                      : "-"}
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => onEdit(agreement)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="text-center py-4">
                  No hay convenios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


