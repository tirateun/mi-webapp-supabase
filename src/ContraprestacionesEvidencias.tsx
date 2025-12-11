// src/ContraprestacionesEvidencias.tsx
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
  periodo?: number | null; // si existe en tu esquema
}

interface SeguimientoRaw {
  id: string;
  contraprestacion_id: string | null;
  año?: number | null;
  anio?: number | null;
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
  año: number;
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

  const resolveAgreementId = async (id: string) => {
    try {
      // Verificar si existe en agreements
      const { data: agreementData, error: agreementError } = await supabase
        .from("agreements")
        .select("id")
        .eq("id", id)
        .single();

      if (!agreementError && agreementData) {
        return id;
      }

      // Verificar si es un id de renovación
      const { data: renewalData, error: renewalError } = await supabase
        .from("agreement_renewals")
        .select("agreement_id")
        .eq("id", id)
        .single();

      if (!renewalError && renewalData) {
        return renewalData.agreement_id;
      }

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

      // 3) contraprestaciones
      const { data: cData, error: cErr } = await supabase
        .from("contraprestaciones")
        // NO seleccionar campos inciertos — seleccionar los que usualmente existan
        .select("id, tipo, descripcion, renewal_id, agreement_id, periodo_inicio, periodo_fin, agreement_year_id")
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

      // 4) seguimientos: traemos seguimientos que pertenezcan a esas contraprestaciones
      //    Traemos también la contraprestacion anidada (para poder calcular año si falta)
      const { data: sData, error: sErr } = await supabase
        .from("contraprestaciones_seguimiento")
        // no pedimos campos inexistentes de la contraprestacion; pedimos campos seguros
        .select("*, contraprestaciones(id, tipo, descripcion, periodo_inicio, periodo_fin, periodo, renewal_id, agreement_year_id)")
        .in("contraprestacion_id", contraprestacionIds)
        .order("año", { ascending: true })
        .order("fecha_verificacion", { ascending: true });
      if (sErr) throw sErr;

      const raw: SeguimientoRaw[] = sData || [];

      // helper para determinar año de manera robusta
      const determineYear = (r: SeguimientoRaw, c?: Partial<Contraprestacion> | null): number => {
        // 1) priorizar campo del seguimiento
        const valFromSeg = r.año ?? r.anio;
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
        const añoCalculado = determineYear(r, c);
        return {
          id: r.id,
          contraprestacion_id: (r.contraprestacion_id as string) ?? (r as any).contraprestacion_id ?? "",
          año: añoCalculado,
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
    /* =======================
       1. Construir períodos
       ======================= */
    const periods: {
      key: string;
      title: string;
      start: Date | null;
      end: Date | null;
      renewalId: string | null;
    }[] = [];

    // Período original del convenio
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

    /* =======================
       2. Inicializar mapa
       ======================= */
    const map: Record<string, Seguimiento[]> = {};
    periods.forEach((p) => { map[p.key] = []; });

    /* =======================
       3. Función CORRECTA
          de asignación
       ======================= */
    const findPeriodKeyForSeguimiento = (s: Seguimiento) => {
      // Caso 1: si tiene renewal_id, pertenece estrictamente a esa renovación.
      if (s.renewal_id) {
        const rr = periods.find((p) => p.renewalId === s.renewal_id);
        if (rr) return rr.key;
      }

      // Caso 2: si el seguimiento tiene fecha_verificacion -> ubicar por fecha
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

      // Caso 3: intentar ubicar por la contraprestacion (si tiene periodos definidos por inicio/fin)
      const c = s.contraprestacion;
      if (c) {
        const inicio = c.periodo_inicio ? parseLocalDate(c.periodo_inicio) : null;
        const fin = c.periodo_fin ? parseLocalDate(c.periodo_fin) : null;
        if (inicio || fin) {
          const found = periods.find((p) => {
            if (!p.start && !p.end) return false;
            // consideramos overlap si inicio/fin del item cae dentro del periodo p
            const itemStart = inicio ?? new Date(0);
            const itemEnd = fin ?? new Date(8640000000000000);
            const afterStart = p.start ? itemEnd >= p.start : true;
            const beforeEnd = p.end ? itemStart <= p.end : true;
            return afterStart && beforeEnd;
          });
          if (found) return found.key;
        }
      }

      // Caso 4: fallback - asignar al periodo original
      return "original";
    };

    // Crear mapa de contraprestaciones por ID
    const contraprestacionesMap = new Map(contraprestaciones.map(c => [c.id, c]));

    (seguimientos || []).forEach((s) => {
      const key = findPeriodKeyForSeguimiento(s) ?? "original";

      const contraprestacionCompleta = contraprestacionesMap.get(s.contraprestacion_id) || s.contraprestacion || null;

      map[key].push({
        ...s,
        contraprestacion: contraprestacionCompleta,
        periodo: periods.find((p) => p.key === key)?.title ?? ""
      });
    });

    // Agregar contraprestaciones sin seguimientos como dummy en el periodo correspondiente
    contraprestaciones.forEach(c => {
      const tieneSeguimiento = seguimientos.some(s => s.contraprestacion_id === c.id);
      if (tieneSeguimiento) return;

      // calcular año real si hay periodo_inicio y signature_date
      const calcularAnioReal = () => {
        if (!c.periodo_inicio || !agreementInfo?.signature_date) return (c as any).periodo ?? 1;
        const inicio = new Date(c.periodo_inicio);
        const firma = new Date(agreementInfo.signature_date);
        return inicio.getFullYear() - firma.getFullYear() + 1;
      };

      const dummySeguimiento: Seguimiento = {
        id: `dummy_${c.id}`,
        contraprestacion_id: c.id,
        año: calcularAnioReal(),
        estado: null,
        observaciones: null,
        fecha_verificacion: null,
        responsable: null,
        evidencia_url: null,
        ejecutado: false,
        renewal_id: c.renewal_id ?? null,
        contraprestacion: c,
        periodo: periods[0]?.title ?? ""
      };

      // intentar asignar a período por overlap con periodo_inicio/periodo_fin, sino original
      let key = "original";
      if (c.periodo_inicio || c.periodo_fin) {
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

    // ordenar
    Object.keys(map).forEach((k) => {
      map[k].sort((x, y) => {
        const yd = (x.año || 0) - (y.año || 0);
        if (yd !== 0) return yd;
        const tx = x.contraprestacion?.tipo ?? "";
        const ty = y.contraprestacion?.tipo ?? "";
        return tx.localeCompare(ty);
      });
    });

    return periods.map((p) => ({ period: p, items: map[p.key] || [] }));
  }, [agreementInfo, renewals, seguimientos, contraprestaciones]);

  // ---------------------------
  // Toggle ejecutado (crear o actualizar seguimiento)
  // ---------------------------
  const handleToggleEjecutado = async (s: Seguimiento) => {
    if (!(role === "admin" || role === "Admin" || role === "Administrador")) {
      alert("Solo los administradores pueden cambiar el estado de cumplimiento.");
      return;
    }

    // Si es un seguimiento dummy (sin ID real), crear uno nuevo
    if (s.id.startsWith("dummy_")) {
      // Al crear, incluir renewal_id si la contraprestacion o el seguimiento dummy lo traen
      const renewal_to_set = s.renewal_id ?? s.contraprestacion?.renewal_id ?? null;
      try {
        const { error: insertError } = await supabase
          .from("contraprestaciones_seguimiento")
          .insert({
            contraprestacion_id: s.contraprestacion_id,
            año: s.año,
            estado: "Cumplido",
            ejecutado: true,
            responsable: userId,
            fecha_verificacion: new Date().toISOString().split("T")[0],
            renewal_id: renewal_to_set
          });
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

    // Si no es dummy -> actualizar registro existente
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
      const { error: uploadError } = await supabase.storage.from("evidencias").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("evidencias").getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      // si es dummy -> crear seguimiento con evidencia y renewal_id si aplica
      if (s.id.startsWith("dummy_")) {
        const renewal_to_set = s.renewal_id ?? s.contraprestacion?.renewal_id ?? null;
        const { error: insertError } = await supabase
          .from("contraprestaciones_seguimiento")
          .insert({
            contraprestacion_id: s.contraprestacion_id,
            año: s.año,
            estado: "Cumplido",
            ejecutado: true,
            responsable: userId,
            fecha_verificacion: new Date().toISOString().split("T")[0],
            evidencia_url: publicUrl,
            renewal_id: renewal_to_set
          });

        if (insertError) {
          console.error("Error creando seguimiento con evidencia:", insertError);
          alert("Error al crear el registro: " + insertError.message);
        } else {
          await loadAllData(resolvedAgreementId!);
        }
      } else {
        const { error: updateError } = await supabase
          .from("contraprestaciones_seguimiento")
          .update({ evidencia_url: publicUrl })
          .eq("id", s.id);

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
          <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>
            🔙 Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 1000 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-primary mb-0">📂 Cumplimiento de Contraprestaciones</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>
          🔙 Volver
        </button>
      </div>

      <div className="mb-3">
        <strong>Convenio:</strong> {agreementInfo?.name ?? "-"} <br />
        <small className="text-muted">
          Firma: {agreementInfo?.signature_date ? formatDate(agreementInfo.signature_date) : "-"} — Vence:{" "}
          {agreementInfo?.expiration_date ? formatDate(agreementInfo.expiration_date) : "Sin dato"}
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
                📁 <strong>{period.title}</strong>{" "}
                <small className="text-muted" style={{ marginLeft: 8 }}>
                  {period.renewalId ? "(Renovación)" : "(Vigencia original)"}
                </small>
              </h6>

              {items.length === 0 ? (
                <div className="text-muted">No hay registros para este periodo.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 100 }}>Año</th>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th style={{ width: 120 }}>Estado</th>
                        <th style={{ width: 160 }}>Evidencia</th>
                        {role === "admin" || role === "Admin" || role === "Administrador" ? <th style={{ width: 120 }}>Acciones</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((s) => (
                        <tr key={s.id}>
                          <td>{s.año ? formatAnio(s.año) : "-"}</td>
                          <td>{s.contraprestacion?.tipo ?? "-"}</td>
                          <td style={{ maxWidth: 360, whiteSpace: "pre-wrap" }}>{s.contraprestacion?.descripcion ?? "-"}</td>
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
                              <a href={s.evidencia_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info">
                                📎 Ver PDF
                              </a>
                            ) : role === "admin" || role === "Admin" || role === "Administrador" ? (
                              <input type="file" accept="application/pdf" disabled={uploadingId === s.id} onChange={(e) => handleFileUpload(e, s)} />
                            ) : (
                              <span className="text-muted">Solo administradores</span>
                            )}
                          </td>

                          {role === "admin" || role === "Admin" || role === "Administrador" ? (
                            <td>
                              <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <input
                                  type="checkbox"
                                  checked={s.ejecutado}
                                  onChange={() => handleToggleEjecutado(s)}
                                  disabled={uploadingId === s.id}
                                />
                                {uploadingId === s.id && <small>Subiendo...</small>}
                              </label>
                            </td>
                          ) : (
                            <td>
                              <span className="text-muted">Solo administradores</span>
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









