// src/AgreementsForm.tsx
// Versión reorganizada: Tipos de convenio primero, luego lógica condicional de responsables
import React, { useEffect, useMemo, useState } from "react";
import Select, { MultiValue } from "react-select";
import { supabase } from "./supabaseClient";
import generateYearsIfNeeded from "./utils/generateYearsIfNeeded";
import { recalculateAgreementYears } from "./utils/recalculateAgreementYears";

interface Option {
  value: string | number;
  label: string;
}

export default function AgreementsForm({ existingAgreement, onSave, onCancel }: any) {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState<string>(existingAgreement?.name || "");
  const [signatureDate, setSignatureDate] = useState<string>(existingAgreement?.signature_date || "");
  const [durationYears, setDurationYears] = useState<number>(existingAgreement?.duration_years ?? 1);
  const [tipoConvenio, setTipoConvenio] = useState<string>(existingAgreement?.convenio || "marco");
  const [resolucion, setResolucion] = useState<string>(existingAgreement?.["Resolución Rectoral"] || existingAgreement?.resolucion || "");
  const [pais, setPais] = useState<string>(existingAgreement?.pais || "");
  const [objetivos, setObjetivos] = useState<string>(existingAgreement?.objetivos || "");
  const [tipoSeleccionados, setTipoSeleccionados] = useState<string[]>(existingAgreement?.tipo_convenio || existingAgreement?.tipos || []);
  const [subTipoDocente, setSubTipoDocente] = useState<string>(existingAgreement?.sub_tipo_docente || existingAgreement?.subtipo_docente || "");

  const [internos, setInternos] = useState<any[]>([]);
  const [externos, setExternos] = useState<any[]>([]);
  const [selectedInternals, setSelectedInternals] = useState<Option[]>(() => {
    if (!existingAgreement) return [];
    const list = existingAgreement.internal_responsibles || existingAgreement.internals || [];
    if (!Array.isArray(list)) return [];
    return list.map((i: any) => (i?.id && i?.full_name ? { value: i.id, label: i.full_name } : { value: String(i), label: String(i) }));
  });
  const [externalResponsible, setExternalResponsible] = useState<string>(String(existingAgreement?.external_responsible || ""));

  const [areas, setAreas] = useState<any[]>([]);
  const [areasSeleccionadas, setAreasSeleccionadas] = useState<any[]>(existingAgreement?.areasSeleccionadas || existingAgreement?.areas || []);

  const [areaId, setAreaId] = useState<number | null>(existingAgreement?.area_vinculada_id ?? null);
  const [convenioMaestroId, setConvenioMaestroId] = useState<number | null>(existingAgreement?.convenio_maestro_id ?? null);
  const [version, setVersion] = useState<number>(existingAgreement?.version ?? 1);
  const [estado, setEstado] = useState<string>(existingAgreement?.estado ?? "ACTIVO");

  const [paises, setPaises] = useState<string[]>(["Perú", "Argentina", "Chile", "Colombia", "México", "Brasil", "España"]);

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

  // 🆕 Verificar si incluye "Docente Asistencial"
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
    if (internos.length > 0) fetchResponsablesInternos(existingAgreement.id);
  }, [internos, existingAgreement]);

  async function fetchEnumsAndLists() {
    try {
      const [{ data: internosData }, { data: externosData }, { data: areasData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role").eq("role", "internal"),
        supabase.from("profiles").select("id, full_name, role").eq("role", "external"),
        supabase.from("areas_vinculadas").select("id, nombre"),
      ]);

      setInternos(internosData || []);
      setExternos(externosData || []);
      setAreas(areasData || []);

      if (existingAgreement?.internal_responsibles && (!selectedInternals || selectedInternals.length === 0)) {
        const mapped = (existingAgreement.internal_responsibles || []).map((p: any) => ({ value: p.id, label: p.full_name }));
        setSelectedInternals(mapped);
      }
    } catch (err) {
      console.error("Error cargando listas:", err);
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

  const toggleTipo = (t: string) => setTipoSeleccionados((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const handleAreaChange = (id: any) => setAreasSeleccionadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

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
        signature_date: toYMD(signatureDate) ?? null,
        duration_years: durationYears ?? null,
        convenio: tipoConvenio,
        pais: pais || null,
        "Resolución Rectoral": resolucion || null,
        tipo_convenio: tipoSeleccionados || null,
        objetivos: objetivos || null,
        sub_tipo_docente: incluyeDocenteAsistencial ? subTipoDocente || null : null,
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

      // Sincronizar responsables internos
      const internalIds = (selectedInternals || []).map((s) => s.value);
      await supabase.from("agreement_internal_responsibles").delete().eq("agreement_id", agreementId);
      if (internalIds.length > 0) {
        const toInsert = internalIds.map((pid: any) => ({ agreement_id: agreementId, internal_responsible_id: pid }));
        const { error } = await supabase.from("agreement_internal_responsibles").insert(toInsert);
        if (error) throw error;
      }

      // Sincronizar areas vinculadas
      await supabase.from("agreement_areas_vinculadas").delete().eq("agreement_id", agreementId);
      if (areasSeleccionadas && areasSeleccionadas.length > 0) {
        const areaPayload = areasSeleccionadas.map((a: any) => ({ agreement_id: agreementId, area_vinculada_id: a }));
        const { error } = await supabase.from("agreement_areas_vinculadas").insert(areaPayload);
        if (error) throw error;
      }

      // Actualizar responsable externo
      await supabase.from("agreements").update({ external_responsible: externalResponsible || null }).eq("id", agreementId);

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

          {/* FECHA, DURACIÓN, TIPO */}
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Fecha de firma</label>
              <input type="date" className="form-control" value={signatureDate || ""} onChange={(e) => setSignatureDate(e.target.value)} />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Duración (años)</label>
              <select className="form-select" value={durationYears} onChange={(e) => setDurationYears(Number(e.target.value))}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((y) => (
                  <option key={y} value={y}>{y} {y === 1 ? "año" : "años"}</option>
                ))}
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Tipo de convenio</label>
              <select className="form-select" value={tipoConvenio} onChange={(e) => setTipoConvenio(e.target.value)}>
                <option value="marco">Marco</option>
                <option value="específico">Específico</option>
              </select>
            </div>
          </div>

          {/* RESOLUCIÓN Y PAÍS */}
          <div className="mb-3">
            <label className="form-label">Resolución Rectoral</label>
            <input className="form-control" value={resolucion} onChange={(e) => setResolucion(e.target.value)} placeholder="Nº de resolución" />
          </div>

          <div className="mb-3">
            <label className="form-label">País</label>
            <select className="form-select" value={pais} onChange={(e) => setPais(e.target.value)}>
              <option value="">Seleccione un país</option>
              {paises.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 🆕 TIPOS DE CONVENIO - MOVIDO ARRIBA */}
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

          {/* 🆕 LÓGICA CONDICIONAL */}
          
          {/* SI INCLUYE "Docente Asistencial" → Mostrar Subtipos */}
          {incluyeDocenteAsistencial && (
            <div className="mb-3 p-3 border border-primary rounded bg-light">
              <h5 className="text-primary mb-3">📚 Configuración Docente Asistencial</h5>
              
              <div className="mb-3">
                <label className="form-label">Subtipo Docente</label>
                <select className="form-select" value={subTipoDocente} onChange={(e) => setSubTipoDocente(e.target.value)}>
                  <option value="">Seleccione un subtipo</option>
                  {subTiposDocente.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* TODO: Aquí irá la sección de Subtipos + Responsables por subtipo */}
              <div className="alert alert-info">
                <strong>📝 Próximamente:</strong> Selección de responsables por subtipo docente
              </div>
            </div>
          )}

          {/* SI NO INCLUYE "Docente Asistencial" O incluye otros → Mostrar Responsables normales */}
          {tipoSeleccionados.length > 0 && (
            <div className="mb-3">
              <h5 className="mb-3">👥 Responsables</h5>
              <div className="row">
                <div className="col-md-6 mb-3">
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

                <div className="col-md-6 mb-3">
                  <label className="form-label">Responsable Externo</label>
                  <select className="form-select" value={externalResponsible} onChange={(e) => setExternalResponsible(e.target.value)}>
                    <option value="">Seleccione</option>
                    {externos.map((p) => (
                      <option key={p.id} value={String(p.id)}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
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

          {/* AREAS VINCULADAS */}
          <div className="mb-3">
            <label className="form-label">Áreas vinculadas</label>
            <div className="border rounded p-3 bg-light">
              {areas.length > 0 ? (
                areas.map((area) => (
                  <label key={area.id} className="me-3 d-block mb-2">
                    <input 
                      type="checkbox" 
                      checked={areasSeleccionadas.includes(area.id)} 
                      onChange={() => handleAreaChange(area.id)} 
                      className="me-2" 
                    />
                    {area.nombre}
                  </label>
                ))
              ) : (
                <div className="text-muted">No hay áreas registradas</div>
              )}
            </div>
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