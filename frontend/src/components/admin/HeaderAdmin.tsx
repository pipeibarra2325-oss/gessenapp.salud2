import { Bell, Search, User, LogOut } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function HeaderAdmin({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    onLogout();
    navigate("/", { replace: true });
  };

  // Obtener datos del usuario desde sessionStorage
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between relative z-50">
      {/* Buscador */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar usuarios, platillos..."
            className="w-full bg-muted pl-10 pr-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Notificaciones + Usuario */}
      <div className="flex items-center gap-6">
        {/* Notificaciones */}
        <button className="relative p-2 hover:bg-accent rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background"></span>
        </button>

        {/* Perfil de Usuario */}
        <div className="relative">
          <div
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 cursor-pointer hover:bg-accent px-3 py-2 rounded-xl"
          >
            <div className="text-right">
              <p className="font-medium text-sm">
                {user.nombre ? `${user.nombre} ${user.apellido || ''}` : "Administrador"}
              </p>
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
      </div>
    </header>
  );
}