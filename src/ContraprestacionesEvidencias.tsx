import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface ContraprestacionesEvidenciasProps {
  agreementId: string;
  onBack: () => void;
}

export default function ContraprestacionesEvidencias({
  agreementId,
  onBack,
}: ContraprestacionesEvidenciasProps) {
  const [seguimientos, setSeguimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeguimientos();
  }, [agreementId]);

  const fetchSeguimientos = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("contraprestaciones")
      .select(`
        id,
        tipo,
        descripcion,
        contraprestaciones_seguimiento (
          id,
          año,
          estado,
          observaciones,
          fecha_verificacion,
          responsable,
          evidencia_url,
          ejecutado
        )
      `)
      .eq("agreement_id", agreementId);

    if (error) {
      console.error("Error al cargar contraprestaciones:", error);
      setSeguimientos([]);
    } else {
      setSeguimientos(data || []);
    }

    setLoading(false);
  };

  const handleFileUpload = async (seguimientoId: string, file: File) => {
    const filePath = `${seguimientoId}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("evidencias")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("❌ Error al subir archivo: " + uploadError.message);
      return;
    }

    const publicUrl = supabase.storage.from("evidencias").getPublicUrl(filePath)
      .data.publicUrl;

    const { error: updateError } = await supabase
      .from("contraprestaciones_seguimiento")
      .update({ evidencia_url: publicUrl })
      .eq("id", seguimientoId);

    if (updateError) {
      alert("❌ Error al guardar evidencia: " + updateError.message);
    } else {
      alert("✅ Evidencia subida correctamente");
      fetchSeguimientos();
    }
  };

  const toggleEjecutado = async (seguimientoId: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("contraprestaciones_seguimiento")
      .update({
        ejecutado: !currentValue,
        estado: !currentValue ? "cumplido" : "pendiente",
        fecha_verificacion: !currentValue ? new Date().toISOString() : null,
      })
      .eq("id", seguimientoId);

    if (error) {
      alert("❌ Error al actualizar estado: " + error.message);
    } else {
      fetchSeguimientos();
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold text-primary">📂 Cumplimiento de Contraprestaciones</h3>
        <button className="btn btn-outline-secondary" onClick={onBack}>
          🔙 Volver
        </button>
      </div>

      {loading ? (
        <p className="text-center">Cargando...</p>
      ) : seguimientos.length === 0 ? (
        <p className="text-center text-muted">
          No hay contraprestaciones registradas para este convenio.
        </p>
      ) : (
        seguimientos.map((contrap) => (
          <div key={contrap.id} className="card mb-4 shadow-sm">
            <div className="card-header bg-primary text-white fw-bold">
              {contrap.tipo} — {contrap.descripcion}
            </div>
            <div className="card-body">
              {contrap.contraprestaciones_seguimiento.map((seg: any) => (
                <div
                  key={seg.id}
                  className="d-flex align-items-center justify-content-between border-bottom py-2"
                >
                  <div>
                    <p className="mb-1">
                      <strong>Año {seg.año}</strong> — Estado:{" "}
                      <span
                        className={`badge ${
                          seg.ejecutado ? "bg-success" : "bg-warning text-dark"
                        }`}
                      >
                        {seg.estado || (seg.ejecutado ? "Cumplido" : "Pendiente")}
                      </span>
                    </p>
                    <small className="text-muted">
                      {seg.observaciones || "Sin observaciones"}
                    </small>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!seg.ejecutado}
                      onChange={() => toggleEjecutado(seg.id, seg.ejecutado)}
                    />
                    {seg.evidencia_url ? (
                      <a
                        href={seg.evidencia_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-success btn-sm"
                      >
                        📎 Ver PDF
                      </a>
                    ) : (
                      <label className="btn btn-outline-primary btn-sm mb-0">
                        📤 Subir PDF
                        <input
                          type="file"
                          accept="application/pdf"
                          hidden
                          onChange={(e) =>
                            e.target.files &&
                            handleFileUpload(seg.id, e.target.files[0])
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}


