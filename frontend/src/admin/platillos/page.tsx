// src/admin/platillos/page.tsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Edit, Trash2, Plus, Search, ListChecks } from "lucide-react";
import { getAuthHeaders, apiUrl } from "../../utils/auth";
import { toast } from "sonner";
import { IngredientesModal } from "./IngredientesModal";

interface Platillo {
  id_platillo: number;
  nombre_platillo: string;
  descripcion: string;
  nivel_glucemico: string;
  porcion_gramos: number | null;
  id_categoria: number | null;
  categoria: string | null;
  tiempo_preparacion: number | null;
  imagen_url: string | null;
  imagen_credito: string | null;
  calorias: number;
  consumos: number;
  ingredientes?: number;
}

const NIVELES = ["Bajo", "Medio", "Alto"];
const IMAGEN_VACIA = "https://placehold.co/400x300?text=Sin+imagen";

// Lee el mensaje de error que envía el backend ({ error: "..." })
const leerError = async (res: Response, porDefecto: string) => {
  const data = await res.json().catch(() => null);
  return data?.error || porDefecto;
};

const leerArchivo = (archivo: File) =>
  new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result as string);
    lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
    lector.readAsDataURL(archivo);
  });

export default function PlatillosPage() {
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [categorias, setCategorias] = useState<{ id_categoria: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [modo, setModo] = useState<"crear" | "editar">("crear");
  const [platilloForm, setPlatilloForm] = useState<any>(null);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [platilloIngredientes, setPlatilloIngredientes] = useState<Platillo | null>(null);

  const fetchPlatillos = async () => {
    try {
      const res = await fetch(apiUrl("/admin/platillos"), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(await leerError(res, "Error cargando platillos"));
      const data = await res.json();
      setPlatillos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al cargar las recetas");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await fetch(apiUrl("/admin/categorias"), { headers: getAuthHeaders() });
      if (res.ok) setCategorias(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPlatillos();
    fetchCategorias();
  }, []);

  const abrirCrear = () => {
    setModo("crear");
    setPlatilloForm({
      nombre_platillo: "",
      descripcion: "",
      nivel_glucemico: "Bajo",
      porcion_gramos: "",
      id_categoria: categorias[0]?.id_categoria ?? "",
      tiempo_preparacion: "",
      imagen_url: "",
      imagen_credito: "",
    });
    setImagenFile(null);
    setOpenModal(true);
  };

  const abrirEditar = (platillo: Platillo) => {
    setModo("editar");
    setPlatilloForm({
      ...platillo,
      nivel_glucemico: NIVELES.find((n) => n.toLowerCase() === String(platillo.nivel_glucemico).toLowerCase()) || "Bajo",
      porcion_gramos: platillo.porcion_gramos ?? "",
      tiempo_preparacion: platillo.tiempo_preparacion ?? "",
      imagen_url: platillo.imagen_url ?? "",
      imagen_credito: platillo.imagen_credito ?? "",
    });
    setImagenFile(null);
    setOpenModal(true);
  };

  const eliminarPlatillo = async (p: Platillo) => {
    if (!confirm(`¿Eliminar "${p.nombre_platillo}" permanentemente?`)) return;
    try {
      const res = await fetch(apiUrl(`/admin/platillos/${p.id_platillo}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(await leerError(res, "Error al eliminar la receta"));
      toast.success("Receta eliminada correctamente");
      setPlatillos((prev) => prev.filter((x) => x.id_platillo !== p.id_platillo));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const subirImagen = async (archivo: File) => {
    if (archivo.size > 3 * 1024 * 1024) throw new Error("La imagen no puede superar 3 MB");
    const dataUrl = await leerArchivo(archivo);
    const res = await fetch(apiUrl("/admin/imagenes"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ dataUrl }),
    });
    if (!res.ok) throw new Error(await leerError(res, "Error al subir la imagen"));
    return (await res.json()).url as string;
  };

  const guardarPlatillo = async () => {
    if (!platilloForm?.nombre_platillo?.trim()) {
      toast.error("El nombre del platillo es obligatorio");
      return;
    }
    if (!platilloForm.id_categoria) {
      toast.error("Selecciona una categoría");
      return;
    }

    setGuardando(true);
    try {
      let imagenUrl = platilloForm.imagen_url;
      let credito = platilloForm.imagen_credito;
      if (imagenFile) {
        imagenUrl = await subirImagen(imagenFile);
        if (!credito) credito = "Imagen subida por el administrador";
      }

      const url = modo === "crear"
        ? apiUrl("/admin/platillos")
        : apiUrl(`/admin/platillos/${platilloForm.id_platillo}`);

      const res = await fetch(url, {
        method: modo === "crear" ? "POST" : "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...platilloForm,
          id_categoria: Number(platilloForm.id_categoria),
          porcion_gramos: platilloForm.porcion_gramos === "" ? null : Number(platilloForm.porcion_gramos),
          tiempo_preparacion: platilloForm.tiempo_preparacion === "" ? null : Number(platilloForm.tiempo_preparacion),
          imagen_url: imagenUrl || null,
          imagen_credito: credito || null,
        }),
      });

      if (!res.ok) throw new Error(await leerError(res, "Error al guardar la receta"));

      toast.success(modo === "crear" ? "Receta creada correctamente" : "Receta actualizada correctamente",
        modo === "crear" ? { description: "Asígnale sus ingredientes: la receta aparece en el catálogo de los pacientes cuando los tiene." } : undefined);
      setOpenModal(false);
      await fetchPlatillos();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al guardar la receta");
    } finally {
      setGuardando(false);
    }
  };

  const filtrados = platillos.filter((p) =>
    `${p.nombre_platillo} ${p.categoria}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12 text-lg">Cargando recetas...</div>;
  }

  const colorNivel = (n: string) =>
    ({ bajo: "bg-emerald-100 text-emerald-700", medio: "bg-amber-100 text-amber-700", alto: "bg-red-100 text-red-700" } as any)[
      String(n).toLowerCase()
    ] || "bg-gray-100 text-gray-700";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Recetas</h1>
          <p className="text-muted-foreground">{platillos.length} platillos en el sistema</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar receta"
              className="pl-9 pr-3 py-2.5 border rounded-2xl w-full"
            />
          </div>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Añadir Receta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.map((p) => (
          <Card key={p.id_platillo} className="overflow-hidden">
            <img
              src={p.imagen_url || IMAGEN_VACIA}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = IMAGEN_VACIA; }}
              className="w-full h-52 object-cover"
              alt={p.nombre_platillo}
            />

            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${colorNivel(p.nivel_glucemico)}`}>IG {p.nivel_glucemico}</span>
                {p.categoria && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{p.categoria}</span>}
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{Math.round(p.calorias)} kcal</span>
                {p.ingredientes === 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold"
                    title="Los pacientes no la ven hasta que tenga ingredientes">
                    Sin publicar: agrega ingredientes
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg line-clamp-2">{p.nombre_platillo}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{p.descripcion}</p>
              {p.imagen_credito && <p className="text-[11px] text-muted-foreground line-clamp-1">Foto: {p.imagen_credito}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => abrirEditar(p)}
                  className="flex-1 border py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4 inline mr-1" /> Editar
                </button>

                <button
                  onClick={() => setPlatilloIngredientes(p)}
                  className="flex-1 border py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <ListChecks className="w-4 h-4 inline mr-1" /> Ingredientes
                </button>

                <button
                  onClick={() => eliminarPlatillo(p)}
                  title={p.consumos > 0 ? "No se puede eliminar: tiene consumos registrados" : ""}
                  className="flex-1 text-red-600 border py-2.5 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" /> Eliminar
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {platilloIngredientes && (
        <IngredientesModal
          platillo={platilloIngredientes}
          onClose={() => setPlatilloIngredientes(null)}
          onGuardado={fetchPlatillos}
        />
      )}

      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto space-y-4">
            <h2 className="text-xl font-bold">
              {modo === "crear" ? "Nueva Receta" : "Editar Receta"}
            </h2>

            <input
              placeholder="Nombre del platillo"
              maxLength={150}
              className="w-full border p-3 rounded-xl"
              value={platilloForm.nombre_platillo}
              onChange={(e) => setPlatilloForm({ ...platilloForm, nombre_platillo: e.target.value })}
            />

            <textarea
              placeholder="Descripción"
              maxLength={2000}
              className="w-full border p-3 rounded-xl min-h-[80px]"
              value={platilloForm.descripcion || ""}
              onChange={(e) => setPlatilloForm({ ...platilloForm, descripcion: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm">
                <span className="block mb-1 text-muted-foreground">Nivel glucémico</span>
                <select
                  className="w-full border p-3 rounded-xl"
                  value={platilloForm.nivel_glucemico}
                  onChange={(e) => setPlatilloForm({ ...platilloForm, nivel_glucemico: e.target.value })}
                >
                  {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <span className="block mb-1 text-muted-foreground">Categoría</span>
                <select
                  className="w-full border p-3 rounded-xl"
                  value={platilloForm.id_categoria ?? ""}
                  onChange={(e) => setPlatilloForm({ ...platilloForm, id_categoria: e.target.value })}
                >
                  <option value="">Selecciona...</option>
                  {categorias.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm">
                <span className="block mb-1 text-muted-foreground">Porción (g)</span>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  className="w-full border p-3 rounded-xl"
                  value={platilloForm.porcion_gramos}
                  onChange={(e) => setPlatilloForm({ ...platilloForm, porcion_gramos: e.target.value })}
                />
              </label>
              <label className="text-sm">
                <span className="block mb-1 text-muted-foreground">Tiempo (min)</span>
                <input
                  type="number"
                  min={0}
                  max={1440}
                  step={1}
                  className="w-full border p-3 rounded-xl"
                  value={platilloForm.tiempo_preparacion}
                  onChange={(e) => setPlatilloForm({ ...platilloForm, tiempo_preparacion: e.target.value })}
                />
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium block">Imagen</label>
              {(imagenFile || platilloForm.imagen_url) && (
                <img
                  src={imagenFile ? URL.createObjectURL(imagenFile) : platilloForm.imagen_url}
                  alt="Vista previa"
                  className="w-full h-40 object-cover rounded-xl"
                />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  // Una imagen nueva no conserva el crédito de la anterior
                  setImagenFile(e.target.files?.[0] || null);
                  setPlatilloForm({ ...platilloForm, imagen_credito: "" });
                }}
              />
              <input
                placeholder="O pega la URL de una imagen"
                maxLength={1000}
                className="w-full border p-3 rounded-xl text-sm"
                value={platilloForm.imagen_url}
                onChange={(e) => setPlatilloForm({ ...platilloForm, imagen_url: e.target.value, imagen_credito: "" })}
                disabled={!!imagenFile}
              />
              <input
                placeholder="Crédito de la imagen (autor y licencia)"
                maxLength={300}
                className="w-full border p-3 rounded-xl text-sm"
                value={platilloForm.imagen_credito}
                onChange={(e) => setPlatilloForm({ ...platilloForm, imagen_credito: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setOpenModal(false)} className="flex-1 border py-3 rounded-xl">
                Cancelar
              </button>
              <button
                onClick={guardarPlatillo}
                disabled={guardando}
                className="flex-1 bg-primary text-white py-3 rounded-xl disabled:opacity-70"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
