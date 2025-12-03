// AgreementsForm.tsx (versión profesional corregida + generación automática de agreement_years)
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Select, { MultiValue, Options } from "react-select";
import { supabase } from "./supabaseClient";

interface AgreementsFormProps {
  existingAgreement?: any;
  onSave: () => void;
  onCancel: () => void;
}

type Option = { value: string; label: string };

export default function AgreementsForm({
  existingAgreement,
  onSave,
  onCancel,
}: AgreementsFormProps) {
  // --- estados del formulario ---
  const [name, setName] = useState<string>(existingAgreement?.name || "");
  const [selectedInternals, setSelectedInternals] = useState<Option[]>(
    () => {
      const initial =
        existingAgreement?.internal_responsibles || existingAgreement?.internals || [];
      if (!Array.isArray(initial) || initial.length === 0) return [];
      return initial.map((it: any) => {
        if (typeof it === "string") return { value: it, label: it };
        if (it?.id && it?.full_name) return { value: it.id, label: it.full_name };
        return { value: String(it), label: String(it) };
      });
    }
  );

  const [externalResponsible, setExternalResponsible] = useState<string>(
    existingAgreement?.external_responsible || ""
  );
  const [signatureDate, setSignatureDate] = useState<string>(
    existingAgreement?.signature_date || ""
  );
  const [durationYears, setDurationYears] = useState<number>(
    existingAgreement?.duration_years || 1
  );
  const [tipoConvenio, setTipoConvenio] = useState<string>(
    existingAgreement?.convenio || "marco"
  );
  const [resolucion, setResolucion] = useState<string>(
    existingAgreement?.["Resolución Rectoral"] || ""
  );
  const [pais, setPais] = useState<string>(existingAgreement?.pais || "");
  const [objetivos, setObjetivos] = useState<string>(
    existingAgreement?.objetivos || ""
  );
  const [tipoSeleccionados, setTipoSeleccionados] = useState<string[]>(
    existingAgreement?.tipo_convenio || []
  );
  const [subTipoDocente, setSubTipoDocente] = useState<string>(
    existingAgreement?.sub_tipo_docente || ""
  );

  // listas para selects
  const [internos, setInternos] = useState<any[]>([]);
  const [externos, setExternos] = useState<any[]>([]);
  const [paises, setPaises] = useState<string[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [areasSeleccionadas, setAreasSeleccionadas] = useState<string[]>(
    existingAgreement?.areasSeleccionadas || []
  );

  const [loading, setLoading] = useState<boolean>(false);

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

  // ----------------------------------
  // CARGAS INICIALES (ordenadas)
  // ----------------------------------
  useEffect(() => {
    fetchPaises();
    fetchAreas();
    fetchResponsables();
    fetchResponsablesExternos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!existingAgreement?.id) return;
    if (internos.length === 0) return;
    fetchAreasVinculadas(existingAgreement.id);
    fetchResponsablesInternos(existingAgreement.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internos, existingAgreement]);

  // ----------------------------------
  // FUNCIONES DE FETCH
  // ----------------------------------
  const fetchResponsables = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("role", "internal");
      setInternos(data || []);
    } catch (err) {
      console.error("Error fetchResponsables internos:", err);
      setInternos([]);
    }
  };

  const fetchResponsablesExternos = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("role", "external");
      setExternos(data || []);
    } catch (err) {
      console.error("Error fetchResponsables externos:", err);
      setExternos([]);
    }
  };

  const fetchResponsablesInternos = async (agreementId: string) => {
    try {
      const { data } = await supabase
        .from("agreement_internal_responsibles")
        .select("internal_responsible_id")
        .eq("agreement_id", agreementId);

      const ids: string[] = (data || []).map((r: any) => r.internal_responsible_id);

      const seleccionados: Option[] = internos
        .filter((i) => ids.includes(i.id))
        .map((i) => ({ value: i.id, label: i.full_name }));

      setSelectedInternals(seleccionados);
    } catch (err) {
      console.error("Error fetchResponsablesInternos:", err);
    }
  };

  const fetchAreas = async () => {
    try {
      const { data, error } = await supabase.from("areas_vinculadas").select("id, nombre");
      if (error) throw error;
      setAreas(data || []);
    } catch (err) {
      console.error("Error fetchAreas:", err);
      setAreas([]);
    }
  };

  const fetchAreasVinculadas = async (agreementId: string) => {
    try {
      const { data } = await supabase
        .from("agreement_areas_vinculadas")
        .select("area_vinculada_id")
        .eq("agreement_id", agreementId);
      setAreasSeleccionadas((data || []).map((a: any) => a.area_vinculada_id));
    } catch (err) {
      console.error("Error fetchAreasVinculadas:", err);
    }
  };

  const fetchPaises = async () => {
    try {
      const response = await fetch("https://restcountries.com/v3.1/all");
      const data = await response.json();
      const nombres = (data || [])
        .map((p: any) => p?.name?.common)
        .filter(Boolean)
        .sort((a: string, b: string) => a.localeCompare(b, "es"));
      setPaises(nombres);
    } catch (err) {
      console.warn("Fallo fetch countries, aplicando fallback:", err);
      setPaises(["Perú", "Argentina", "Chile", "Colombia", "México", "Brasil", "Ecuador", "España", "Estados Unidos", "Canadá"]);
    }
  };

  // ----------------------------------
  // HELPERS
  // ----------------------------------
  const toggleTipo = (tipo: string) => {
    setTipoSeleccionados((prev) => (prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]));
  };

  const handleAreaChange = (id: string) => {
    setAreasSeleccionadas((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  // ----------------------------------
  // Helper: generar años entre fechas y persistir en agreement_years
  // ----------------------------------
  const generateYearsIfNeeded = async (agreementId: string, signature_date: string | null, expiration_date: string | null, duration_years: number | null) => {
    try {
      // Validaciones mínimas
      if (!agreementId) return;
      if (!signature_date) return;

      // Obtener fecha de fin real (si no existe, calcular con duration_years)
      let startDate = new Date(signature_date);
      let endDate: Date;
      if (expiration_date) {
        endDate = new Date(expiration_date);
      } else if (duration_years && !isNaN(duration_years)) {
        endDate = new Date(signature_date);
        endDate.setFullYear(endDate.getFullYear() + (duration_years as number));
        // restar 1 día para que sea inclusivo hasta el día anterior al aniversario
        endDate.setDate(endDate.getDate() - 1);
      } else {
        // sin fecha fin ni duración, no generamos
        return;
      }

      // Obtener años ya existentes
      const { data: existingYears, error: existingError } = await supabase
        .from("agreement_years")
        .select("id, year_number, year_start, year_end")
        .eq("agreement_id", agreementId)
        .order("year_number", { ascending: true });

      if (existingError) {
        console.error("Error obteniendo agreement_years:", existingError);
        return;
      }

      // Si no existe ninguno, crear todos los años desde signature_date hasta endDate
      if (!existingYears || existingYears.length === 0) {
        const toInsert: any[] = [];
        let currentStart = new Date(startDate);
        let yearNumber = 1;

        while (currentStart <= endDate) {
          const candidateEnd = new Date(currentStart);
          candidateEnd.setFullYear(candidateEnd.getFullYear() + 1);
          candidateEnd.setDate(candidateEnd.getDate() - 1);

          const yearEnd = candidateEnd > endDate ? endDate : candidateEnd;

          toInsert.push({
            agreement_id: agreementId,
            year_number: yearNumber,
            year_start: currentStart.toISOString().split("T")[0],
            year_end: yearEnd.toISOString().split("T")[0],
          });

          yearNumber += 1;
          currentStart = new Date(yearEnd);
          currentStart.setDate(currentStart.getDate() + 1);
        }

        if (toInsert.length > 0) {
          const { error: insertErr } = await supabase.from("agreement_years").insert(toInsert);
          if (insertErr) {
            console.error("Error insertando agreement_years:", insertErr);
          }
        }

        return;
      }

      // Si ya hay años, comprobar si necesitamos agregar más (extensión por renovación)
      const lastYear = existingYears[existingYears.length - 1];
      const lastYearEnd = new Date(lastYear.year_end);

      // Si la fecha de fin actual es menor o igual al último año registrado, no hay nada que hacer
      if (endDate <= lastYearEnd) {
        return;
      }

      // Si hay extensión, crear años empezando el día siguiente a lastYearEnd hasta endDate
      const toInsertExtra: any[] = [];
      let currentStart = new Date(lastYearEnd);
      currentStart.setDate(currentStart.getDate() + 1);
      let yearNumber = lastYear.year_number + 1;

      while (currentStart <= endDate) {
        const candidateEnd = new Date(currentStart);
        candidateEnd.setFullYear(candidateEnd.getFullYear() + 1);
        candidateEnd.setDate(candidateEnd.getDate() - 1);

        const yearEnd = candidateEnd > endDate ? endDate : candidateEnd;

        toInsertExtra.push({
          agreement_id: agreementId,
          year_number: yearNumber,
          year_start: currentStart.toISOString().split("T")[0],
          year_end: yearEnd.toISOString().split("T")[0],
        });

        yearNumber += 1;
        currentStart = new Date(yearEnd);
        currentStart.setDate(currentStart.getDate() + 1);
      }

      if (toInsertExtra.length > 0) {
        const { error: insertErr } = await supabase.from("agreement_years").insert(toInsertExtra);
        if (insertErr) {
          console.error("Error insertando agreement_years extra:", insertErr);
        }
      }
    } catch (err) {
      console.error("generateYearsIfNeeded error:", err);
    }
  };

  // ----------------------------------
  // SUBMIT (crear / actualizar)
  // ----------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        alert("❌ No se pudo verificar el usuario autenticado.");
        setLoading(false);
        return;
      }

      const user = userData.user;
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error al obtener perfil:", profileError);
        alert("No se pudo verificar permisos.");
        setLoading(false);
        return;
      }

      if (!["admin", "Admin", "Administrador"].includes(profileData?.role)) {
        alert("❌ No tienes permisos para crear o editar convenios.");
        setLoading(false);
        return;
      }

      const convenioNormalizado = tipoConvenio.toLowerCase().includes("marco")
        ? "marco"
        : tipoConvenio.toLowerCase().includes("espec")
        ? "específico"
        : tipoConvenio;

      const dataToSave: any = {
        name,
        external_responsible: externalResponsible || null,
        signature_date: signatureDate || null,
        duration_years: durationYears || null,
        convenio: convenioNormalizado,
        pais: pais || null,
        "Resolución Rectoral": resolucion || null,
        tipo_convenio: tipoSeleccionados,
        objetivos: objetivos || null,
        sub_tipo_docente: tipoSeleccionados.includes("Docente Asistencial") ? subTipoDocente || null : null,
      };

      let agreementId: string | undefined;

      if (existingAgreement?.id) {
        const { error } = await supabase.from("agreements").update(dataToSave).eq("id", existingAgreement.id);
        if (error) throw error;
        agreementId = existingAgreement.id;
      } else {
        const { data, error } = await supabase.from("agreements").insert([dataToSave]).select("id, signature_date, expiration_date").single();
        if (error) throw error;
        agreementId = data?.id;
        // si el insert fue exitoso y expiración se calculó en backend, la fila retornará expiration_date
        // si no, la función generateYearsIfNeeded sabrá calcular usando durationYears
      }

      if (!agreementId) throw new Error("No se obtuvo el id del convenio guardado.");

      // sincronizar responsables internos: borramos anteriores y volvemos a insertar
      const toInsert = selectedInternals.map((s) => ({ agreement_id: agreementId, internal_responsible_id: s.value }));

      await supabase.from("agreement_internal_responsibles").delete().eq("agreement_id", agreementId);
      if (toInsert.length > 0) {
        const { error } = await supabase.from("agreement_internal_responsibles").insert(toInsert);
        if (error) throw error;
      }

      // sincronizar areas vinculadas
      const toInsertAreas = areasSeleccionadas.map((areaId) => ({ agreement_id: agreementId, area_vinculada_id: areaId }));
      await supabase.from("agreement_areas_vinculadas").delete().eq("agreement_id", agreementId);
      if (toInsertAreas.length > 0) {
        const { error } = await supabase.from("agreement_areas_vinculadas").insert(toInsertAreas);
        if (error) throw error;
      }

      // --- Generar / sincronizar agreement_years AUTOMÁTICAMENTE ---
      // Recuperar la fila de agreement (para asegurar expiration_date si el backend la calculó)
      const { data: agreementRow, error: agreementRowErr } = await supabase
        .from("agreements")
        .select("id, signature_date, expiration_date, duration_years")
        .eq("id", agreementId)
        .single();

      if (agreementRowErr) {
        console.error("No se pudo recuperar convenio para generar años:", agreementRowErr);
      } else {
        // signature_date y expiration_date vienen como strings tipo 'YYYY-MM-DD'
        await generateYearsIfNeeded(
          agreementId,
          agreementRow.signature_date || signatureDate || null,
          agreementRow.expiration_date || null,
          agreementRow.duration_years || durationYears || null
        );
      }

      alert("✅ Convenio guardado correctamente");
      onSave();
    } catch (err: any) {
      console.error("Error guardar convenio:", err);
      alert("❌ Error al guardar el convenio: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------
  // Render
  // ----------------------------------
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

          {/* RESPONSABLES INTERNOS y EXTERNOS */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Responsables Internos</label>
              <Select
                isMulti
                options={internos.map((p) => ({ value: p.id, label: p.full_name })) as Options<Option>}
                value={selectedInternals}
                onChange={(val: MultiValue<Option>) => setSelectedInternals(Array.isArray(val) ? (val as Option[]) : [])}
                placeholder="Buscar y seleccionar..."
                noOptionsMessage={() => "No hay responsables"}
                isDisabled={internos.length === 0}
              />
            </div>

          {/* resto del JSX (igual que tu archivo original) */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Responsable Externo</label>
            <select className="form-select" value={externalResponsible} onChange={(e) => setExternalResponsible(e.target.value)}>
              <option value="">Seleccione</option>
              {externos.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
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

          {/* SUBTIPO DOCENTE */}
          {tipoSeleccionados.includes("Docente Asistencial") && (
            <div className="mb-3">
              <label className="form-label">Subtipo Docente</label>
              <select className="form-select" value={subTipoDocente} onChange={(e) => setSubTipoDocente(e.target.value)}>
                <option value="">Seleccione</option>
                {subTiposDocente.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
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























