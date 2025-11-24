// AgreementsList.tsx — Versión Extendida (~450 líneas)
// --------------------------------------------------------------
// Esta versión mantiene la estructura visual del original (tablas,
// botones, estilos y layout), pero eliminando código duplicado.
// Se conserva compatibilidad total con tus pantallas actuales.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

interface Agreement {
  id: string;
  name: string;
  signature_date: string | null;
  expiration_date: string | null;
  duration_years: number | null;
  institucion_id: string | null;
  tipo_convenio: string[] | null;
  created_at: string;
}

export default function AgreementsList() {
  const navigate = useNavigate();

  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------
  // Cargar convenios
  // -----------------------------------------------
  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("agreements")
        .select("id, name, signature_date, expiration_date, duration_years, institucion_id, tipo_convenio, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAgreements(data || []);
    } catch (err: any) {
      console.error("Error cargando convenios:", err);
      setError("Error cargando convenios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  // -----------------------------------------------
  // Navegación segura
  // -----------------------------------------------
  const safeNavigate = (path: string, agreementId: string) => {
    if (!agreementId) {
      console.error("❌ agreementId inválido");
      alert("Error: ID de convenio no válido.");
      return;
    }
    navigate(path.replace(":id", agreementId));
  };

  // -----------------------------------------------
  // Render
  // -----------------------------------------------
  return (
    <div className="container mt-4" style={{ maxWidth: "1200px" }}>
      <div className="card shadow p-4 border-0" style={{ borderRadius: "16px" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold text-primary">📑 Lista de Convenios</h3>
          <button
            className="btn btn-success"
            onClick={() => navigate("/agreements/new")}
          >
            + Nuevo Convenio
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">Cargando convenios...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : agreements.length === 0 ? (
          <p className="text-muted">No hay convenios registrados.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Firma</th>
                  <th>Vencimiento</th>
                  <th>Duración</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {agreements.map((ag) => (
                  <tr key={ag.id}>
                    <td className="fw-semibold">{ag.name}</td>
                    <td>{ag.signature_date || "—"}</td>
                    <td>{ag.expiration_date || "—"}</td>
                    <td>{ag.duration_years || "—"} años</td>
                    
                    {/* ACCIONES */}
                    <td>
                      <div className="d-flex gap-2 justify-content-center flex-wrap">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => safeNavigate("/agreements/:id/edit", ag.id)}
                        >
                          ✏️ Editar
                        </button>

                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => safeNavigate("/agreements/:id/programar", ag.id)}
                        >
                          📅 Programar
                        </button>

                        <button
                          className="btn btn-outline-warning btn-sm"
                          onClick={() => safeNavigate("/agreements/:id/cumplimiento", ag.id)}
                        >
                          📘 Cumplimiento
                        </button>

                        <button
                          className="btn btn-outline-info btn-sm"
                          onClick={() => safeNavigate("/agreements/:id/info", ag.id)}
                        >
                          📝 Informe
                        </button>

                        <button
                          className="btn btn-outline-success btn-sm"
                          onClick={() => safeNavigate("/agreements/:id/renew", ag.id)}
                        >
                          ♻️ Renovar
                        </button>

                        <button
                          className="btn btn-outline-dark btn-sm"
                          onClick={() => safeNavigate("/agreements/:id/renewals", ag.id)}
                        >
                          📄 Historial
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



























