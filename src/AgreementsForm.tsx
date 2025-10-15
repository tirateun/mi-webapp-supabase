import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function AgreementsForm({
  existingAgreement = null,
  onSave,
  onCancel,
}: {
  existingAgreement?: any;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    nombre: existingAgreement?.nombre || "",
    descripcion: existingAgreement?.descripcion || "",
    fecha_inicio: existingAgreement?.fecha_inicio || "",
    fecha_fin: existingAgreement?.fecha_fin || "",
    tipo_convenio: existingAgreement?.tipo_convenio || [], // ✅ nuevo campo
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const tiposConvenio = [
    "Docente Asistencial",
    "Cooperación técnica",
    "Movilidad académica",
    "Investigación",
    "Colaboración académica",
    "Consultoría",
    "Cotutela",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.from("agreements").upsert([
      {
        id: existingAgreement?.id,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        tipo_convenio: formData.tipo_convenio, // ✅ nuevo campo
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(error);
      setErrorMsg("Error al guardar el convenio.");
    } else {
      onSave();
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded p-6">
      <h2 className="text-2xl font-bold mb-4">
        {existingAgreement ? "Editar convenio" : "Nuevo convenio"}
      </h2>

      {errorMsg && <p className="text-red-600 mb-3">{errorMsg}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Nombre:</label>
          <input
            type="text"
            className="border rounded p-2 w-full"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Descripción:</label>
          <textarea
            className="border rounded p-2 w-full"
            value={formData.descripcion}
            onChange={(e) =>
              setFormData({ ...formData, descripcion: e.target.value })
            }
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Fecha inicio:</label>
            <input
              type="date"
              className="border rounded p-2 w-full"
              value={formData.fecha_inicio}
              onChange={(e) =>
                setFormData({ ...formData, fecha_inicio: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Fecha fin:</label>
            <input
              type="date"
              className="border rounded p-2 w-full"
              value={formData.fecha_fin}
              onChange={(e) =>
                setFormData({ ...formData, fecha_fin: e.target.value })
              }
            />
          </div>
        </div>

        {/* ✅ Nuevo campo múltiple */}
        <div>
          <label className="block font-medium mb-1">Tipo de convenio:</label>
          <select
            multiple
            className="border p-2 rounded w-full h-32"
            value={formData.tipo_convenio}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(
                (opt) => opt.value
              );
              setFormData({ ...formData, tipo_convenio: selected });
            }}
          >
            {tiposConvenio.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
          <small className="text-gray-500">
            Mantén presionado Ctrl o Cmd para seleccionar varios tipos.
          </small>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

