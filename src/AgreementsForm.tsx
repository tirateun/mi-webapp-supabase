// src/AgreementsForm.tsx
// Versión con SUBTIPOS DOCENTES y responsables por subtipo
import React, { useEffect, useMemo, useState } from "react";
import Select, { MultiValue } from "react-select";
import { supabase } from "./supabaseClient";
import generateYearsIfNeeded from "./utils/generateYearsIfNeeded";

interface Option {
  value: string | number;
  label: string;
}

interface SubtipoConfig {
  nombre: string;
  responsables: Option[];
}

export default function AgreementsForm({ existingAgreement, onSave, onCancel }: any) {
  // ---------- Estados principales ----------
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState<string>(existingAgreement?.name || "");
  const [signatureDate, setSignatureDate] = useState<string>(existingAgreement?.signature_date || "");
  const [durationYears, setDurationYears] = useState<number>(existingAgreement?.duration_years ?? 1);
  const [tipoConvenio, setTipoConvenio] = useState<string>(existingAgreement?.convenio || "marco");
  const [resolucion, setResolucion] = useState<string>(existingAgreement?.["Resolución Rectoral"] || existingAgreement?.resolucion || "");
  const [pais, setPais] = useState<string>(existingAgreement?.pais || "");
  const [objetivos, setObjetivos] = useState<string>(existingAgreement?.objetivos || "");
  const [tipoSeleccionados, setTipoSeleccionados] = useState<string[]>(existingAgreement?.tipo_convenio || existingAgreement?.tipos || []);
  const [documentUrl, setDocumentUrl] = useState<string>(existingAgreement?.document_url || "");

  // 🆕 NUEVO: Gestión de subtipos con responsables
  const [subtipesConfig, setSubtipesConfig] = useState<Record<string, SubtipoConfig>>({});

  // Responsables / externos / áreas
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

  // ---- Cargas iniciales ----
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
      fetchSubtypes(existingAgreement.id);
    }
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

  // 🆕 Cargar subtipos existentes
  async function fetchSubtypes(agreementId: string) {
    try {
      const { data: subtypesData } = await supabase
        .from("agreement_subtypes")
        .select("id, subtipo_nombre")
        .eq("agreement_id", agreementId);

      if (subtypesData && subtypesData.length > 0) {
        const config: Record<string, SubtipoConfig> = {};

        for (const subtype of subtypesData) {
          // Cargar responsables de este subtipo
          const { data: responsiblesData } = await supabase
            .from("subtype_internal_responsibles")
            .select("internal_responsible_id")
            .eq("subtype_id", subtype.id);

          const responsibleIds = (responsiblesData || []).map((r: any) => r.internal_responsible_id);
          const responsables = internos
            .filter((i) => responsibleIds.includes(i.id))
            .map((i) => ({ value: i.id, label: i.full_name }));

          config[subtype.subtipo_nombre] = {
            nombre: subtype.subtipo_nombre,
            responsables,
          };
        }

        setSubtipesConfig(config);
      }
    } catch (err) {
      console.error("Error cargando subtipos:", err);
    }
  }

  const toggleTipo = (t: string) => setTipoSeleccionados((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  
  const handleAreaChange = (id: any) => setAreasSeleccionadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // 🆕 Toggle subtipo docente
  const toggleSubtipo = (subtipo: string) => {
    setSubtipesConfig((prev) => {
      const newConfig = { ...prev };
      if (newConfig[subtipo]) {
        delete newConfig[subtipo];
      } else {
        newConfig[subtipo] = {
          nombre: subtipo,
          responsables: [],
        };
      }
      return newConfig;
    });
  };

  // 🆕 Actualizar responsables de un subtipo
  const updateSubtipoResponsables = (subtipo: string, responsables: Option[]) => {
    setSubtipesConfig((prev) => ({
      ...prev,
      [subtipo]: {
        ...prev[subtipo],
        responsables,
      },
    }));
  };

  const toYMD = (v: any): string | null => {
    if (!v) return null;
    if (typeof v === "string") {
      return v.length >= 10 ? v.slice(0, 10) : v;
    }
    if (v instanceof Date) {
      return v.toISOString().slice(0, 10);
    }
    try {
      const s = String(v);
      return s.length >= 10 ? s.slice(0, 10) : s;
    } catch {
      return null;
    }
  };

  const isValidUrl = (urlString: string): boolean => {
    if (!urlString) return true;
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (documentUrl && !isValidUrl(documentUrl)) {
      alert("❌ La URL del documento no es válida. Debe comenzar con http:// o https://");
      return;
    }

    // 🆕 Validar que subtipos tengan responsables
    if (tipoSeleccionados.includes("Docente Asistencial") && Object.keys(subtipesConfig).length > 0) {
      const subtypesSinResponsables = Object.entries(subtipesConfig)
        .filter(([_, config]) => config.responsables.length === 0)
        .map(([nombre, _]) => nombre);

      if (subtypesSinResponsables.length > 0) {
        alert(`❌ Los siguientes subtipos no tienen responsables asignados:\n- ${subtypesSinResponsables.join('\n- ')}`);
        return;
      }
    }

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
        sub_tipo_docente: null, // Ya no se usa este campo
        area_vinculada_id: areaId ?? null,
        convenio_maestro_id: convenioMaestroId ?? null,
        version,
        estado,
        document_url: documentUrl || null,
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

      // 🆕 Guardar subtipos y sus responsables
      if (tipoSeleccionados.includes("Docente Asistencial") && Object.keys(subtipesConfig).length > 0) {
        // Eliminar subtipos anteriores
        await supabase.from("agreement_subtypes").delete().eq("agreement_id", agreementId);

        // Insertar nuevos subtipos
        for (const [_, config] of Object.entries(subtipesConfig)) {
          const { data: subtypeData, error: subtypeError } = await supabase
            .from("agreement_subtypes")
            .insert({
              agreement_id: agreementId,
              subtipo_nombre: config.nombre,
            })
            .select("id")
            .single();

          if (subtypeError) throw subtypeError;

          // Insertar responsables del subtipo
          if (config.responsables.length > 0) {
            const responsablesPayload = config.responsables.map((r) => ({
              subtype_id: subtypeData.id,
              internal_responsible_id: r.value,
            }));

            const { error: respError } = await supabase
              .from("subtype_internal_responsibles")
              .insert(responsablesPayload);

            if (respError) throw respError;
          }
        }
      }

      // sincronizar responsables internos generales (solo si NO es docente asistencial con subtipos)
      if (!(tipoSeleccionados.includes("Docente Asistencial") && Object.keys(subtipesConfig).length > 0)) {
        const internalIds = (selectedInternals || []).map((s) => s.value);
        await supabase.from("agreement_internal_responsibles").delete().eq("agreement_id", agreementId);
        if (internalIds.length > 0) {
          const toInsert = internalIds.map((pid: any) => ({ agreement_id: agreementId, internal_responsible_id: pid }));
          const { error } = await supabase.from("agreement_internal_responsibles").insert(toInsert);
          if (error) throw error;
        }
      }

      // sincronizar areas vinculadas
      await supabase.from("agreement_areas_vinculadas").delete().eq("agreement_id", agreementId);
      if (areasSeleccionadas && areasSeleccionadas.length > 0) {
        const areaPayload = areasSeleccionadas.map((a: any) => ({ agreement_id: agreementId, area_vinculada_id: a }));
        const { error } = await supabase.from("agreement_areas_vinculadas").insert(areaPayload);
        if (error) throw error;
      }

      // actualizar responsable externo
      await supabase.from("agreements").update({ external_responsible: externalResponsible || null }).eq("id", agreementId);

      // Generar años
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

  const esDocenteAsistencial = tipoSeleccionados.includes("Docente Asistencial");

  return (
    <div className="container mt-4" style={{ maxWidth: 900 }}>
      <div className="card shadow-sm p-4" style={{ borderRadius: 12 }}>
        <h3 className="text-center mb-3 text-primary fw-bold">{existingAgreement ? "✏️ Editar Convenio" : "➕ Nuevo Convenio"}</h3>

        <form onSubmit={handleSubmit}>
          {/* NOMBRE */}
          <div className="mb-3">
            <label className="form-label">Nombre del convenio</label>
            <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {/* ENLACE AL DOCUMENTO */}
          <div className="mb-3">
            <label className="form-label">
              Enlace al documento del convenio <span className="text-muted">(opcional)</span>
            </label>
            <input 
              type="url"
              className="form-control" 
              value={documentUrl} 
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="https://drive.google.com/... o https://..."
            />
            <small className="form-text text-muted">
              💡 Pega aquí el enlace donde está almacenado el documento (Google Drive, OneDrive, etc.)
            </small>
            {documentUrl && !isValidUrl(documentUrl) && (
              <div className="text-danger small mt-1">
                ⚠️ La URL no es válida. Debe comenzar con http:// o https://
              </div>
            )}
          </div>

          {/* RESPONSABLES INTERNOS y EXTERNOS - Solo si NO es docente asistencial con subtipos */}
          {!(esDocenteAsistencial && Object.keys(subtipesConfig).length > 0) && (
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
          )}

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

          {/* TIPOS DE CONVENIO */}
          <div className="mb-3">
            <label className="form-label">Tipos de convenio</label>
            <div className="border rounded p-3 bg-light">
              {tipos.map((t) => (
                <label key={t} className="me-3">
                  <input type="checkbox" checked={tipoSeleccionados.includes(t)} onChange={() => toggleTipo(t)} className="me-1" />
                  {t}
                </label>
              ))}
            </div>
          </div>

          {/* 🆕 SUBTIPOS DOCENTES CON RESPONSABLES */}
          {esDocenteAsistencial && (
            <div className="mb-3">
              <div className="card border-primary">
                <div className="card-header bg-primary text-white">
                  <h6 className="mb-0">📚 Subtipos Docente-Asistenciales y Responsables</h6>
                </div>
                <div className="card-body">
                  <p className="text-muted small mb-3">
                    Seleccione los subtipos que aplican y asigne responsables internos a cada uno
                  </p>

                  {subTiposDocente.map((subtipo) => {
                    const isSelected = subtipesConfig[subtipo] !== undefined;
                    
                    return (
                      <div key={subtipo} className="mb-3 pb-3 border-bottom">
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`subtipo-${subtipo}`}
                            checked={isSelected}
                            onChange={() => toggleSubtipo(subtipo)}
                          />
                          <label className="form-check-label fw-bold" htmlFor={`subtipo-${subtipo}`}>
                            {subtipo}
                          </label>
                        </div>

                        {isSelected && (
                          <div className="ms-4">
                            <label className="form-label small text-muted">
                              Responsables internos para este subtipo:
                            </label>
                            <Select
                              isMulti
                              options={internos.map((p) => ({ value: p.id, label: p.full_name }))}
                              value={subtipesConfig[subtipo]?.responsables || []}
                              onChange={(val: MultiValue<Option>) => 
                                updateSubtipoResponsables(
                                  subtipo, 
                                  Array.isArray(val) ? (val as Option[]) : []
                                )
                              }
                              placeholder="Seleccionar responsables..."
                              noOptionsMessage={() => "No hay responsables"}
                              isDisabled={internos.length === 0}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {Object.keys(subtipesConfig).length === 0 && (
                    <div className="alert alert-warning small mb-0">
                      ⚠️ Debe seleccionar al menos un subtipo docente
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* OBJETIVOS */}
          <div className="mb-3">
            <label className="form-label">Objetivos</label>
            <textarea className="form-control" rows={3} value={objetivos} onChange={(e) => setObjetivos(e.target.value)} placeholder="Describa los objetivos principales" />
          </div>

          {/* AREAS VINCULADAS */}
          <div className="mb-3">
            <label className="form-label">Áreas vinculadas</label>
            <div className="border rounded p-3 bg-light">
              {areas.length > 0 ? (
                areas.map((area) => (
                  <label key={area.id} className="me-3">
                    <input type="checkbox" checked={areasSeleccionadas.includes(area.id)} onChange={() => handleAreaChange(area.id)} className="me-1" />
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
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Guardando..." : "Guardar Convenio"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}