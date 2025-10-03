import Sidebar from "./Sidebar";
import Agreements from "./Agreements";
import Users from "./Users";

function App() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      {/* Barra lateral */}
      <Sidebar />

      {/* Contenido principal */}
      <div style={{ flex: 1, padding: "20px", background: "#f9fafb" }}>
        <h1 style={{ marginBottom: "20px", color: "#333" }}>🚀 Dashboard de Convenios</h1>

        {/* Secciones */}
        <div style={{ marginBottom: "40px" }}>
          <Agreements />
        </div>

        <div>
          <Users />
        </div>
      </div>
    </div>
  );
}

export default App;








