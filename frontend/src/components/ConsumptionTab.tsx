import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Calendar, Clock, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, Info, Utensils, Coffee, Sun, Moon, Apple, PieChart, Plus, Search, Camera, X, ChevronDown } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { toast } from "sonner";
import { Recipe } from './RecipeCard';
import { REFERENCIAS, calcularAlertas } from '../utils/referencias';

// Tipos para consumos
export interface Consumption {
  id: string;
  recipeId?: string;
  recipeName: string;
  mealTime: string;
  date?: string;
  time: string;
  portions?: number;
  rating?: number;
  comment?: string | null;
  glycemicIndex: 'bajo' | 'medio' | 'alto';
  carbs: number;
  protein: number;
  fiber: number;
  fat?: number;
  calories: number;
  sugar?: number;
  sodium?: number;
}

interface ConsumptionTabProps {
  user: any;
  recipes: Recipe[];
  externalConsumptions?: Consumption[];
  // Historial completo (todas las fechas); alimenta la lista "Mis consumos"
  historial?: Consumption[];
  onConsumptionsChange?: (consumptions: Consumption[]) => void;
  // Guardan y eliminan en la base de datos; si no se pasan, los cambios quedan solo en pantalla
  onAddConsumption?: (consumption: any) => Promise<boolean>;
  onRemoveConsumption?: (id: string) => Promise<void>;
}

