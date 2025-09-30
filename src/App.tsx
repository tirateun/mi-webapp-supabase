import { useState } from "react";

function App() {
  const [backendMsg, setBackendMsg] = useState("");
  const [clientMsg, setClientMsg] = useState("");
  const [status, setStatus] = useState("");

  const callApi = async () => {
    setStatus("⏳ Enviando solicitud...");
    try {
      const response = await fetch(
        "https://ylekwhaeyullcrkzbzty.supabase.co/functions/v1/super-api",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZWt3aGFleXVsbGNya3pienR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTk1NzIsImV4cCI6MjA3MzE3NTU3Mn0.riHlrigLN3OWinW2iTFUeNl8qMcupMxmj_Sh0FWQ_KU",
          },
          body: JSON.stringify({ mensaje: "hola desde React" }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setBackendMsg(data.mensaje);
      setClientMsg(data.data.mensaje);
      setStatus("✅ Respuesta recibida correctamente");
    } catch (err: any) {
      setStatus("❌ Error: " + err.message);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>
        Mi WebApp con Supabase 🚀
      </h1>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={callApi}
          style={{
            padding: "12px 24px",
            background: "#3b82f6",
            color: "white",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          Probar super-api
        </button>
      </div>

      <div
        style={{
          marginTop: "30px",
          maxWidth: "500px",
          marginLeft: "auto",
          marginRight: "auto",
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "15px", fontSize: "18px", color: "#444" }}>
          Resultado
        </h2>
        <p>{status}</p>
        {backendMsg && (
          <p>
            <strong>✅ Mensaje del backend:</strong> {backendMsg}
          </p>
        )}
        {clientMsg && (
          <p>
            <strong>📦 Data enviada:</strong> {clientMsg}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;







