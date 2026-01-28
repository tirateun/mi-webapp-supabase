// src/MovilidadCumplimiento.tsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface MovilidadCumplimientoProps {
  movilidadId: string;
  onBack: () => void;
}

interface Movilidad {
  id: string;
  categoria: string;
  tipo_programa: string;
  direccion: string;
  documento_identidad?: string;
  codigo_matricula?: string;
  codigo_docente?: string;
  nombre_completo: string;
  pais_origen?: string;
  institucion_origen?: string;
  pais_destino?: string;
  institucion_destino?: string;
  destination_country?: string;
  destination_place?: string;
  nivel_academico?: string;
  escuela?: string;
  programa_especifico?: string;
  tipo_estancia?: string;
  periodo?: string;
  start_date?: string;
  end_date?: string;
  sede_rotacion?: string;
  especialidad_texto?: string;
  status: string;
  notes?: string;
  informe_texto?: string;
  informe_pdf_url?: string;
  informe_fecha?: string;
  informe_enviado?: boolean;
  informe_uploaded_by?: string;
  responsible_id: string;
  agreement?: { id: string; name: string; pais?: string };
  responsible?: { id: string; full_name: string; email: string };
}

const formatDateLocal = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  let fechaPura = dateString;
  if (dateString.includes("T")) {
    fechaPura = dateString.split("T")[0];
  }
  const [year, month, day] = fechaPura.split("-").map(Number);
  if (!year || !month || !day) return "-";
  return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
};

