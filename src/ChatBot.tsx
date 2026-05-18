import { useState, useRef, useEffect } from "react";

interface Mensaje {
  rol: "user" | "assistant";
  texto: string;
}

export default function ChatBot() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      rol: "assistant",
      texto: "👋 Hola, soy el asistente del Sistema de Convenios. Puedo ayudarte con:\n\n• Buscar convenios por nombre, país o institución\n• Consultar vencimientos próximos\n• Ver estado de contraprestaciones\n• Estadísticas generales\n\n¿En qué te puedo ayudar?"
    }
  ]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviarMensaje = async () => {
    if (!input.trim() || cargando) return;

    const textoUsuario = input.trim();
    setInput("");
    setMensajes(prev => [...prev, { rol: "user", texto: textoUsuario }]);
    setCargando(true);

    try {
      const historial = mensajes.slice(-6).map(m => ({
        role: m.rol === "user" ? "user" : "model",
        parts: [{ text: m.texto }]
      }));

      const res = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ mensaje: textoUsuario, historial }),
      });

      const data = await res.json();
      setMensajes(prev => [...prev, {
        rol: "assistant",
        texto: data.respuesta || "No pude obtener una respuesta."
      }]);
    } catch {
      setMensajes(prev => [...prev, {
        rol: "assistant",
        texto: "❌ Error de conexión. Intenta nuevamente."
      }]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const sugerencias = [
    "¿Qué convenios vencen en los próximos 30 días?",
    "Estadísticas generales del sistema",
    "Convenios con Brasil",
    "¿Hay convenios vencidos?",
  ];

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(v => !v)}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #3D1A4F, #5B2C6F)",
          border: "none",
          boxShadow: "0 4px 20px rgba(61,26,79,0.5)",
          cursor: "pointer",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        title="Asistente IA"
      >
        {abierto ? "✕" : "🤖"}
      </button>

      {/* Ventana del chat */}
      {abierto && (
        <div style={{
          position: "fixed",
          bottom: 100,
          right: 28,
          width: 380,
          height: 520,
          background: "white",
          borderRadius: 16,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          zIndex: 9998,
          overflow: "hidden",
          fontFamily: "Arial, sans-serif",
        }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #3D1A4F, #5B2C6F)",
            padding: "14px 18px",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Asistente de Convenios</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>Facultad de Medicina San Fernando</div>
            </div>
            <div style={{
              marginLeft: "auto",
              width: 8, height: 8,
              borderRadius: "50%",
              background: "#4ade80",
              boxShadow: "0 0 6px #4ade80"
            }} />
          </div>

          {/* Mensajes */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background: "#f9fafb",
          }}>
            {mensajes.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.rol === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius: m.rol === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: m.rol === "user"
                    ? "linear-gradient(135deg, #3D1A4F, #5B2C6F)"
                    : "white",
                  color: m.rol === "user" ? "white" : "#1f2937",
                  fontSize: 13,
                  lineHeight: 1.5,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {m.texto}
                </div>
              </div>
            ))}

            {cargando && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  background: "white",
                  padding: "10px 14px",
                  borderRadius: "18px 18px 18px 4px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  display: "flex", gap: 4, alignItems: "center"
                }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7,
                      borderRadius: "50%",
                      background: "#5B2C6F",
                      animation: `bounce 1s ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias (solo al inicio) */}
          {mensajes.length === 1 && (
            <div style={{ padding: "6px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {sugerencias.map((s, i) => (
                <button key={i} onClick={() => setInput(s)} style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  background: "white",
                  cursor: "pointer",
                  color: "#5B2C6F",
                  fontWeight: 500,
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: "10px 12px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            gap: 8,
            background: "white",
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta..."
              rows={1}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 12,
                border: "1px solid #d1d5db",
                fontSize: 13,
                outline: "none",
                resize: "none",
                fontFamily: "Arial, sans-serif",
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={enviarMensaje}
              disabled={cargando || !input.trim()}
              style={{
                padding: "8px 14px",
                borderRadius: 12,
                border: "none",
                background: input.trim() && !cargando
                  ? "linear-gradient(135deg, #3D1A4F, #5B2C6F)"
                  : "#e5e7eb",
                color: input.trim() && !cargando ? "white" : "#9ca3af",
                cursor: input.trim() && !cargando ? "pointer" : "not-allowed",
                fontSize: 16,
                transition: "all 0.2s",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}