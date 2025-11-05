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
  const [internalResponsibles, setInternalResponsibles] = useState<string[]>(
    existingAgreement?.internal_responsibles || []
  );
  const [externalResponsible, setExternalResponsible] = useState(
    existingAgreement?.external_responsible || ""
  );
  const [signatureDate, setSignatureDate] = useState(existingAgreement?.signature_date || "");
  const [durationYears, setDurationYears] = useState(existingAgreement?.duration_years || 1);
  const [tipoConvenio, setTipoConvenio] = useState(existingAgreement?.convenio || "marco");
  const [resolucion, setResolucion] = useState(existingAgreement?.["Resolución Rectoral"] || "");
  const [pais, setPais] = useState(existingAgreement?.pais || "");
  const [objetivos, setObjetivos] = useState(existingAgreement?.objetivos || "");
  const [tipoSeleccionados, setTipoSeleccionados] = useState<string[]>(existingAgreement?.tipo_convenio || []);
  const [subTipoDocente, setSubTipoDocente] = useState(existingAgreement?.sub_tipo_docente || "");
  const [areasVinculadas, setAreasVinculadas] = useState<string[]>(
    existingAgreement?.areas_vinculadas_ids || []
  );

  const [internos, setInternos] = useState<any[]>([]);
  const [externos, setExternos] = useState<any[]>([]);
  const [paises, setPaises] = useState<string[]>([]);
  const [areas, setAreas] = useState<any[]>([]);

  const tipos = [
    "Docente Asistencial",
    "Cooperación técnica",
    "Movilidad académica",
    "Investigación",
    "Colaboración académica",
    "Consultoría",
    "Cotutela",
  ];

  const subTiposDocente = [
    "PREGRADO - NACIONALES",
    "POSTGRADO RESIDENTADO EN ENFERMERÍA - NACIONALES CONAREN",
    "POSTGRADO 2DA ESP. EN ENFERMERÍA NO RESIDENTADO - NACIONALES",
    "POSTGRADO RESIDENTADO MÉDICO - CONAREME",
    "POSTGRADO 2DA ESPECIALIDAD NUTRICIÓN PALIATIVA",
  ];

  useEffect(() => {
    fetchResponsables();
    fetchPaises();
    fetchAreas();
  }, []);

  const fetchResponsables = async () => {
    const { data: internosData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "internal");
    const { data: externosData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "external");
    setInternos(internosData || []);
    setExternos(externosData || []);
  };

  const fetchPaises = async () => {
    try {
      const response = await fetch("https://restcountries.com/v3.1/all");
  
      if (!response.ok) throw new Error("Fallo al cargar países");
  
      const data = await response.json();
      const nombres = data
        .map((p: any) => p?.name?.common)
        .filter(Boolean)
        .sort((a: string, b: string) => a.localeCompare(b, "es"));
  
      setPaises(nombres);
    } catch (error) {
      console.warn("⚠️ No se pudo cargar países desde la API, usando lista local.");
      setPaises([
        "Perú",
        "Argentina",
        "Chile",
        "Colombia",
        "México",
        "Brasil",
        "Ecuador",
        "España",
        "Estados Unidos",
        "Canadá",
      ]);
    }
  };

  const fetchAreas = async () => {
    const { data, error } = await supabase
      .from("areas_vinculadas")
      .select("id, nombre")
      .order("nombre");
    if (!error) setAreas(data || []);
  };

  const handleTipoChange = (tipo: string) => {
    setTipoSeleccionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const handleAddArea = () => setAreasVinculadas([...areasVinculadas, ""]);
  const handleRemoveArea = (index: number) => {
    const updated = [...areasVinculadas];
    updated.splice(index, 1);
    setAreasVinculadas(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      alert("❌ No se pudo verificar el usuario autenticado.");
      return;
    }

    const user = userData.user;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!["admin", "Admin", "Administrador"].includes(profile?.role)) {
      alert("❌ No tienes permisos para crear o editar convenios.");
      return;
    }

    const convenioNormalizado =
      tipoConvenio.toLowerCase().includes("marco")
        ? "marco"
        : tipoConvenio.toLowerCase().includes("espec")
        ? "específico"
        : tipoConvenio;

    const dataToSave = {
      name,
      external_responsible: externalResponsible,
      signature_date: signatureDate,
      duration_years: durationYears,
      convenio: convenioNormalizado,
      pais,
      "Resolución Rectoral": resolucion,
      tipo_convenio: tipoSeleccionados,
      objetivos,
      sub_tipo_docente: tipoSeleccionados.includes("Docente Asistencial")
        ? subTipoDocente
        : null,
    };

    let error = null;
    let agreementId = existingAgreement?.id;

    if (existingAgreement) {
      const { error: updateError } = await supabase
        .from("agreements")
        .update(dataToSave)
        .eq("id", existingAgreement.id);
      error = updateError;
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from("agreements")
        .insert([dataToSave])
        .select("id")
        .single();
      error = insertError;
      agreementId = insertData?.id;
    }

    if (error) {
      alert("❌ Error al guardar el convenio: " + error.message);
      return;
    }

    // 🔹 Guardar responsables internos
    await supabase.from("agreement_internal_responsibles").delete().eq("agreement_id", agreementId);
    for (const internalId of internalResponsibles) {
      await supabase.from("agreement_internal_responsibles").insert([
        { agreement_id: agreementId, internal_responsible_id: internalId },
      ]);
    }

    // 🔹 Guardar áreas vinculadas
    await supabase.from("agreement_areas_vinculadas").delete().eq("agreement_id", agreementId);
    for (const areaId of areasVinculadas.filter(Boolean)) {
      await supabase.from("agreement_areas_vinculadas").insert([
        { agreement_id: agreementId, area_vinculada_id: areaId },
      ]);
    }

    alert("✅ Convenio guardado correctamente");
    onSave();
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "850px" }}>
      <div className="card shadow-lg p-4 border-0" style={{ borderRadius: "16px" }}>
        <h3 className="mb-4 text-center text-primary fw-bold">
          {existingAgreement ? "✏️ Editar Convenio" : "Registrar Nuevo Convenio"}
        </h3>

        <form onSubmit={handleSubmit}>
          {/* NOMBRE */}
          <div className="mb-3">
            <label>Nombre del convenio</label>
            <input
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* RESPONSABLES INTERNOS (MÚLTIPLES) */}
          <div className="mb-3">
            <label>Responsables Internos</label>
            <select
              multiple
              className="form-select"
              value={internalResponsibles}
              onChange={(e) =>
                setInternalResponsibles(Array.from(e.target.selectedOptions, (opt) => opt.value))
              }
            >
              {internos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
            <small className="text-muted">Mantén presionada CTRL (o CMD en Mac) para seleccionar varios.</small>
          </div>

          {/* RESPONSABLE EXTERNO */}
          <div className="mb-3">
            <label>Responsable Externo</label>
            <select
              className="form-select"
              value={externalResponsible}
              onChange={(e) => setExternalResponsible(e.target.value)}
            >
              <option value="">Seleccione</option>
              {externos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* ÁREAS VINCULADAS (MÚLTIPLES) */}
          <div className="mb-3">
            <label>Áreas Vinculadas</label>
            {areasVinculadas.map((areaId, index) => (
              <div key={index} className="d-flex align-items-center mb-2">
                <select
                  className="form-select me-2"
                  value={areaId}
                  onChange={(e) => {
                    const updated = [...areasVinculadas];
                    updated[index] = e.target.value;
                    setAreasVinculadas(updated);
                  }}
                >
                  <option value="">Seleccione un área</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleRemoveArea(index)}
                >
                  ❌
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleAddArea}>
              ➕ Agregar área vinculada
            </button>
          </div>

          {/* RESTO DEL FORMULARIO (sin cambios visuales) */}
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
            />
          </div>

          <div className="mb-3">
            <label>País</label>
            <select
              className="form-select"
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

          {tipoSeleccionados.includes("Docente Asistencial") && (
            <div className="mb-4">
              <label>Subtipo Docente Asistencial</label>
              <select
                className="form-select"
                value={subTipoDocente}
                onChange={(e) => setSubTipoDocente(e.target.value)}
              >
                <option value="">Seleccione una opción</option>
                {subTiposDocente.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label>Objetivos del convenio</label>
            <textarea
              className="form-control"
              rows={3}
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value)}
            />
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
















