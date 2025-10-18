import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Contraprestacion {
  id?: string;
  tipo: string;
  descripcion: string;
  unidades_comprometidas: number;
  periodo_inicio: string;
  periodo_fin: string;
  cumplido?: boolean;
  evidencia_url?: string;
}

interface Catalogo {
  id: string;
  tipo: string;
  unidad: string;
}

interface Props {
  agreementId: string;
  onBack: () => void;
}

export default function Contraprestaciones({ agreementId, onBack }: Props) {
  const [catalogo, setCatalogo] = useState<Catalogo[]>([]);
  const [contraprestaciones, setContraprestaciones] = useState<Contraprestacion[]>([]);
  const [nueva, setNueva] = useState<Contraprestacion>({
    tipo: "",
    descripcion: "",
    unidades_comprometidas: 1,
    periodo_inicio: "",
    periodo_fin: "",
  });
  const [subiendo, setSubiendo] = useState(false);

  // 📦 Cargar catálogo y contraprestaciones existentes
  useEffect(() => {
    fetchCatalogo();
    fetchContraprestaciones();
  }, [agreementId]);

  const fetchCatalogo = async () => {
    const { data, error } = await supabase.from("contraprestaciones_catalogo").select("*");
    if (error) console.error("Error al cargar catálogo:", error);
    else setCatalogo(data || []);
  };

  const fetchContraprestaciones = async () => {
    const { data, error } = await supabase
      .from("contraprestaciones")
      .select("*")
      .eq("agreement_id", agreementId)
      .order("periodo_inicio", { ascending: true });
    if (error) console.error("Error al cargar contraprestaciones:", error);
    else setContraprestaciones(data || []);
  };

  // 📝 Agregar nueva contraprestación
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nueva.tipo || !nueva.periodo_inicio || !nueva.periodo_fin) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    const { error } = await supabase.from("contraprestaciones").insert([
      {
        agreement_id: agreementId,
        tipo: nueva.tipo,
        descripcion: nueva.descripcion,
        unidades_comprometidas: nueva.unidades_comprometidas,
        periodo_inicio: nueva.periodo_inicio,
        periodo_fin: nueva.periodo_fin,
      },
    ]);

    if (error) {
      console.error(error);
      alert("❌ Error al guardar: " + error.message);
    } else {
      alert("✅ Contraprestación registrada");
      setNueva({
        tipo: "",
        descripcion: "",
        unidades_comprometidas: 1,
        periodo_inicio: "",
        periodo_fin: "",
      });
      fetchContraprestaciones();
    }
  };

  // ✅ Marcar cumplimiento
  const handleCumplido = async (id: string, checked: boolean) => {
    const { error } = await supabase
      .from("contraprestaciones")
      .update({ cumplido: checked })
      .eq("id", id);
    if (error) console.error(error);
    else fetchContraprestaciones();
  };

  // 📎 Subir evidencia PDF
  const handleUpload = async (id: string, file: File) => {
    try {
      setSubiendo(true);
      const filePath = `evidencias/${id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("evidencias")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("evidencias").getPublicUrl(filePath);
      const { error: updateError } = await supabase
        .from("contraprestaciones")
        .update({ evidencia_url: urlData.publicUrl })
        .eq("id", id);

      if (updateError) throw updateError;
      fetchContraprestaciones();
      alert("📎 Evidencia subida correctamente");
    } catch (error: any) {
      console.error(error);
      alert("❌ Error al subir evidencia: " + error.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "1000px" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold text-primary">📋 Contraprestaciones del Convenio</h3>
        <button className="btn btn-secondary" onClick={onBack}>
          ⬅ Volver
        </button>
      </div>

      {/* Formulario */}
      <div className="card shadow-sm mb-4 p-4 border-0">
        <h5 className="fw-semibold mb-3 text-secondary">Agregar nueva contraprestación</h5>
        <form onSubmit={handleAdd} className="row g-3">
          <div className="col-md-4">
            <label>Tipo</label>
            <select
              className="form-select"
              value={nueva.tipo}
              onChange={(e) => setNueva({ ...nueva, tipo: e.target.value })}
              required
            >
              <option value="">Seleccione tipo</option>
              {catalogo.map((c) => (
                <option key={c.id} value={c.tipo}>
                  {c.tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label>Unidades comprometidas</label>
            <input
              type="number"
              className="form-control"
              min={1}
              value={nueva.unidades_comprometidas}
              onChange={(e) =>
                setNueva({ ...nueva, unidades_comprometidas: Number(e.target.value) })
              }
            />
          </div>

          <div className="col-md-4">
            <label>Periodo de inicio</label>
            <input
              type="date"
              className="form-control"
              value={nueva.periodo_inicio}
              onChange={(e) => setNueva({ ...nueva, periodo_inicio: e.target.value })}
              required
            />
          </div>

          <div className="col-md-4">
            <label>Periodo de fin</label>
            <input
              type="date"
              className="form-control"
              value={nueva.periodo_fin}
              onChange={(e) => setNueva({ ...nueva, periodo_fin: e.target.value })}
              required
            />
          </div>

          <div className="col-md-8">
            <label>Descripción / Detalles</label>
            <textarea
              className="form-control"
              value={nueva.descripcion}
              onChange={(e) => setNueva({ ...nueva, descripcion: e.target.value })}
              placeholder="Ejemplo: Beca parcial del 50% en maestría"
            />
          </div>

          <div className="col-12 text-end mt-3">
            <button type="submit" className="btn btn-primary px-4">
              ➕ Agregar
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de contraprestaciones */}
      <div className="card shadow-sm p-3 border-0">
        <h5 className="fw-semibold text-secondary mb-3">Lista de contraprestaciones</h5>
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Unidades</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Cumplido</th>
              <th>Evidencia</th>
            </tr>
          </thead>
          <tbody>
            {contraprestaciones.length > 0 ? (
              contraprestaciones.map((c) => (
                <tr key={c.id}>
                  <td>{c.tipo}</td>
                  <td>{c.unidades_comprometidas}</td>
                  <td>{c.periodo_inicio}</td>
                  <td>{c.periodo_fin}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!c.cumplido}
                      onChange={(e) => handleCumplido(c.id!, e.target.checked)}
                    />
                  </td>
                  <td>
                    {c.evidencia_url ? (
                      <a
                        href={c.evidencia_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-success"
                      >
                        📎 Ver PDF
                      </a>
                    ) : (
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          e.target.files?.[0] && handleUpload(c.id!, e.target.files[0])
                        }
                        disabled={subiendo}
                      />
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center text-muted py-3">
                  No hay contraprestaciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
