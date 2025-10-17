import { useEffect, useState } from "react";
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
  const [internalResponsible, setInternalResponsible] = useState(existingAgreement?.internal_responsible || "");
  const [externalResponsible, setExternalResponsible] = useState(existingAgreement?.external_responsible || "");
  const [signatureDate, setSignatureDate] = useState(existingAgreement?.signature_date || "");
  const [durationYears, setDurationYears] = useState(existingAgreement?.duration_years || 1);
  const [tipoConvenio, setTipoConvenio] = useState(existingAgreement?.convenio || "marco");
  const [resolucion, setResolucion] = useState(existingAgreement?.["Resolución Rectoral"] || "");
  const [pais, setPais] = useState(existingAgreement?.pais || "");
  const [tipoSeleccionados, setTipoSeleccionados] = useState<string[]>(existingAgreement?.tipo_convenio || []);

  const [internos, setInternos] = useState<any[]>([]);
  const [externos, setExternos] = useState<any[]>([]);
  const [paises, setPaises] = useState<string[]>([]);

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
    fetchResponsables();
    fetchPaises();
  }, []);

  const fetchResponsables = async () => {
    const { data: internosData } = await supabase.from("profiles").select("id, full_name").eq("role", "internal");
    const { data: externosData } = await supabase.from("profiles").select("id, full_name").eq("role", "external");

    setInternos(internosData || []);
    setExternos(externosData || []);
  };

  const fetchPaises = async () => {
    try {
      const response = await fetch("https://restcountries.com/v3.1/all");
      const data = await response.json();
      const nombres = data.map((p: any) => p.name.common).sort();
      setPaises(nombres);
    } catch (error) {
      console.error("Error al cargar países:", error);
    }
  };

  const handleTipoChange = (tipo: string) => {
    if (tipoSeleccionados.includes(tipo)) {
      setTipoSeleccionados(tipoSeleccionados.filter((t) => t !== tipo));
    } else {
      setTipoSeleccionados([...tipoSeleccionados, tipo]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Normalizar tipo de convenio según constraint
    const convenioNormalizado =
      tipoConvenio.toLowerCase().includes("marco")
        ? "marco"
        : tipoConvenio.toLowerCase().includes("espec")
        ? "específico"
        : tipoConvenio;

    const { error } = await supabase.from("agreements").insert([
      {
        name,
        internal_responsible: internalResponsible,
        external_responsible: externalResponsible,
        signature_date: signatureDate,
        duration_years: durationYears,
        convenio: convenioNormalizado,
        pais,
        "Resolución Rectoral": resolucion,
        tipo_convenio: tipoSeleccionados,
      },
    ]);

    if (error) {
      console.error(error);
      alert("❌ Error al guardar el convenio: " + error.message);
    } else {
      alert("✅ Convenio guardado correctamente");
      onSave();
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "800px" }}>
      <div className="card shadow-lg p-4 border-0" style={{ borderRadius: "16px" }}>
        <h3 className="mb-4 text-center text-primary fw-bold">Registrar Nuevo Convenio</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Nombre del convenio</label>
            <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label>Responsable Interno</label>
              <select
                className="form-select"
                value={internalResponsible}
                onChange={(e) => setInternalResponsible(e.target.value)}
              >
                <option value="">Seleccione</option>
                {internos.map((p) => (
                  <option key={p.id} value={p.full_name}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label>Responsable Externo</label>
              <select
                className="form-select"
                value={externalResponsible}
                onChange={(e) => setExternalResponsible(e.target.value)}
              >
                <option value="">Seleccione</option>
                {externos.map((p) => (
                  <option key={p.id} value={p.full_name}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4 mb-3">
              <label>Fecha de firma</label>
              <input
                type="date"
                className="form-control"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
              />
            </div>

            <div className="col-md-4 mb-3">
              <label>Duración (años)</label>
              <select
                className="form-select"
                value={durationYears}
                onChange={(e) => setDurationYears(Number(e.target.value))}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label>Tipo de convenio</label>
              <select
                className="form-select"
                value={tipoConvenio}
                onChange={(e) => setTipoConvenio(e.target.value)}
              >
                <option value="marco">Marco</option>
                <option value="específico">Específico</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label>Resolución Rectoral</label>
            <input
              className="form-control"
              value={resolucion}
              onChange={(e) => setResolucion(e.target.value)}
              placeholder="Ingrese número de resolución"
            />
          </div>

          <div className="mb-3">
            <label>País</label>
            <select className="form-select" value={pais} onChange={(e) => setPais(e.target.value)}>
              <option value="">Seleccione un país</option>
              {paises.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label>Tipos de convenio</label>
            <div className="border rounded p-3 bg-light">
              {tipos.map((tipo) => (
                <label key={tipo} className="me-3">
                  <input
                    type="checkbox"
                    checked={tipoSeleccionados.includes(tipo)}
                    onChange={() => handleTipoChange(tipo)}
                    className="me-1"
                  />
                  {tipo}
                </label>
              ))}
            </div>
          </div>

          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-secondary me-3" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Convenio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}










