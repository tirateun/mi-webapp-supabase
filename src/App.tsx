// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Users from "./Users";
import Agreements from "./Agreements";
import Login from "./Login";
import "./App.css";

export default function App() {
  const isLoggedIn = localStorage.getItem("supabaseSession");

  return (
    <Router>
      {isLoggedIn ? (
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar />
          <div style={{ flex: 1, padding: "20px" }}>
            <Routes>
              <Route path="/users" element={<Users />} />
              <Route path="/agreements" element={<Agreements />} />
              <Route path="*" element={<Navigate to="/users" />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Login />
      )}
    </Router>
  );
}
