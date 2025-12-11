// src/ContraprestacionesEvidencias.tsx
// Versión consolidada y robusta del componente de cumplimiento de contraprestaciones.
// Nota: integra las correcciones discutidas: manejo de años, asignación por agreement_year_id,
// cálculo de years/periodos, creación de seguimientos dummy, subida de evidencias y creación/actualización.

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
  periodo_inicio?: string | null; // ISO date string
  periodo_fin?: string | null; // ISO date string
  renewal_id?: string | null;
  agreement_year_id?: string | null; // UUID of agreement_years
  periodo?: number | null; // fallback numeric year relative to signature
}

interface SeguimientoRaw {
  id: string;
  contraprestacion_id: string | null;
  anio?: number | null; // some DBs use this name
  ["año"]?: number | null; // others use tilde
  estado?: string | null;
  observaciones?: string | null;
  fecha_verificacion?: string | null; // ISO date
  responsable?: string | null;
  evidencia_url?: string | null;
  ejecutado?: boolean | null;
  renewal_id?: string | null;
  contraprestaciones?: Partial<Contraprestacion> | null; // nested join
}

interface Seguimiento {
  id: string;
  contraprestacion_id: string;
  anio: number; // numeric year (1,2,3...)
  estado: string | null;
  observaciones: string | null;
  fecha_verificacion: string | null;
  responsable: string | null;
  evidencia_url: string | null;
  ejecutado: boolean;
  renewal_id: string | null;
  periodo?: string; // human title of period
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
      await loadAllData(realAgreementId);
    };

    resolveAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputId]);

  // ---------------------------
  // loadAllData: carga todo
  // ---------------------------
  const loadAllData = async (agreementId: string) => {
    try {
      // 1) agreement
      const { data: agData, error: agErr } = await supabase
        .from("agreements")
        .select("id, name, signature_date, duration_years, expiration_date")
        .eq("id", agreementId)
        .maybeSingle();
      if (agErr) throw agErr;
      setAgreementInfo(agData || null);

      // 2) renovaciones
      const { data: rData, error: rErr } = await supabase
        .from("agreement_renewals")
        .select("*")
        .eq("agreement_id", agreementId)
        .order("changed_at", { ascending: true });
      if (rErr) throw rErr;
      setRenewals((rData || []) as Renewal[]);

      // 3) agreement_years (años del convenio)
      const { data: yData, error: yErr } = await supabase
        .from("agreement_years")
        .select("id, year_number, year_start, year_end")
        .eq("agreement_id", agreementId)
        .order("year_number", { ascending: true });
      if (yErr) throw yErr;
      setAgreementYears(yData || []);

      // 4) contraprestaciones
      const { data: cData, error: cErr } = await supabase
        .from("contraprestaciones")
        .select("id, tipo, descripcion, renewal_id, agreement_id, periodo_inicio, periodo_fin, agreement_year_id, periodo")
        .eq("agreement_id", agreementId)
        .order("tipo", { ascending: true });
      if (cErr) throw cErr;
      const cList = (cData || []) as Contraprestacion[];
      setContraprestaciones(cList);

      const contraprestacionIds = cList.map((c) => c.id).filter(Boolean);
      if (contraprestacionIds.length === 0) {
        setSeguimientos([]);
        setLoading(false);
        return;
      }

      // 5) seguimientos: traemos seguimientos que pertenezcan a esas contraprestaciones
      const { data: sData, error: sErr } = await supabase
        .from("contraprestaciones_seguimiento")
        .select("*, contraprestaciones(id, tipo, descripcion, periodo_inicio, periodo_fin, periodo, renewal_id, agreement_year_id)")
        .in("contraprestacion_id", contraprestacionIds)
        .order("fecha_verificacion", { ascending: true });
      if (sErr) throw sErr;

      const raw: SeguimientoRaw[] = (sData || []) as SeguimientoRaw[];

      // helper para determinar año de manera robusta
      const determineYear = (r: SeguimientoRaw, c?: Partial<Contraprestacion> | null): number => {
        // 1) priorizar campo del seguimiento (anio o "año")
        const valFromSeg = r.anio ?? (r as any)["año"];
        if (valFromSeg !== undefined && valFromSeg !== null) {
          const n = Number(valFromSeg);
          if (!isNaN(n) && n > 0) return n;
        }

        // 2) si la contraprestacion trae un campo 'periodo' numérico, usarlo
        if (c) {
          const per = (c as any).periodo;
          if (per !== undefined && per !== null) {
            const np = Number(per);
            if (!isNaN(np) && np > 0) return np;
          }
        }

        // 3) si la contraprestacion tiene periodo_inicio y tenemos signature_date -> calcular diferencia en años
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

        // 4) fallback
        return 1;
      };

      const mapped: Seguimiento[] = raw.map((r) => {
        const c = r.contraprestaciones ?? null;
        const anioCalculado = determineYear(r, c);
        return {
          id: r.id,
          contraprestacion_id: (r.contraprestacion_id as string) ?? (r as any).contraprestacion_id ?? "",
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

      // Ordenar client-side por anio asc y luego por fecha_verificacion asc
      mapped.sort((a, b) => {
        const y = (a.anio || 0) - (b.anio || 0);
        if (y !== 0) return y;
        const ta = a.fecha_verificacion ? new Date(a.fecha_verificacion).getTime() : 0;
        const tb = b.fecha_verificacion ? new Date(b.fecha_verificacion).getTime() : 0;
        return ta - tb;
      });

      setSeguimientos(mapped);
    } catch (err: any) {
      console.error("Error cargando contraprestaciones/evidencias:", err);
      alert("Error al cargar datos. Revisa consola.");
      setContraprestaciones([]);
      setSeguimientos([]);
      setRenewals([]);
      setAgreementInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Agrupar por periodos / renovaciones
  // ---------------------------
  const grouped = useMemo(() => {
    const periods: { key: string; title: string; start: Date | null; end: Date | null; renewalId: string | null }[] = [];

    // Período original
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

    // Renovaciones
    (renewals || []).forEach((r) => {
      const oldExp = parseLocalDate(r.old_expiration_date ?? null);
      const newExp = parseLocalDate(r.new_expiration_date ?? null);
      const start = oldExp ? addDays(oldExp, 1) : null;
      const end = newExp ?? null;
      const title = start && end ? `${formatDate(start)} — ${formatDate(end)}` : `Renovación ${r.changed_at ? formatDate(r.changed_at) : ""}`;
      periods.push({ key: r.id, title, start, end, renewalId: r.id });
    });

    // agreement_years como periodos (mejor granularidad)
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
      // 0) Si la contraprestacion tiene agreement_year_id -> usarla
      const ayId = s.contraprestacion?.agreement_year_id ?? (s as any).agreement_year_id;
      if (ayId) {
        const py = periods.find((p) => p.key === String(ayId));
        if (py) return py.key;
      }

      // 1) Si el seguimiento está ligado a una renovación
      if (s.renewal_id) {
        const rr = periods.find((p) => p.renewalId === s.renewal_id);
        if (rr) return rr.key;
      }

      // 2) Si tiene fecha_verificacion, ubicar por fecha
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

      // 3) Si la contraprestacion tiene campo periodo numérico -> emparejar con year_number
      const periodoNum = (s.contraprestacion as any)?.periodo ?? (s as any).anio ?? (s as any)["año"];
      if (periodoNum) {
        const foundByYearNumber = (agreementYears || []).find((y) => Number(y.year_number) === Number(periodoNum));
        if (foundByYearNumber) return String(foundByYearNumber.id);
      }

      // 4) Intentar por overlap con periodo_inicio/periodo_fin de la contraprestacion
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

      // fallback
      return "original";
    };

    const contraprestacionesMap = new Map(contraprestaciones.map(c => [c.id, c]));

    (seguimientos || []).forEach((s) => {
      const key = findPeriodKeyForSeguimiento(s) ?? "original";
      const contraprestacionCompleta = contraprestacionesMap.get(s.contraprestacion_id) || s.contraprestacion || null;
      if (!map[key]) map[key] = [];
      map[key].push({ ...s, contraprestacion: contraprestacionCompleta, periodo: periods.find((p) => p.key === key)?.title ?? "" });
    });

    // Agregar contraprestaciones sin seguimientos (dummy) y asignarlas correctamente
    contraprestaciones.forEach(c => {
      const tieneSeguimiento = seguimientos.some(s => s.contraprestacion_id === c.id);
      if (tieneSeguimiento) return;

      const calcularAnioReal = () => {
        if (!c.periodo_inicio || !agreementInfo?.signature_date) return (c as any).periodo ?? 1;
        const inicio = new Date(c.periodo_inicio);
        const firma = new Date(agreementInfo.signature_date);
        return inicio.getFullYear() - firma.getFullYear() + 1;
      };

      const dummySeguimiento: Seguimiento = {
        id: `dummy_${c.id}`,
        contraprestacion_id: c.id,
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

      // Determinar key preferente: agreement_year_id -> periodo numérico -> overlap fechas -> original
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
    });

    // ordenar por año y tipo
    Object.keys(map).forEach((k) => {
      map[k].sort((x, y) => {
        const yd = (x.anio || 0) - (y.anio || 0);
        if (yd !== 0) return yd;
        const tx = x.contraprestacion?.tipo ?? "";
        const ty = y.contraprestacion?.tipo ?? "";
        return tx.localeCompare(ty);
      });
    });

    return periods.map((p) => ({ period: p, items: map[p.key] || [] }));
  }, [agreementInfo, renewals, seguimientos, contraprestaciones, agreementYears]);

  // ---------------------------
  // Toggle ejecutado (crear o actualizar seguimiento)
  // ---------------------------
  const handleToggleEjecutado = async (s: Seguimiento) => {
    if (!(role === "admin" || role === "Admin" || role === "Administrador")) {
      alert("Solo los administradores pueden cambiar el estado de cumplimiento.");
      return;
    }

    // Si es dummy -> crear
    if (s.id.startsWith("dummy_")) {
      const renewal_to_set = s.renewal_id ?? s.contraprestacion?.renewal_id ?? null;
      try {
        const insertObj: any = {
          contraprestacion_id: s.contraprestacion_id,
          estado: "Cumplido",
          ejecutado: true,
          responsable: userId,
          fecha_verificacion: new Date().toISOString().split("T")[0],
          renewal_id: renewal_to_set,
        };
        // usar la columna 'año' si existe en la BD
        insertObj["año"] = s.anio;

        const { error: insertError } = await supabase.from("contraprestaciones_seguimiento").insert(insertObj);
        if (insertError) {
          console.error("Error creando seguimiento:", insertError);
          alert("Error al crear el registro de cumplimiento: " + insertError.message);
        } else {
          await loadAllData(resolvedAgreementId!);
        }
      } catch (err: any) {
        console.error("Error creando seguimiento (catch):", err);
        alert("Error creando seguimiento: " + (err?.message || String(err)));
      }
      return;
    }

    // actualizar existente
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
        console.error("Error actualizando seguimiento:", updateError);
        alert("Error al actualizar el estado: " + updateError.message);
      } else {
        await loadAllData(resolvedAgreementId!);
      }
    } catch (err: any) {
      console.error("Error actualizando seguimiento (catch):", err);
      alert("Error al actualizar: " + (err?.message || String(err)));
    }
  };

  // ---------------------------
  // Subir evidencia (archivo)
  // ---------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, s: Seguimiento) => {
    if (!(role === "admin" || role === "Admin" || role === "Administrador")) {
      alert("Solo los administradores pueden subir evidencias.");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF como evidencia.");
      return;
    }

    setUploadingId(s.id);
    try {
      const filePath = `${resolvedAgreementId}/${s.contraprestacion_id}/${s.id}_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("evidencias").upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("evidencias").getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      if (s.id.startsWith("dummy_")) {
        const renewal_to_set = s.renewal_id ?? s.contraprestacion?.renewal_id ?? null;
        const insertObj: any = {
          contraprestacion_id: s.contraprestacion_id,
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
          alert("Error al crear el registro: " + insertError.message);
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
      alert("Error al subir la evidencia: " + (err.message || "Error desconocido"));
    } finally {
      setUploadingId(null);
    }
  };

  const formatAnio = (anio: number) => `${anio}° año`;

  if (loading) return <p className="text-center mt-4">Cargando contraprestaciones...</p>;
  if (error) {
    return (
      <div className="container mt-4" style={{ maxWidth: 1000 }}>
        <div className="alert alert-danger">
          <h4>Error al cargar los datos</h4>
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
          Firma: {agreementInfo?.signature_date ? formatDate(agreementInfo.signature_date) : "-"} — Vence: {agreementInfo?.expiration_date ? formatDate(agreementInfo.expiration_date) : "Sin dato"}
        </small>
      </div>

      {grouped.length === 0 ? (
        <div className="alert alert-info">
          <p className="mb-0">No hay contraprestaciones registradas para este convenio.</p>
          <p className="mb-0 small text-muted">Asegúrese de haber registrado las contraprestaciones anuales primero.</p>
        </div>
      ) : (
        grouped.map(({ period, items }) => (
          <div key={period.key} className="card mb-3">
            <div className="card-body">
              <h6 style={{ marginBottom: 12 }}>
                📁 <strong>{period.title}</strong>{' '}
                <small className="text-muted" style={{ marginLeft: 8 }}>{period.renewalId ? "(Renovación)" : "(Vigencia original)"}</small>
              </h6>

              {items.length === 0 ? (
                <div className="text-muted">No hay registros para este periodo.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th style={{ width: 120 }}>Estado</th>
                        <th style={{ width: 160 }}>Evidencia</th>
                        { (role === "admin" || role === "Admin" || role === "Administrador") ? <th style={{ width: 120 }}>Acciones</th> : null }
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((s) => (
                        <tr key={s.id}>
                          <td>{s.contraprestacion?.tipo ?? "-"}</td>
                          <td style={{ maxWidth: 360, whiteSpace: 'pre-wrap' }}>{s.contraprestacion?.descripcion ?? "-"}</td>
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
                              <input type="file" accept="application/pdf" disabled={uploadingId === s.id} onChange={(e) => handleFileUpload(e, s)} />
                            ) : (
                              <span className="text-muted">Solo administradores</span>
                            )}
                          </td>

                          { (role === "admin" || role === "Admin" || role === "Administrador") ? (
                            <td>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <input type="checkbox" checked={s.ejecutado} onChange={() => handleToggleEjecutado(s)} disabled={uploadingId === s.id} />
                                {uploadingId === s.id && <small>Subiendo...</small>}
                              </label>
                            </td>
                          ) : (
                            <td><span className="text-muted">Solo administradores</span></td>
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