export function ConsumptionTab({ user, recipes, externalConsumptions = [], historial, onConsumptionsChange, onAddConsumption, onRemoveConsumption }: ConsumptionTabProps) {
  // Estados para consumos y modales
  const [consumptions, setConsumptions] = useState<Consumption[]>(externalConsumptions);
  const [addConsumptionModalOpen, setAddConsumptionModalOpen] = useState(false);
  const [selectedMealTime, setSelectedMealTime] = useState<'Desayuno' | 'Almuerzo' | 'Merienda' | 'Snack' | 'Cena'>('Desayuno');
  const [searchRecipe, setSearchRecipe] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [visibles, setVisibles] = useState(15);

  // Sincronizar con consumos externos
  useEffect(() => {
    setConsumptions(externalConsumptions);
  }, [externalConsumptions]);

  // Notificar cambios al padre
  const updateConsumptions = (newConsumptions: Consumption[]) => {
    setConsumptions(newConsumptions);
    if (onConsumptionsChange) {
      onConsumptionsChange(newConsumptions);
    }
  };

  // Calcular totales del día
  const dailyTotals = useMemo(() => {
    const totals = consumptions.reduce((acc, c) => ({
      carbs: acc.carbs + c.carbs,
      protein: acc.protein + c.protein,
      fiber: acc.fiber + c.fiber,
      fat: acc.fat + (c.fat || 0),
      calories: acc.calories + c.calories,
      sugar: acc.sugar + (c.sugar || 0),
      sodium: acc.sodium + (c.sodium || 0)
    }), { carbs: 0, protein: 0, fiber: 0, fat: 0, calories: 0, sugar: 0, sodium: 0 });

    // Se redondea a un decimal para evitar valores como 26.599999999999998
    const r1 = (v: number) => Math.round(v * 10) / 10;
    return {
      carbs: r1(totals.carbs), protein: r1(totals.protein), fiber: r1(totals.fiber), fat: r1(totals.fat),
      calories: r1(totals.calories), sugar: r1(totals.sugar), sodium: r1(totals.sodium),
    };
  }, [consumptions]);

  // Alertas del día por sodio y azúcares (mismos umbrales que el informe del profesional)
  const alertasDelDia = useMemo(() => calcularAlertas(consumptions), [consumptions]);

  // Calcular impacto glucémico estimado del día
  const glycemicImpact = useMemo(() => {
    if (consumptions.length === 0) return { 
      level: 'Sin datos', 
      color: 'gray', 
      icon: Minus,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-700',
      description: 'Registra tu primera comida'
    };

    // Carga glucémica acumulada del día: suma la de cada platillo (índice glucémico y carbohidratos
    // de sus ingredientes) por la porción consumida. A diferencia del porcentaje de carbohidratos,
    // distingue un platillo de índice glucémico bajo, como la avena, de uno de índice alto.
    const carga = Math.round(consumptions.reduce((s, c) => {
      const receta = recipes.find(r => r.id === c.recipeId);
      return s + (Number(receta?.glycemicLoad) || 0) * (c.portions || 1);
    }, 0));
    const detalle = `Carga glucémica acumulada: ${carga} (baja hasta ${REFERENCIAS.carga_dia_baja}, alta desde ${REFERENCIAS.carga_dia_alta})`;

    if (carga >= REFERENCIAS.carga_dia_alta) {
      return {
        level: 'Alto',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        icon: TrendingUp,
        description: detalle
      };
    } else if (carga > REFERENCIAS.carga_dia_baja) {
      return {
        level: 'Moderado',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
        icon: Minus,
        description: detalle
      };
    } else {
      return {
        level: 'Bajo',
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        icon: TrendingDown,
        description: detalle
      };
    }
  }, [consumptions, recipes]);

  // Distribución de la energía entre macronutrientes: 4 kcal/g de carbohidratos y proteínas, 9 kcal/g de grasas.
  // La fibra no se incluye: forma parte de los carbohidratos y se muestra aparte.
  const macrosDistribution = useMemo(() => {
    const kc = dailyTotals.carbs * 4, kp = dailyTotals.protein * 4, kg = dailyTotals.fat * 9;
    const total = kc + kp + kg;
    if (total === 0) return { carbs: 0, protein: 0, fat: 0 };

    return {
      carbs: Math.round((kc / total) * 100),
      protein: Math.round((kp / total) * 100),
      fat: Math.round((kg / total) * 100)
    };
  }, [dailyTotals]);

  // Generar consejo automático basado en reglas condicionales
  const automaticAdvice = useMemo(() => {
    // Regla 1: Bajo consumo de fibra
    if (dailyTotals.fiber < REFERENCIAS.fibra_min_g) {
      return {
        title: 'Aumenta tu consumo de fibra',
        message: `Tu ingesta de fibra está por debajo de lo recomendado (${REFERENCIAS.fibra_min_g}-30 g diarios). Incluye más vegetales, legumbres y granos integrales en tus próximas comidas.`,
        icon: AlertTriangle,
        color: 'amber'
      };
    }

    // Regla 2: Alto porcentaje de carbohidratos
    if (macrosDistribution.carbs > 55) {
      return {
        title: 'Balance tus macronutrientes',
        message: 'El porcentaje de carbohidratos es elevado. Considera aumentar las proteínas magras y grasas saludables para mejorar la saciedad y control glucémico.',
        icon: Info,
        color: 'blue'
      };
    }

    // Regla 3: Buena distribución proteica
    if (dailyTotals.protein >= 60 && macrosDistribution.protein >= 25) {
      return {
        title: '¡Excelente ingesta proteica!',
        message: 'Has alcanzado una muy buena cantidad de proteínas. Esto ayuda a mantener la masa muscular y mejora la sensación de saciedad.',
        icon: CheckCircle2,
        color: 'green'
      };
    }

    // Regla 4: Impacto glucémico bajo
    if (glycemicImpact.level === 'Bajo') {
      return {
        title: 'Control glucémico óptimo',
        message: 'Tus elecciones alimentarias del día han sido excelentes para mantener estables tus niveles de glucosa. ¡Continúa así!',
        icon: CheckCircle2,
        color: 'green'
      };
    }

    // Regla 5: Pocas comidas registradas
    if (consumptions.length < 3) {
      return {
        title: 'Registra más comidas',
        message: 'Has registrado pocas comidas hoy. Mantener un registro completo te ayudará a obtener recomendaciones más precisas y mejorar tu control.',
        icon: Info,
        color: 'blue'
      };
    }

    // Regla por defecto
    return {
      title: 'Mantén el equilibrio',
      message: 'Continúa eligiendo alimentos con bajo índice glucémico y balanceando tus porciones en cada comida del día.',
      icon: CheckCircle2,
      color: 'purple'
    };
  }, [dailyTotals, macrosDistribution, consumptions, glycemicImpact]);

  // Organizar consumos por momento del día
  const mealTimes = ['Desayuno', 'Almuerzo', 'Merienda', 'Snack', 'Cena'] as const;
  
  const getMealIcon = (mealTime: string) => {
    switch (mealTime) {
      case 'Desayuno': return Coffee;
      case 'Almuerzo': return Sun;
      case 'Snack': return Apple;
      case 'Cena': return Moon;
      default: return Utensils;
    }
  };


  // Lista "Mis consumos": historial completo (o los de hoy si no se recibe), del más reciente al más antiguo
  const listaConsumos = useMemo(() => {
    const base = historial ?? consumptions;
    return [...base].sort((a, b) => `${b.date || ''} ${b.time}`.localeCompare(`${a.date || ''} ${a.time}`));
  }, [historial, consumptions]);

  const gruposPorFecha = useMemo(() => {
    const grupos = new Map<string, Consumption[]>();
    for (const c of listaConsumos.slice(0, visibles)) {
      const f = c.date || new Date().toLocaleDateString('en-CA');
      if (!grupos.has(f)) grupos.set(f, []);
      grupos.get(f)!.push(c);
    }
    return [...grupos.entries()];
  }, [listaConsumos, visibles]);

  const etiquetaFecha = (f: string) => {
    const hoy = new Date();
    const ayer = new Date(hoy.getTime() - 86400000);
    if (f === hoy.toLocaleDateString('en-CA')) return 'Hoy';
    if (f === ayer.toLocaleDateString('en-CA')) return 'Ayer';
    return new Date(f + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Momento del día sugerido para un registro nuevo, según la hora actual
  const momentoSegunHora = (): 'Desayuno' | 'Almuerzo' | 'Merienda' | 'Snack' | 'Cena' => {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'Desayuno';
    if (h >= 11 && h < 16) return 'Almuerzo';
    if (h >= 16 && h < 20) return 'Merienda';
    return 'Cena';
  };

  const getGIColor = (gi: string) => {
    switch (gi) {
      case 'bajo': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
      case 'medio': return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
      case 'alto': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  const getAdviceColor = (color: string) => {
    switch (color) {
      case 'green': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', iconColor: 'text-green-600' };
      case 'blue': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-600' };
      case 'amber': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', iconColor: 'text-amber-600' };
      case 'purple': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', iconColor: 'text-purple-600' };
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', iconColor: 'text-gray-600' };
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-CO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Filtrar recetas para el modal de búsqueda
  const filteredRecipes = useMemo(() => {
    if (!searchRecipe) return recipes;
    return recipes.filter(r => 
      r.title.toLowerCase().includes(searchRecipe.toLowerCase()) ||
      r.description.toLowerCase().includes(searchRecipe.toLowerCase())
    );
  }, [recipes, searchRecipe]);

  // Handlers
  const handleOpenAddModal = (mealTime: 'Desayuno' | 'Almuerzo' | 'Merienda' | 'Snack' | 'Cena') => {
    setSelectedMealTime(mealTime);
    setAddConsumptionModalOpen(true);
    setSearchRecipe('');
    setSelectedRecipe(null);
    // Set current time as default
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setSelectedTime(`${hours}:${minutes}`);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleAddConsumption = async () => {
    if (!selectedRecipe || !selectedTime) {
      toast.error('Debes seleccionar un platillo y la hora');
      return;
    }

    if (onAddConsumption) {
      const ok = await onAddConsumption({
        recipeId: selectedRecipe.id,
        recipeName: selectedRecipe.title,
        mealTime: selectedMealTime,
        time: selectedTime,
        portions: 1,
      });
      if (!ok) return;
    } else {
      updateConsumptions([...consumptions, {
        id: Date.now().toString(),
        recipeId: selectedRecipe.id,
        recipeName: selectedRecipe.title,
        mealTime: selectedMealTime,
        time: selectedTime,
        glycemicIndex: selectedRecipe.glycemicIndex as 'bajo' | 'medio' | 'alto',
        carbs: parseFloat(selectedRecipe.carbs) || 0,
        protein: parseFloat(selectedRecipe.protein) || 0,
        fiber: parseFloat(selectedRecipe.fiber) || 0,
        fat: parseFloat((selectedRecipe as any).fats) || 0,
        calories: parseFloat(selectedRecipe.calories) || 0,
        sugar: parseFloat(selectedRecipe.sugars) || 0,
        sodium: parseFloat(selectedRecipe.sodium) || 0
      }]);
      toast.success('Consumo registrado', { description: `${selectedRecipe.title} agregado a ${selectedMealTime}` });
    }

    setAddConsumptionModalOpen(false);
    setSelectedRecipe(null);
    setSearchRecipe('');
  };

  const handlePhotoRecognition = () => {
    toast.info('Próximamente', {
      description: 'El reconocimiento del plato por fotografía estará disponible en una próxima versión.'
    });
  };

  const handleRemoveConsumption = async (id: string) => {
    if (onRemoveConsumption) {
      await onRemoveConsumption(id);
      return;
    }
    updateConsumptions(consumptions.filter(c => c.id !== id));
    toast.success('Consumo eliminado');
  };

  return (
    <div className="space-y-6">
      {/* Encabezado con fecha e impacto glucémico */}
      <div className="space-y-4">
        {/* Fecha actual */}
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium capitalize">{formattedDate}</span>
        </div>

        {/* Indicador de impacto glucémico */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${glycemicImpact.bgColor} ${glycemicImpact.borderColor} border-2 rounded-2xl p-5`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${glycemicImpact.color === 'green' ? 'bg-green-600' : glycemicImpact.color === 'yellow' ? 'bg-yellow-600' : glycemicImpact.color === 'red' ? 'bg-red-600' : 'bg-gray-400'}`}>
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Impacto glucémico estimado del día</h4>
                <p className={`text-2xl font-black ${glycemicImpact.textColor} flex items-center gap-2 mt-0.5`}>
                  {glycemicImpact.level}
                  <glycemicImpact.icon className="w-6 h-6" />
                </p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`${glycemicImpact.bgColor} ${glycemicImpact.textColor} ${glycemicImpact.borderColor} px-3 py-1.5 text-xs font-bold`}
            >
              {consumptions.length} {consumptions.length === 1 ? 'comida registrada' : 'comidas registradas'}
            </Badge>
          </div>
          <p className={`text-xs ${glycemicImpact.textColor} font-medium`}>
            {glycemicImpact.description}
          </p>
        </motion.div>
      </div>

      {/* Opciones de agregar consumos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={() => handleOpenAddModal(momentoSegunHora())}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl h-12 font-bold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Agregar Consumo Manual
        </Button>
        
        <Button
          onClick={handlePhotoRecognition}
          variant="outline"
          className="border-2 border-gray-200 text-gray-500 rounded-xl h-12 font-bold cursor-not-allowed"
          aria-disabled="true"
        >
          <Camera className="w-5 h-5 mr-2" />
          Reconocimiento con foto
          <span className="ml-2 text-[10px] font-bold uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Próximamente</span>
        </Button>
      </div>

      {/* Mis consumos: historial completo; cada consumo se despliega con su detalle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mis consumos</h5>
          {listaConsumos.length > 0 && (
            <span className="text-xs text-gray-500">{listaConsumos.length} {listaConsumos.length === 1 ? 'consumo registrado' : 'consumos registrados'}</span>
          )}
        </div>

        {listaConsumos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
          >
            <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Utensils className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-bold mb-1">Hasta la fecha no presentas ningún consumo registrado</p>
            <p className="text-sm text-gray-400 mb-4">Cuando registres un platillo, aparecerá aquí con la fecha, la hora y el momento del día</p>
            <Button
              onClick={() => handleOpenAddModal(momentoSegunHora())}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar primera comida
            </Button>
          </motion.div>
        ) : (
          gruposPorFecha.map(([fecha, items]) => (
            <div key={fecha} className="space-y-2">
              <p className="text-xs font-bold text-purple-700 capitalize">{etiquetaFecha(fecha)}</p>
              {items.map((c) => {
                const abierto = expandido === c.id;
                const receta = recipes.find(r => r.id === c.recipeId);
                const giColors = getGIColor(c.glycemicIndex);
                const MealIcon = getMealIcon(c.mealTime);
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setExpandido(abierto ? null : c.id)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                      aria-expanded={abierto}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                        {receta?.image
                          ? <img src={receta.image} alt={c.recipeName} className="w-full h-full object-cover" />
                          : <Utensils className="w-5 h-5 text-gray-300" />}
                      </div>
                      <span className="flex-1 font-bold text-gray-900 text-sm">{c.recipeName}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {abierto && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
                              <div className="bg-purple-50 rounded-xl p-2.5">
                                <p className="text-[10px] font-bold text-gray-500 uppercase">Momento</p>
                                <p className="font-bold text-purple-800 flex items-center gap-1 mt-0.5"><MealIcon className="w-3.5 h-3.5" />{c.mealTime}</p>
                              </div>
                              <div className="bg-purple-50 rounded-xl p-2.5">
                                <p className="text-[10px] font-bold text-gray-500 uppercase">Hora</p>
                                <p className="font-bold text-purple-800 flex items-center gap-1 mt-0.5"><Clock className="w-3.5 h-3.5" />{c.time || '—'}</p>
                              </div>
                              <div className="bg-purple-50 rounded-xl p-2.5">
                                <p className="text-[10px] font-bold text-gray-500 uppercase">Fecha</p>
                                <p className="font-bold text-purple-800 mt-0.5">{c.date ? new Date(c.date + 'T12:00:00').toLocaleDateString('es-CO') : '—'}</p>
                              </div>
                              <div className="bg-purple-50 rounded-xl p-2.5">
                                <p className="text-[10px] font-bold text-gray-500 uppercase">Porción</p>
                                <p className="font-bold text-purple-800 mt-0.5">{c.portions ?? 1}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                              <span>🔥 {c.calories} kcal</span>
                              <span>🥗 {c.carbs} g carbohidratos</span>
                              <span>🍗 {c.protein} g proteína</span>
                              <span>🌾 {c.fiber} g fibra</span>
                              {c.sugar != null && <span>🍬 {c.sugar} g azúcares</span>}
                              {c.sodium != null && <span>🧂 {c.sodium} mg sodio</span>}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={`${giColors.bg} ${giColors.text} ${giColors.border} text-[10px] px-2 py-0.5`}>
                                IG {c.glycemicIndex}
                              </Badge>
                              {c.rating ? <span className="text-xs text-amber-600">{'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}</span> : null}
                              {c.comment && <span className="text-xs text-gray-500 italic">«{c.comment}»</span>}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveConsumption(c.id)}
                                className="ml-auto h-8 text-red-600 hover:bg-red-50 rounded-lg text-xs"
                              >
                                <X className="w-3.5 h-3.5 mr-1" /> Eliminar
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {listaConsumos.length > visibles && (
          <Button
            variant="outline"
            onClick={() => setVisibles(visibles + 15)}
            className="w-full rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            Ver más consumos ({listaConsumos.length - visibles} restantes)
          </Button>
        )}
      </div>

      {/* Resumen nutricional del día */}
      {consumptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200 p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-5 h-5 text-purple-600" />
            <h5 className="font-black text-purple-900">Resumen Nutricional del Día</h5>
          </div>

          {/* Totales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-xl border border-purple-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Calorías totales</p>
              <p className="text-2xl font-black text-purple-900 mt-1">{dailyTotals.calories}</p>
              <p className="text-xs text-gray-600">kcal</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-purple-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fibra total</p>
              <p className="text-2xl font-black text-purple-900 mt-1">{dailyTotals.fiber}</p>
              <p className="text-xs text-gray-600">gramos</p>
            </div>
          </div>

          {/* Distribución de macronutrientes */}
          <div className="bg-white rounded-xl border border-purple-100 p-4 space-y-3">
            <h6 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Distribución de macronutrientes</h6>
            
            {/* Carbohidratos */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-700">Carbohidratos</span>
                <span className="text-xs font-black text-blue-600">{macrosDistribution.carbs}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${macrosDistribution.carbs}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{dailyTotals.carbs}g totales</p>
            </div>

            {/* Proteínas */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-700">Proteína</span>
                <span className="text-xs font-black text-orange-600">{macrosDistribution.protein}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${macrosDistribution.protein}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-full bg-orange-500 rounded-full"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{dailyTotals.protein}g totales</p>
            </div>

            {/* Grasas */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-700">Grasas</span>
                <span className="text-xs font-black text-yellow-600">{macrosDistribution.fat}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${macrosDistribution.fat}%` }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="h-full bg-yellow-500 rounded-full"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{dailyTotals.fat}g totales</p>
            </div>
            <p className="text-[10px] text-gray-400">Porcentaje de la energía del día que aporta cada macronutriente.</p>
          </div>

          {/* Alertas de sodio y azúcares */}
          {alertasDelDia.map(a => (
            <div key={a.clave} className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-600">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h6 className="font-bold text-sm text-red-700 mb-1">{a.titulo}</h6>
                  <p className="text-xs text-red-700 leading-relaxed">{a.mensaje}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Consejo automático */}
          <div className={`${getAdviceColor(automaticAdvice.color).bg} ${getAdviceColor(automaticAdvice.color).border} border rounded-xl p-4`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${automaticAdvice.color === 'green' ? 'bg-green-600' : automaticAdvice.color === 'blue' ? 'bg-blue-600' : automaticAdvice.color === 'amber' ? 'bg-amber-600' : 'bg-purple-600'}`}>
                <automaticAdvice.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h6 className={`font-bold text-sm ${getAdviceColor(automaticAdvice.color).text} mb-1`}>
                  {automaticAdvice.title}
                </h6>
                <p className={`text-xs ${getAdviceColor(automaticAdvice.color).text} leading-relaxed`}>
                  {automaticAdvice.message}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Nota informativa */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 leading-relaxed">
          Los valores nutricionales y el impacto glucémico son estimaciones basadas en las recetas registradas. 
          Para un control preciso, consulta con tu profesional de salud.
        </p>
      </div>

      {/* Modal para agregar consumo */}
      <Dialog open={addConsumptionModalOpen} onOpenChange={setAddConsumptionModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl" aria-describedby="add-consumption-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              <Plus className="w-5 h-5 text-purple-600" />
              Agregar consumo
            </DialogTitle>
            <DialogDescription id="add-consumption-description">
              Busca el platillo que consumiste, elige el momento del día e indica la hora
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Buscador de recetas */}
            <div className="space-y-2">
              <Label htmlFor="search-recipe" className="text-sm font-bold text-gray-700">
                Buscar Platillo
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="search-recipe"
                  type="text" 
                  placeholder="Busca por nombre o ingrediente..."
                  value={searchRecipe} 
                  onChange={(e) => setSearchRecipe(e.target.value)} 
                  className="pl-10 h-12 rounded-xl bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Lista de recetas */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">
                Selecciona un platillo
              </Label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50">
                {filteredRecipes.map((recipe) => {
                  const giColors = getGIColor(recipe.glycemicIndex);
                  return (
                    <button
                      key={recipe.id}
                      onClick={() => handleSelectRecipe(recipe)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedRecipe?.id === recipe.id 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 bg-white hover:border-purple-300'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h6 className="font-bold text-sm text-gray-900 truncate">{recipe.title}</h6>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`${giColors.bg} ${giColors.text} ${giColors.border} text-[10px] px-2 py-0.5`}
                          >
                            IG {recipe.glycemicIndex}
                          </Badge>
                          <span className="text-xs text-gray-500">{recipe.calories}</span>
                        </div>
                      </div>
                      {selectedRecipe?.id === recipe.id && (
                        <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
                
                {filteredRecipes.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No se encontraron platillos</p>
                  </div>
                )}
              </div>
            </div>

            {/* Momento del día */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700">Momento del día</Label>
              <div className="flex flex-wrap gap-2">
                {mealTimes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMealTime(m)}
                    className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold transition-all ${selectedMealTime === m ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de hora */}
            {selectedRecipe && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="consumption-time" className="text-sm font-bold text-gray-700">
                  Hora de consumo
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="consumption-time"
                    type="time" 
                    value={selectedTime} 
                    onChange={(e) => setSelectedTime(e.target.value)} 
                    className="pl-10 h-12 rounded-xl bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </motion.div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddConsumption}
                disabled={!selectedRecipe || !selectedTime}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold h-12"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Consumo
              </Button>
              <Button
                onClick={() => setAddConsumptionModalOpen(false)}
                variant="outline"
                className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-medium h-12"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}