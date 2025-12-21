// src/ContraprestacionesEvidencias.tsx
// VERSIÓN CON SOPORTE PARA SUBTIPOS DOCENTES

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { useParams } from "react-router-dom";

/* ------------------ Tipos ------------------ */
interface Contraprestacion {
  id: string;
  agreement_id: string | null;
  tipo: string;
  descripcion: string | null;
  unidades_comprometidas?: number | null;
  periodo_inicio?: string | null;
  periodo_fin?: string | null;
  renewal_id?: string | null;
  agreement_year_id?: string | null;
  periodo?: number | null;
  subtype_id?: string | null; // 🆕
}

interface SeguimientoRaw {
  id: string;
  contraprestacion_id: string | null;
  unidad_numero?: number | null;
  anio?: number | null;
  ["año"]?: number | null;
  estado?: string | null;
  observaciones?: string | null;
  fecha_verificacion?: string | null;
  responsable?: string | null;
  evidencia_url?: string | null;
  ejecutado?: boolean | null;
  renewal_id?: string | null;
  contraprestaciones?: Partial<Contraprestacion> | null;
}

interface Seguimiento {
  id: string;
  contraprestacion_id: string;
  unidad_numero: number;
  anio: number;
  estado: string | null;
  observaciones: string | null;
  fecha_verificacion: string | null;
  responsable: string | null;
  evidencia_url: string | null;
  ejecutado: boolean;
  renewal_id: string | null;
  periodo?: string;
  contraprestacion?: Contraprestacion | null;
}

interface Renewal {
  id: string;
  agreement_id: string;
  old_expiration_date: string | null;
  new_expiration_date: string | null;
  changed_at: string | null;
  changed_by?: string | null;
}

// 🆕 Interface para subtipos
interface Subtype {
  id: string;
  subtipo_nombre: string;
}

/* ------------------ Props ------------------ */
interface Props {
  agreementId?: string;
  onBack: () => void;
  role: string;
  userId: string;
}

/* ------------------ Helpers fecha ------------------ */
function parseLocalDate(dateString?: string | null): Date | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  return d;
}
function formatDate(d?: string | Date | null) {
  if (!d) return "-";
  const dt = typeof d === "string" ? parseLocalDate(d) : d;
  if (!dt) return "-";
  return dt.toLocaleDateString("es-PE");
}
function addDays(date: Date, days: number) {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
}

