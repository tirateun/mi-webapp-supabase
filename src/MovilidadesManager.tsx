// src/MovilidadesManager.tsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import MovilidadForm from "./MovilidadForm";

interface Movilidad {
  id: string;
  student_name: string;
  student_code: string;
  escuela: string;
  nivel_academico: string;
  destination_place: string;
  destination_country: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  status: string;
  informe_pdf_url: string | null;
  responsible: {
    id: string;
    full_name: string;
    email: string;
  };
  agreement: {
    id: string;
    name: string;
  };
}

export default function MovilidadesManager() {
  const [movilidades, setMovilidades] = useState<Movilidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMovilidad, setEditingMovilidad] = useState<any>(null);
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEscuela, setFilterEscuela] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  
  // Usuario actual
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchMovilidades();
    }
  }, [currentUser, filterStatus, filterEscuela, filterYear]);

  async function fetchCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("user_id", user.id)
        .single();

      setCurrentUser(profile);
      setUserRole(profile?.role || "");
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  }

  async function fetchMovilidades() {
    try {
      setLoading(true);

      let query = supabase
        .from("movilidades")
        .select(`
          *,
          responsible:profiles!responsible_id(id, full_name, email),
          agreement:agreements(id, name)
        `)
        .order("created_at", { ascending: false });

      // Si es responsable interno, solo ver sus movilidades asignadas
      if (userRole === "internal" && currentUser) {
        query = query.eq("responsible_id", currentUser.id);
      }

      // Aplicar filtros
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      if (filterEscuela !== "all") {
        query = query.eq("escuela", filterEscuela);
      }

      if (filterYear !== "all") {
        const startOfYear = `${filterYear}-01-01`;
        const endOfYear = `${filterYear}-12-31`;
        query = query.gte("start_date", startOfYear).lte("start_date", endOfYear);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMovilidades(data || []);
    } catch (err) {
      console.error("Error fetching movilidades:", err);
      alert("Error al cargar movilidades");
    } finally {
      setLoading(false);
    }
  }

  const handleNuevaMovilidad = () => {
    setEditingMovilidad(null);
    setShowForm(true);
  };

  const handleEditMovilidad = (movilidad: Movilidad) => {
    setEditingMovilidad(movilidad);
    setShowForm(true);
  };

  const handleDeleteMovilidad = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta movilidad?")) return;

    try {
      const { error } = await supabase.from("movilidades").delete().eq("id", id);

      if (error) throw error;

      alert("✅ Movilidad eliminada correctamente");
      fetchMovilidades();
    } catch (err: any) {
      console.error("Error deleting movilidad:", err);
      alert("❌ Error al eliminar: " + err.message);
    }
  };

  const handleSubirInforme = async (movilidadId: string) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf";
    
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // Subir archivo a Supabase Storage
        const fileName = `informe_${movilidadId}_${Date.now()}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("movilidades-informes")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from("movilidades-informes")
          .getPublicUrl(fileName);

        // Actualizar movilidad con URL del informe
        const { error: updateError } = await supabase
          .from("movilidades")
          .update({
            informe_pdf_url: urlData.publicUrl,
            informe_fecha: new Date().toISOString().split("T")[0],
            informe_uploaded_by: currentUser.id,
            status: "Completada",
          })
          .eq("id", movilidadId);

        if (updateError) throw updateError;

        alert("✅ Informe subido correctamente");
        fetchMovilidades();
      } catch (err: any) {
        console.error("Error uploading informe:", err);
        alert("❌ Error al subir informe: " + err.message);
      }
    };

    fileInput.click();
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      Pendiente: "bg-warning",
      "En curso": "bg-info",
      Completada: "bg-success",
      Cancelada: "bg-danger",
    };
    return badges[status] || "bg-secondary";
  };

  const getStatusIcon = (status: string) => {
    const icons: any = {
      Pendiente: "⏳",
      "En curso": "🔄",
      Completada: "✅",
      Cancelada: "❌",
    };
    return icons[status] || "📋";
  };

  if (showForm) {
    return (
      <MovilidadForm
        existingMovilidad={editingMovilidad}
        onSave={() => {
          setShowForm(false);
          fetchMovilidades();
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">🌍 Movilidades Académicas</h4>
            {userRole === "admin" && (
              <button className="btn btn-light btn-sm" onClick={handleNuevaMovilidad}>
                ➕ Registrar Movilidad
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {/* FILTROS */}
          <div className="row mb-4">
            <div className="col-md-4">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="Pendiente">⏳ Pendiente</option>
                <option value="En curso">🔄 En curso</option>
                <option value="Completada">✅ Completada</option>
                <option value="Cancelada">❌ Cancelada</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Escuela</label>
              <select
                className="form-select"
                value={filterEscuela}
                onChange={(e) => setFilterEscuela(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="Medicina">Medicina</option>
                <option value="Enfermería">Enfermería</option>
                <option value="Nutrición">Nutrición</option>
                <option value="Obstetricia">Obstetricia</option>
                <option value="Tecnología Médica">Tecnología Médica</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Año</label>
              <select
                className="form-select"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
          </div>

          {/* ESTADÍSTICAS RÁPIDAS */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <h5 className="text-muted">Total</h5>
                  <h2>{movilidades.length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning bg-opacity-25">
                <div className="card-body text-center">
                  <h5 className="text-muted">Pendientes</h5>
                  <h2>{movilidades.filter((m) => m.status === "Pendiente").length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info bg-opacity-25">
                <div className="card-body text-center">
                  <h5 className="text-muted">En curso</h5>
                  <h2>{movilidades.filter((m) => m.status === "En curso").length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success bg-opacity-25">
                <div className="card-body text-center">
                  <h5 className="text-muted">Completadas</h5>
                  <h2>{movilidades.filter((m) => m.status === "Completada").length}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE MOVILIDADES */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : movilidades.length === 0 ? (
            <div className="alert alert-info text-center">
              📭 No hay movilidades registradas con los filtros seleccionados
            </div>
          ) : (
            <div className="row">
              {movilidades.map((movilidad) => (
                <div key={movilidad.id} className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <span>
                        <span className={`badge ${getStatusBadge(movilidad.status)} me-2`}>
                          {getStatusIcon(movilidad.status)} {movilidad.status}
                        </span>
                        <span className="badge bg-secondary">{movilidad.escuela}</span>
                      </span>
                    </div>

                    <div className="card-body">
                      <h5 className="card-title">🎓 {movilidad.student_name}</h5>
                      
                      <p className="mb-1">
                        <strong>Código:</strong> {movilidad.student_code || "No especificado"}
                      </p>
                      <p className="mb-1">
                        <strong>Nivel:</strong> {movilidad.nivel_academico}
                      </p>
                      <p className="mb-1">
                        <strong>Convenio:</strong> {movilidad.agreement.name}
                      </p>
                      
                      <hr />
                      
                      <p className="mb-1">
                        <strong>🌍 Destino:</strong> {movilidad.destination_place}
                      </p>
                      <p className="mb-1">
                        <strong>📍 País:</strong> {movilidad.destination_country}
                      </p>
                      <p className="mb-1">
                        <strong>📅 Periodo:</strong>{" "}
                        {new Date(movilidad.start_date).toLocaleDateString("es-PE")} -{" "}
                        {new Date(movilidad.end_date).toLocaleDateString("es-PE")}
                      </p>
                      <p className="mb-1">
                        <strong>⏱️ Duración:</strong> {movilidad.duration_months}{" "}
                        {movilidad.duration_months === 1 ? "mes" : "meses"}
                      </p>

                      <hr />

                      <p className="mb-1">
                        <strong>👤 Responsable:</strong> {movilidad.responsible.full_name}
                      </p>
                      <p className="mb-1 small text-muted">
                        📧 {movilidad.responsible.email}
                      </p>

                      {movilidad.informe_pdf_url && (
                        <>
                          <hr />
                          <p className="mb-1">
                            <strong>📄 Informe:</strong>{" "}
                            <a
                              href={movilidad.informe_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                            >
                              Ver PDF
                            </a>
                          </p>
                        </>
                      )}
                    </div>

                    <div className="card-footer">
                      <div className="d-flex gap-2">
                        {/* RESPONSABLE: Subir informe */}
                        {userRole === "internal" &&
                          currentUser.id === movilidad.responsible.id &&
                          !movilidad.informe_pdf_url && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleSubirInforme(movilidad.id)}
                            >
                              📤 Subir Informe
                            </button>
                          )}

                        {/* ADMIN: Editar/Eliminar */}
                        {userRole === "admin" && (
                          <>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleEditMovilidad(movilidad)}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteMovilidad(movilidad.id)}
                            >
                              🗑️ Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}