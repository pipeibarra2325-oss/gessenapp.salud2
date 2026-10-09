import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getAuthHeaders, apiUrl } from "../../utils/auth";
import { toast } from "sonner";

interface Ingrediente {
  id_ingrediente: number;
  nombre_ingrediente: string;
}

interface Fila {
  id_ingrediente: string;
  cantidad: string;
}

interface IngredientesModalProps {
  platillo: { id_platillo: number; nombre_platillo: string };
  onClose: () => void;
  onGuardado: () => void;
}

// Editor de los ingredientes (en gramos) de un platillo. Al guardar, el servidor
// recalcula el aporte nutricional con los valores por 100 g de cada ingrediente.
export function IngredientesModal({ platillo, onClose, onGuardado }: IngredientesModalProps) {
  const [catalogo, setCatalogo] = useState<Ingrediente[]>([]);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [resCat, resPlat] = await Promise.all([
          fetch(apiUrl("/admin/ingredientes"), { headers: getAuthHeaders() }),
          fetch(apiUrl(`/admin/platillos/${platillo.id_platillo}/ingredientes`), { headers: getAuthHeaders() }),
        ]);
        if (!resCat.ok || !resPlat.ok) throw new Error();
        setCatalogo(await resCat.json());
        const actuales = await resPlat.json();
        setFilas(actuales.map((x: any) => ({ id_ingrediente: String(x.id_ingrediente), cantidad: String(x.cantidad) })));
      } catch {
        toast.error("No se pudieron cargar los ingredientes");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [platillo.id_platillo]);

  const cambiar = (i: number, campo: keyof Fila, valor: string) =>
    setFilas(filas.map((f, k) => (k === i ? { ...f, [campo]: valor } : f)));

  const guardar = async () => {
    const lista = filas.filter(f => f.id_ingrediente);
    if (lista.length === 0) {
      toast.error("Agrega al menos un ingrediente");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch(apiUrl(`/admin/platillos/${platillo.id_platillo}/ingredientes`), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ingredientes: lista.map(f => ({ id_ingrediente: Number(f.id_ingrediente), cantidad: Number(f.cantidad) })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudieron guardar los ingredientes");
      const n = data.nutrientes;
      toast.success("Ingredientes actualizados", {
        description: n ? `${n.calorias} kcal · ${n.carbohidratos} g carbohidratos · ${n.azucares} g azúcares · ${n.sodio} mg sodio` : undefined,
      });
      onGuardado();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const totalGramos = filas.reduce((s, f) => s + (Number(f.cantidad) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto space-y-4">
        <div>
          <h2 className="text-xl font-bold">Ingredientes</h2>
          <p className="text-sm text-muted-foreground">{platillo.nombre_platillo} · una porción</p>
        </div>

        {cargando ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <div className="space-y-2">
            {filas.map((f, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select
                  aria-label={`Ingrediente ${i + 1}`}
                  className="flex-1 border p-2.5 rounded-xl text-sm"
                  value={f.id_ingrediente}
                  onChange={(e) => cambiar(i, "id_ingrediente", e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  {catalogo.map(c => <option key={c.id_ingrediente} value={c.id_ingrediente}>{c.nombre_ingrediente}</option>)}
                </select>
                <input
                  aria-label={`Gramos del ingrediente ${i + 1}`}
                  type="number"
                  min={1}
                  max={2000}
                  className="w-24 border p-2.5 rounded-xl text-sm"
                  value={f.cantidad}
                  onChange={(e) => cambiar(i, "cantidad", e.target.value)}
                />
                <span className="text-sm text-muted-foreground">g</span>
                <button
                  onClick={() => setFilas(filas.filter((_, k) => k !== i))}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Quitar ingrediente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setFilas([...filas, { id_ingrediente: "", cantidad: "50" }])}
              className="flex items-center gap-1 text-sm text-primary font-medium pt-1"
            >
              <Plus className="w-4 h-4" /> Agregar ingrediente
            </button>
            <p className="text-xs text-muted-foreground">Total: {totalGramos} g. El aporte nutricional se recalcula al guardar.</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border py-3 rounded-xl">Cancelar</button>
          <button
            onClick={guardar}
            disabled={guardando || cargando}
            className="flex-1 bg-primary text-white py-3 rounded-xl disabled:opacity-70"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
