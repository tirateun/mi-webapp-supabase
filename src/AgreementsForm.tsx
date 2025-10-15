import { useState, useEffect, ChangeEvent } from "react";
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
  const [nombre, setNombre] = useState(existingAgreement?.nombre || "");
  const [institucion, setInstitucion] = useState(existingAgreement?.institucion || "");
  const [pais, setPais] = useState(existingAgreement?.pais || "");
  const [responsableInterno, setResponsableInterno] = useState(
    existingAgreement?.responsable_interno || ""
  );
  const [responsableExterno, setResponsableExterno] = useState(
    existingAgreement?.responsable_externo || ""
  );
  const [duracion, setDuracion] = useState(existingAgreement?.duracion || "1");
  const [tipoConvenio, setTipoConvenio] = useState(existingAgreement?.tipo_convenio || []);
  const [categoriaConvenio, setCategoriaConvenio] = useState(
    existingAgreement?.categoria_convenio || "Marco"
  );
  const [resolucionRectoral, setResolucionRectoral] = useState(
    existingAgreement?.resolucion_rectoral || ""
  );

  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paises = [
    "Perú", "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Ecuador",
    "México", "Paraguay", "Uruguay", "Venezuela", "España", "Estados Unidos",
    "Canadá", "Francia", "Alemania", "Italia", "Japón", "Corea del Sur", "China",
  ];

  useEffect(() => {
    fetchInstituciones();
    fetchUsuarios();
  }, []);

  const fetchInstituciones = async () => {
    const { data, error } = await supabase.from("instituciones").select("id, nombre");
    if (!error && data) setInstituciones(data);
  };

  const fetchUsuarios = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role");

    if (!error && data) setUsuarios(data);
  };

  const internos = usuarios.filter(
    (u) => u.role === "interno" || u.role === "admin"
  );
  const externos = usuarios.filter((u) => u.role === "externo");

  const handleTipoConvenioChange = (tipo: string) => {
    setTipoConvenio((prev: string[]) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const dataToSave = {
      nombre,
      institucion,
      pais,
      responsable_interno: responsableInterno,
      responsable_externo: responsableExterno,
      duracion,
      tipo_convenio: tipoConvenio,
      categoria_convenio: categoriaConvenio,
      resolucion_rectoral: resolucionRectoral,
    };

    const { error } = existingAgreement
      ? await supabase.from("agreements").update(dataToSave).eq("id", existingAgreement.id)
      : await supabase.from("agreements").insert([dataToSave]);

    if (error) {
      console.error("Error al guardar:", error);
      setError("❌ Error al guardar el convenio");
    } else {
      onSave();
    }

    setGuardando(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-8 border border-gray-200">
      <h2 className="text-3xl font-bold text-blue-800 mb-6 text-center">
        {existingAgreement ? "Editar Convenio" : "Registrar Nuevo Convenio"}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
        {/* Nombre */}
        <div className="col-span-2">
          <label className="block text-gray-700 font-semibold mb-1">
            Nombre del convenio
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            required
          />
        </div>

        {/* Institución */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Institución</label>
          <select
            value={institucion}
            onChange={(e) => setInstitucion(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            required
          >
            <option value="">Seleccione una institución</option>
            {instituciones.map((inst) => (
              <option key={inst.id} value={inst.nombre}>
                {inst.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* País */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">País</label>
          <select
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            required
          >
            <option value="">Seleccione país</option>
            {paises.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Responsable Interno */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Responsable Interno
          </label>
          <select
            value={responsableInterno}
            onChange={(e) => setResponsableInterno(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Seleccione responsable interno</option>
            {internos.map((user) => (
              <option key={user.id} value={user.full_name}>
                {user.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Responsable Externo */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Responsable Externo
          </label>
          <select
            value={responsableExterno}
            onChange={(e) => setResponsableExterno(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Seleccione responsable externo</option>
            {externos.map((user) => (
              <option key={user.id} value={user.full_name}>
                {user.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Duración */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Duración (en años)
          </label>
          <select
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((año) => (
              <option key={año} value={año}>
                {año} año{año > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Convenio Marco / Específico */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Tipo de convenio
          </label>
          <select
            value={categoriaConvenio}
            onChange={(e) => setCategoriaConvenio(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
          >
            <option value="Marco">Marco</option>
            <option value="Específico">Específico</option>
          </select>
        </div>

        {/* Resolución Rectoral */}
        <div className="col-span-2">
          <label className="block text-gray-700 font-semibold mb-1">
            Resolución Rectoral
          </label>
          <input
            type="text"
            value={resolucionRectoral}
            onChange={(e) => setResolucionRectoral(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Tipo de convenio múltiple */}
        <div className="col-span-2 mt-2">
          <label className="block text-gray-700 font-semibold mb-1">
            Ámbito del convenio
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Docente Asistencial",
              "Cooperación técnica",
              "Movilidad académica",
              "Investigación",
              "Colaboración académica",
              "Consultoría",
              "Cotutela",
            ].map((tipo) => (
              <label key={tipo} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={tipoConvenio.includes(tipo)}
                  onChange={() => handleTipoConvenioChange(tipo)}
                />
                <span>{tipo}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Botones */}
        {error && <p className="text-red-500 col-span-2">{error}</p>}
        <div className="col-span-2 flex justify-end mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg mr-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg shadow-md transition-all duration-200"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}





