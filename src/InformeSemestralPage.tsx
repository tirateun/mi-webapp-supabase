// InformeSemestralPage.tsx (versión actualizada)
// Ajustado para integrarse con agreement_years y evitar romper funcionalidades existentes.
// Esta es una versión base mejorada, lista para adaptar al flujo real que uses.

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useParams, useNavigate } from "react-router-dom";

interface AgreementYear {
  id: string;
  agreement_id: string;
  year_number: number;
  year_start?: string;
  year_end?: string;
}

interface Informe {
  id: string;
  agreement_id: string;
  year_id: string;
  contenido: string;
  created_at: string;
}

export default function InformeSemestralPage() {
  const { convenioId } = useParams<{ convenioId: string }>();
  const navigate = useNavigate();

  const [years, setYears] = useState<AgreementYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [informes, setInformes] = useState<Informe[]>([]);
  const [loading, setLoading] = useState(false);

  const [contenido, setContenido] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    if (!convenioId) return;
    loadYears();
  }, [convenioId]);

  useEffect(() => {
    if (selectedYearId) loadInformes();
  }, [selectedYearId]);

  const loadYears = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agreement_years")
      .select("id, agreement_id, year_number, year_start, year_end")
      .eq("agreement_id", convenioId)
      .order("year_number", { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setYears(data || []);
    if (data && data.length > 0) setSelectedYearId(data[0].id);
    setLoading(false);
  };

  const loadInformes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("informes_semestrales")
      .select("id, agreement_id, year_id, contenido, created_at")
      .eq("agreement_id", convenioId)
      .eq("year_id", selectedYearId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setInformes(data || []);
    setLoading(false);
  };

  const saveInforme = async () => {
    if (!contenido.trim()) return alert("Ingresa contenido.");
    if (!selectedYearId) return alert("Selecciona un año.");

    setLoading(true);

    if (editId) {
      const { error } = await supabase
        .from("informes_semestrales")
        .update({ contenido })
        .eq("id", editId);

      if (error) alert("Error al actualizar.");
    } else {
      const { error } = await supabase
        .from("informes_semestrales")
        .insert([
          {
            agreement_id: convenioId,
            year_id: selectedYearId,
            contenido,
          },
        ]);

      if (error) alert("Error al guardar.");
    }

    setContenido("");
    setEditId(null);
    await loadInformes();
    setLoading(false);
  };

  const editInforme = (inf: Informe) => {
    setContenido(inf.contenido);
    setEditId(inf.id);
  };

  const deleteInforme = async (id: string) => {
    if (!confirm("¿Eliminar informe?")) return;

    const { error } = await supabase
      .from("informes_semestrales")
      .delete()
      .eq("id", id);

    if (error) alert("No se pudo eliminar.");
    await loadInformes();
  };

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <h3 className="mb-4">📝 Informes Semestrales</h3>

      <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
        ← Volver
      </button>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-auto">
              <label className="form-label mb-0">Año</label>
              <select
                className="form-select"
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    Año {y.year_number} {y.year_start && `(${y.year_start} - ${y.year_end})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              <button className="btn btn-outline-secondary" onClick={loadInformes}>
                Refrescar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="mb-3">{editId ? "Editar informe" : "Nuevo informe"}</h5>

          <textarea
            className="form-control mb-3"
            rows={4}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
          />

          <button className="btn btn-primary me-2" onClick={saveInforme} disabled={loading}>
            Guardar
          </button>
          {editId && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditId(null);
                setContenido("");
              }}
            >
              Cancelar edición
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">Informes guardados</h5>

          {loading ? (
            <div>Cargando...</div>
          ) : (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Contenido</th>
                  <th style={{ width: 160 }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {informes.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-muted">
                      No hay informes registrados para este año.
                    </td>
                  </tr>
                ) : (
                  informes.map((inf) => (
                    <tr key={inf.id}>
                      <td>{inf.contenido}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => editInforme(inf)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteInforme(inf.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}