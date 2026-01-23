// src/AgreementsForm.tsx
// Versión completa: Institución, múltiples subtipos docentes con responsables por subtipo
// ACTUALIZADO: Áreas vinculadas con react-select multiselect con buscador
import React, { useEffect, useMemo, useState } from "react";
import Select, { MultiValue } from "react-select";
import { supabase } from "./supabaseClient";
import generateYearsIfNeeded from "./utils/generateYearsIfNeeded";
import { recalculateAgreementYears } from "./utils/recalculateAgreementYears";

interface Option {
  value: string | number;
  label: string;
}

interface SubtipoConResponsables {
  subtipo: string;
  responsables: Option[];
}

export default function AgreementsForm({ existingAgreement, onSave, onCancel }: any) {
  const [loading, setLoading] = useState(false);

  // Campos básicos
  const [name, setName] = useState<string>(existingAgreement?.name || "");
  const [institucionId, setInstitucionId] = useState<string>(existingAgreement?.institucion_id || "");
  const [documentLink, setDocumentLink] = useState<string>(existingAgreement?.document_url || "");
  const [signatureDate, setSignatureDate] = useState<string>(existingAgreement?.signature_date || "");
  const [expirationDate, setExpirationDate] = useState<string>(existingAgreement?.expiration_date || "");
  const [durationYears, setDurationYears] = useState<number | string>(existingAgreement?.duration_years ?? "");

  // Calcular duración cuando cambien las fechas
  const handleExpirationDateChange = (newDate: string) => {
    setExpirationDate(newDate);
    
    if (signatureDate && newDate) {
      // Parsear fechas manualmente para evitar problemas de zona horaria
      const [yearI, monthI, dayI] = signatureDate.split('-').map(Number);
      const [yearF, monthF, dayF] = newDate.split('-').map(Number);
      
      const inicio = new Date(yearI, monthI - 1, dayI);
      const termino = new Date(yearF, monthF - 1, dayF);
      
      // Sumar 1 día para incluir el día de vencimiento como completo
      const diffMs = termino.getTime() - inicio.getTime() + (1000 * 60 * 60 * 24);
      const diffAnios = diffMs / (1000 * 60 * 60 * 24 * 365.25);
      
      if (diffAnios > 0) {
        // Redondear a 1 decimal, pero si está muy cerca de un entero, usar el entero
        let duracionCalculada = Math.round(diffAnios * 10) / 10;
        const parteDecimal = duracionCalculada % 1;
        if (parteDecimal >= 0.95 || parteDecimal <= 0.05) {
          duracionCalculada = Math.round(duracionCalculada);
        }
        setDurationYears(duracionCalculada);
      }
    }
  };

  // Calcular fecha de vencimiento cuando cambie la duración
  const handleDurationChange = (newDuration: string) => {
    setDurationYears(newDuration);
    
    if (signatureDate && newDuration && newDuration !== "") {
      // Usar formato local para evitar problemas de zona horaria
      const [year, month, day] = signatureDate.split('-').map(Number);
      const inicio = new Date(year, month - 1, day); // mes es 0-indexed
      
      const años = Math.floor(Number(newDuration));
      const mesesRestantes = Math.round((Number(newDuration) - años) * 12);
      
      const termino = new Date(inicio);
      termino.setFullYear(termino.getFullYear() + años);
      termino.setMonth(termino.getMonth() + mesesRestantes);
      
      // Restar 1 día para obtener el último día del periodo
      termino.setDate(termino.getDate() - 1);
      
      // Formatear a YYYY-MM-DD
      const yearStr = termino.getFullYear();
      const monthStr = String(termino.getMonth() + 1).padStart(2, '0');
      const dayStr = String(termino.getDate()).padStart(2, '0');
      
      setExpirationDate(`${yearStr}-${monthStr}-${dayStr}`);
    }
  };

  // Recalcular cuando cambie fecha de inicio
  const handleSignatureDateChange = (newDate: string) => {
    setSignatureDate(newDate);
    
    // Si hay duración, recalcular fecha de vencimiento
    if (newDate && durationYears && durationYears !== "") {
      const [year, month, day] = newDate.split('-').map(Number);
      const inicio = new Date(year, month - 1, day);
      
      const años = Math.floor(Number(durationYears));
      const mesesRestantes = Math.round((Number(durationYears) - años) * 12);
      
      const termino = new Date(inicio);
      termino.setFullYear(termino.getFullYear() + años);
      termino.setMonth(termino.getMonth() + mesesRestantes);
      termino.setDate(termino.getDate() - 1);
      
      const yearStr = termino.getFullYear();
      const monthStr = String(termino.getMonth() + 1).padStart(2, '0');
      const dayStr = String(termino.getDate()).padStart(2, '0');
      
      setExpirationDate(`${yearStr}-${monthStr}-${dayStr}`);
    }
  };
  const [tipoConvenio, setTipoConvenio] = useState<string>(existingAgreement?.convenio || "marco");
  const [resolucion, setResolucion] = useState<string>(existingAgreement?.["Resolución Rectoral"] || existingAgreement?.resolucion || "");
  const [objetivos, setObjetivos] = useState<string>(existingAgreement?.objetivos || "");
  const [tipoSeleccionados, setTipoSeleccionados] = useState<string[]>(existingAgreement?.tipo_convenio || existingAgreement?.tipos || []);

  // Estados para listas
  const [internos, setInternos] = useState<any[]>([]);
  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [contactoInstitucion, setContactoInstitucion] = useState<any>(null);
  
  // Responsables para convenios NO docente-asistenciales
  const [selectedInternals, setSelectedInternals] = useState<Option[]>(() => {
    if (!existingAgreement) return [];
    const list = existingAgreement.internal_responsibles || existingAgreement.internals || [];
    if (!Array.isArray(list)) return [];
    return list.map((i: any) => (i?.id && i?.full_name ? { value: i.id, label: i.full_name } : { value: String(i), label: String(i) }));
  });

  // 🆕 Subtipos docentes con responsables por cada uno
  const [subtiposConResponsables, setSubtiposConResponsables] = useState<SubtipoConResponsables[]>([]);

  const [areas, setAreas] = useState<any[]>([]);
  
  // ✅ ACTUALIZADO: Áreas seleccionadas ahora usa Option[] para react-select
  const [areasSeleccionadas, setAreasSeleccionadas] = useState<Option[]>([]);

  const [areaId, setAreaId] = useState<number | null>(existingAgreement?.area_vinculada_id ?? null);
  const [convenioMaestroId, setConvenioMaestroId] = useState<number | null>(existingAgreement?.convenio_maestro_id ?? null);
  const [version, setVersion] = useState<number>(existingAgreement?.version ?? 1);
  const [estado, setEstado] = useState<string>(existingAgreement?.estado ?? "ACTIVO");

  const tipos = useMemo(
    () => [
      "Docente Asistencial",
      "Cooperación técnica",
      "Movilidad académica",
      "Investigación",
      "Colaboración académica",
      "Consultoría",
      "Cotutela",
    ],
    []
  );

  const subTiposDocente = useMemo(
    () => [
      "PREGRADO - NACIONALES",
      "POSTGRADO RESIDENTADO EN ENFERMERÍA - NACIONALES CONAREN",
      "POSTGRADO 2DA ESP. EN ENFERMERÍA NO RESIDENTADO - NACIONALES",
      "POSTGRADO RESIDENTADO MÉDICO - CONAREME",
      "POSTGRADO 2DA ESPECIALIDAD NUTRICIÓN PALIATIVA",
    ],
    []
  );

  const incluyeDocenteAsistencial = tipoSeleccionados.includes("Docente Asistencial");

  useEffect(() => {
    fetchEnumsAndLists();
  }, []);

  useEffect(() => {
    if (existingAgreement?.version) {
      setVersion(existingAgreement.version);
    }
  }, [existingAgreement]);

  useEffect(() => {
    if (!existingAgreement?.id) return;
    if (internos.length > 0) {
      fetchResponsablesInternos(existingAgreement.id);
      fetchSubtiposConResponsables(existingAgreement.id);
    }
  }, [internos, existingAgreement]);

  // ✅ NUEVO: Cargar áreas seleccionadas cuando se edita un convenio existente
  useEffect(() => {
    if (!existingAgreement?.id || areas.length === 0) return;
    fetchAreasVinculadas(existingAgreement.id);
  }, [areas, existingAgreement]);

  async function fetchEnumsAndLists() {
    try {
      const [{ data: internosData }, { data: institucionesData }, { data: areasData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role").eq("role", "internal"),
        supabase.from("instituciones").select("id, nombre, contacto, email, telefono, cargo, pais").order("nombre"),
        supabase.from("areas_vinculadas").select("id, nombre").order("nombre"),
      ]);

      setInternos(internosData || []);
      setInstituciones(institucionesData || []);
      setAreas(areasData || []);

      // Si es edición y hay institución, cargar contacto
      if (existingAgreement?.institucion_id && institucionesData) {
        const inst = institucionesData.find((i: any) => i.id === existingAgreement.institucion_id);
        if (inst) {
          setContactoInstitucion(inst);
        }
      }

      if (existingAgreement?.internal_responsibles && (!selectedInternals || selectedInternals.length === 0)) {
        const mapped = (existingAgreement.internal_responsibles || []).map((p: any) => ({ value: p.id, label: p.full_name }));
        setSelectedInternals(mapped);
      }
    } catch (err) {
      console.error("Error cargando listas:", err);
    }
  }

  // ✅ NUEVO: Función para cargar áreas vinculadas del convenio existente
  async function fetchAreasVinculadas(agreementId: string) {
    try {
      const { data, error } = await supabase
        .from("agreement_areas_vinculadas")
        .select("area_vinculada_id")
        .eq("agreement_id", agreementId);

      if (error) throw error;

      if (data && data.length > 0) {
        const areaIds = data.map((r: any) => r.area_vinculada_id);
        const seleccionadas = areas
          .filter((a) => areaIds.includes(a.id))
          .map((a) => ({ value: a.id, label: a.nombre }));
        setAreasSeleccionadas(seleccionadas);
      }
    } catch (err) {
      console.error("Error fetchAreasVinculadas:", err);
    }
  }

  async function fetchResponsablesInternos(agreementId: string) {
    try {
      const { data } = await supabase.from("agreement_internal_responsibles").select("internal_responsible_id").eq("agreement_id", agreementId);
      const ids = (data || []).map((r: any) => r.internal_responsible_id);
      const seleccionados = internos.filter((i) => ids.includes(i.id)).map((i) => ({ value: i.id, label: i.full_name }));
      setSelectedInternals(seleccionados);
    } catch (err) {
      console.error("Error fetchResponsablesInternos:", err);
    }
  }

  async function fetchSubtiposConResponsables(agreementId: string) {
    try {
      // Obtener subtipos del convenio
      const { data: subtypes } = await supabase
        .from("agreement_subtypes")
        .select("id, subtipo_nombre")
        .eq("agreement_id", agreementId);

      if (!subtypes || subtypes.length === 0) return;

      // Para cada subtipo, obtener sus responsables
      const subtiposData: SubtipoConResponsables[] = [];

      for (const subtype of subtypes) {
        const { data: responsables } = await supabase
          .from("subtype_internal_responsibles")
          .select("internal_responsible_id")
          .eq("subtype_id", subtype.id);

        const responsableIds = (responsables || []).map((r: any) => r.internal_responsible_id);
        const responsablesOptions = internos
          .filter((i) => responsableIds.includes(i.id))
          .map((i) => ({ value: i.id, label: i.full_name }));

        subtiposData.push({
          subtipo: subtype.subtipo_nombre,
          responsables: responsablesOptions,
        });
      }

      setSubtiposConResponsables(subtiposData);
    } catch (err) {
      console.error("Error fetchSubtiposConResponsables:", err);
    }
  }

  const toggleTipo = (t: string) => setTipoSeleccionados((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  // 🆕 Agregar nuevo subtipo
  const agregarSubtipo = (subtipo: string) => {
    if (!subtiposConResponsables.find((s) => s.subtipo === subtipo)) {
      setSubtiposConResponsables([...subtiposConResponsables, { subtipo, responsables: [] }]);
    }
  };

  // 🆕 Eliminar subtipo
  const eliminarSubtipo = (subtipo: string) => {
    setSubtiposConResponsables(subtiposConResponsables.filter((s) => s.subtipo !== subtipo));
  };

  // 🆕 Actualizar responsables de un subtipo
  const actualizarResponsablesSubtipo = (subtipo: string, responsables: Option[]) => {
    setSubtiposConResponsables(
      subtiposConResponsables.map((s) => (s.subtipo === subtipo ? { ...s, responsables } : s))
    );
  };

  const toYMD = (v: any): string | null => {
    if (!v) return null;
    if (typeof v === "string") return v.length >= 10 ? v.slice(0, 10) : v;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    try {
      const s = String(v);
      return s.length >= 10 ? s.slice(0, 10) : s;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        name,
        institucion_id: institucionId || null,
        document_url: documentLink || null,
        signature_date: toYMD(signatureDate) ?? null,
        duration_years: durationYears ?? null,
        convenio: tipoConvenio,
        pais: contactoInstitucion?.pais || null,
        "Resolución Rectoral": resolucion || null,
        tipo_convenio: tipoSeleccionados || null,
        objetivos: objetivos || null,
        area_vinculada_id: areaId ?? null,
        convenio_maestro_id: convenioMaestroId ?? null,
        version,
        estado,
        updated_at: new Date().toISOString(),
      };

      let agreementId: string | undefined = existingAgreement?.id;

      if (existingAgreement?.id) {
        const { error } = await supabase.from("agreements").update(payload).eq("id", existingAgreement.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("agreements").insert(payload).select("id").single();
        if (error) throw error;
        agreementId = data?.id;
      }

      if (!agreementId) throw new Error("No se obtuvo ID del convenio guardado.");

      // Sincronizar responsables internos (para convenios NO docente-asistenciales)
      if (!incluyeDocenteAsistencial) {
        const internalIds = (selectedInternals || []).map((s) => s.value);
        await supabase.from("agreement_internal_responsibles").delete().eq("agreement_id", agreementId);
        if (internalIds.length > 0) {
          const toInsert = internalIds.map((pid: any) => ({ agreement_id: agreementId, internal_responsible_id: pid }));
          const { error } = await supabase.from("agreement_internal_responsibles").insert(toInsert);
          if (error) throw error;
        }
      }

      // 🆕 Sincronizar subtipos con responsables (para docente-asistencial)
      if (incluyeDocenteAsistencial && subtiposConResponsables.length > 0) {
        // Eliminar subtipos existentes
        await supabase.from("agreement_subtypes").delete().eq("agreement_id", agreementId);

        // Insertar nuevos subtipos y sus responsables
        for (const item of subtiposConResponsables) {
          // Insertar subtipo
          const { data: subtypeData, error: subtypeError } = await supabase
            .from("agreement_subtypes")
            .insert([{ agreement_id: agreementId, subtipo_nombre: item.subtipo }])
            .select("id")
            .single();

          if (subtypeError) throw subtypeError;

          const subtypeId = subtypeData.id;

          // Insertar responsables del subtipo
          if (item.responsables.length > 0) {
            const responsablesToInsert = item.responsables.map((r) => ({
              subtype_id: subtypeId,
              internal_responsible_id: r.value,
            }));

            const { error: responsablesError } = await supabase
              .from("subtype_internal_responsibles")
              .insert(responsablesToInsert);

            if (responsablesError) throw responsablesError;
          }
        }
      }

      // ✅ ACTUALIZADO: Sincronizar áreas vinculadas usando el nuevo formato Option[]
      await supabase.from("agreement_areas_vinculadas").delete().eq("agreement_id", agreementId);
      if (areasSeleccionadas && areasSeleccionadas.length > 0) {
        const areaPayload = areasSeleccionadas.map((a: Option) => ({ 
          agreement_id: agreementId, 
          area_vinculada_id: a.value 
        }));
        const { error } = await supabase.from("agreement_areas_vinculadas").insert(areaPayload);
        if (error) throw error;
      }

      // Recuperar agreement row
      const { data: agreementRow, error: agreementRowErr } = await supabase
        .from("agreements")
        .select("id, signature_date, expiration_date, duration_years")
        .eq("id", agreementId)
        .single();

      if (agreementRowErr) {
        console.error("No se pudo recuperar convenio para generar años:", agreementRowErr);
      } else {
        const durationFinal = Number(agreementRow.duration_years ?? durationYears ?? 0);
        const signatureFinal = toYMD(agreementRow.signature_date) ?? toYMD(signatureDate) ?? null;
        const expirationFinal = toYMD(agreementRow.expiration_date) ?? null;

        if (existingAgreement?.id && signatureFinal) {
          console.log("🔄 Recalculando años existentes...");
          await recalculateAgreementYears(agreementId, signatureFinal, durationFinal);
        }

        console.log("📅 Generando años faltantes si es necesario...");
        await generateYearsIfNeeded(agreementId, signatureFinal, expirationFinal, durationFinal);
      }

      alert("✅ Convenio guardado correctamente");
      onSave && onSave();
    } catch (err: any) {
      console.error("Error guardar convenio:", err);
      alert("❌ Error al guardar el convenio: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: 900 }}>
      <div className="card shadow-sm p-4" style={{ borderRadius: 12 }}>
        <h3 className="text-center mb-3 text-primary fw-bold">
          {existingAgreement ? "✏️ Editar Convenio" : "➕ Nuevo Convenio"}
        </h3>

        <form onSubmit={handleSubmit}>
          {/* NOMBRE */}
          <div className="mb-3">
            <label className="form-label">Nombre del convenio</label>
            <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {/* INSTITUCIÓN ASOCIADA */}
          <div className="mb-3">
            <label className="form-label">Institución Asociada *</label>
            <Select
              options={instituciones.map((inst) => ({ value: inst.id, label: inst.nombre }))}
              value={institucionId ? { value: institucionId, label: instituciones.find(i => i.id === institucionId)?.nombre || "" } : null}
              onChange={(option) => {
                setInstitucionId(option?.value || "");
                if (option?.value) {
                  const inst = instituciones.find(i => i.id === option.value);
                  setContactoInstitucion(inst || null);
                } else {
                  setContactoInstitucion(null);
                }
              }}
              placeholder="Buscar institución por nombre o país..."
              noOptionsMessage={() => "No se encontraron instituciones"}
              isDisabled={instituciones.length === 0}
              isClearable
            />
            {instituciones.length === 0 && (
              <small className="text-muted">Cargando instituciones...</small>
            )}
          </div>

          {/* CONTACTO DE LA INSTITUCIÓN */}
          {contactoInstitucion && (
            <div className="mb-3 p-3 border rounded bg-light">
              <h6 className="text-secondary mb-2">🏛️ Información de la Institución</h6>
              
              <div className="mb-2">
                <strong>País:</strong> <span className="badge bg-primary">{contactoInstitucion.pais || "No especificado"}</span>
              </div>
              
              <h6 className="text-secondary mb-2 mt-3">📞 Contacto</h6>
              <div className="row">
                <div className="col-md-6">
                  <strong>Nombre:</strong> {contactoInstitucion.contacto || "No especificado"}
                </div>
                {contactoInstitucion.cargo && (
                  <div className="col-md-6">
                    <strong>Cargo:</strong> {contactoInstitucion.cargo}
                  </div>
                )}
              </div>
              <div className="row mt-2">
                {contactoInstitucion.email && (
                  <div className="col-md-6">
                    <strong>Email:</strong> <a href={`mailto:${contactoInstitucion.email}`}>{contactoInstitucion.email}</a>
                  </div>
                )}
                {contactoInstitucion.telefono && (
                  <div className="col-md-6">
                    <strong>Teléfono:</strong> {contactoInstitucion.telefono}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ENLACE AL DOCUMENTO */}
          <div className="mb-3">
            <label className="form-label">Enlace al documento del convenio (opcional)</label>
            <input 
              type="url"
              className="form-control" 
              value={documentLink} 
              onChange={(e) => setDocumentLink(e.target.value)}
              placeholder="https://drive.google.com/... o https://..."
            />
            <small className="text-muted">
              Pega aquí el enlace donde está almacenado el documento (Google Drive, OneDrive, etc.)
            </small>
          </div>

          {/* FECHA, DURACIÓN, TIPO */}
          <div className="row">
            <div className="col-md-3 mb-3">
              <label className="form-label">Fecha de inicio *</label>
              <input 
                type="date" 
                className="form-control" 
                value={signatureDate || ""} 
                onChange={(e) => handleSignatureDateChange(e.target.value)}
                required
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Fecha de vencimiento</label>
              <input 
                type="date" 
                className="form-control" 
                value={expirationDate || ""} 
                onChange={(e) => handleExpirationDateChange(e.target.value)}
              />
              <small className="text-muted">O llena duración para calcular automáticamente</small>
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Duración (años)</label>
              <input 
                type="number"
                step="0.1"
                min="0.1"
                max="99"
                className="form-control" 
                value={durationYears} 
                onChange={(e) => handleDurationChange(e.target.value)}
                placeholder="Ej: 1, 1.5, 2"
              />
              <small className="text-muted">O llena fecha de vencimiento para calcular</small>
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Tipo de convenio</label>
              <select className="form-select" value={tipoConvenio} onChange={(e) => setTipoConvenio(e.target.value)}>
                <option value="marco">Marco</option>
                <option value="específico">Específico</option>
              </select>
            </div>
          </div>

          {/* RESOLUCIÓN */}
          <div className="mb-3">
            <label className="form-label">Resolución Rectoral</label>
            <input className="form-control" value={resolucion} onChange={(e) => setResolucion(e.target.value)} placeholder="Nº de resolución" />
          </div>

          {/* TIPOS DE CONVENIO */}
          <div className="mb-3">
            <label className="form-label fw-bold">Tipos de convenio *</label>
            <div className="border rounded p-3 bg-light">
              {tipos.map((t) => (
                <label key={t} className="me-3 d-block mb-2">
                  <input 
                    type="checkbox" 
                    checked={tipoSeleccionados.includes(t)} 
                    onChange={() => toggleTipo(t)} 
                    className="me-2" 
                  />
                  {t}
                </label>
              ))}
            </div>
            {tipoSeleccionados.length === 0 && (
              <small className="text-danger">* Debe seleccionar al menos un tipo de convenio</small>
            )}
          </div>

          {/* 🆕 SI INCLUYE "Docente Asistencial" → Subtipos con responsables */}
          {incluyeDocenteAsistencial && (
            <div className="mb-3 p-3 border border-primary rounded bg-light">
              <h5 className="text-primary mb-3">📚 Configuración Docente Asistencial</h5>
              
              {/* Selector para agregar subtipos */}
              <div className="mb-3">
                <label className="form-label">Agregar Subtipo Docente</label>
                <select 
                  className="form-select" 
                  onChange={(e) => {
                    if (e.target.value) {
                      agregarSubtipo(e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">Seleccione un subtipo para agregar...</option>
                  {subTiposDocente
                    .filter((s) => !subtiposConResponsables.find((sc) => sc.subtipo === s))
                    .map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                </select>
              </div>

              {/* Lista de subtipos con sus responsables */}
              {subtiposConResponsables.length > 0 ? (
                <div className="mt-3">
                  {subtiposConResponsables.map((item, index) => (
                    <div key={index} className="card mb-3">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <strong>📋 {item.subtipo}</strong>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => eliminarSubtipo(item.subtipo)}
                        >
                          ❌ Eliminar
                        </button>
                      </div>
                      <div className="card-body">
                        <label className="form-label">Responsables Internos</label>
                        <Select
                          isMulti
                          options={internos.map((p) => ({ value: p.id, label: p.full_name }))}
                          value={item.responsables}
                          onChange={(val: MultiValue<Option>) =>
                            actualizarResponsablesSubtipo(item.subtipo, Array.isArray(val) ? (val as Option[]) : [])
                          }
                          placeholder="Buscar y seleccionar responsables..."
                          noOptionsMessage={() => "No hay responsables"}
                          isDisabled={internos.length === 0}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info">
                  <strong>ℹ️ No hay subtipos agregados.</strong> Selecciona un subtipo del menú desplegable arriba para comenzar.
                </div>
              )}
            </div>
          )}

          {/* SI NO INCLUYE "Docente Asistencial" → Responsables normales */}
          {tipoSeleccionados.length > 0 && !incluyeDocenteAsistencial && (
            <div className="mb-3">
              <h5 className="mb-3">👥 Responsables Internos</h5>
              <div className="mb-3">
                <label className="form-label">Responsables Internos</label>
                <Select
                  isMulti
                  options={internos.map((p) => ({ value: p.id, label: p.full_name }))}
                  value={selectedInternals as any}
                  onChange={(val: MultiValue<Option>) => setSelectedInternals(Array.isArray(val) ? (val as Option[]) : [])}
                  placeholder="Buscar y seleccionar..."
                  noOptionsMessage={() => "No hay responsables"}
                  isDisabled={internos.length === 0}
                />
              </div>
            </div>
          )}

          {/* OBJETIVOS */}
          <div className="mb-3">
            <label className="form-label">Objetivos</label>
            <textarea 
              className="form-control" 
              rows={3} 
              value={objetivos} 
              onChange={(e) => setObjetivos(e.target.value)} 
              placeholder="Describa los objetivos principales" 
            />
          </div>

          {/* ✅ ACTUALIZADO: ÁREAS VINCULADAS CON REACT-SELECT MULTISELECT */}
          <div className="mb-3">
            <label className="form-label">Áreas vinculadas</label>
            <Select
              isMulti
              options={areas.map((area) => ({ value: area.id, label: area.nombre }))}
              value={areasSeleccionadas}
              onChange={(val: MultiValue<Option>) => 
                setAreasSeleccionadas(Array.isArray(val) ? (val as Option[]) : [])
              }
              placeholder="Buscar y seleccionar áreas..."
              noOptionsMessage={() => "No hay áreas disponibles"}
              isDisabled={areas.length === 0}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '42px',
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: '#e7f1ff',
                  borderRadius: '4px',
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: '#0d6efd',
                  fontWeight: 500,
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: '#0d6efd',
                  ':hover': {
                    backgroundColor: '#0d6efd',
                    color: 'white',
                  },
                }),
              }}
            />
            {areas.length === 0 && (
              <small className="text-muted">Cargando áreas...</small>
            )}
            {areasSeleccionadas.length > 0 && (
              <small className="text-muted">
                {areasSeleccionadas.length} área(s) seleccionada(s)
              </small>
            )}
          </div>

          {/* BOTONES */}
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || tipoSeleccionados.length === 0}>
              {loading ? "Guardando..." : "Guardar Convenio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}