import { useEffect, useState } from "react";
import Select from "react-select";
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
  const [internalResponsibles, setInternalResponsibles] = useState<any[]>([]);
  const [selectedInternals, setSelectedInternals] = useState<any[]>([]);
  const [externalResponsible, setExternalResponsible] = useState(
    existingAgreement?.external_responsible || ""
  );
  const [signatureDate, setSignatureDate] = useState(
    existingAgreement?.signature_date || ""
  );
  const [durationYears, setDurationYears] = useState(
    existingAgreement?.duration_years || 1
  );
  const [tipoConvenio, setTipoConvenio] = useState(
    existingAgreement?.convenio || "marco"
  );
  const [resolucion, setResolucion] = useState(
    existingAgreement?.["Resolución Rectoral"] || ""
  );
  const [pais, setPais] = useState(existingAgreement?.pais || "");
  const [objetivos, setObjetivos] = useState(existingAgreement?.objetivos || "");
  const [tipoSeleccionados, setTipoSeleccionados] = useState<string[]>(
    existingAgreement?.tipo_convenio || []
  );
  const [subTipoDocente, setSubTipoDocente] = useState(
    existingAgreement?.sub_tipo_docente || ""
  );
  const [externos, setExternos] = useState<any[]>([]);
  const [paises, setPaises] = useState<string[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [areasSeleccionadas, setAreasSeleccionadas] = useState<string[]>([]);

  // Listas estáticas
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

  // ===============================
  // CARGA INICIAL
  // ===============================
  useEffect(() => {
    fetchResponsables();
    fetchPaises();
    fetchAreas();

    if (existingAgreement?.id) {
      fetchAreasVinculadas(existingAgreement.id);
      fetchInternalResponsibles(existingAgreement.id);
    }
  }, []);

  // ===============================
  // FETCH DATA
  // ===============================
  const fetchResponsables = async () => {
    const { data: internosData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "internal");
    const { data: externosData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "external");
    setInternalResponsibles(internosData || []);
    setExternos(externosData || []);
  };

  const fetchPaises = async () => {
    try {
      const response = await fetch("https://restcountries.com/v3.1/all");
      const data = await response.json();
      const nombres = data
        .map((p: any) => p?.name?.common)
        .filter(Boolean)
        .sort((a: string, b: string) => a.localeCompare(b, "es"));
      setPaises(nombres);
    } catch {
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
      .select("id, nombre");
    if (!error && data) setAreas(data);
  };

  const fetchAreasVinculadas = async (agreementId: string) => {
    const { data } = await supabase
      .from("agreement_areas_vinculadas")
      .select("area_vinculada_id")
      .eq("agreement_id", agreementId);
    if (data) setAreasSeleccionadas(data.map((a) => a.area_vinculada_id));
  };

  const fetchInternalResponsibles = async (agreementId: string) => {
    const { data } = await supabase
      .from("agreement_internal_responsibles")
      .select("internal_responsible_id")
      .eq("agreement_id", agreementId);
    if (data && data.length > 0) {
      const seleccionados = internalResponsibles
        .filter((r) =>
          data.some((d) => d.internal_responsible_id === r.id)
        )
        .map((r) => ({ value: r.id, label: r.full_name }));
      setSelectedInternals(seleccionados);
    }
  };

  // ===============================
  // HANDLERS
  // ===============================
  const handleTipoChange = (tipo: string) => {
    if (tipoSeleccionados.includes(tipo)) {
      setTipoSeleccionados(tipoSeleccionados.filter((t) => t !== tipo));
    } else {
      setTipoSeleccionados([...tipoSeleccionados, tipo]);
    }
  };

  const handleAreaChange = (id: string) => {
    if (areasSeleccionadas.includes(id)) {
      setAreasSeleccionadas(areasSeleccionadas.filter((a) => a !== id));
    } else {
      setAreasSeleccionadas([...areasSeleccionadas, id]);
    }
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

    const convenioNormalizado = tipoConvenio
      .toLowerCase()
      .includes("marco")
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

    let agreementId: string | undefined;
    let error = null;

    if (existingAgreement) {
      const { error: updateError } = await supabase
        .from("agreements")
        .update(dataToSave)
        .eq("id", existingAgreement.id);
      agreementId = existingAgreement.id;
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from("agreements")
        .insert([dataToSave])
        .select("id")
        .single();
      agreementId = data?.id;
      error = insertError;
    }

    if (error) {
      console.error(error);
      alert("❌ Error al guardar el convenio: " + error.message);
      return;
    }

    if (agreementId) {
      // Guardar áreas vinculadas
      await supabase
        .from("agreement_areas_vinculadas")
        .delete()
        .eq("agreement_id", agreementId);
      const registrosAreas = areasSeleccionadas.map((areaId) => ({
        agreement_id: agreementId,
        area_vinculada_id: areaId,
      }));
      if (registrosAreas.length > 0)
        await supabase.from("agreement_areas_vinculadas").insert(registrosAreas);

      // Guardar responsables internos
      await supabase
        .from("agreement_internal_responsibles")
        .delete()
        .eq("agreement_id", agreementId);
      const registrosInternos = selectedInternals.map((r) => ({
        agreement_id: agreementId,
        internal_responsible_id: r.value,
      }));
      if (registrosInternos.length > 0)
        await supabase
          .from("agreement_internal_responsibles")
          .insert(registrosInternos);
    }

    alert("✅ Convenio guardado correctamente");
    onSave();
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="container mt-5" style={{ maxWidth: "850px" }}>
      <div className="card shadow-lg p-4 border-0" style={{ borderRadius: "16px" }}>
        <h3 className="mb-4 text-center text-primary fw-bold">
          {existingAgreement ? "✏️ Editar Convenio" : "Registrar Nuevo Convenio"}
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <div className="mb-3">
            <label>Nombre del convenio</label>
            <input
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Responsables */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label>Responsables Internos (uno o más)</label>
              <Select
                isMulti
                options={internalResponsibles.map((p) => ({
                  value: p.id,
                  label: p.full_name,
                }))}
                value={selectedInternals}
                onChange={(selected) => setSelectedInternals(selected || [])}
                placeholder="Buscar y seleccionar responsables..."
              />
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
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha, duración y tipo */}
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

          {/* Resolución rectoral */}
          <div className="mb-3">
            <label>Resolución Rectoral</label>
            <input
              className="form-control"
              value={resolucion}
              onChange={(e) => setResolucion(e.target.value)}
              placeholder="Ingrese número de resolución"
            />
          </div>

          {/* País */}
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

          {/* Tipos de convenio */}
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

          {/* Subtipo docente */}
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

          {/* Objetivos */}
          <div className="mb-4">
            <label>Objetivos del convenio</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Describa los principales objetivos del convenio..."
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value)}
            />
          </div>

          {/* Áreas vinculadas */}
          <div className="mb-4">
            <label>Áreas vinculadas</label>
            <div className="border rounded p-3 bg-light">
              {areas.length > 0 ? (
                areas.map((area) => (
                  <label key={area.id} className="me-3">
                    <input
                      type="checkbox"
                      checked={areasSeleccionadas.includes(area.id)}
                      onChange={() => handleAreaChange(area.id)}
                      className="me-1"
                    />
                    {area.nombre}
                  </label>
                ))
              ) : (
                <p className="text-muted">No hay áreas registradas</p>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-secondary me-3"
              onClick={onCancel}
            >
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



















