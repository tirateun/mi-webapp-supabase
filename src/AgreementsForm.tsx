import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function AgreementsForm({ existingAgreement, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: "",
    institucion: "",
    pais: "",
    responsable_interno: "",
    responsable_externo: "",
    fecha_inicio: "",
    fecha_fin: "",
    duracion: "",
    tipo_convenio: [], // ✅ nuevo campo como array
  });

  const tipos = [
    "Docente Asistencial",
    "Cooperación técnica",
    "Movilidad académica",
    "Investigación",
    "Colaboración académica",
    "Consultoría",
    "Cotutela",
  ];

  useEffect(() => {
    if (existingAgreement) setFormData(existingAgreement);
  }, [existingAgreement]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTipoChange = (tipo) => {
    const updatedTipos = formData.tipo_convenio.includes(tipo)
      ? formData.tipo_convenio.filter((t) => t !== tipo)
      : [...formData.tipo_convenio, tipo];
    setFormData({ ...formData, tipo_convenio: updatedTipos });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existingAgreement) {
      await supabase.from("agreements").update(formData).eq("id", existingAgreement.id);
    } else {
      await supabase.from("agreements").insert([formData]);
    }
    onSave();
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {existingAgreement ? "Editar convenio" : "Registrar nuevo convenio"}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="nombre"
          placeholder="Nombre del convenio"
          value={formData.nombre}
          onChange={handleChange}
          className="border p-2 rounded col-span-2"
          required
        />
        <input
          type="text"
          name="institucion"
          placeholder="Institución"
          value={formData.institucion}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="pais"
          placeholder="País"
          value={formData.pais}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="responsable_interno"
          placeholder="Responsable interno"
          value={formData.responsable_interno}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="responsable_externo"
          placeholder="Responsable externo"
          value={formData.responsable_externo}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="date"
          name="fecha_inicio"
          placeholder="Fecha de inicio"
          value={formData.fecha_inicio}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="date"
          name="fecha_fin"
          placeholder="Fecha de fin"
          value={formData.fecha_fin}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="duracion"
          placeholder="Duración"
          value={formData.duracion}
          onChange={handleChange}
          className="border p-2 rounded col-span-2"
        />

        {/* ✅ NUEVO CAMPO: Tipo de convenio */}
        <div className="col-span-2 border p-3 rounded">
          <label className="font-semibold mb-2 block">Tipo de convenio:</label>
          <div className="grid grid-cols-2 gap-2">
            {tipos.map((tipo) => (
              <label key={tipo} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.tipo_convenio.includes(tipo)}
                  onChange={() => handleTipoChange(tipo)}
                />
                <span>{tipo}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="col-span-2 flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-2 px-4 rounded"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}


