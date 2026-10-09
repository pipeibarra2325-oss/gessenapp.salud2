import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiUrl, getAuthHeaders } from '../../utils/auth';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  TrendingUp,
  Shield,
  Settings,
  ScrollText,
  X
} from 'lucide-react';

const menu = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Usuarios', href: '/admin/usuarios', icon: Users },
  { name: 'Recetas', href: '/admin/platillos', icon: UtensilsCrossed },
  { name: 'Progreso y PDF', href: '/admin/progreso', icon: TrendingUp },
  { name: 'Administradores', href: '/admin/administradores', icon: Shield },
  { name: 'Logs', href: '/admin/logs', icon: ScrollText },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
];

// En pantallas medianas o grandes el menú está siempre visible; en el teléfono se abre desde el
// botón del encabezado y se superpone al contenido
export function SidebarAdmin({ abierto = false, onCerrar }: { abierto?: boolean; onCerrar?: () => void }) {
  const location = useLocation();
  // Nombre de la aplicación definido en Configuración
  const [nombreApp, setNombreApp] = useState("GessenApp");
  useEffect(() => {
    const cargar = () =>
      fetch(apiUrl("/admin/configuracion"), { headers: getAuthHeaders() })
        .then((r) => (r.ok ? r.json() : null))
        .then((c) => c?.app_name && setNombreApp(c.app_name))
        .catch(() => {});
    cargar();
    window.addEventListener("gessen-config", cargar);
    return () => window.removeEventListener("gessen-config", cargar);
  }, []);

  return (
    <>
      {abierto && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onCerrar} />}
      <div className={`w-72 border-r bg-card flex-col h-screen fixed inset-y-0 left-0 z-50 md:static md:flex ${abierto ? 'flex' : 'hidden'}`}>
        <div className="p-6 border-b flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary truncate max-w-[13rem]" title={nombreApp}>{nombreApp}</h1>
            <p className="text-sm text-muted-foreground">Panel de Administración</p>
          </div>
          <button onClick={onCerrar} className="md:hidden p-1 rounded-lg hover:bg-accent" aria-label="Cerrar menú">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6">
          <ul className="space-y-1">
            {menu.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={onCerrar}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-accent text-foreground'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
