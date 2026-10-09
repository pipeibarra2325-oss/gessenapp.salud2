// src/admin/logs/page.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getAuthHeaders, apiUrl } from "../../utils/auth";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Log {
  id_log: number;
  accion: string;
  entidad: string | null;
  id_entidad: number | null;
  detalle: Record<string, unknown> | null;
  ip: string | null;
  fecha: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
}

const LIMITE = 25;

const colorAccion = (accion: string) => {
  if (accion.startsWith("ELIMINAR") || accion.startsWith("QUITAR") || accion === "LOGIN_FALLIDO") return "bg-red-100 text-red-700";
  if (accion.startsWith("CREAR") || accion.startsWith("REGISTR") || accion === "SUBIR_IMAGEN") return "bg-emerald-100 text-emerald-700";
  if (accion.startsWith("EDITAR") || accion.startsWith("ACTUALIZAR")) return "bg-amber-100 text-amber-700";
  if (accion.startsWith("DESCARGAR")) return "bg-indigo-100 text-indigo-700";
  return "bg-blue-100 text-blue-700";
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [acciones, setAcciones] = useState<string[]>([]);
  const [accion, setAccion] = useState("");
  const [buscar, setBuscar] = useState("");
  const [loading, setLoading] = useState(true);

  const cargar = async (pag = pagina) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pagina: String(pag), limite: String(LIMITE) });
      if (accion) params.set("accion", accion);
      if (buscar.trim()) params.set("buscar", buscar.trim());
      const res = await fetch(apiUrl(`/admin/logs?${params}`), { headers: getAuthHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al cargar los logs");
      setLogs(data.logs);
      setTotal(data.total);
      setPagina(pag);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch(apiUrl("/admin/logs/acciones"), { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setAcciones)
      .catch(() => setAcciones([]));
  }, []);

  useEffect(() => { cargar(1); }, [accion]);

  const paginas = Math.max(1, Math.ceil(total / LIMITE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Registro de actividad (logs)</h1>
        <p className="text-muted-foreground">Inicios de sesión, cambios realizados desde el panel y descargas de informes</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <CardTitle>{total} evento(s)</CardTitle>
            <div className="flex flex-wrap gap-3">
              <select value={accion} onChange={(e) => setAccion(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
                <option value="">Todas las acciones</option>
                {acciones.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <form onSubmit={(e) => { e.preventDefault(); cargar(1); }} className="relative flex gap-2">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder="Buscar por usuario o detalle"
                  aria-label="Buscar en el registro de eventos"
                  className="pl-9 pr-3 py-2 border rounded-xl text-sm"
                />
                <button type="submit" className="px-3 py-2 border rounded-xl text-sm hover:bg-gray-50">Buscar</button>
              </form>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Cargando...</p>
          ) : logs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay eventos registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4">Fecha</th>
                    <th className="py-2 pr-4">Acción</th>
                    <th className="py-2 pr-4">Usuario</th>
                    <th className="py-2 pr-4">Objeto</th>
                    <th className="py-2 pr-4">Detalle</th>
                    <th className="py-2 pr-4">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id_log} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-4 whitespace-nowrap">{new Date(l.fecha).toLocaleString("es-CO")}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorAccion(l.accion)}`}>{l.accion}</span>
                      </td>
                      <td className="py-2 pr-4">
                        {l.email ? <><div>{l.nombre} {l.apellido}</div><div className="text-xs text-muted-foreground">{l.email}</div></> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">{l.entidad ? `${l.entidad}${l.id_entidad ? ` #${l.id_entidad}` : ""}` : "—"}</td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground max-w-xs break-words">
                        {l.detalle ? Object.entries(l.detalle).map(([k, v]) => `${k}: ${v}`).join(" · ") : "—"}
                      </td>
                      <td className="py-2 pr-4 text-xs">{l.ip || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <button disabled={pagina <= 1} onClick={() => cargar(pagina - 1)} aria-label="Página anterior" className="border rounded-xl p-2 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm">Página {pagina} de {paginas}</span>
            <button disabled={pagina >= paginas} onClick={() => cargar(pagina + 1)} aria-label="Página siguiente" className="border rounded-xl p-2 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
