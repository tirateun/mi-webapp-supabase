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
  const [objetivos, setObjetivos] = useState(existingAgreement?.objetivos || "");
  const [tipoSeleccionados, setTipoSeleccionados] = useState<string[]>(existingAgreement?.tipo_convenio || []);
  const [subTipoDocente, setSubTipoDocente] = useState(existingAgreement?.sub_tipo_docente || "");

  const [internos, setInternos] = useState<any[]>([]);
  const [externos, setExternos] = useState<any[]>([]);
  const [paises, setPaises] = useState<string[]>([]);

  // ✅ NUEVO: Áreas vinculadas
  const [areas, setAreas] = useState<any[]>([]);
  const [areasSeleccionadas, setAreasSeleccionadas] = useState<string[]>([]);

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
    fetchAreasVinculadas();
    if (existingAgreement) fetchAreasAsociadas(existingAgreement.id);
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
      const nombres = data.map((p: any) => p?.name?.common).filter(Boolean).sort((a: string, b: string) => a.localeCompare(b, "es"));
      setPaises(nombres);
    } catch {
      setPaises(["Perú", "Argentina", "Chile", "Colombia", "México", "Brasil", "Ecuador", "España", "Estados Unidos", "Canadá"]);
    }
  };

  // ✅ Cargar catálogo de áreas vinculadas
  const fetchAreasVinculadas = async () => {
    const { data, error } = await supabase.from("areas_vinculadas").select("id, nombre");
    if (!error && data) setAreas(data);
  };

  // ✅ Cargar áreas asociadas al editar un convenio
  const fetchAreasAsociadas = async (agreementId: string) => {
    const { data, error } = await supabase
      .from("agreement_areas_vinculadas")
      .select("area_vinculada_id")
      .eq("agreement_id", agreementId);
    if (!error && data) setAreasSeleccionadas(data.map((d) => d.area_vinculada_id));
  };

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

    // 🧰 Verificación de usuario
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      alert("❌ No se pudo verificar el usuario autenticado.");
      return;
    }

    const user = userData.user;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

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
      internal_responsible: internalResponsible,
      external_responsible: externalResponsible,
      signature_date: signatureDate,
      duration_years: durationYears,
      convenio: convenioNormalizado,
      pais,
      "Resolución Rectoral": resolucion,
      tipo_convenio: tipoSeleccionados,
      objetivos,
      sub_tipo_docente: tipoSeleccionados.includes("Docente Asistencial") ? subTipoDocente : null,
    };

    let agreementId: string | null = null;
    let error = null;

    if (existingAgreement) {
      const { error: updateError } = await supabase.from("agreements").update(dataToSave).eq("id", existingAgreement.id);
      error = updateError;
      agreementId = existingAgreement.id;
    } else {
      const { data: inserted, error: insertError } = await supabase.from("agreements").insert([dataToSave]).select().single();
      error = insertError;
      agreementId = inserted?.id || null;
    }

    if (error) {
      console.error(error);
      alert("❌ Error al guardar el convenio: " + error.message);
      return;
    }

    // ✅ Guardar las áreas vinculadas
    if (agreementId) {
      // Eliminamos las áreas previas (en edición)
      await supabase.from("agreement_areas_vinculadas").delete().eq("agreement_id", agreementId);
      // Insertamos las nuevas
      if (areasSeleccionadas.length > 0) {
        const { error: areasError } = await supabase.from("agreement_areas_vinculadas").insert(
          areasSeleccionadas.map((areaId) => ({
            agreement_id: agreementId,
            area_vinculada_id: areaId,
          }))
        );
        if (areasError) console.error("⚠️ Error guardando áreas vinculadas:", areasError);
      }
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
          {/* ...todos los campos previos sin cambios... */}

          {/* ✅ NUEVA SECCIÓN: ÁREAS VINCULADAS */}
          <div className="mb-4">
            <label>Áreas vinculadas</label>
            <div className="border rounded p-3 bg-light">
              {areas.map((a) => (
                <label key={a.id} className="me-3">
                  <input
                    type="checkbox"
                    checked={areasSeleccionadas.includes(a.id)}
                    onChange={() => handleAreaChange(a.id)}
                    className="me-1"
                  />
                  {a.nombre}
                </label>
              ))}
            </div>
          </div>

          {/* BOTONES */}
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


















