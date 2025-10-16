import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsFormProps {
  existingAgreement?: any;
  onSave: () => void;
  onCancel: () => void;
}

export default function AgreementsForm({
  existingAgreement,
  onSave,
  onCancel,
}: AgreementsFormProps) {
  const [name, setName] = useState(existingAgreement?.name || "");
  const [institucionId, setInstitucionId] = useState(existingAgreement?.institucion_id || "");
  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [pais, setPais] = useState(existingAgreement?.pais || "");
  const [internalResponsible, setInternalResponsible] = useState(existingAgreement?.internal_responsible || "");
  const [externalResponsible, setExternalResponsible] = useState(existingAgreement?.external_responsible || "");
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [convenio, setConvenio] = useState(existingAgreement?.convenio || "Marco");
  const [durationYears, setDurationYears] = useState(existingAgreement?.duration_years || 1);
  const [resolucionRectoral, setResolucionRectoral] = useState(existingAgreement?.["Resolución Rectoral"] || "");
  const [tipoConvenio, setTipoConvenio] = useState<string[]>(existingAgreement?.tipo_convenio || []);
  const [loading, setLoading] = useState(false);

  const tiposDisponibles = [
    "Docente Asistencial",
    "Cooperación Técnica",
    "Movilidad Académica",
    "Investigación",
    "Colaboración Académica",
    "Consultoría",
    "Cotutela",
  ];

  useEffect(() => {
    fetchUsuarios();
    fetchInstituciones();
  }, []);

  const fetchUsuarios = async () => {
    const { data, error } = await supabase.from("profiles").select("id, full_name, role");
    if (error) console.error("Error cargando usuarios:", error);
    else setUsuarios(data || []);
  };

  const fetchInstituciones = async () => {
    const { data, error } = await supabase.from("instituciones").select("id, nombre");
    if (error) console.error("Error cargando instituciones:", error);
    else setInstituciones(data || []);
  };

  const handleTipoChange = (tipo: string) => {
    if (tipoConvenio.includes(tipo)) {
      setTipoConvenio(tipoConvenio.filter((t) => t !== tipo));
    } else {
      setTipoConvenio([...tipoConvenio, tipo]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const nuevoConvenio = {
      name,
      institucion_id: institucionId || null,
      pais,
      internal_responsible: internalResponsible,
      external_responsible: externalResponsible,
      duration_years: durationYears,
      "Resolución Rectoral": resolucionRectoral,
      convenio,
      tipo_convenio: tipoConvenio,
    };

    console.log("Insertando convenio:", nuevoConvenio);

    const { error } = existingAgreement
      ? await supabase.from("agreements").update(nuevoConvenio).eq("id", existingAgreement.id)
      : await supabase.from("agreements").insert([nuevoConvenio]);

    setLoading(false);

    if (error) {
      alert("❌ Error al guardar el convenio");
      console.error(error);
    } else {
      alert("✅ Convenio guardado correctamente");
      onSave();
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8 mt-6">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">
        {existingAgreement ? "✏️ Editar Convenio" : "📝 Registrar Nuevo Convenio"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-semibold mb-1">Nombre del Convenio</label>
          <input
            type="text"
            className="w-full border rounded-lg p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Institución</label>
          <select
            className="w-full border rounded-lg p-2"
            value={institucionId}
            onChange={(e) => setInstitucionId(e.target.value)}
            required
          >
            <option value="">Seleccione institución</option>
            {instituciones.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">País</label>
          <input
            type="text"
            className="w-full border rounded-lg p-2"
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            placeholder="Ejemplo: Perú"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Responsable Interno</label>
            <select
              className="w-full border rounded-lg p-2"
              value={internalResponsible}
              onChange={(e) => setInternalResponsible(e.target.value)}
              required
            >
              <option value="">Seleccione</option>
              {usuarios
                .filter((u) => u.role === "interno" || u.role === "admin")
                .map((u) => (
                  <option key={u.id} value={u.full_name}>
                    {u.full_name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Responsable Externo</label>
            <select
              className="w-full border rounded-lg p-2"
              value={externalResponsible}
              onChange={(e) => setExternalResponsible(e.target.value)}
              required
            >
              <option value="">Seleccione</option>
              {usuarios
                .filter((u) => u.role === "externo")
                .map((u) => (
                  <option key={u.id} value={u.full_name}>
                    {u.full_name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Duración (años)</label>
          <select
            className="w-full border rounded-lg p-2"
            value={durationYears}
            onChange={(e) => setDurationYears(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Convenio</label>
          <select
            className="w-full border rounded-lg p-2"
            value={convenio}
            onChange={(e) => setConvenio(e.target.value)}
          >
            <option value="Marco">Marco</option>
            <option value="Específico">Específico</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Resolución Rectoral</label>
          <input
            type="text"
            className="w-full border rounded-lg p-2"
            value={resolucionRectoral}
            onChange={(e) => setResolucionRectoral(e.target.value)}
            placeholder="Ejemplo: Resolución N° 123-2023-UNMSM"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2 text-blue-700">
            Tipos de Convenio
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tiposDisponibles.map((tipo) => (
              <label key={tipo} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={tipoConvenio.includes(tipo)}
                  onChange={() => handleTipoChange(tipo)}
                />
                <span>{tipo}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 px-5 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            {loading ? "Guardando..." : "Guardar Convenio"}
          </button>
        </div>
      </form>
    </div>
  );
}





