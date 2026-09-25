import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UtensilsCrossed, 
  TrendingUp, 
  Shield, 
  Settings,
  ScrollText
} from 'lucide-react';

const menu = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Usuarios', href: '/admin/usuarios', icon: Users },
  { name: 'Recetas', href: '/admin/platillos', icon: UtensilsCrossed },
  { name: 'Progreso', href: '/admin/progreso', icon: TrendingUp },
  { name: 'Administradores', href: '/admin/administradores', icon: Shield },
  { name: 'Logs', href: '/admin/logs', icon: ScrollText },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
];

export function SidebarAdmin() {
  const location = useLocation();

  return (
    <div className="w-72 border-r bg-card flex flex-col h-screen">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-primary">GessenApp</h1>
        <p className="text-sm text-muted-foreground">Panel de Administración</p>
      </div>

      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-1">
          {menu.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
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
  );
}