import { useEffect, useState } from 'react';
import { BrainCircuit, Info, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';
import { Recipe } from './RecipeCard';
import { obtenerRecomendacionesML } from '../services/api';

interface MLRecommendationsTabProps {
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
  // Cambia cada vez que el usuario registra o elimina un consumo, para actualizar las sugerencias
  version?: number;
}

interface Sugerencia {
  id: string;
  puntaje?: number;
  explicacion: string;
}

// Sugerencias personalizadas del modelo de aprendizaje automático (filtrado colaborativo),
// filtradas por las reglas clínicas del sistema (sin platillos de índice glucémico alto).
export function MLRecommendationsTab({ recipes, onRecipeClick, version = 0 }: MLRecommendationsTabProps) {
  const [datos, setDatos] = useState<{ modo: string; mensaje?: string; recomendaciones: Sugerencia[]; modelo?: any; reglas?: { descripcion?: string[] } } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await obtenerRecomendacionesML(6));
    } catch (e: any) {
      setError(e.message || 'No se pudieron obtener las recomendaciones');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [version]);

  const pct = (x?: number) => (x == null ? '—' : `${Math.round(x * 100)} %`);
  const m = datos?.modelo;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-600 shrink-0">
          <BrainCircuit className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-black text-gray-900">Recomendado para ti</h4>
          <p className="text-sm text-gray-600">
            Un modelo de aprendizaje automático aprende de los consumos, favoritos, calificaciones y platillos vistos
            por los pacientes, y de tus propias preferencias, para sugerirte platillos que podrían gustarte. Las reglas
            clínicas del sistema solo admiten índice glucémico bajo (o medio, si tu profesional lo autoriza) y, con un
            IMC de 25 o más, dan prioridad a los platillos con menos calorías.
          </p>
        </div>
        <button onClick={cargar} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Actualizar sugerencias">
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!!datos?.reglas?.descripcion?.length && (
        <div className="flex flex-wrap gap-2">
          {datos.reglas.descripcion.map((d) => (
            <span key={d} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{d}</span>
          ))}
        </div>
      )}

      {datos?.modo === 'inicio_en_frio' && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">{datos.mensaje}</p>
        </div>
      )}

      {cargando && !datos ? (
        <p className="text-sm text-gray-500">Calculando tus sugerencias...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(datos?.recomendaciones || []).map((s) => {
            const r = recipes.find((x) => x.id === s.id);
            if (!r) return null;
            return (
              <button
                key={s.id}
                onClick={() => onRecipeClick(r)}
                className="flex gap-3 p-3 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left"
              >
                <img src={r.image} alt={r.title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-gray-900">{r.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 border-green-200">IG {r.glycemicIndex}</Badge>
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">{r.category}</Badge>
                    <span className="text-[11px] text-gray-500">{r.calories}</span>
                  </div>
                  <p className="text-[11px] text-indigo-700 mt-1.5 leading-snug">{s.explicacion}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {m?.entrenado && (
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Modelo entrenado con {m.interacciones} interacciones de {m.pacientes} pacientes. En la validación, el platillo
          que el paciente eligió después aparece entre las 10 primeras sugerencias en el {pct(m.metricas?.modelo?.hitRate)} de
          los casos (recomendar los platillos más populares: {pct(m.metricas?.popularidad?.hitRate)}). Las sugerencias son
          orientativas y no reemplazan la indicación de tu profesional de la salud.
        </p>
      )}
    </div>
  );
}
