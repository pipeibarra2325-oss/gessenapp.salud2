// src/admin/progreso/page.tsx
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getAuthHeaders, apiUrl } from "../../utils/auth";
import { descargarReportePdf } from "../../utils/reportePdf";
import { toast } from "sonner";
import { FileDown, Stethoscope, Search, X, HeartPulse } from "lucide-react";
import { SeguimientoClinico } from "../../components/SeguimientoClinico";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, LabelList,
} from "recharts";

const MAX_RESULTADOS = 8;
const normalizar = (t: string) => (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const COLORES_IG: Record<string, string> = { Bajo: "#10b981", Medio: "#f59e0b", Alto: "#ef4444", "Sin dato": "#94a3b8" };

export default function ProgresoPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const [reporte, setReporte] = useState<any>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  // Fechas con las que se calcularon el resumen y las gráficas que se ven en pantalla
  const [aplicado, setAplicado] = useState({ desde: "", hasta: "" });
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  // Contenedores de las gráficas (se capturan para el PDF)
  const refCalorias = useRef<HTMLDivElement>(null);
  const refNutrientes = useRef<HTMLDivElement>(null);
  const refIndice = useRef<HTMLDivElement>(null);
  const refMomento = useRef<HTMLDivElement>(null);
  const refPeso = useRef<HTMLDivElement>(null);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(apiUrl("/admin/usuarios"), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setUsuarios(lista);
      // Si se llega desde Usuarios (?usuario=ID), ese paciente queda seleccionado
      const idInicial = Number(searchParams.get("usuario"));
      const inicial = lista.find((u: any) => u.id_usuario === idInicial);
      if (inicial) setUsuarioSeleccionado(inicial);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la lista de usuarios");
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const fetchReporte = async (id: number, registrar = false) => {
    if (desde && hasta && desde > hasta) {
      throw new Error("La fecha «Desde» no puede ser posterior a la fecha «Hasta»");
    }
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (registrar) params.set("registrar", "1");
    const res = await fetch(apiUrl(`/admin/reporte/${id}?${params}`), { headers: getAuthHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Error al cargar el progreso");
    return data;
  };

  const cargarReporte = async () => {
    if (!usuarioSeleccionado) return;
    if (desde && hasta && desde > hasta) {
      // Se conserva el reporte que ya está en pantalla
      toast.error("La fecha «Desde» no puede ser posterior a la fecha «Hasta»");
      return;
    }
    setLoadingReporte(true);
    try {
      setReporte(await fetchReporte(usuarioSeleccionado.id_usuario));
      setAplicado({ desde, hasta });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
      setReporte(null);
    } finally {
      setLoadingReporte(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);
  useEffect(() => { cargarReporte(); }, [usuarioSeleccionado]);

  const descargarPdf = async () => {
    if (!usuarioSeleccionado) return;
    setGenerandoPdf(true);
    try {
      // Se vuelve a consultar con registrar=1 para dejar constancia de la descarga en los logs
      const datos = await fetchReporte(usuarioSeleccionado.id_usuario, true);
      // Si las fechas cambiaron sin pulsar "Aplicar", primero se actualizan las gráficas para que
      // el resumen y las gráficas del PDF correspondan al mismo periodo
      if (desde !== aplicado.desde || hasta !== aplicado.hasta) {
        setReporte(datos);
        setAplicado({ desde, hasta });
        await new Promise((r) => setTimeout(r, 2000));
      }
      await descargarReportePdf(datos, [
        { titulo: "Calorías por día", contenedor: refCalorias.current },
        { titulo: "Promedio diario de nutrientes (g)", contenedor: refNutrientes.current },
        { titulo: "Índice glucémico de los platillos consumidos", contenedor: refIndice.current },
        { titulo: "Registros por momento del día", contenedor: refMomento.current },
        { titulo: "Evolución del peso (azul, kg) y del IMC (verde, kg/m²)", contenedor: refPeso.current, seccion: "seguimiento" },
      ]);
      toast.success("Informe PDF generado");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "No se pudo generar el PDF");
    } finally {
      setGenerandoPdf(false);
    }
  };

  // La lista solo muestra coincidencias de la búsqueda, para no saturar la pantalla
  const termino = normalizar(filtro.trim());
  const coincidencias = termino
    ? usuarios.filter((u) => normalizar(`${u.nombre} ${u.apellido} ${u.email}`).includes(termino))
    : [];
  const usuariosFiltrados = coincidencias.slice(0, MAX_RESULTADOS);

  const seleccionar = (u: any) => {
    setUsuarioSeleccionado(u);
    setFiltro("");
  };

  const pr = reporte?.promedios;
  const dataNutrientes = pr
    ? [
        { nombre: "Carbohidratos", valor: pr.carbohidratos },
        { nombre: "Proteínas", valor: pr.proteinas },
        { nombre: "Grasas", valor: pr.grasas },
        { nombre: "Azúcares", valor: pr.azucares },
        { nombre: "Fibra", valor: pr.fibra },
      ]
    : [];
  const dataIndice = (reporte?.porNivelGlucemico || []).map((x: any) => ({ ...x, color: COLORES_IG[x.nombre] || "#94a3b8" }));
  const hayDatos = reporte?.periodo?.total_registros > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Progreso de Usuarios</h1>
        <p className="text-muted-foreground">
          Seguimiento de la alimentación registrada y descarga del informe para el médico
        </p>
      </div>

      {/* BÚSQUEDA DE PACIENTES: solo muestra coincidencias mientras se escribe */}
      <Card className="shadow-xl">
        <CardContent className="p-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder={usuarioSeleccionado ? "Buscar otro paciente por nombre, apellido o correo" : "Buscar paciente por nombre, apellido o correo"}
              className="w-full pl-9 pr-9 py-2.5 border rounded-xl"
              autoFocus={!usuarioSeleccionado}
            />
            {filtro && (
              <button onClick={() => setFiltro("")} title="Limpiar búsqueda"
                className="absolute right-2 top-2 p-1 rounded-lg text-muted-foreground hover:bg-gray-50">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {loadingUsuarios ? (
            <p className="text-sm text-muted-foreground">Cargando pacientes...</p>
          ) : !termino ? (
            <p className="text-sm text-muted-foreground">
              {usuarios.length} paciente(s) registrados. Escribe para buscar.
            </p>
          ) : usuariosFiltrados.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pacientes que coincidan con «{filtro}»</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {usuariosFiltrados.map((u) => (
                  <button
                    key={u.id_usuario}
                    onClick={() => seleccionar(u)}
                    className="p-3 rounded-2xl flex items-center gap-3 text-left transition-all hover:bg-gray-50 border"
                  >
                    <div className="w-8 h-8 bg-emerald-400 text-white rounded-full flex items-center justify-center font-bold shadow shrink-0">
                      {(u.nombre?.[0] || "") + (u.apellido?.[0] || "")}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{u.nombre} {u.apellido}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email} · {u.registros} registro(s)</p>
                    </div>
                  </button>
                ))}
              </div>
              {coincidencias.length > MAX_RESULTADOS && (
                <p className="text-xs text-muted-foreground">
                  y {coincidencias.length - MAX_RESULTADOS} más; sigue escribiendo para acotar la búsqueda
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div>
        {/* CONTENIDO PRINCIPAL */}
        <div className="space-y-6">
          {!usuarioSeleccionado ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Busca y selecciona un paciente para ver su progreso y descargar el informe PDF.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* ENCABEZADO, FILTRO Y PDF */}
              <Card className="shadow-xl">
                <CardContent className="p-5 flex flex-wrap items-end gap-4 justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}</h2>
                    <p className="text-sm text-muted-foreground">
                      {reporte?.usuario?.edad != null ? `${reporte.usuario.edad} años · ` : ""}
                      {reporte?.usuario?.imc != null ? `IMC ${reporte.usuario.imc} (${reporte.usuario.clasificacion_imc})` : "Sin datos de peso y estatura"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="text-sm">
                      <span className="block text-muted-foreground mb-1">Desde</span>
                      <input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} className="border rounded-xl px-3 py-2" />
                    </label>
                    <label className="text-sm">
                      <span className="block text-muted-foreground mb-1">Hasta</span>
                      <input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className="border rounded-xl px-3 py-2" />
                    </label>
                    <button onClick={cargarReporte} className="border px-4 py-2 rounded-xl hover:bg-gray-50">Aplicar</button>
                    <button
                      onClick={descargarPdf}
                      disabled={generandoPdf || loadingReporte || !reporte}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <FileDown className="w-4 h-4" />
                      {generandoPdf ? "Generando..." : "Descargar informe PDF"}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {loadingReporte ? (
                <p className="text-center py-10">Cargando progreso...</p>
              ) : !reporte ? null : (
                <>
                  {/* RESUMEN */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-200 to-orange-200 shadow">
                      <p className="text-2xl font-bold">{Math.round(pr.calorias)}</p>
                      <p className="text-xs">kcal promedio por día</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-200 to-indigo-200 shadow">
                      <p className="text-2xl font-bold">{reporte.periodo.total_registros}</p>
                      <p className="text-xs">Registros en {reporte.periodo.dias_con_registro} día(s)</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-green-200 to-emerald-200 shadow">
                      <p className="text-2xl font-bold">{pr.fibra} g</p>
                      <p className="text-xs">Fibra promedio por día</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-pink-200 to-red-200 shadow">
                      <p className="text-2xl font-bold">{Math.round(pr.sodio)} mg</p>
                      <p className="text-xs">Sodio promedio por día</p>
                    </div>
                  </div>

                  {/* OBSERVACIONES PARA EL MÉDICO */}
                  <Card className="shadow-xl border-emerald-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-emerald-600" />
                        Resumen para el médico
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1.5 text-sm">
                        {reporte.observaciones.map((o: string, i: number) => <li key={i}>{o}</li>)}
                      </ul>
                      <p className="text-xs text-muted-foreground mt-3">
                        Observaciones orientativas generadas automáticamente; no reemplazan la valoración clínica.
                      </p>
                    </CardContent>
                  </Card>

                  {/* SEGUIMIENTO CLÍNICO */}
                  <Card className="shadow-xl border-rose-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <HeartPulse className="w-5 h-5 text-rose-600" />
                        Seguimiento clínico
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SeguimientoClinico key={usuarioSeleccionado.id_usuario} modo="admin" idPaciente={usuarioSeleccionado.id_usuario} refCurva={refPeso} />
                    </CardContent>
                  </Card>

                  {hayDatos && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="shadow-xl">
                        <CardHeader><CardTitle>Calorías por día</CardTitle></CardHeader>
                        <CardContent>
                          <div ref={refCalorias} style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={reporte.porDia} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="fecha" fontSize={11} />
                                <YAxis fontSize={11} />
                                <Tooltip />
                                <Line type="monotone" dataKey="calorias" name="kcal" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-xl">
                        <CardHeader><CardTitle>Promedio diario de nutrientes (g)</CardTitle></CardHeader>
                        <CardContent>
                          <div ref={refNutrientes} style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={dataNutrientes} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nombre" fontSize={11} />
                                <YAxis fontSize={11} />
                                <Tooltip />
                                <Bar dataKey="valor" fill="#34d399" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                                  <LabelList dataKey="valor" position="top" fontSize={11} />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-xl">
                        <CardHeader><CardTitle>Índice glucémico de los platillos consumidos</CardTitle></CardHeader>
                        <CardContent>
                          <div ref={refIndice} style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={dataIndice}
                                  dataKey="cantidad"
                                  nameKey="nombre"
                                  outerRadius={95}
                                  label={({ nombre, cantidad }: any) => `${nombre}: ${cantidad}`}
                                  isAnimationActive={false}
                                >
                                  {dataIndice.map((d: any) => <Cell key={d.nombre} fill={d.color} />)}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-xl">
                        <CardHeader><CardTitle>Registros por momento del día</CardTitle></CardHeader>
                        <CardContent>
                          <div ref={refMomento} style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={reporte.porMomento} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nombre" fontSize={11} />
                                <YAxis allowDecimals={false} fontSize={11} />
                                <Tooltip />
                                <Bar dataKey="cantidad" fill="#60a5fa" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                                  <LabelList dataKey="cantidad" position="top" fontSize={11} />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* HISTORIAL */}
                  <Card className="shadow-xl">
                    <CardHeader><CardTitle>Historial de consumo</CardTitle></CardHeader>
                    <CardContent>
                      {!hayDatos ? (
                        <p className="text-center py-8 text-muted-foreground">
                          Este usuario no tiene registros de consumo en el periodo seleccionado.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-muted-foreground border-b">
                                <th className="py-2 pr-3">Fecha</th>
                                <th className="py-2 pr-3">Momento</th>
                                <th className="py-2 pr-3">Platillo</th>
                                <th className="py-2 pr-3 text-right">Porción</th>
                                <th className="py-2 pr-3 text-right">kcal</th>
                                <th className="py-2 pr-3 text-right">Carb. (g)</th>
                                <th className="py-2 pr-3 text-right">Fibra (g)</th>
                                <th className="py-2 pr-3">IG</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...reporte.registros].reverse().map((r: any) => (
                                <tr key={r.id_historial} className="border-b last:border-0">
                                  <td className="py-2 pr-3">{r.fecha_consumo}</td>
                                  <td className="py-2 pr-3">{r.meal_time}</td>
                                  <td className="py-2 pr-3">{r.nombre_platillo}</td>
                                  <td className="py-2 pr-3 text-right">{r.porcion_consumida}</td>
                                  <td className="py-2 pr-3 text-right">{Math.round(r.calorias_consumidas)}</td>
                                  <td className="py-2 pr-3 text-right">{r.carbs_consumidos}</td>
                                  <td className="py-2 pr-3 text-right">{r.fibra_consumida}</td>
                                  <td className="py-2 pr-3">
                                    <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ background: COLORES_IG[r.nivel_glucemico] || "#94a3b8" }}>
                                      {r.nivel_glucemico || "—"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
