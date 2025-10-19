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
  const [contraprestaciones, setContraprestaciones] = useState<any[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContraprestaciones();
  }, [agreementId]);

  // 🔹 Obtener contraprestaciones y su seguimiento
  const fetchContraprestaciones = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("contraprestaciones_seguimiento")
      .select("*")
      .eq("agreement_id", agreementId)
      .order("periodo_inicio", { ascending: true });

    if (error) console.error("Error al cargar contraprestaciones:", error);
    else setContraprestaciones(data || []);

    setLoading(false);
  };

  // 🔹 Marcar cumplimiento (check)
  const toggleCumplido = async (id: string, cumplido: boolean) => {
    const { error } = await supabase
      .from("contraprestaciones_seguimiento")
      .update({ cumplido: !cumplido })
      .eq("id", id);

    if (error) alert("❌ Error al actualizar: " + error.message);
    else fetchContraprestaciones();
  };

  // 🔹 Subir archivo PDF como evidencia
  const handleFileUpload = async (id: string, file: File) => {
    try {
      setUploading(id);

      if (file.type !== "application/pdf") {
        alert("Solo se permiten archivos PDF.");
        return;
      }

      const filePath = `${agreementId}/${id}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("evidencias")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("evidencias")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("contraprestaciones_seguimiento")
        .update({ evidencia_url: publicUrlData.publicUrl })
        .eq("id", id);

      if (updateError) throw updateError;

      alert("✅ Evidencia subida correctamente");
      fetchContraprestaciones();
    } catch (err: any) {
      alert("❌ Error al subir archivo: " + err.message);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary">
          📂 Cumplimiento de Contraprestaciones
        </h3>
        <button className="btn btn-secondary" onClick={onBack}>
          🔙 Volver
        </button>
      </div>

      {loading ? (
        <p className="text-center">Cargando contraprestaciones...</p>
      ) : contraprestaciones.length === 0 ? (
        <p className="text-center text-muted">
          No hay contraprestaciones registradas para este convenio.
        </p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead className="table-primary">
              <tr>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Periodo</th>
                <th>Unidades comprometidas</th>
                <th>Cumplido</th>
                <th>Evidencia (PDF)</th>
              </tr>
            </thead>
            <tbody>
              {contraprestaciones.map((c) => (
                <tr key={c.id}>
                  <td>{c.tipo}</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>
                    {c.descripcion || "-"}
                  </td>
                  <td>
                    {new Date(c.periodo_inicio).toLocaleDateString("es-PE")}{" "}
                    - {new Date(c.periodo_fin).toLocaleDateString("es-PE")}
                  </td>
                  <td>{c.unidades_comprometidas}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!c.cumplido}
                      onChange={() => toggleCumplido(c.id, !!c.cumplido)}
                    />
                  </td>
                  <td>
                    {c.evidencia_url ? (
                      <a
                        href={c.evidencia_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm"
                      >
                        📎 Ver PDF
                      </a>
                    ) : (
                      <div>
                        <label className="btn btn-outline-secondary btn-sm">
                          {uploading === c.id ? "Subiendo..." : "Subir PDF"}
                          <input
                            type="file"
                            accept="application/pdf"
                            hidden
                            onChange={(e) => {
                              if (e.target.files?.[0])
                                handleFileUpload(c.id, e.target.files[0]);
                            }}
                          />
                        </label>
                      </div>
                    )}
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

