// src/InformesPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import InformesRouter from "./InformesRouter";

interface Props {
  user: any;
  role: string;
}

export default function InformesPage({ user, role }: Props) {
  const { convenioId } = useParams<{ convenioId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [convenio, setConvenio] = useState<any>(null);
  const [esResponsable, setEsResponsable] = useState(false);

  useEffect(() => {
    if (convenioId) {
      cargarConvenioYPermisos();
    }
  }, [convenioId, user]);

  const cargarConvenioYPermisos = async () => {
    setLoading(true);
    try {
      // 1. Cargar convenio
      const { data: convenioData, error: convenioError } = await supabase
        .from("agreements")
        .select("*")
        .eq("id", convenioId)
        .single();

      if (convenioError) throw convenioError;
      setConvenio(convenioData);

      // 2. Verificar si el usuario es responsable
      if (role === "admin" || role === "Admin" || role === "Administrador") {
        // Admin: Solo puede ver
        setEsResponsable(false);
      } else {
        // Verificar si es responsable general
        const { data: responsableGeneral } = await supabase
          .from("agreement_internal_responsibles")
          .select("id")
          .eq("agreement_id", convenioId)
          .eq("internal_responsible_id", user.id)
          .maybeSingle();

        if (responsableGeneral) {
          setEsResponsable(true);
        } else {
          // Verificar si es responsable de algún subtipo
          const { data: subtypes } = await supabase
            .from("agreement_subtypes")
            .select("id")
            .eq("agreement_id", convenioId);

          if (subtypes && subtypes.length > 0) {
            const subtypeIds = subtypes.map(st => st.id);
            
            const { data: responsableSubtipo } = await supabase
              .from("subtype_internal_responsibles")
              .select("id")
              .in("subtype_id", subtypeIds)
              .eq("internal_responsible_id", user.id)
              .maybeSingle();

            setEsResponsable(!!responsableSubtipo);
          } else {
            setEsResponsable(false);
          }
        }
      }
    } catch (error) {
      console.error("Error cargando convenio:", error);
      alert("Error al cargar el convenio");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#F8F9FA"
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p style={{ marginTop: "1rem", color: "#6C757D" }}>Cargando convenio...</p>
        </div>
      </div>
    );
  }

  if (!convenio) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#F8F9FA"
      }}>
        <div style={{ textAlign: "center" }}>
          <h3>Convenio no encontrado</h3>
          <button 
            onClick={() => navigate("/")} 
            className="btn btn-primary"
            style={{ marginTop: "1rem" }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
        color: "white",
        padding: "2rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
      }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>
                📊 Informes del Convenio
              </h1>
              <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "1rem" }}>
                {convenio.name}
              </p>
              
              {/* Badge de permisos */}
              <div style={{ marginTop: "1rem" }}>
                {role === "admin" || role === "Admin" || role === "Administrador" ? (
                  <span style={{
                    background: "rgba(255,255,255,0.2)",
                    padding: "0.5rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.9rem",
                    display: "inline-block"
                  }}>
                    👁️ Modo visualización (Administrador)
                  </span>
                ) : esResponsable ? (
                  <span style={{
                    background: "rgba(253,185,19,0.3)",
                    padding: "0.5rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.9rem",
                    display: "inline-block"
                  }}>
                    ✏️ Modo edición (Responsable)
                  </span>
                ) : (
                  <span style={{
                    background: "rgba(255,255,255,0.2)",
                    padding: "0.5rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.9rem",
                    display: "inline-block"
                  }}>
                    👁️ Modo visualización
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => navigate("/")}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 600,
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
              onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Volver
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <InformesRouter
          convenioId={convenioId!}
          convenioNombre={convenio.name}
          esResponsable={esResponsable}
          isAdmin={role === "admin" || role === "Admin" || role === "Administrador"}
        />
      </div>
    </div>
  );
}