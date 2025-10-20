import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface ContraprestacionesEvidenciasProps {
  agreementId: string;
  onBack: () => void;
  role: string; // admin | internal | external
  userId: string;
}

export default function ContraprestacionesEvidencias({
  agreementId,
  onBack,
  role,
  userId,
}: ContraprestacionesEvidenciasProps) {
  const [contraprestaciones, setContraprestaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalResponsible, setInternalResponsible] = useState<string | null>(null);

  // 🔹 Cargar contraprestaciones y responsable del convenio
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: convenio } = await supabase
        .from("agreements")
        .select("internal_responsible")
        .eq("id", agreementId)
        .single();

      if (convenio) setInternalResponsible(convenio.internal_responsible);

      const { data, error } = await supabase
        .from("contraprestaciones")
        .select("id, tipo, descripcion, unidades_comprometidas, contraprestaciones_seguimiento(id, estado, evidencia_url, fecha_verificacion)")
        .eq("agreement_id", agreementId);

      if (error) console.error("Error al cargar contraprestaciones:", error);
      else setContraprestaciones(data || []);

      setLoading(false);
    };

    fetchData();
  }, [agreementId]);

  // 🔹 Verificar si el usuario tiene permiso para editar
  const canEdit =
    role === "admin" ||
    (role === "internal" && userId === internalResponsible);

  // 🔹 Actualizar estado (cumplido / pendiente)
  const handleCheck = async (seguimientoId: string, currentState: string) => {
    if (!canEdit) return alert("❌ No tienes permiso para modificar esta contraprestación.");

    const newState = currentState === "cumplido" ? "pendiente" : "cumplido";

    const { error } = await supabase
      .from("contraprestaciones_seguimiento")
      .update({
        estado: newState,
        fecha_verificacion: new Date().toISOString(),
      })
      .eq("id", seguimientoId);

    if (error) {
      alert("Error al actualizar el estado: " + error.message);
    } else {
      setContraprestaciones((prev) =>
        prev.map((c) => ({
          ...c,
          contraprestaciones_seguimiento: c.contraprestaciones_seguimiento.map((s: any) =>
            s.id === seguimientoId ? { ...s, estado: newState } : s
          ),
        }))
      );
    }
  };

  // 🔹 Subir evidencia PDF
  const handleUpload = async (seguimientoId: string, file: File) => {
    if (!canEdit) return alert("❌ No tienes permiso para subir evidencia.");

    const fileName = `${seguimientoId}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("evidencias")
      .upload(fileName, file, { upsert: true });

    if (uploadError) return alert("Error al subir el archivo: " + uploadError.message);

    const { data: publicUrl } = supabase.storage.from("evidencias").getPublicUrl(fileName);

    const { error } = await supabase
      .from("contraprestaciones_seguimiento")
      .update({ evidencia_url: publicUrl.publicUrl })
      .eq("id", seguimientoId);

    if (error) alert("Error al guardar la evidencia: " + error.message);
    else alert("✅ Evidencia subida correctamente.");
  };

  if (loading) return <p className="text-center mt-5">Cargando contraprestaciones...</p>;

  return (
    <div className="container mt-4">
      <h3 className="fw-bold text-primary mb-3">📂 Cumplimiento de Contraprestaciones</h3>
      <button className="btn btn-secondary mb-4" onClick={onBack}>
        🔙 Volver
      </button>

      {contraprestaciones.length === 0 ? (
        <p className="text-muted">No hay contraprestaciones registradas para este convenio.</p>
      ) : (
        <div className="list-group shadow-sm">
          {contraprestaciones.map((c) => (
            <div key={c.id} className="list-group-item mb-3 border rounded p-3">
              <h5 className="mb-2 text-dark fw-semibold">
                {c.tipo} ({c.unidades_comprometidas} unidades)
              </h5>
              <p className="text-muted mb-3">{c.descripcion}</p>

              {c.contraprestaciones_seguimiento.map((s: any) => (
                <div
                  key={s.id}
                  className="d-flex align-items-center justify-content-between border-top pt-2 mt-2"
                >
                  <div>
                    <strong>Estado:</strong>{" "}
                    <span
                      className={`badge ${
                        s.estado === "cumplido" ? "bg-success" : "bg-warning text-dark"
                      }`}
                    >
                      {s.estado}
                    </span>
                    <br />
                    <small className="text-muted">
                      Última verificación:{" "}
                      {s.fecha_verificacion
                        ? new Date(s.fecha_verificacion).toLocaleDateString("es-PE")
                        : "—"}
                    </small>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="checkbox"
                      checked={s.estado === "cumplido"}
                      onChange={() => handleCheck(s.id, s.estado)}
                      disabled={!canEdit}
                    />
                    <label className="ms-1">Cumplido</label>

                    {s.evidencia_url ? (
                      <a
                        href={s.evidencia_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        📎 Ver evidencia
                      </a>
                    ) : (
                      <label className={`btn btn-sm ${canEdit ? "btn-outline-success" : "btn-outline-secondary disabled"}`}>
                        📤 Subir evidencia
                        <input
                          type="file"
                          accept="application/pdf"
                          hidden
                          onChange={(e) =>
                            e.target.files && handleUpload(s.id, e.target.files[0])
                          }
                          disabled={!canEdit}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




