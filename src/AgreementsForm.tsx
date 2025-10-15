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
  const [nombre, setNombre] = useState<string>(existingAgreement?.nombre || "");
  const [institucion, setInstitucion] = useState<string>(existingAgreement?.institucion || "");
  const [pais, setPais] = useState<string>(existingAgreement?.pais || "");
  const [responsableInterno, setResponsableInterno] = useState<string>(
    existingAgreement?.responsable_interno || ""
  );
  const [responsableExterno, setResponsableExterno] = useState<string>(
    existingAgreement?.responsable_externo || ""
  );
  const [fechaInicio, setFechaInicio] = useState<string>(
    existingAgreement?.fecha_inicio || ""
  );
  const [fechaFin, setFechaFin] = useState<string>(existingAgreement?.fecha_fin || "");
  const [duracion, setDuracion] = useState<string>(existingAgreement?.duracion || "");
  const [tipoConvenio, setTipoConvenio] = useState<string[]>(
    existingAgreement?.tipo_convenio || []
  );

  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInstituciones();
  }, []);

  const fetchInstituciones = async () => {
    const { data, error } = await supabase.from("instituciones").select("id, nombre");
    if (!error && data) setInstituciones(data);
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
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      duracion,
      tipo_convenio: tipoConvenio,
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

  const handleTipoConvenioChange = (tipo: string) => {
    setTipoConvenio((prev: string[]) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">
        {existingAgreement ? "Editar Convenio" : "Registrar Nuevo Convenio"}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Nombre del convenio</label>
          <input
            type="text"
            value={nombre}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
            className="border border-gray-300 rounded w-full p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Institución</label>
          <select
            value={institucion}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setInstitucion(e.target.value)}
            className="border border-gray-300 rounded w-full p-2"
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

        <div>
          <label className="block mb-1 font-semibold">País</label>
          <input
            type="text"
            value={pais}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPais(e.target.value)}
            className="border border-gray-300 rounded w-full p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Responsable interno</label>
          <input
            type="text"
            value={responsableInterno}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setResponsableInterno(e.target.value)}
            className="border border-gray-300 rounded w-full p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Responsable externo</label>
          <input
            type="text"
            value={responsableExterno}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setResponsableExterno(e.target.value)}
            className="border border-gray-300 rounded w-full p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Fecha inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFechaInicio(e.target.value)}
            className="border border-gray-300 rounded w-full p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Fecha fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFechaFin(e.target.value)}
            className="border border-gray-300 rounded w-full p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Duración</label>
          <input
            type="text"
            value={duracion}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDuracion(e.target.value)}
            className="border border-gray-300 rounded w-full p-2"
          />
        </div>

        {/* ✅ NUEVO CAMPO MULTI-SELECCIÓN */}
        <div className="col-span-2">
          <label className="block mb-2 font-semibold">Tipo de convenio</label>
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

        {error && <p className="text-red-500 col-span-2">{error}</p>}

        <div className="col-span-2 flex justify-end mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded mr-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}



