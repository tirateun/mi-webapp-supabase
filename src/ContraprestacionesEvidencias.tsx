import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface ContraprestacionesEvidenciasProps {
  agreementId: string;
  onBack: () => void;
}

interface Seguimiento {
  id: string;
  tipo: string;
  descripcion: string;
  unidades_comprometidas: number;
  ejecutado: boolean;
  evidencia_url: string | null;
  estado: string | null;
}

export default function ContraprestacionesEvidencias({
  agreementId,
  onBack,
}: ContraprestacionesEvidenciasProps) {
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchSeguimientos();
  }, [agreementId]);

  const fetchSeguimientos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contraprestaciones")
      .select("id, tipo, descripcion, unidades_comprometidas, seguimiento:contraprestaciones_seguimiento(*)")
      .eq("agreement_id", agreementId);

    if (error) {
      console.error("Error al cargar contraprestaciones:", error);
    } else {
      // Aplanar los registros de seguimiento
      const items: Seguimiento[] = [];
      data?.forEach((c: any) => {
        c.seguimiento?.forEach((s: any) => {
          items.push({
            id: s.id,
            tipo: c.tipo,
            descripcion: c.descripcion,
            unidades_comprometidas: c.unidades_comprometidas,
            ejecutado: s.ejecutado,
            evidencia_url: s.evidencia_url,
            estado: s.estado,
          });
        });
      });
      setSeguimientos(items);
    }
    setLoading(false);
  };

  const handleCheck = async (id: string, checked: boolean) => {
    const { error } = await supabase
      .from("contraprestaciones_seguimiento")
      .update({ ejecutado: checked })
      .eq("id", id);

    if (error) {
      alert("❌ Error al actualizar el estado: " + error.message);
    } else {
      fetchSeguimientos();
    }
  };

  const handleUpload = async (id: string, file: File) => {
    try {
      setUploading(id);
      const fileExt = file.name.split(".").pop();
      const filePath = `${id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("evidencias")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("evidencias")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("contraprestaciones_seguimiento")
        .update({ evidencia_url: urlData.publicUrl })
        .eq("id", id);

      if (updateError) throw updateError;

      alert("✅ Evidencia subida correctamente");
      fetchSeguimientos();
    } catch (err: any) {
      alert("❌ Error al subir evidencia: " + err.message);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="fw-bold text-primary mb-3">📂 Cumplimiento de Contraprestaciones</h3>
      <button className="btn btn-outline-secondary mb-4" onClick={onBack}>
        🔙 Volver
      </button>

      {loading ? (
        <p>Cargando contraprestaciones...</p>
      ) : seguimientos.length === 0 ? (
        <p>No hay contraprestaciones registradas para este convenio.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Unidades</th>
                <th>Ejecutado</th>
                <th>Evidencia (PDF)</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {seguimientos.map((s) => (
                <tr key={s.id}>
                  <td>{s.tipo}</td>
                  <td>{s.descripcion}</td>
                  <td>{s.unidades_comprometidas}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={s.ejecutado || false}
                      onChange={(e) => handleCheck(s.id, e.target.checked)}
                    />
                  </td>
                  <td>
                    {s.evidencia_url ? (
                      <a
                        href={s.evidencia_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        📄 Ver evidencia
                      </a>
                    ) : (
                      <label className="btn btn-sm btn-outline-secondary mb-0">
                        {uploading === s.id ? "Subiendo..." : "Subir PDF"}
                        <input
                          type="file"
                          accept="application/pdf"
                          hidden
                          onChange={(e) =>
                            e.target.files && handleUpload(s.id, e.target.files[0])
                          }
                        />
                      </label>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        s.estado === "Cumplido"
                          ? "bg-success"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {s.estado || "Pendiente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