export default function MovilidadCumplimiento({ movilidadId, onBack }: MovilidadCumplimientoProps) {
  const [loading, setLoading] = useState(true);
  const [movilidad, setMovilidad] = useState<Movilidad | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [informeTexto, setInformeTexto] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchMovilidad();
  }, [movilidadId]);

  async function fetchCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("user_id", user.id)
        .single();
      setCurrentUser(data);
    }
  }

  async function fetchMovilidad() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("movilidades")
        .select(`*, agreement:agreements(id, name, pais), responsible:profiles!responsible_id(id, full_name, email)`)
        .eq("id", movilidadId)
        .single();
      if (error) throw error;
      setMovilidad(data);
      setInformeTexto(data.informe_texto || "");
      setPdfUrl(data.informe_pdf_url || null);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("⚠️ Solo se permiten archivos PDF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("⚠️ El archivo no debe superar los 10MB");
      return;
    }
    setUploadingPdf(true);
    try {
      const fileName = `movilidad_${movilidadId}_${Date.now()}.pdf`;
      const { error } = await supabase.storage.from("movilidades-informes").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("movilidades-informes").getPublicUrl(fileName);
      setPdfUrl(data.publicUrl);
      await supabase.from("movilidades").update({ informe_pdf_url: data.publicUrl }).eq("id", movilidadId);
      alert("✅ PDF subido correctamente");
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleEliminarPdf = async () => {
    if (!confirm("¿Eliminar el PDF?")) return;
    setPdfUrl(null);
    await supabase.from("movilidades").update({ informe_pdf_url: null }).eq("id", movilidadId);
  };

  const handleGuardarBorrador = async () => {
    setGuardando(true);
    try {
      await supabase.from("movilidades").update({ informe_texto: informeTexto, updated_at: new Date().toISOString() }).eq("id", movilidadId);
      alert("✅ Borrador guardado");
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEnviarInforme = async () => {
    if (!informeTexto.trim()) return alert("⚠️ Debe escribir el informe");
    if (!pdfUrl) return alert("⚠️ Debe subir el PDF");
    if (!confirm("⚠️ Al enviar el informe NO podrá modificarse.\n\n¿Continuar?")) return;
    setEnviando(true);
    try {
      await supabase.from("movilidades").update({
        informe_texto: informeTexto,
        informe_enviado: true,
        informe_fecha: new Date().toISOString().split("T")[0],
        informe_uploaded_by: currentUser?.id,
        status: "Completada",
        updated_at: new Date().toISOString()
      }).eq("id", movilidadId);
      alert("✅ Informe enviado. Movilidad marcada como Completada.");
      onBack();
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const getCategoriaBadge = (cat: string) => cat?.toLowerCase().includes("estudi") 
    ? { bg: "bg-primary", icon: "🎓", label: "Estudiante" } 
    : { bg: "bg-info", icon: "👨‍🏫", label: "Docente" };

  const getDireccionBadge = (dir: string) => dir?.toLowerCase() === "entrante"
    ? { bg: "bg-success", icon: "📥", label: "Entrante" }
    : { bg: "bg-warning text-dark", icon: "📤", label: "Saliente" };

  const getPais = () => movilidad?.direccion?.toLowerCase() === "entrante" 
    ? movilidad?.pais_origen || movilidad?.agreement?.pais || "-"
    : movilidad?.pais_destino || movilidad?.destination_country || "-";

  const getInstitucion = () => {
    if (movilidad?.tipo_programa?.toLowerCase().includes("intercambio")) return movilidad?.agreement?.name || "-";
    return movilidad?.direccion?.toLowerCase() === "entrante" ? movilidad?.institucion_origen || "-" : movilidad?.institucion_destino || movilidad?.destination_place || "-";
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /><p>Cargando...</p></div>;
  if (!movilidad) return <div className="alert alert-danger m-4">No encontrada <button className="btn btn-link" onClick={onBack}>Volver</button></div>;

  const yaEnviado = movilidad.informe_enviado;
  const puedeEnviar = informeTexto.trim() && pdfUrl;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <button className="btn btn-outline-secondary mb-3" onClick={onBack}>← Volver a Movilidades</button>
          <h2 style={{ color: "#3D1A4F" }}>{yaEnviado ? "📄 Informe de Movilidad" : "📝 Registro de Cumplimiento"}</h2>
          <p className="text-muted">{yaEnviado ? "Este informe ya fue enviado y no puede modificarse" : "Complete el informe del viaje y suba los medios verificables"}</p>
        </div>
        {yaEnviado && <span className="badge bg-success fs-6 py-2 px-3">✅ Enviado - {formatDateLocal(movilidad.informe_fecha)}</span>}
      </div>

      <div className="row">
        {/* Info de movilidad */}
        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header text-white" style={{ background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)" }}>
              <h5 className="mb-0">📋 Datos de la Movilidad</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className={`badge ${getCategoriaBadge(movilidad.categoria).bg}`}>{getCategoriaBadge(movilidad.categoria).icon} {getCategoriaBadge(movilidad.categoria).label}</span>
                <span className={`badge ${getDireccionBadge(movilidad.direccion).bg}`}>{getDireccionBadge(movilidad.direccion).icon} {getDireccionBadge(movilidad.direccion).label}</span>
              </div>
              <div className="mb-3"><small className="text-muted">Participante</small><br /><strong className="fs-5">{movilidad.nombre_completo}</strong><br /><small className="text-muted">{movilidad.documento_identidad || movilidad.codigo_matricula || movilidad.codigo_docente || "-"}</small></div>
              <hr />
              <div className="mb-3"><small className="text-muted">Programa</small><br />{movilidad.tipo_programa}</div>
              <div className="mb-3"><small className="text-muted">{movilidad.direccion?.toLowerCase() === "entrante" ? "Institución de Origen" : "Institución de Destino"}</small><br />{getInstitucion()}</div>
              <div className="mb-3"><small className="text-muted">País</small><br /><span className="badge bg-light text-dark">{getPais()}</span></div>
              <hr />
              <div className="mb-3"><small className="text-muted">Periodo</small><div className="d-flex gap-3"><div><small>Inicio</small><br /><strong>{formatDateLocal(movilidad.start_date)}</strong></div><div><small>Término</small><br /><strong>{formatDateLocal(movilidad.end_date)}</strong></div></div></div>
              <div className="mb-3"><small className="text-muted">Nivel</small><br />{movilidad.nivel_academico || "-"}</div>
              <div className="mb-3"><small className="text-muted">Escuela/Programa</small><br />{movilidad.programa_especifico || movilidad.escuela || "-"}</div>
              {movilidad.tipo_estancia && <div className="mb-3"><small className="text-muted">Tipo Estancia</small><br />{movilidad.tipo_estancia}</div>}
              {movilidad.sede_rotacion && <div className="mb-3"><small className="text-muted">Sede Rotación</small><br />{movilidad.sede_rotacion}</div>}
              <hr />
              {movilidad.responsible && <div><small className="text-muted">Responsable Interno</small><br /><strong>{movilidad.responsible.full_name}</strong><br /><small className="text-muted">{movilidad.responsible.email}</small></div>}
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom"><h5 className="mb-0">{yaEnviado ? "📄 Informe Enviado" : "✍️ Informe del Viaje"}</h5></div>
            <div className="card-body">
              {/* Informe texto */}
              <div className="mb-4">
                <label className="form-label fw-bold">📝 Descripción de Actividades {!yaEnviado && "*"}</label>
                <p className="text-muted small mb-2">Describa actividades realizadas, logros, experiencias y observaciones.</p>
                {yaEnviado ? (
                  <div className="form-control bg-light" style={{ minHeight: "200px", whiteSpace: "pre-wrap" }}>{movilidad.informe_texto || "-"}</div>
                ) : (
                  <textarea className="form-control" rows={10} value={informeTexto} onChange={(e) => setInformeTexto(e.target.value)} placeholder="Escriba aquí el informe..." />
                )}
                {!yaEnviado && <small className="text-muted">{informeTexto.length} caracteres</small>}
              </div>

              {/* PDF */}
              <div className="mb-4">
                <label className="form-label fw-bold">📎 Medios Verificables (PDF) {!yaEnviado && "*"}</label>
                <p className="text-muted small mb-2">Fotos, tickets, constancias, certificados, etc.</p>
                {pdfUrl ? (
                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded">
                    <span className="badge bg-success fs-6">✅ PDF Cargado</span>
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">👁️ Ver</a>
                    {!yaEnviado && <button className="btn btn-outline-danger btn-sm" onClick={handleEliminarPdf}>🗑️ Eliminar</button>}
                  </div>
                ) : (
                  <div className="border rounded p-4 text-center bg-light">
                    <input type="file" id="pdfUpload" className="d-none" accept=".pdf" onChange={handleUploadPdf} disabled={uploadingPdf} />
                    <label htmlFor="pdfUpload" className={`btn btn-outline-primary ${uploadingPdf ? 'disabled' : ''}`}>
                      {uploadingPdf ? <><span className="spinner-border spinner-border-sm me-2" />Subiendo...</> : <>📤 Seleccionar PDF</>}
                    </label>
                    <p className="text-muted small mt-2 mb-0">Máximo 10MB</p>
                  </div>
                )}
              </div>

              {/* Checklist */}
              {!yaEnviado && (
                <div className="card bg-light border-0 mb-4">
                  <div className="card-body">
                    <h6 className="mb-3">✓ Checklist de Cumplimiento</h6>
                    <div className="row">
                      <div className="col-md-6"><div className="form-check"><input type="checkbox" className="form-check-input" checked={!!informeTexto.trim()} readOnly /><label className="form-check-label">Informe redactado</label></div></div>
                      <div className="col-md-6"><div className="form-check"><input type="checkbox" className="form-check-input" checked={!!pdfUrl} readOnly /><label className="form-check-label">PDF cargado</label></div></div>
                    </div>
                  </div>
                </div>
              )}

              {!yaEnviado && puedeEnviar && (
                <div className="alert alert-warning mb-4">
                  <strong>⚠️ Importante:</strong> Al enviar, la movilidad quedará como <strong>"Completada"</strong> y <strong>no podrá modificarse</strong>.
                </div>
              )}

              {yaEnviado && (
                <div className="alert alert-success mb-0">
                  <strong>✅ Informe enviado el {formatDateLocal(movilidad.informe_fecha)}</strong><br />
                  <small>Este informe no puede ser modificado.</small>
                </div>
              )}
            </div>

            {!yaEnviado && (
              <div className="card-footer bg-white border-top">
                <div className="d-flex justify-content-between">
                  <button className="btn btn-outline-secondary" onClick={onBack}>← Cancelar</button>
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary" onClick={handleGuardarBorrador} disabled={guardando || !informeTexto.trim()}>
                      {guardando ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</> : <>💾 Guardar Borrador</>}
                    </button>
                    <button className="btn btn-success btn-lg" onClick={handleEnviarInforme} disabled={!puedeEnviar || enviando}>
                      {enviando ? <><span className="spinner-border spinner-border-sm me-2" />Enviando...</> : <>📤 Enviar Informe</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}