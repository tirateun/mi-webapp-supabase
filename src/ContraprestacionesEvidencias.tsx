import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface ContraprestacionDetalle {
  id: string;
  tipo: string;
  descripcion: string | null;
}

interface ContraprestacionSeguimiento {
  id: string;
  contraprestacion_id: string;
  año: number;
  estado: string | null;
  observaciones: string | null;
  fecha_verificacion: string | null;
  responsable: string | null;
  evidencia_url: string | null;
  ejecutado: boolean;
  contraprestacion?: {
    tipo: string;
    descripcion: string | null;
  };
}

interface Props {
  agreementId: string;
  onBack: () => void;
  role: string;
  userId: string;
}

export default function ContraprestacionesEvidencias({
  agreementId,
  onBack,
  role,
  userId,
}: Props) {
  const [seguimientos, setSeguimientos] = useState<ContraprestacionSeguimiento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!agreementId) return;
    fetchSeguimientos();
  }, [agreementId]);

  const fetchSeguimientos = async () => {
    setLoading(true);
    try {
      const { data: contraprestacionesIds, error: errIds } = await supabase
        .from("contraprestaciones")
        .select("id")
        .eq("agreement_id", agreementId);

      if (errIds) throw errIds;
      const ids = (contraprestacionesIds || []).map((r: any) => r.id);

      if (!ids.length) {
        setSeguimientos([]);
        setLoading(false);
        return;
      }

      const { data: rawSeguimientos, error: errSeg } = await supabase
        .from("contraprestaciones_seguimiento")
        .select("*, contraprestaciones(tipo, descripcion)")
        .in("contraprestacion_id", ids)
        .order("año", { ascending: true });

      if (errSeg) throw errSeg;

      const uniqueSeguimientos = Array.from(
        new Map(rawSeguimientos.map((s: any) => [s.id, s])).values()
      );

      const merged = uniqueSeguimientos.map((s: any) => ({
        id: s.id,
        contraprestacion_id: s.contraprestacion_id,
        año: Number(s.año),
        estado: s.estado ?? null,
        observaciones: s.observaciones ?? null,
        fecha_verificacion: s.fecha_verificacion ?? null,
        responsable: s.responsable ?? null,
        evidencia_url: s.evidencia_url ?? null,
        ejecutado: !!s.ejecutado,
        contraprestacion: s.contraprestaciones,
      }));

      setSeguimientos(merged);
    } catch (error: any) {
      console.error("Error cargando seguimientos:", error);
      alert("Error al cargar seguimientos. Revisa consola.");
      setSeguimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEjecutado = async (s: ContraprestacionSeguimiento) => {
    if (!(role === "admin" || role === "Admin" || role === "Administrador")) {
      alert("Solo los administradores pueden cambiar el estado de cumplimiento.");
      return;
    }

    const nuevoEjecutado = !s.ejecutado;
    const nuevoEstado = nuevoEjecutado ? "Cumplido" : "Pendiente";

    const payload: any = {
      ejecutado: nuevoEjecutado,
      estado: nuevoEstado,
    };

    if (nuevoEjecutado) {
      payload.responsable = userId || null;
      payload.fecha_verificacion = new Date().toISOString();
    } else {
      payload.responsable = null;
      payload.fecha_verificacion = null;
    }

    const { error } = await supabase
      .from("contraprestaciones_seguimiento")
      .update(payload)
      .eq("id", s.id);

    if (error) {
      console.error("Error actualizando seguimiento:", error);
      alert("Error al actualizar el estado: " + error.message);
    } else {
      fetchSeguimientos();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, s: ContraprestacionSeguimiento) => {
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
      const filePath = `${s.contraprestacion_id}/${s.id}_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("evidencias").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("evidencias").getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      const { error: updateError } = await supabase
        .from("contraprestaciones_seguimiento")
        .update({ evidencia_url: publicUrl })
        .eq("id", s.id);

      if (updateError) throw updateError;

      fetchSeguimientos();
    } catch (err: any) {
      console.error("Error subiendo evidencia:", err);
      alert("Error al subir la evidencia: " + (err.message || JSON.stringify(err)));
    } finally {
      setUploadingId(null);
    }
  };

  const formatAnio = (anio: number) => `${anio}° año`;

  if (loading) return <p className="text-center mt-4">Cargando contraprestaciones...</p>;

  return (
    <div className="container mt-4" style={{ maxWidth: 1000 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-primary mb-0">📂 Cumplimiento de Contraprestaciones</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>
          🔙 Volver
        </button>
      </div>

      {seguimientos.length === 0 ? (
        <p className="text-muted">No hay contraprestaciones registradas para este convenio.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Año</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Evidencia</th>
                {role === "admin" || role === "Admin" || role === "Administrador" ? (
                  <th>Acciones</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {seguimientos.map((s) => (
                <tr key={s.id}>
                  <td>{formatAnio(s.año)}</td>
                  <td>{s.contraprestacion?.tipo ?? "-"}</td>
                  <td style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>
                    {s.contraprestacion?.descripcion ?? "-"}
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
                      <a href={s.evidencia_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info">
                        📎 Ver PDF
                      </a>
                    ) : role === "admin" || role === "Admin" || role === "Administrador" ? (
                      <input
                        type="file"
                        accept="application/pdf"
                        disabled={uploadingId === s.id}
                        onChange={(e) => handleFileUpload(e, s)}
                      />
                    ) : (
                      <span className="text-muted">Sin evidencia</span>
                    )}
                  </td>
                  {role === "admin" || role === "Admin" || role === "Administrador" ? (
                    <td>
                      <input
                        type="checkbox"
                        checked={s.ejecutado}
                        onChange={() => handleToggleEjecutado(s)}
                        disabled={uploadingId === s.id}
                      />
                      {uploadingId === s.id && <small> Subiendo...</small>}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}













