import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, UserCheck, UtensilsCrossed, ClipboardList } from "lucide-react";
import { getAuthHeaders } from "../utils/auth";
import { toast } from "sonner";
import { apiUrl } from "../utils/auth";
import { ModeloRecomendacionCard } from "./ModeloRecomendacionCard";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

interface DashboardData {
  totalUsuarios?: number;
  usuariosActivos?: number;
  totalAdmins?: number;
  totalPlatillos?: number;
  totalConsumos?: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [crecimiento, setCrecimiento] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actividad, setActividad] = useState<any[]>([]);
  const [evolucionImc, setEvolucionImc] = useState<any[]>([]);

  // IMC promedio de los pacientes por mes (última medición de cada paciente en el mes)
  const fetchEvolucionImc = async () => {
    try {
      const res = await fetch(apiUrl("/admin/evolucion-imc"), { headers: getAuthHeaders() });
      if (res.ok) setEvolucionImc(await res.json());
    } catch (error) {
      console.error("Error evolución IMC:", error);
    }
  };

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
        nuevos: Number(item.nuevos),
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
      await Promise.all([fetchDashboard(), fetchCrecimiento(), fetchActividad(), fetchEvolucionImc()]);
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
    { title: "Consumos registrados", value: data?.totalConsumos || 0, icon: ClipboardList, color: "text-rose-600", enlace: "/admin/progreso", ayuda: "Ver progreso y descargar PDF" },
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
          <Card
            key={index}
            onClick={stat.enlace ? () => navigate(stat.enlace!) : undefined}
            title={stat.ayuda}
            className={stat.enlace ? "cursor-pointer hover:shadow-md hover:border-rose-200 transition-all" : undefined}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stat.value}</div>
              {stat.ayuda && <p className="text-xs text-rose-600 mt-1">{stat.ayuda} →</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modelo de recomendación con aprendizaje automático */}
      <ModeloRecomendacionCard />

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
                  <Legend />
                  <Line type="monotone" dataKey="total" name="Total de pacientes" stroke="#3b82f6" strokeWidth={3} />
                  <Line type="monotone" dataKey="nuevos" name="Nuevos en el mes" stroke="#10b981" strokeWidth={2} strokeDasharray="4 3" />
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

      <Card>
        <CardHeader>
          <CardTitle>Evolución del IMC promedio de los pacientes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Promedio mensual con la última medición de peso de cada paciente en el mes. La línea punteada marca el IMC de 25 (sobrepeso).
          </p>
        </CardHeader>
        <CardContent className="h-[320px]">
          {evolucionImc.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucionImc}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="imc" domain={["auto", "auto"]} />
                <YAxis yAxisId="n" orientation="right" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <ReferenceLine yAxisId="imc" y={25} stroke="#f59e0b" strokeDasharray="4 4" />
                <Line yAxisId="imc" type="monotone" dataKey="imc_promedio" name="IMC promedio (kg/m²)" stroke="#10b981" strokeWidth={3} isAnimationActive={false} />
                <Line yAxisId="n" type="monotone" dataKey="pacientes" name="Pacientes medidos" stroke="#94a3b8" strokeDasharray="5 5" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Aún no hay mediciones de peso</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}