/* ------------------ Componente ------------------ */
export default function ContraprestacionesEvidencias({ agreementId: propAgreementId, onBack, role, userId }: Props) {
  const { agreementId: urlAgreementId } = useParams<{ agreementId: string }>();
  const inputId = propAgreementId || urlAgreementId;

  const [loading, setLoading] = useState<boolean>(true);
  const [contraprestaciones, setContraprestaciones] = useState<Contraprestacion[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [agreementInfo, setAgreementInfo] = useState<any | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvedAgreementId, setResolvedAgreementId] = useState<string | null>(null);
  const [agreementYears, setAgreementYears] = useState<any[]>([]);

  // 🆕 Estados para subtipos
  const [subtypes, setSubtypes] = useState<Subtype[]>([]);
  const [selectedSubtype, setSelectedSubtype] = useState<string>("");
  const [loadingSubtypes, setLoadingSubtypes] = useState(false);

  const resolveAgreementId = async (id: string) => {
    try {
      const { data: agreementData, error: agreementError } = await supabase
        .from("agreements")
        .select("id")
        .eq("id", id)
        .single();
      if (!agreementError && agreementData) return id;

      const { data: renewalData, error: renewalError } = await supabase
        .from("agreement_renewals")
        .select("agreement_id")
        .eq("id", id)
        .single();
      if (!renewalError && renewalData) return renewalData.agreement_id;

      return null;
    } catch (err) {
      console.error("Error resolviendo agreement_id:", err);
      return null;
    }
  };

  // 🆕 Cargar subtipos
  const loadSubtypes = async (agreementId: string) => {
    try {
      setLoadingSubtypes(true);
      const { data, error } = await supabase
        .from("agreement_subtypes")
        .select("id, subtipo_nombre")
        .eq("agreement_id", agreementId)
        .order("subtipo_nombre", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setSubtypes(data);
        setSelectedSubtype(data[0].id);
      } else {
        setSubtypes([]);
        setSelectedSubtype("");
      }
    } catch (err) {
      console.error("Error loadSubtypes:", err);
      setSubtypes([]);
      setSelectedSubtype("");
    } finally {
      setLoadingSubtypes(false);
    }
  };

  useEffect(() => {
    if (!inputId) {
      setError("No se proporcionó ID de convenio");
      setLoading(false);
      return;
    }

    const resolveAndLoad = async () => {
      setLoading(true);
      setError(null);

      const realAgreementId = await resolveAgreementId(inputId);
      if (!realAgreementId) {
        setError("El ID proporcionado no corresponde a un convenio válido");
        setLoading(false);
        return;
      }

      setResolvedAgreementId(realAgreementId);
      await loadSubtypes(realAgreementId); // 🆕 Cargar subtipos
      await loadAllData(realAgreementId);
    };

    resolveAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputId]);

  const loadAllData = async (agreementId: string) => {
    try {
      const { data: agData, error: agErr } = await supabase
        .from("agreements")
        .select("id, name, signature_date, duration_years, expiration_date")
        .eq("id", agreementId)
        .maybeSingle();
      if (agErr) throw agErr;
      setAgreementInfo(agData || null);

      const { data: rData, error: rErr } = await supabase
        .from("agreement_renewals")
        .select("*")
        .eq("agreement_id", agreementId)
        .order("changed_at", { ascending: true });
      if (rErr) throw rErr;
      setRenewals((rData || []) as Renewal[]);

      const { data: yData, error: yErr } = await supabase
        .from("agreement_years")
        .select("id, year_number, year_start, year_end")
        .eq("agreement_id", agreementId)
        .order("year_number", { ascending: true });
      if (yErr) throw yErr;
      setAgreementYears(yData || []);

      // 🆕 Cargar contraprestaciones (filtradas por subtipo si existe)
      let contrapQuery = supabase
        .from("contraprestaciones")
        .select("id, tipo, descripcion, renewal_id, agreement_id, periodo_inicio, periodo_fin, agreement_year_id, periodo, unidades_comprometidas, subtype_id")
        .eq("agreement_id", agreementId)
        .order("tipo", { ascending: true });

      const { data: cData, error: cErr } = await contrapQuery;
      if (cErr) throw cErr;
      const cList = (cData || []) as Contraprestacion[];
      setContraprestaciones(cList);

      const contraprestacionIds = cList.map((c) => c.id).filter(Boolean);
      if (contraprestacionIds.length === 0) {
        setSeguimientos([]);
        setLoading(false);
        return;
      }

      const { data: sData, error: sErr } = await supabase
        .from("contraprestaciones_seguimiento")
        .select("*, contraprestaciones(id, tipo, descripcion, periodo_inicio, periodo_fin, periodo, renewal_id, agreement_year_id, unidades_comprometidas, subtype_id)")
        .in("contraprestacion_id", contraprestacionIds)
        .order("fecha_verificacion", { ascending: true });
      if (sErr) throw sErr;

      const raw: SeguimientoRaw[] = (sData || []) as SeguimientoRaw[];

      const determineYear = (r: SeguimientoRaw, c?: Partial<Contraprestacion> | null): number => {
        const valFromSeg = r.anio ?? (r as any)["año"];
        if (valFromSeg !== undefined && valFromSeg !== null) {
          const n = Number(valFromSeg);
          if (!isNaN(n) && n > 0) return n;
        }

        if (c) {
          const per = (c as any).periodo;
          if (per !== undefined && per !== null) {
            const np = Number(per);
            if (!isNaN(np) && np > 0) return np;
          }
        }

        if (c && (c as any).periodo_inicio && agData?.signature_date) {
          try {
            const inicio = new Date((c as any).periodo_inicio);
            const firma = new Date(agData.signature_date);
            if (!isNaN(inicio.getTime()) && !isNaN(firma.getTime())) {
              const yearDiff = inicio.getFullYear() - firma.getFullYear() + 1;
              if (!isNaN(yearDiff) && yearDiff > 0) return yearDiff;
            }
          } catch {
            // ignore
          }
        }

        return 1;
      };

      const mapped: Seguimiento[] = raw.map((r) => {
        const c = r.contraprestaciones ?? null;
        const anioCalculado = determineYear(r, c);
        return {
          id: r.id,
          contraprestacion_id: (r.contraprestacion_id as string) ?? "",
          unidad_numero: r.unidad_numero ?? 1,
          anio: anioCalculado,
          estado: r.estado ?? null,
          observaciones: r.observaciones ?? null,
          fecha_verificacion: r.fecha_verificacion ?? null,
          responsable: r.responsable ?? null,
          evidencia_url: r.evidencia_url ?? null,
          ejecutado: !!r.ejecutado,
          renewal_id: r.renewal_id ?? null,
          contraprestacion: (c as any) ?? null,
        };
      });

      mapped.sort((a, b) => {
        const y = (a.anio || 0) - (b.anio || 0);
        if (y !== 0) return y;
        const ta = a.fecha_verificacion ? new Date(a.fecha_verificacion).getTime() : 0;
        const tb = b.fecha_verificacion ? new Date(b.fecha_verificacion).getTime() : 0;
        return ta - tb;
      });

      setSeguimientos(mapped);
    } catch (err: any) {
      console.error("Error cargando datos:", err);
      alert("Error al cargar datos.");
      setContraprestaciones([]);
      setSeguimientos([]);
      setRenewals([]);
      setAgreementInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Filtrar contraprestaciones y seguimientos por subtipo
  const contraprestacionesFiltradas = useMemo(() => {
    if (subtypes.length === 0) {
      // Sin subtipos: mostrar solo las contraprestaciones sin subtipo
      return contraprestaciones.filter(c => !c.subtype_id);
    } else if (selectedSubtype) {
      // Con subtipos: mostrar solo las del subtipo seleccionado
      return contraprestaciones.filter(c => c.subtype_id === selectedSubtype);
    } else {
      return [];
    }
  }, [contraprestaciones, subtypes, selectedSubtype]);

  const seguimientosFiltrados = useMemo(() => {
    const contrapIds = contraprestacionesFiltradas.map(c => c.id);
    return seguimientos.filter(s => contrapIds.includes(s.contraprestacion_id));
  }, [seguimientos, contraprestacionesFiltradas]);

  const grouped = useMemo(() => {
    const periods: { key: string; title: string; start: Date | null; end: Date | null; renewalId: string | null }[] = [];

    if (agreementInfo) {
      let start: Date | null = null;
      let end: Date | null = null;

      if (agreementInfo.signature_date) start = parseLocalDate(agreementInfo.signature_date);
      if (agreementInfo.expiration_date) end = parseLocalDate(agreementInfo.expiration_date);
      else if (agreementInfo.signature_date && agreementInfo.duration_years) {
        const sig = parseLocalDate(agreementInfo.signature_date);
        if (sig) {
          const compEnd = new Date(sig);
          compEnd.setFullYear(compEnd.getFullYear() + Number(agreementInfo.duration_years));
          compEnd.setDate(compEnd.getDate() - 1);
          end = compEnd;
        }
      }

      const title = start && end ? `${formatDate(start)} — ${formatDate(end)}` : "Vigencia original";
      periods.push({ key: "original", title, start, end, renewalId: null });
    }

    (renewals || []).forEach((r) => {
      const oldExp = parseLocalDate(r.old_expiration_date ?? null);
      const newExp = parseLocalDate(r.new_expiration_date ?? null);
      const start = oldExp ? addDays(oldExp, 1) : null;
      const end = newExp ?? null;
      const title = start && end ? `${formatDate(start)} — ${formatDate(end)}` : `Renovación ${r.changed_at ? formatDate(r.changed_at) : ""}`;
      periods.push({ key: r.id, title, start, end, renewalId: r.id });
    });

    (agreementYears || []).forEach((y) => {
      periods.push({
        key: String(y.id),
        title: `Año ${y.year_number} — ${formatDate(y.year_start)} / ${formatDate(y.year_end)}`,
        start: parseLocalDate(y.year_start),
        end: parseLocalDate(y.year_end),
        renewalId: null,
      });
    });

    const map: Record<string, Seguimiento[]> = {};
    periods.forEach((p) => { map[p.key] = []; });

    const findPeriodKeyForSeguimiento = (s: Seguimiento) => {
      const ayId = s.contraprestacion?.agreement_year_id ?? (s as any).agreement_year_id;
      if (ayId) {
        const py = periods.find((p) => p.key === String(ayId));
        if (py) return py.key;
      }

      if (s.renewal_id) {
        const rr = periods.find((p) => p.renewalId === s.renewal_id);
        if (rr) return rr.key;
      }

      const fv = s.fecha_verificacion ? parseLocalDate(s.fecha_verificacion) : null;
      if (fv) {
        const found = periods.find((p) => {
          if (!p.start && !p.end) return false;
          const afterStart = p.start ? fv >= p.start : true;
          const beforeEnd = p.end ? fv <= p.end : true;
          return afterStart && beforeEnd;
        });
        if (found) return found.key;
      }

      const periodoNum = (s.contraprestacion as any)?.periodo ?? (s as any).anio ?? (s as any)["año"];
      if (periodoNum) {
        const foundByYearNumber = (agreementYears || []).find((y) => Number(y.year_number) === Number(periodoNum));
        if (foundByYearNumber) return String(foundByYearNumber.id);
      }

      const c = s.contraprestacion;
      if (c) {
        const inicio = c.periodo_inicio ? parseLocalDate(c.periodo_inicio) : null;
        const fin = c.periodo_fin ? parseLocalDate(c.periodo_fin) : null;
        if (inicio || fin) {
          const found = periods.find((p) => {
            if (!p.start && !p.end) return false;
            const itemStart = inicio ?? new Date(0);
            const itemEnd = fin ?? new Date(8640000000000000);
            const afterStart = p.start ? itemEnd >= p.start : true;
            const beforeEnd = p.end ? itemStart <= p.end : true;
            return afterStart && beforeEnd;
          });
          if (found) return found.key;
        }
      }

      return "original";
    };

    const contraprestacionesMap = new Map(contraprestacionesFiltradas.map(c => [c.id, c]));

    // 🆕 Usar seguimientos filtrados
    (seguimientosFiltrados || []).forEach((s) => {
      const key = findPeriodKeyForSeguimiento(s) ?? "original";
      const contraprestacionCompleta = contraprestacionesMap.get(s.contraprestacion_id) || s.contraprestacion || null;
      if (!map[key]) map[key] = [];
      map[key].push({ ...s, contraprestacion: contraprestacionCompleta, periodo: periods.find((p) => p.key === key)?.title ?? "" });
    });

    // Crear dummies solo para contraprestaciones filtradas
    contraprestacionesFiltradas.forEach(c => {
      const unidadesComprometidas = c.unidades_comprometidas ?? 1;
      
      for (let unidadNum = 1; unidadNum <= unidadesComprometidas; unidadNum++) {
        const yaExiste = seguimientosFiltrados.some(s => 
          s.contraprestacion_id === c.id && 
          s.unidad_numero === unidadNum
        );
        
        if (yaExiste) continue;

        const calcularAnioReal = () => {
          if (!c.periodo_inicio || !agreementInfo?.signature_date) return (c as any).periodo ?? 1;
          const inicio = new Date(c.periodo_inicio);
          const firma = new Date(agreementInfo.signature_date);
          return inicio.getFullYear() - firma.getFullYear() + 1;
        };

        const dummySeguimiento: Seguimiento = {
          id: `dummy_${c.id}_${unidadNum}`,
          contraprestacion_id: c.id,
          unidad_numero: unidadNum,
          anio: calcularAnioReal(),
          estado: null,
          observaciones: null,
          fecha_verificacion: null,
          responsable: null,
          evidencia_url: null,
          ejecutado: false,
          renewal_id: c.renewal_id ?? null,
          contraprestacion: c,
          periodo: periods[0]?.title ?? "",
        };

        let key = "original";

        if (c.agreement_year_id) {
          const ky = periods.find((p) => p.key === String(c.agreement_year_id));
          if (ky) key = ky.key;
        } else if ((c as any).periodo) {
          const ky = (agreementYears || []).find((y) => Number(y.year_number) === Number((c as any).periodo));
          if (ky) key = String(ky.id);
        } else if (c.periodo_inicio || c.periodo_fin) {
          const itemStart = c.periodo_inicio ? parseLocalDate(c.periodo_inicio) : null;
          const itemEnd = c.periodo_fin ? parseLocalDate(c.periodo_fin) : null;
          const found = periods.find((p) => {
            if (!p.start && !p.end) return false;
            const afterStart = p.start ? (itemEnd ? itemEnd >= p.start : true) : true;
            const beforeEnd = p.end ? (itemStart ? itemStart <= p.end : true) : true;
            return afterStart && beforeEnd;
          });
          if (found) key = found.key;
        }

        if (!map[key]) map[key] = [];
        map[key].push(dummySeguimiento);
      }
    });

    Object.keys(map).forEach((k) => {
      map[k].sort((x, y) => {
        const yd = (x.anio || 0) - (y.anio || 0);
        if (yd !== 0) return yd;
        const tx = x.contraprestacion?.tipo ?? "";
        const ty = y.contraprestacion?.tipo ?? "";
        const tc = tx.localeCompare(ty);
        if (tc !== 0) return tc;
        return (x.unidad_numero || 0) - (y.unidad_numero || 0);
      });
    });

    return periods.map((p) => ({ period: p, items: map[p.key] || [] }));
  }, [agreementInfo, renewals, seguimientosFiltrados, contraprestacionesFiltradas, agreementYears]);

  // 🆕 Verificar si el periodo es futuro
  const isPeriodoFuturo = (s: Seguimiento): boolean => {
    const c = s.contraprestacion;
    if (!c) return false;

    // Verificar por agreement_year
    if (c.agreement_year_id) {
      const year = agreementYears.find(y => String(y.id) === String(c.agreement_year_id));
      if (year && year.year_start) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const inicio = new Date(year.year_start);
        inicio.setHours(0, 0, 0, 0);
        return hoy < inicio; // Si hoy es antes del inicio, es futuro
      }
    }

    // Verificar por periodo_inicio
    if (c.periodo_inicio) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const inicio = new Date(c.periodo_inicio);
      inicio.setHours(0, 0, 0, 0);
      return hoy < inicio;
    }

    return false;
  };

  const handleToggleEjecutado = async (s: Seguimiento) => {
    if (!(role === "admin" || role === "Admin" || role === "Administrador")) {
      alert("Solo los administradores pueden cambiar el estado.");
      return;
    }

    // 🆕 Validar que no sea periodo futuro
    if (isPeriodoFuturo(s)) {
      alert("⚠️ No se puede registrar cumplimiento en periodos futuros.\nEspere a que inicie el periodo para registrar evidencias.");
      return;
    }

    if (s.id.startsWith("dummy_")) {
      const renewal_to_set = s.renewal_id ?? s.contraprestacion?.renewal_id ?? null;
      try {
        const insertObj: any = {
          contraprestacion_id: s.contraprestacion_id,
          unidad_numero: s.unidad_numero,
          estado: "Cumplido",
          ejecutado: true,
          responsable: userId,
          fecha_verificacion: new Date().toISOString().split("T")[0],
          renewal_id: renewal_to_set,
        };
        insertObj["año"] = s.anio;

        const { error: insertError } = await supabase.from("contraprestaciones_seguimiento").insert(insertObj);
        if (insertError) {
          console.error("Error creando seguimiento:", insertError);
          alert("Error al crear el registro: " + insertError.message);
        } else {
          await loadAllData(resolvedAgreementId!);
        }
      } catch (err: any) {
        console.error("Error:", err);
        alert("Error creando seguimiento: " + (err?.message || String(err)));
      }
      return;
    }

    const nuevoEjecutado = !s.ejecutado;
    const nuevoEstado = nuevoEjecutado ? "Cumplido" : "Pendiente";
    const payload: any = { ejecutado: nuevoEjecutado, estado: nuevoEstado };

    if (nuevoEjecutado) {
      payload.responsable = userId || null;
      payload.fecha_verificacion = new Date().toISOString().split("T")[0];
    } else {
      payload.responsable = null;
      payload.fecha_verificacion = null;
    }

    try {
      const { error: updateError } = await supabase.from("contraprestaciones_seguimiento").update(payload).eq("id", s.id);
      if (updateError) {
        console.error("Error actualizando:", updateError);
        alert("Error al actualizar: " + updateError.message);
      } else {
        await loadAllData(resolvedAgreementId!);
      }
    } catch (err: any) {
      console.error("Error:", err);
      alert("Error: " + (err?.message || String(err)));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, s: Seguimiento) => {
    if (!(role === "admin" || role === "Admin" || role === "Administrador")) {
      alert("Solo los administradores pueden subir evidencias.");
      return;
    }

    // 🆕 Validar que no sea periodo futuro
    if (isPeriodoFuturo(s)) {
      alert("⚠️ No se puede subir evidencias en periodos futuros.\nEspere a que inicie el periodo para registrar evidencias.");
      e.target.value = ""; // Limpiar el input
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF.");
      return;
    }

    setUploadingId(s.id);
    try {
      const sanitizeFilename = (filename: string): string => {
        const ext = filename.substring(filename.lastIndexOf('.'));
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
        
        const sanitized = nameWithoutExt
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .replace(/_+/g, "_")
          .substring(0, 100);
        
        return `${sanitized}${ext}`;
      };

      const sanitizedFileName = sanitizeFilename(file.name);
      const timestamp = Date.now();
      const filePath = `${resolvedAgreementId}/${s.contraprestacion_id}/${s.id}_${timestamp}_${sanitizedFileName}`;
      
      const { error: uploadError } = await supabase.storage.from("evidencias").upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("evidencias").getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      if (s.id.startsWith("dummy_")) {
        const renewal_to_set = s.renewal_id ?? s.contraprestacion?.renewal_id ?? null;
        const insertObj: any = {
          contraprestacion_id: s.contraprestacion_id,
          unidad_numero: s.unidad_numero,
          estado: "Cumplido",
          ejecutado: true,
          responsable: userId,
          fecha_verificacion: new Date().toISOString().split("T")[0],
          evidencia_url: publicUrl,
          renewal_id: renewal_to_set,
        };
        insertObj["año"] = s.anio;

        const { error: insertError } = await supabase.from("contraprestaciones_seguimiento").insert(insertObj);
        if (insertError) {
          console.error("Error creando seguimiento con evidencia:", insertError);
          alert("Error: " + insertError.message);
        } else {
          await loadAllData(resolvedAgreementId!);
        }
      } else {
        const { error: updateError } = await supabase.from("contraprestaciones_seguimiento").update({ evidencia_url: publicUrl }).eq("id", s.id);
        if (updateError) throw updateError;
        await loadAllData(resolvedAgreementId!);
      }
    } catch (err: any) {
      console.error("Error subiendo evidencia:", err);
      alert("Error: " + (err.message || "Error desconocido"));
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) return <p className="text-center mt-4">Cargando...</p>;
  if (error) {
    return (
      <div className="container mt-4" style={{ maxWidth: 1000 }}>
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error}</p>
          <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>🔙 Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 1000 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-primary mb-0">📂 Cumplimiento de Contraprestaciones</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>🔙 Volver</button>
      </div>

      <div className="mb-3">
        <strong>Convenio:</strong> {agreementInfo?.name ?? "-"} <br />
        <small className="text-muted">
          Firma: {agreementInfo?.signature_date ? formatDate(agreementInfo.signature_date) : "-"} — Vence: {agreementInfo?.expiration_date ? formatDate(agreementInfo.expiration_date) : "-"}
        </small>
      </div>

      {/* 🆕 PESTAÑAS DE SUBTIPOS */}
      {loadingSubtypes ? (
        <div className="mb-4 p-3 bg-primary bg-opacity-10 rounded">
          <p className="mb-0">Cargando subtipos...</p>
        </div>
      ) : subtypes.length > 0 ? (
        <div className="mb-4">
          <div className="d-flex flex-wrap gap-2 border-bottom border-2 border-secondary pb-2">
            {subtypes.map((subtype) => (
              <button
                key={subtype.id}
                onClick={() => setSelectedSubtype(subtype.id)}
                className={`btn ${
                  selectedSubtype === subtype.id
                    ? "btn-primary fw-bold"
                    : "btn-outline-secondary"
                }`}
              >
                📚 {subtype.subtipo_nombre}
              </button>
            ))}
          </div>
          
          {selectedSubtype && (
            <div className="mt-3 p-3 bg-primary bg-opacity-10 rounded border-start border-primary border-4">
              <p className="mb-0 text-primary">
                <strong>Trabajando en:</strong> {subtypes.find(s => s.id === selectedSubtype)?.subtipo_nombre}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {grouped.length === 0 ? (
        <div className="alert alert-info">
          {subtypes.length > 0 && !selectedSubtype
            ? "Seleccione un subtipo para ver las contraprestaciones"
            : "No hay contraprestaciones registradas."}
        </div>
      ) : (
        grouped
          .filter(({ items }) => items.length > 0)
          .map(({ period, items }) => (
          <div key={period.key} className="card mb-3">
            <div className="card-body">
              <h6 style={{ marginBottom: 12 }}>
                📁 <strong>{period.title}</strong>{' '}
                <small className="text-muted">{period.renewalId ? "(Renovación)" : "(Vigencia original)"}</small>
              </h6>

              {items.length === 0 ? (
                <div className="text-muted">No hay registros.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th style={{ width: 100 }}>Unidad</th>
                        <th style={{ width: 120 }}>Estado</th>
                        <th style={{ width: 160 }}>Evidencia</th>
                        {(role === "admin" || role === "Admin" || role === "Administrador") && <th style={{ width: 120 }}>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((s) => (
                        <tr key={s.id}>
                          <td>{s.contraprestacion?.tipo ?? "-"}</td>
                          <td style={{ maxWidth: 360, whiteSpace: 'pre-wrap' }}>{s.contraprestacion?.descripcion ?? "-"}</td>
                          <td className="text-center">
                            {s.contraprestacion?.unidades_comprometidas && s.contraprestacion.unidades_comprometidas > 1 ? (
                              <span className="badge bg-secondary">{s.unidad_numero}/{s.contraprestacion.unidades_comprometidas}</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            {s.estado === "Cumplido" ? (
                              <span className="badge bg-success">Cumplido</span>
                            ) : s.estado === "En proceso" ? (
                              <span className="badge bg-info text-dark">En proceso</span>
                            ) : s.estado === "Incumplido" ? (
                              <span className="badge bg-danger">Incumplido</span>
                            ) : (
                              <span className="badge bg-warning text-dark">Pendiente</span>
                            )}
                          </td>
                          <td>
                            {s.evidencia_url ? (
                              <a href={s.evidencia_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info">📎 Ver PDF</a>
                            ) : (role === "admin" || role === "Admin" || role === "Administrador") ? (
                              isPeriodoFuturo(s) ? (
                                <span className="text-muted small">📅 Periodo futuro</span>
                              ) : (
                                <input type="file" accept="application/pdf" disabled={uploadingId === s.id} onChange={(e) => handleFileUpload(e, s)} />
                              )
                            ) : (
                              <span className="text-muted">Solo admins</span>
                            )}
                          </td>

                          {(role === "admin" || role === "Admin" || role === "Administrador") && (
                            <td>
                              {isPeriodoFuturo(s) ? (
                                <span className="text-muted small">📅 Futuro</span>
                              ) : (
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                  <input type="checkbox" checked={s.ejecutado} onChange={() => handleToggleEjecutado(s)} disabled={uploadingId === s.id} />
                                  {uploadingId === s.id && <small>Subiendo...</small>}
                                </label>
                              )}
                            </td>
                          )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }








