import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsFormProps {
  existingAgreement?: any;
  onSave: () => void;
  onCancel: () => void;
}

export default function AgreementsForm({ existingAgreement, onSave, onCancel }: AgreementsFormProps) {
  const [nombre, setNombre] = useState(existingAgreement?.name || "");
  const [responsableInterno, setResponsableInterno] = useState(existingAgreement?.internal_responsible || "");
  const [responsableExterno, setResponsableExterno] = useState(existingAgreement?.external_responsible || "");
  const [fechaFirma, setFechaFirma] = useState(existingAgreement?.signature_date || "");
  const [duracion, setDuracion] = useState(existingAgreement?.duration_years || 1);
  const [tipoConvenio, setTipoConvenio] = useState(existingAgreement?.convenio || "Marco");
  const [resolucionRectoral, setResolucionRectoral] = useState(existingAgreement?.["Resolución Rectoral"] || "");
  const [pais, setPais] = useState(existingAgreement?.pais || "");
  const [institucion, setInstitucion] = useState(existingAgreement?.institucion_id || "");
  const [tiposConvenio, setTiposConvenio] = useState<string[]>(existingAgreement?.tipo_convenio || []);

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const tiposDisponibles = [
    "Docente Asistencial",
    "Cooperación técnica",
    "Movilidad académica",
    "Investigación",
    "Colaboración académica",
    "Consultoría",
    "Cotutela",
  ];

  // 🔹 Cargar usuarios e instituciones
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: usuariosData } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .order("full_name");

        const { data: institucionesData } = await supabase
          .from("instituciones")
          .select("id, nombre");

        setUsuarios(usuariosData || []);
        setInstituciones(institucionesData || []);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔹 Manejador de checkboxes
  const handleTipoConvenioChange = (tipo: string) => {
    setTiposConvenio((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  // 🔹 Guardar convenio
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("agreements").insert([
        {
          name: nombre,
          internal_responsible: responsableInterno || null,
          external_responsible: responsableExterno || null,
          signature_date: fechaFirma,
          duration_years: duracion,
          convenio: tipoConvenio,
          pais,
          "Resolución Rectoral": resolucionRectoral || "",
          institucion_id: institucion || null,
          tipo_convenio: tiposConvenio, // ✅ array de strings
        },
      ]);

      if (error) {
        console.error("Error al guardar convenio:", error);
        alert("❌ Error al guardar el convenio: " + error.message);
        return;
      }

      alert("✅ Convenio guardado exitosamente");
      onSave();
    } catch (err) {
      console.error("Error general:", err);
      alert("❌ Error inesperado al guardar el convenio");
    }
  };

  if (loading) return <p>Cargando...</p>;

  const paises = [
    "Perú", "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica",
    "Cuba", "Ecuador", "El Salvador", "España", "Estados Unidos", "Francia",
    "Italia", "México", "Panamá", "Paraguay", "Portugal", "Reino Unido",
    "Uruguay", "Venezuela", "Canadá", "Japón", "China", "Alemania", "Suecia"
  ];

  return (
    <div className="container mt-4">
      <h2>Registrar Nuevo Convenio</h2>
      <form onSubmit={handleSubmit} className="mt-3">

        {/* Nombre */}
        <div className="mb-3">
          <label>Nombre del convenio</label>
          <input
            type="text"
            className="form-control"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        {/* Responsable Interno */}
        <div className="mb-3">
          <label>Responsable Interno</label>
          <select
            className="form-control"
            value={responsableInterno}
            onChange={(e) => setResponsableInterno(e.target.value)}
          >
            <option value="">Seleccione</option>
            {usuarios
              .filter((u) => u.role === "internal")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
          </select>
        </div>

        {/* Responsable Externo */}
        <div className="mb-3">
          <label>Responsable Externo</label>
          <select
            className="form-control"
            value={responsableExterno}
            onChange={(e) => setResponsableExterno(e.target.value)}
          >
            <option value="">Seleccione</option>
            {usuarios
              .filter((u) => u.role === "external")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
          </select>
        </div>

        {/* Institución */}
        <div className="mb-3">
          <label>Institución</label>
          <select
            className="form-control"
            value={institucion}
            onChange={(e) => setInstitucion(e.target.value)}
          >
            <option value="">Seleccione una institución</option>
            {instituciones.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha firma */}
        <div className="mb-3">
          <label>Fecha de firma</label>
          <input
            type="date"
            className="form-control"
            value={fechaFirma}
            onChange={(e) => setFechaFirma(e.target.value)}
          />
        </div>

        {/* Duración */}
        <div className="mb-3">
          <label>Duración (años)</label>
          <select
            className="form-control"
            value={duracion}
            onChange={(e) => setDuracion(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de convenio */}
        <div className="mb-3">
          <label>Tipo de convenio</label>
          <select
            className="form-control"
            value={tipoConvenio}
            onChange={(e) => setTipoConvenio(e.target.value)}
          >
            <option value="Marco">Marco</option>
            <option value="Específico">Específico</option>
          </select>
        </div>

        {/* Resolución Rectoral */}
        <div className="mb-3">
          <label>Resolución Rectoral</label>
          <input
            type="text"
            className="form-control"
            value={resolucionRectoral}
            onChange={(e) => setResolucionRectoral(e.target.value)}
          />
        </div>

        {/* País */}
        <div className="mb-3">
          <label>País</label>
          <select
            className="form-control"
            value={pais}
            onChange={(e) => setPais(e.target.value)}
          >
            <option value="">Seleccione un país</option>
            {paises.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Tipos de convenio */}
        <div className="mb-3">
          <label>Tipos de convenio</label>
          <div>
            {tiposDisponibles.map((tipo) => (
              <label key={tipo} style={{ marginRight: "12px" }}>
                <input
                  type="checkbox"
                  checked={tiposConvenio.includes(tipo)}
                  onChange={() => handleTipoConvenioChange(tipo)}
                />{" "}
                {tipo}
              </label>
            ))}
          </div>
        </div>

        {/* Botones */}
        <div className="mt-4">
          <button type="submit" className="btn btn-primary me-2">
            Guardar Convenio
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}








