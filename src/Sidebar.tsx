import React, { useState } from "react";
import { Menu, X } from "lucide-react";

interface SidebarProps {
  setActivePage: (page: "agreementsList" | "agreementsForm" | "users" | "instituciones") => void;
  onLogout: () => void;
  role: string;
  userName: string;
}

export default function Sidebar({ setActivePage, onLogout, role, userName }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (page: "agreementsList" | "agreementsForm" | "users" | "instituciones") => {
    setActivePage(page);
    setIsOpen(false); // Cierra el menú en móviles
  };

  return (
    <>
      {/* 🔹 Botón hamburguesa (solo móvil) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-700 text-white p-2 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 🔹 Sidebar principal */}
      <div
        className={`fixed md:static top-0 left-0 h-full md:h-auto w-64 bg-blue-900 text-white flex flex-col justify-between transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 flex flex-col h-full">
          {/* Encabezado */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">UNMSM</h2>
            <p className="text-sm text-gray-300 break-words">{userName}</p>
          </div>

          {/* Menú principal */}
          <nav className="flex-1 space-y-2">
            <button onClick={() => handleNavigate("agreementsList")} className={menuButton}>
              📑 Ver convenios
            </button>
            <button onClick={() => handleNavigate("agreementsForm")} className={menuButton}>
              📝 Crear convenio
            </button>
            <button onClick={() => handleNavigate("instituciones")} className={menuButton}>
              🏛️ Instituciones
            </button>
            {role === "admin" && (
              <button onClick={() => handleNavigate("users")} className={menuButton}>
                👥 Usuarios
              </button>
            )}
          </nav>

          {/* Cerrar sesión */}
          <div className="mt-8 border-t border-white/30 pt-4">
            <button
              onClick={onLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition-colors"
            >
              🚪 Cerrar sesión
            </button>
            <p className="text-xs text-center text-blue-300 mt-4">
              Facultad de Medicina UNMSM
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// 🎨 Estilo base de botones
const menuButton =
  "block w-full text-left py-2 px-4 rounded-lg hover:bg-blue-700 transition-all text-white font-medium";

