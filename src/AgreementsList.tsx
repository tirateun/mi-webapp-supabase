import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function AgreementsList({
  user,
  role,
  onEdit,
  onCreate,
}: {
  user: any;
  role: string;
  onEdit: (agreement: any) => void;
  onCreate: () => void;
}) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgreements();
  }, []);

  async function fetchAgreements() {
    setLoading(true);
    const { data, error } = await supabase.from("agreements").select("*");
    if (!error) setAgreements(data || []);
    setLoading(false);
  }

  if (loading) return <p>Cargando convenios...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lista de convenios</h2>
        {role === "admin" && (
          <button
            onClick={onCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Nuevo convenio
          </button>
        )}
      </div>

      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Nombre</th>
            <th className="border p-2">Descripción</th>
            <th className="border p-2">Tipo de convenio</th>
            <th className="border p-2">Fechas</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {agreements.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="border p-2">{a.nombre}</td>
              <td className="border p-2">{a.descripcion}</td>
              <td className="border p-2">
                {a.tipo_convenio?.length
                  ? a.tipo_convenio.join(", ")
                  : "—"}
              </td>
              <td className="border p-2">
                {a.fecha_inicio
                  ? `${a.fecha_inicio} — ${a.fecha_fin || "Sin fin"}`
                  : "—"}
              </td>
              <td className="border p-2 text-center">
                {role === "admin" && (
                  <button
                    onClick={() => onEdit(a)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Editar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

