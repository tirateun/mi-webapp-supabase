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
}

interface SeguimientoRaw {
  id: string;
  contraprestacion_id: string | null;
  año: number | null;
  estado: string | null;
  observaciones: string | null;
  fecha_verificacion: string | null;
  responsable: string | null;
  evidencia_url: string | null;
  ejecutado: boolean | null;
  anio?: number | null;
  renewal_id?: string | null;
  periodo?: string;
  contraprestaciones?: {
    id: string;
    tipo: string;
    descripcion: string | null;
    renewal_id?: string | null;
  } | null;
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
  contraprestacion?: {
    id: string;
    tipo: string;
    descripcion: string | null;
    renewal_id?: string | null;
  } | null;
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
        .from('agreements')
        .select('id')
        .eq('id', id)
        .single();

      if (!agreementError && agreementData) {
        return id;
      }

      // Verificar si es un id de renovación
      const { data: renewalData, error: renewalError } = await supabase
        .from('agreement_renewals')
        .select('agreement_id')
        .eq('id', id)
        .single();

      if (!renewalError && renewalData) {
        return renewalData.agreement_id;
      }

      return null;
    } catch (error) {
      console.error('Error resolviendo agreement_id:', error);
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

      const { data: cData, error: cErr } = await supabase
        .from("contraprestaciones")
        .select("id, tipo, descripcion, renewal_id, agreement_id, periodo_inicio, periodo_fin")
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

      const { data: sData, error: sErr } = await supabase
        .from("contraprestaciones_seguimiento")
        .select("*, contraprestaciones(id, tipo, descripcion, renewal_id)")
        .in("contraprestacion_id", contraprestacionIds)
        .order("año", { ascending: true })
        .order("fecha_verificacion", { ascending: true });
      if (sErr) throw sErr;

      const raw: SeguimientoRaw[] = sData || [];
      const mapped: Seguimiento[] = raw.map((r) => ({
        id: r.id,
        contraprestacion_id: (r.contraprestacion_id as string) ?? (r as any).contraprestacion_id,
        año: Number(r.año ?? r.anio ?? 0),
        estado: r.estado ?? null,
        observaciones: r.observaciones ?? null,
        fecha_verificacion: r.fecha_verificacion ?? null,
        responsable: r.responsable ?? null,
        evidencia_url: r.evidencia_url ?? null,
        ejecutado: !!r.ejecutado,
        renewal_id: r.renewal_id ?? null,
        contraprestacion: r.contraprestaciones ?? null,
      }));

      setSeguimientos(mapped);
    } catch (err: any) {
      console.error("Error cargando contraprestaciones/evidencias:", err);
      alert("Error al cargar datos. Revisa consola.");
      setContraprestaciones([]);
      setSeguimientos([]);
      setRenewals([]);
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const periods: { key: string; title: string; start: Date | null; end: Date | null; renewalId: string | null }[] = [];

    if (agreementInfo) {
      let start: Date | null = null;
      let end: Date | null = null;

      if (agreementInfo.signature_date) {
        start = parseLocalDate(agreementInfo.signature_date);
      }
      if (agreementInfo.expiration_date) {
        end = parseLocalDate(agreementInfo.expiration_date);
      } else if (agreementInfo.signature_date && agreementInfo.duration_years) {
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

    const map: Record<string, Seguimiento[]> = {};
    periods.forEach((p) => { map[p.key] = []; });

    const findPeriodKeyForSeguimiento = (s: Seguimiento) => {
      // Caso 1: si tiene renewal_id, pertenece estrictamente a esa renovación.
      if (s.renewal_id) {
        const rr = periods.find((p) => p.renewalId === s.renewal_id);
        if (rr) return rr.key;
      }

      // Caso 2: si la contraprestación tiene año, usarlo
      if (s.año && s.año > 0) {
        const foundByYear = periods.find((p) => {
          if (!p.start || !p.end) return false;
          return s.año >= p.start.getFullYear() && s.año <= p.end.getFullYear();
        });
        if (foundByYear) return foundByYear.key;
      }

      // Caso 3: intentar ubicar por fecha de verificación
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

      // Caso 4: fallback - asignar al periodo original
      return "original";
    };

    // Crear un mapeo de contraprestaciones por ID para acceso rápido
    const contraprestacionesMap = new Map(contraprestaciones.map(c => [c.id, c]));

    (seguimientos || []).forEach((s) => {
      const key = findPeriodKeyForSeguimiento(s) ?? "original";
      if (!map[key]) map[key] = [];
      
      // Obtener la contraprestación completa para mostrar información adicional
      const contraprestacionCompleta = contraprestacionesMap.get(s.contraprestacion_id) || s.contraprestacion;
      
      map[key].push({ 
        ...s, 
        contraprestacion: contraprestacionCompleta,
        periodo: periods.find((p) => p.key === key)?.title ?? "" 
      });
    });

    // También agregar contraprestaciones sin seguimientos al periodo correspondiente
    contraprestaciones.forEach(c => {
      if (!seguimientos.some(s => s.contraprestacion_id === c.id)) {
        // Esta contraprestación no tiene seguimientos, agregar un registro vacío
        const dummySeguimiento: Seguimiento = {
          id: `dummy_${c.id}`,
          contraprestacion_id: c.id,
          año: 1, // Año por defecto
          estado: null,
          observaciones: null,
          fecha_verificacion: null,
          responsable: null,
          evidencia_url: null,
          ejecutado: false,
          renewal_id: null,
          contraprestacion: c,
          periodo: ""
        };
        
        const key = "original"; // Asignar al periodo original
        if (!map[key]) map[key] = [];
        map[key].push({ ...dummySeguimiento, periodo: periods.find((p) => p.key === key)?.title ?? "" });
      }
    });

    Object.keys(map).forEach((k) => {
      map[k].sort((x, y) => {
        const yearDiff = (x.año || 0) - (y.año || 0);
        if (yearDiff !== 0) return yearDiff;
        const tx = x.contraprestacion?.tipo ?? "";
        const ty = y.contraprestacion?.tipo ?? "";
        return tx.localeCompare(ty);
      });
    });

    return periods.map((p) => ({ period: p, items: map[p.key] || [] }));
  }, [agreementInfo, renewals, seguimientos, contraprestaciones]);

  const handleToggleEjecutado = async (s: Seguimiento) => {
    if (!(role === "admin" || role === "Admin" || role === "Administrador")) {
      alert("Solo los administradores pueden cambiar el estado de cumplimiento.");
      return;
    }

    // Si es un seguimiento dummy (sin ID real), crear uno nuevo
    if (s.id.startsWith('dummy_')) {
      const { error: insertError } = await supabase
        .from("contraprestaciones_seguimiento")
        .insert({
          contraprestacion_id: s.contraprestacion_id,
          año: s.año,
          estado: "Cumplido",
          ejecutado: true,
          responsable: userId,
          fecha_verificacion: new Date().toISOString().split("T")[0]
        });

      if (insertError) {
        console.error("Error creando seguimiento:", insertError);
        alert("Error al crear el registro de cumplimiento: " + insertError.message);
      } else {
        await loadAllData(resolvedAgreementId!);
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

    const { error: updateError } = await supabase.from("contraprestaciones_seguimiento").update(payload).eq("id", s.id);
    if (updateError) {
      console.error("Error actualizando seguimiento:", updateError);
      alert("Error al actualizar el estado: " + updateError.message);
    } else {
      await loadAllData(resolvedAgreementId!);
    }
  };

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

      // Si es un seguimiento dummy, crear uno nuevo con la evidencia
      if (s.id.startsWith('dummy_')) {
        const { error: insertError } = await supabase
          .from("contraprestaciones_seguimiento")
          .insert({
            contraprestacion_id: s.contraprestacion_id,
            año: s.año,
            estado: "Cumplido",
            ejecutado: true,
            responsable: userId,
            fecha_verificacion: new Date().toISOString().split("T")[0],
            evidencia_url: publicUrl
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









