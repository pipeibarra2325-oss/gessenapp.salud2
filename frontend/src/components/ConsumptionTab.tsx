import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Calendar, Clock, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, Info, Utensils, Coffee, Sun, Moon, Apple, PieChart, Plus, Search, Camera, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { toast } from "sonner";
import { Recipe } from './RecipeCard';

// Tipos para consumos
export interface Consumption {
  id: string;
  recipeId?: string;
  recipeName: string;
  mealTime: string;
  time: string;
  portions?: number;
  rating?: number;
  comment?: string | null;
  glycemicIndex: 'bajo' | 'medio' | 'alto';
  carbs: number;
  protein: number;
  fiber: number;
  calories: number;
}

interface ConsumptionTabProps {
  user: any;
  recipes: Recipe[];
  externalConsumptions?: Consumption[];
  onConsumptionsChange?: (consumptions: Consumption[]) => void;
  // Guardan y eliminan en la base de datos; si no se pasan, los cambios quedan solo en pantalla
  onAddConsumption?: (consumption: any) => Promise<boolean>;
  onRemoveConsumption?: (id: string) => Promise<void>;
}

export function ConsumptionTab({ user, recipes, externalConsumptions = [], onConsumptionsChange, onAddConsumption, onRemoveConsumption }: ConsumptionTabProps) {
  // Estados para consumos y modales
  const [consumptions, setConsumptions] = useState<Consumption[]>(externalConsumptions);
  const [addConsumptionModalOpen, setAddConsumptionModalOpen] = useState(false);
  const [selectedMealTime, setSelectedMealTime] = useState<'Desayuno' | 'Almuerzo' | 'Merienda' | 'Snack' | 'Cena'>('Desayuno');
  const [searchRecipe, setSearchRecipe] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedTime, setSelectedTime] = useState('');

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
      calories: acc.calories + c.calories
    }), { carbs: 0, protein: 0, fiber: 0, calories: 0 });

    return totals;
  }, [consumptions]);

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

    const lowCount = consumptions.filter(c => c.glycemicIndex === 'bajo').length;
    const mediumCount = consumptions.filter(c => c.glycemicIndex === 'medio').length;
    const highCount = consumptions.filter(c => c.glycemicIndex === 'alto').length;

    // Cálculo del porcentaje de carbohidratos del total de calorías
    const carbsCalories = dailyTotals.carbs * 4; // 1g carbs = 4 kcal
    const totalCalories = dailyTotals.calories || 1;
    const carbsPercentage = (carbsCalories / totalCalories) * 100;

    // Lógica de reglas condicionales para determinar impacto
    if (highCount > 0 || carbsPercentage > 60) {
      return { 
        level: 'Alto', 
        color: 'red', 
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        icon: TrendingUp,
        description: 'Impacto glucémico elevado detectado'
      };
    } else if (mediumCount >= 2 || carbsPercentage > 45) {
      return { 
        level: 'Moderado', 
        color: 'yellow', 
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
        icon: Minus,
        description: 'Impacto glucémico moderado'
      };
    } else {
      return { 
        level: 'Bajo', 
        color: 'green', 
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        icon: TrendingDown,
        description: 'Excelente control glucémico'
      };
    }
  }, [consumptions, dailyTotals]);

  // Distribución de macronutrientes
  const macrosDistribution = useMemo(() => {
    const totalGrams = dailyTotals.carbs + dailyTotals.protein + dailyTotals.fiber;
    if (totalGrams === 0) return { carbs: 0, protein: 0, fiber: 0 };

    return {
      carbs: Math.round((dailyTotals.carbs / totalGrams) * 100),
      protein: Math.round((dailyTotals.protein / totalGrams) * 100),
      fiber: Math.round((dailyTotals.fiber / totalGrams) * 100)
    };
  }, [dailyTotals]);

  // Generar consejo automático basado en reglas condicionales
  const automaticAdvice = useMemo(() => {
    // Regla 1: Bajo consumo de fibra
    if (dailyTotals.fiber < 20) {
      return {
        title: 'Aumenta tu consumo de fibra',
        message: 'Tu ingesta de fibra está por debajo de lo recomendado (25-30g diarios). Incluye más vegetales, legumbres y granos integrales en tus próximas comidas.',
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
        calories: parseFloat(selectedRecipe.calories) || 0
      }]);
      toast.success('Consumo registrado', { description: `${selectedRecipe.title} agregado a ${selectedMealTime}` });
    }

    setAddConsumptionModalOpen(false);
    setSelectedRecipe(null);
    setSearchRecipe('');
  };

  const handlePhotoRecognition = () => {
    toast.info('Función no disponible', {
      description: 'El reconocimiento con foto a través de IA estará disponible próximamente.'
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
              {consumptions.length} {consumptions.length === 1 ? 'comida' : 'comidas'} registradas
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
          onClick={() => handleOpenAddModal('Desayuno')}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl h-12 font-bold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Agregar Consumo Manual
        </Button>
        
        <Button
          onClick={handlePhotoRecognition}
          variant="outline"
          className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl h-12 font-bold"
        >
          <Camera className="w-5 h-5 mr-2" />
          Reconocimiento con Foto (IA)
        </Button>
      </div>

      {/* Registro de comidas por momento del día */}
      <div className="space-y-4">
        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registro del día</h5>
        
        {mealTimes.map((mealTime) => {
          const mealsForTime = consumptions.filter(c => c.mealTime === mealTime);
          const MealIcon = getMealIcon(mealTime);
          
          return (
            <div key={mealTime} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <MealIcon className="w-4 h-4 text-purple-600" />
                <h6 className="text-sm font-black text-gray-900 flex-1">{mealTime}</h6>
                {mealsForTime.length > 0 && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] px-2 py-0.5">
                    {mealsForTime.length}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenAddModal(mealTime)}
                  className="h-7 w-7 p-0 hover:bg-purple-100 rounded-lg"
                >
                  <Plus className="w-4 h-4 text-purple-600" />
                </Button>
              </div>
              
              {mealsForTime.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {mealsForTime.map((consumption) => {
                    const giColors = getGIColor(consumption.glycemicIndex);
                    return (
                      <motion.div
                        key={consumption.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <h6 className="font-bold text-gray-900 text-sm mb-1">
                              {consumption.recipeName}
                            </h6>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{consumption.time}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <div className="flex flex-col gap-1.5">
                              <Badge 
                                variant="outline" 
                                className={`${giColors.bg} ${giColors.text} ${giColors.border} text-[10px] px-2 py-0.5 justify-center`}
                              >
                                IG {consumption.glycemicIndex}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-2 py-0.5 justify-center whitespace-nowrap"
                              >
                                Apto DT2
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveConsumption(consumption.id)}
                              className="h-6 w-6 p-0 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Info nutricional mini */}
                        <div className="flex gap-3 text-[10px] text-gray-500 font-medium mt-3 pt-3 border-t border-gray-100">
                          <span>🔥 {consumption.calories} kcal</span>
                          <span>🥗 {consumption.carbs}g carbs</span>
                          <span>🍗 {consumption.protein}g proteína</span>
                          <span>🌾 {consumption.fiber}g fibra</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-400 mb-2">No hay consumos registrados para este momento</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenAddModal(mealTime)}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Agregar platillo
                  </Button>
                </div>
              )}
            </div>
          );
        })}
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

            {/* Fibra */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-700">Fibra</span>
                <span className="text-xs font-black text-green-600">{macrosDistribution.fiber}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${macrosDistribution.fiber}%` }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="h-full bg-green-500 rounded-full"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{dailyTotals.fiber}g totales</p>
            </div>
          </div>

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

      {/* Estado vacío */}
      {consumptions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
        >
          <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Utensils className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium mb-1">No hay consumos registrados para hoy</p>
          <p className="text-sm text-gray-400 mb-4">Comienza a registrar tus comidas para obtener recomendaciones personalizadas</p>
          <Button
            onClick={() => handleOpenAddModal('Desayuno')}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar primera comida
          </Button>
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
              Agregar Consumo - {selectedMealTime}
            </DialogTitle>
            <DialogDescription id="add-consumption-description">
              Busca y selecciona el platillo que consumiste, luego indica la hora
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