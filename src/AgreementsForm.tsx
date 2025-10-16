import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsFormProps {
  existingAgreement?: any;
  onSave: () => void;
  onCancel: () => void;
}

const countries = [
  "Perú", "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica",
  "Cuba", "Ecuador", "El Salvador", "España", "Estados Unidos", "Francia",
  "Guatemala", "Honduras", "Italia", "México", "Nicaragua", "Panamá", "Paraguay",
  "Portugal", "Reino Unido", "República Dominicana", "Uruguay", "Venezuela"
];

const tiposConvenio = [
  "Docente Asistencial",
  "Cooperación técnica",
  "Movilidad académica",
  "Investigación",
  "Colaboración académica",
  "Consultoría",
  "Cotutela",
];

export default function AgreementsForm({ existingAgreement, onSave, onCancel }: AgreementsFormProps) {
  const [formData, setFormData] = useState<any>({
    name: existingAgreement?.name || "",
    internal_responsible: existingAgreement?.internal_responsible || "",
    external_responsible: existingAgreement?.external_responsible || "",
    signature_date: existingAgreement?.signature_date || "",
    duration_years: existingAgreement?.duration_years || "",
    convenio: existingAgreement?.convenio || "Marco",
    pais: existingAgreement?.pais || "",
    Resolución_Rectoral: existingAgreement?.Resolución_Rectoral || "",
    institucion_id: existingAgreement?.institucion_id || "",
    tipo_convenio: existingAgreement?.tipo_convenio || [],
  });

  const [responsablesInternos, setResponsablesInternos] = useState<any[]>([]);
  const [responsablesExternos, setResponsablesExternos] = useState<any[]>([]);
  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [loadingResponsables, setLoadingResponsables] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 🔹 Cargar datos desde Supabase
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoadingResponsables(true);

      // ✅ Buscar responsables internos (role = 'internal')
      const { data: internos, error: errInt } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("role", "internal");

      // ✅ Buscar responsables externos (role = 'external')
      const { data: externos, error: errExt } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("role", "external");

      // ✅ Buscar instituciones
      const { data: inst, error: errInst } = await supabase
        .from("instituciones")
        .select("id, name");

      if (errInt || errExt || errInst) {
        console.error("⚠️ Errores en carga:", { errInt, errExt, errInst });
      }

      console.log("👤 Internos encontrados:", internos);
      console.log("🌎 Externos encontrados:", externos);

      setResponsablesInternos(internos || []);
      setResponsablesExternos(externos || []);
      setInstituciones(inst || []);
    } catch (e) {
      console.error("❌ Error general al cargar datos:", e);
    } finally {
      setLoadingResponsables(false);
    }
  };

  fetchData();
}, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleTipoConvenioChange = (tipo: string) => {
    setFormData((prev: any) => {
      const tipos = prev.tipo_convenio.includes(tipo)
        ? prev.tipo_convenio.filter((t: string) => t !== tipo)
        : [...prev.tipo_convenio, tipo];
      return { ...prev, tipo_convenio: tipos };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const expirationDate = formData.signature_date
      ? new Date(new Date(formData.signature_date).setFullYear(new Date(formData.signature_date).getFullYear() + Number(formData.duration_years)))
      : null;

    const { error } = existingAgreement
      ? await supabase
          .from("agreements")
          .update({ ...formData, expiration_date: expirationDate })
          .eq("id", existingAgreement.id)
      : await supabase.from("agreements").insert([{ ...formData, expiration_date: expirationDate }]);

    setSaving(false);

    if (error) {
      console.error("❌ Error al guardar:", error);
      setError("❌ Error al guardar el convenio");
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSave();
      }, 1200);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8 mt-8 border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">
        {existingAgreement ? "Editar Convenio" : "Registrar Nuevo Convenio"}
      </h2>

      {loadingResponsables ? (
        <p className="text-center text-gray-600">Cargando responsables...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
          <div>
            <label className="block font-medium text-gray-700">Nombre del convenio</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-lg p-2"
              required
            />
          </div>

          {/* RESPONSABLES */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700">Responsable Interno</label>
              <select
                name="internal_responsible"
                value={formData.internal_responsible}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-lg p-2"
                required
              >
                <option value="">Seleccione</option>
                {responsablesInternos.length === 0 ? (
                  <option disabled>⚠️ No hay responsables internos</option>
                ) : (
                  responsablesInternos.map((r) => (
                    <option key={r.id} value={r.full_name}>
                      {r.full_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700">Responsable Externo</label>
              <select
                name="external_responsible"
                value={formData.external_responsible}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-lg p-2"
                required
              >
                <option value="">Seleccione</option>
                {responsablesExternos.length === 0 ? (
                  <option disabled>⚠️ No hay responsables externos</option>
                ) : (
                  responsablesExternos.map((r) => (
                    <option key={r.id} value={r.full_name}>
                      {r.full_name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* DATOS GENERALES */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-gray-700">Fecha de firma</label>
              <input
                type="date"
                name="signature_date"
                value={formData.signature_date}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700">Duración (años)</label>
              <select
                name="duration_years"
                value={formData.duration_years}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-lg p-2"
                required
              >
                <option value="">Seleccione</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700">Tipo de convenio</label>
              <select
                name="convenio"
                value={formData.convenio}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-lg p-2"
              >
                <option value="Marco">Marco</option>
                <option value="Específico">Específico</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700">Resolución Rectoral</label>
            <input
              type="text"
              name="Resolución_Rectoral"
              value={formData.Resolución_Rectoral}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">País</label>
            <select
              name="pais"
              value={formData.pais}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-lg p-2"
              required
            >
              <option value="">Seleccione un país</option>
              {countries.map((pais) => (
                <option key={pais} value={pais}>
                  {pais}
                </option>
              ))}
            </select>
          </div>

          {/* TIPOS DE CONVENIO */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Tipos de convenio
            </label>
            <div className="grid grid-cols-2 gap-2">
              {tiposConvenio.map((tipo) => (
                <label key={tipo} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.tipo_convenio.includes(tipo)}
                    onChange={() => handleTipoConvenioChange(tipo)}
                  />
                  <span>{tipo}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-center">{error}</p>}
          {success && (
            <p className="text-green-600 text-center">
              ✅ Convenio guardado correctamente
            </p>
          )}

          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              {saving ? "Guardando..." : "Guardar Convenio"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}







