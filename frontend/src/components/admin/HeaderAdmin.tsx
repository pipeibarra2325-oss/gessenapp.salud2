import { User, LogOut, Menu } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function HeaderAdmin({ onLogout, onMenu }: { onLogout: () => void; onMenu?: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    onLogout();
    navigate("/", { replace: true });
  };

  // Datos del usuario que inició sesión (el inicio de sesión guarda name/lastName)
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const nombre = [user.name || user.nombre, user.lastName || user.apellido].filter(Boolean).join(" ");

  return (
    <header className="h-16 border-b bg-card px-4 md:px-6 flex items-center justify-between relative z-30">
      {/* Botón del menú en el teléfono */}
      <button onClick={onMenu} className="md:hidden p-2 rounded-xl hover:bg-accent" aria-label="Abrir menú">
        <Menu className="w-5 h-5" />
      </button>
      <div className="hidden md:block" />

      {/* Perfil de Usuario */}
      <div className="relative">
        <div
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 cursor-pointer hover:bg-accent px-3 py-2 rounded-xl"
        >
          <div className="text-right">
            <p className="font-medium text-sm">{nombre || "Administrador"}</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>

          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
            <User className="w-5 h-5" />
          </div>
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg z-50 py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-gray-100 text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
