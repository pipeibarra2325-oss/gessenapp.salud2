import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, UserCheck, UtensilsCrossed, ClipboardList } from "lucide-react";
import { getAuthHeaders } from "../utils/auth";
import { toast } from "sonner";
import { apiUrl } from "../utils/auth";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  totalUsuarios?: number;
  usuariosActivos?: number;
  totalAdmins?: number;
  totalPlatillos?: number;
  totalConsumos?: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [crecimiento, setCrecimiento] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actividad, setActividad] = useState<any[]>([]);

  const fetchActividad = async () => {
    try {
      const res = await fetch(apiUrl("/admin/logs?limite=8"), { headers: getAuthHeaders() });
      if (res.ok) setActividad((await res.json()).logs || []);
    } catch (error) {
      console.error("Error actividad:", error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch(apiUrl("/admin/dashboard"), {
        headers: getAuthHeaders()
      });

      if (res.status === 401) {
        toast.error("Sesión expirada. Inicia sesión nuevamente.");
        return;
      }
      if (res.status === 403) {
        toast.error("No tienes permisos de administrador.");
        return;
      }
      if (!res.ok) throw new Error("Error del servidor");

      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error dashboard:", error);
      toast.error("Error al cargar el dashboard");
    }
  };

  const fetchCrecimiento = async () => {
    try {
      const res = await fetch(apiUrl("/admin/crecimiento-usuarios"), {
        headers: getAuthHeaders()
      });

      if (!res.ok) return;

      const json = await res.json();
      const limpio = json.map((item: any) => ({
        mes: item.mes,
        total: Number(item.total),
      }));

      setCrecimiento(limpio);
    } catch (error) {
      console.error("Error crecimiento:", error);
      toast.error("Error al cargar gráfico de crecimiento");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchCrecimiento(), fetchActividad()]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-lg">Cargando dashboard...</div>;
  }

  const stats = [
    { title: "Total Usuarios", value: data?.totalUsuarios || 0, icon: Users, color: "text-emerald-600" },
    { title: "Usuarios Activos", value: data?.usuariosActivos || 0, icon: UserCheck, color: "text-blue-600" },
    { title: "Administradores", value: data?.totalAdmins || 0, icon: Users, color: "text-purple-600" },
    { title: "Platillos", value: data?.totalPlatillos || 0, icon: UtensilsCrossed, color: "text-orange-600" },
    { title: "Consumos registrados", value: data?.totalConsumos || 0, icon: ClipboardList, color: "text-rose-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground">Datos en tiempo real</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Crecimiento de Usuarios</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            {crecimiento.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={crecimiento}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Sin datos de crecimiento aún</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px] overflow-auto">
            {actividad.length === 0 ? (
              <p className="text-muted-foreground text-center pt-10">Sin actividad registrada aún</p>
            ) : (
              <ul className="space-y-3">
                {actividad.map((a) => (
                  <li key={a.id_log} className="flex justify-between gap-3 text-sm border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{a.accion.replaceAll("_", " ").toLowerCase()}</p>
                      <p className="text-xs text-muted-foreground">{a.email || "Sistema"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(a.fecha).toLocaleString("es-CO")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}