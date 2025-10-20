import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface ContraprestacionSeguimiento {
  id: string;
  contraprestacion_id: string;
  año: number;
  estado: string;
  observaciones: string | null;
  fecha_verificacion: string | null;
  responsable: string | null;
  evidencia_url: string | null;
  ejecutado: boolean;
  contraprestacion?: {
    tipo: string;
    descripcion: string;
  };
}

interface Props {
  agreementId: string;
  onBack: () => void;
  role: string;
  userId: string;
}

export default function ContraprestacionesEvidencias({ agreementId, onBack, role, userId }: Props) {
  const [seguimientos, setSeguimientos] = useState<ContraprestacionSeguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  // 🔹 Cargar contraprestaciones con sus seguimientos
  useEffect(() => {
    fetchSeguimientos();
  }, [agreementId]);

  const fetchSeguimientos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contraprestaciones_seguimiento")
      .select(`
        id,
        contraprestacion_id,
        año,
        estado,
        observaciones,
        fecha_verificacion,
        responsable,
        evidencia_url,
        ejecutado,
        contraprestaciones:contraprestacion_id (
          tipo,
          descripcion
        )
      `)
      .in(
        "contraprestacion_id",
        (
          await supabase
            .from("contraprestaciones")
            .select("id")
            .eq("agreement_id", agreementId)
        ).data?.map((c) => c.id) || []
      )
      .order("año", { ascending: true });

    if (error) {
      console.error("Error al cargar seguimientos:", error);
      alert("Error al cargar los seguimientos de contraprestaciones.");
    } else {
      setSeguimientos(data || []);
    }
    setLoading(false);
  };

  // 🔹 Marcar como ejecutado o pendiente
  const handleToggleEjecutado = async (s: ContraprestacionSeguimiento) => {
    if (role !== "admin" && role !== "interno") {
      alert("❌ No tienes permisos para modificar el cumplimiento.");
      return;
    }

    const nuevoEstado = !s.ejecutado;

    const { error } = await supabase
      .from("contraprestaciones_seguimiento")
      .update({
        ejecutado: nuevoEstado,
        estado: nuevoEstado ? "cumplido" : "pendiente",
        responsable: nuevoEstado ? userId : null,
        fecha_verificacion: nuevoEstado ? new Date().toISOString() : null,
      })
      .eq("id", s.id);

    if (error) {
      alert("Error al actualizar: " + error.message);
    } else {
      fetchSeguimientos();
    }
  };

  // 🔹 Subir evidencia PDF
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, s: ContraprestacionSeguimiento) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(s.id);

    const filePath = `${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("evidencias").upload(filePath, file);

    if (uploadError) {
      alert("❌ Error al subir archivo: " + uploadError.message);
      setUploading(null);
      return;
    }

    const { data: publicUrl } = supabase.storage.from("evidencias").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("contraprestaciones_seguimiento")
      .update({ evidencia_url: publicUrl.publicUrl })
      .eq("id", s.id);

    if (updateError) alert("❌ Error al guardar evidencia.");
    else fetchSeguimientos();

    setUploading(null);
  };

  if (loading) return <p className="text-center mt-4">Cargando contraprestaciones...</p>;

  return (
    <div className="container mt-4" style={{ maxWidth: "900px" }}>
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {seguimientos.map((s) => (
                <tr key={s.id}>
                  <td>{s.año}°</td>
                  <td>{s.contraprestaciones?.tipo || "-"}</td>
                  <td style={{ maxWidth: "250px", whiteSpace: "pre-wrap" }}>
                    {s.contraprestaciones?.descripcion || "-"}
                  </td>
                  <td>
                    {s.ejecutado ? (
                      <span className="badge bg-success">Cumplido</span>
                    ) : (
                      <span className="badge bg-warning text-dark">Pendiente</span>
                    )}
                  </td>
                  <td>
                    {s.evidencia_url ? (
                      <a
                        href={s.evidencia_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-info"
                      >
                        📎 Ver PDF
                      </a>
                    ) : (
                      <input
                        type="file"
                        accept="application/pdf"
                        disabled={uploading === s.id}
                        onChange={(e) => handleFileUpload(e, s)}
                      />
                    )}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={s.ejecutado}
                      onChange={() => handleToggleEjecutado(s)}
                      disabled={
                        uploading === s.id ||
                        (role !== "admin" && role !== "interno")
                      }
                    />{" "}
                    {uploading === s.id && "⏳"}
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




