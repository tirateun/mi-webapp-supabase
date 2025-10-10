import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import AgreementsForm from "./AgreementsForm";

interface AgreementsListProps {
  user: any;
  role: string;
}

export default function AgreementsList({ user, role }: AgreementsListProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgreement, setEditingAgreement] = useState<any | null>(null);

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);
    let query = supabase
      .from("agreements")
      .select(
        `
        id, name, institucion, convenio, pais, 
        signature_date, duration_years, expiration_date,
        profiles!agreements_internal_responsible_fkey (full_name)
      `
      )
      .order("created_at", { ascending: false });

    if (role !== "admin") {
      query = query.eq("internal_responsible", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error al cargar convenios:", error);
    } else {
      setAgreements(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro de eliminar este convenio?")) return;

    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) {
      alert("❌ Error al eliminar convenio: " + error.message);
    } else {
      alert("✅ Convenio eliminado correctamente");
      fetchAgreements(); // 🔄 Recargar lista automáticamente
    }
  };

  if (loading) return <p>Cargando convenios...</p>;

  return (
    <div className="p-4 w-full max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        📑 Lista de Convenios
      </h2>

      {editingAgreement ? (
        <AgreementsForm
          existingAgreement={editingAgreement}
          onSave={() => {
            setEditingAgreement(null);
            fetchAgreements();
          }}
          onCancel={() => setEditingAgreement(null)}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-lg bg-white">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-blue-100 text-gray-800 text-sm uppercase">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Institución</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">País</th>
                <th className="p-3">Responsable interno</th>
                <th className="p-3">Firma</th>
                <th className="p-3">Duración</th>
                <th className="p-3">Vencimiento</th>
                {role === "admin" && <th className="p-3 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {agreements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center italic text-gray-500">
                    No hay convenios registrados.
                  </td>
                </tr>
              ) : (
                agreements.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="p-3">{a.name}</td>
                    <td className="p-3">{a.institucion}</td>
                    <td className="p-3">{a.convenio}</td>
                    <td className="p-3">{a.pais}</td>
                    <td className="p-3">{a.profiles?.full_name || "—"}</td>
                    <td className="p-3">{a.signature_date}</td>
                    <td className="p-3">{a.duration_years} años</td>
                    <td className="p-3">{a.expiration_date}</td>
                    {role === "admin" && (
                      <td className="p-3 flex gap-2 justify-center">
                        <button
                          onClick={() => setEditingAgreement(a)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-all"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md transition-all"
                        >
                          🗑 Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}









