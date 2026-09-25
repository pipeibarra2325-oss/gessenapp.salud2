import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Lightbulb, Clock, Sparkles, MapPin, Activity, Heart, ChevronRight, Salad, Info } from 'lucide-react';
import { Badge } from './ui/badge';
import { Recipe } from './RecipeCard';
import { Button } from './ui/button';

interface DailyRecommendationsTabProps {
  user: any;
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
}

// Consejos rotativos sobre control glucémico
const DAILY_TIPS = [
  {
    id: 1,
    title: "Hidratación constante",
    content: "Beber suficiente agua ayuda a mantener niveles estables de glucosa. Procura 8 vasos al día para facilitar la función renal y el control metabólico."
  },
  {
    id: 2,
    title: "Fibra en cada comida",
    content: "Incluir alimentos ricos en fibra como verduras, legumbres y granos integrales ralentiza la absorción de glucosa y mejora el control glucémico."
  },
  {
    id: 3,
    title: "Horarios regulares",
    content: "Comer a las mismas horas cada día ayuda a regular tus niveles de glucosa. Establece rutinas de alimentación consistentes."
  },
  {
    id: 4,
    title: "Porciones controladas",
    content: "Usa el método del plato: 1/2 vegetales, 1/4 proteína magra y 1/4 carbohidratos complejos. Esto facilita el control de porciones sin pesar alimentos."
  },
  {
    id: 5,
    title: "Actividad después de comer",
    content: "Una caminata de 10-15 minutos después de las comidas principales ayuda a reducir los picos de glucosa postprandial."
  },
  {
    id: 6,
    title: "Proteínas en el desayuno",
    content: "Iniciar el día con proteínas (huevos, yogur griego, nueces) ayuda a estabilizar la glucosa durante toda la mañana."
  },
  {
    id: 7,
    title: "Evita ayunos prolongados",
    content: "Pasar más de 5 horas sin comer puede causar hipoglucemia o picos compensatorios. Incluye snacks saludables entre comidas."
  },
  {
    id: 8,
    title: "Lee las etiquetas",
    content: "Revisa el contenido de carbohidratos totales, no solo azúcares. Los carbohidratos totales afectan tu glucemia más que los azúcares listados."
  },
  {
    id: 9,
    title: "Grasas saludables",
    content: "Incluye aguacate, frutos secos y aceite de oliva. Las grasas saludables mejoran la saciedad y estabilizan la liberación de glucosa."
  },
  {
    id: 10,
    title: "Monitoreo regular",
    content: "Lleva un registro de tus niveles de glucosa antes y después de comer para identificar qué alimentos te afectan más."
  },
  {
    id: 11,
    title: "Cocción al vapor",
    content: "Métodos de cocción como vapor, horno o parrilla preservan mejor los nutrientes y evitan grasas añadidas que dificultan el control glucémico."
  },
  {
    id: 12,
    title: "Estrés y glucosa",
    content: "El estrés eleva el cortisol, que aumenta la glucosa. Practica técnicas de relajación como respiración profunda o meditación breve."
  },
  {
    id: 13,
    title: "Sueño reparador",
    content: "Dormir 7-8 horas mejora la sensibilidad a la insulina. La falta de sueño puede elevar tus niveles de glucosa al día siguiente."
  },
  {
    id: 14,
    title: "Vegetales primero",
    content: "Comenzar las comidas con ensalada o vegetales crudos ayuda a crear una barrera física que ralentiza la absorción de carbohidratos."
  },
  {
    id: 15,
    title: "Snacks inteligentes",
    content: "Combina siempre carbohidratos con proteína o grasa: manzana con mantequilla de almendras, galletas integrales con queso bajo en grasa."
  },
  {
    id: 16,
    title: "Limita los jugos",
    content: "Incluso los jugos naturales elevan rápidamente la glucosa. Prefiere la fruta entera que aporta fibra y ralentiza la absorción."
  },
  {
    id: 17,
    title: "Alimentos de temporada",
    content: "Los productos locales y de temporada son más frescos, nutritivos y económicos. Consulta qué verduras están en cosecha en tu región."
  },
  {
    id: 18,
    title: "Mastica despacio",
    content: "Comer lentamente mejora la digestión y permite que tu cuerpo reconozca la saciedad, evitando excesos que eleven la glucosa."
  },
  {
    id: 19,
    title: "Prepara con anticipación",
    content: "Planifica tus comidas semanales y prepara ingredientes básicos los fines de semana para facilitar decisiones saludables durante la semana."
  },
  {
    id: 20,
    title: "Modera el café",
    content: "La cafeína puede elevar temporalmente la glucosa en algunas personas. Si tomas café, evita añadir azúcar y prueba con canela."
  },
  {
    id: 21,
    title: "Vinagre antes de comer",
    content: "Una cucharada de vinagre de manzana diluido en agua antes de comidas con carbohidratos puede ayudar a reducir picos glucémicos."
  },
  {
    id: 22,
    title: "Especias beneficiosas",
    content: "Canela, cúrcuma y jengibre tienen propiedades que pueden mejorar la sensibilidad a la insulina. Úsalas regularmente en tus preparaciones."
  },
  {
    id: 23,
    title: "Evita edulcorantes",
    content: "Aunque no elevan directamente la glucosa, algunos edulcorantes artificiales pueden alterar la microbiota intestinal. Prefiere stevia natural."
  },
  {
    id: 24,
    title: "Alcohol con precaución",
    content: "El alcohol puede causar hipoglucemia retardada. Si consumes, hazlo con alimentos y en cantidades moderadas."
  },
  {
    id: 25,
    title: "Legumbres regularmente",
    content: "Lentejas, garbanzos y frijoles son excelentes fuentes de proteína vegetal, fibra y tienen bajo índice glucémico."
  },
  {
    id: 26,
    title: "Control de sal",
    content: "El exceso de sodio aumenta el riesgo cardiovascular en personas con diabetes. Usa hierbas y especias para dar sabor."
  },
  {
    id: 27,
    title: "Ejercicio constante",
    content: "30 minutos de actividad moderada 5 veces a la semana mejora significativamente la sensibilidad a la insulina y el control glucémico."
  },
  {
    id: 28,
    title: "Revisa tus pies",
    content: "Personas con diabetes deben revisar diariamente sus pies para detectar heridas tempranamente. Usa calzado cómodo y adecuado."
  },
  {
    id: 29,
    title: "Consultas médicas",
    content: "Asiste a tus controles médicos regularmente. El monitoreo profesional es clave para ajustar tu plan de tratamiento."
  },
  {
    id: 30,
    title: "Apoyo emocional",
    content: "Conecta con grupos de apoyo o comunidades de personas con diabetes. Compartir experiencias reduce el estrés y mejora la adherencia."
  }
];

// Mapeo de regiones a ingredientes típicos para filtrado
const REGIONAL_INGREDIENTS: Record<string, string[]> = {
  'Pacífico': ['pescado', 'trucha', 'plátano', 'coco', 'mariscos'],
  // Nombre con el que la base de datos registra la región de Nariño
  'Pacífica': ['pescado', 'trucha', 'plátano', 'coco', 'mariscos'],
  'Andina': ['papa criolla', 'quinoa', 'trucha', 'habas', 'maíz'],
  'Caribe': ['pescado', 'yuca', 'plátano', 'coco'],
  'Orinoquía': ['carne', 'yuca', 'plátano', 'pescado'],
  'Amazonía': ['pescado', 'yuca', 'plátano'],
  'Insular': ['pescado', 'coco', 'plátano', 'mariscos']
};

export function DailyRecommendationsTab({ user, recipes, onRecipeClick }: DailyRecommendationsTabProps) {
  const region = useMemo(() => user?.region || 'Andina', [user?.region]);
  
  // Determinar tipo de comida según hora del día
  const mealTimeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Desayuno';
    if (hour >= 11 && hour < 16) return 'Almuerzo';
    if (hour >= 16 && hour < 20) return 'Merienda';
    return 'Cena';
  }, []);

  // Filtrar recetas por región y tipo de comida
  const regionalRecipes = useMemo(() => {
    const regionalIngredients = REGIONAL_INGREDIENTS[region] || [];
    
    return recipes.filter(recipe => {
      // Filtro básico: índice glucémico bajo (apto para diabetes tipo 2)
      if (recipe.glycemicIndex !== 'bajo') return false;
      
      // Verificar si contiene ingredientes de la región
      const hasRegionalIngredient = recipe.ingredients.some(ingredient =>
        regionalIngredients.some(regIng => 
          ingredient.toLowerCase().includes(regIng.toLowerCase())
        )
      );
      
      return hasRegionalIngredient;
    });
  }, [recipes, region]);

  // Receta principal recomendada según hora del día
  const mainRecommendation = useMemo(() => {
    const filtered = regionalRecipes.filter(r => r.category === mealTimeOfDay);
    // Si no hay recetas de esa categoría en la región, buscar cualquier receta de esa categoría
    if (filtered.length === 0) {
      const fallback = recipes.filter(r => 
        r.category === mealTimeOfDay && r.glycemicIndex === 'bajo'
      );
      return fallback[0] || recipes.find(r => r.glycemicIndex === 'bajo');
    }
    return filtered[0];
  }, [regionalRecipes, mealTimeOfDay, recipes]);

  // Receta alternativa más ligera
  const alternativeRecommendation = useMemo(() => {
    const lightRecipes = regionalRecipes.filter(r => 
      (Array.isArray(r.preference) ? r.preference.includes('Ligero') : r.preference === 'Ligero') && 
      r.category === mealTimeOfDay &&
      r.id !== mainRecommendation?.id
    );
    
    if (lightRecipes.length === 0) {
      // Fallback: cualquier receta ligera de la misma categoría
      const fallback = recipes.filter(r => 
        (Array.isArray(r.preference) ? r.preference.includes('Ligero') : r.preference === 'Ligero') && 
        r.category === mealTimeOfDay &&
        r.glycemicIndex === 'bajo' &&
        r.id !== mainRecommendation?.id
      );
      return fallback[0];
    }
    
    return lightRecipes[0];
  }, [regionalRecipes, mealTimeOfDay, mainRecommendation, recipes]);

  // Consejo del día (rotación automática por día del año)
  const dailyTip = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const tipIndex = dayOfYear % DAILY_TIPS.length;
    return DAILY_TIPS[tipIndex];
  }, []);

  // Determinar ícono de hora del día
  const getMealIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return '🌅';
    if (hour >= 11 && hour < 16) return '☀️';
    if (hour >= 16 && hour < 20) return '🌤️';
    return '🌙';
  };

  const getMealGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Buenos días';
    if (hour >= 11 && hour < 16) return 'Buen mediodía';
    if (hour >= 16 && hour < 20) return 'Buena tarde';
    return 'Buena noche';
  };

  return (
    <div className="space-y-6">
      {/* Header con saludo personalizado */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-2xl border border-orange-200">
        <div className="flex items-start gap-3">
          <div className="text-4xl">{getMealIcon()}</div>
          <div className="flex-1">
            <h4 className="font-black text-orange-900 mb-1 flex items-center gap-2">
              {getMealGreeting()}, {user?.name || 'Usuario'}
              <Clock className="w-4 h-4" />
            </h4>
            <p className="text-sm text-orange-800 leading-relaxed">
              Basado en la hora actual y tu ubicación en la región <strong>{region}</strong>, 
              te sugerimos estas opciones saludables para tu {mealTimeOfDay.toLowerCase()}.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros automáticos activos */}
      <div className="space-y-2">
        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtros automáticos activos</h5>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 px-3 py-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Región: {region}
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 px-3 py-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Índice glucémico bajo
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 px-3 py-1.5 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" />
            Apto para diabetes tipo 2
          </Badge>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300 px-3 py-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {mealTimeOfDay}
          </Badge>
        </div>
      </div>

      {/* Receta principal recomendada */}
      {mainRecommendation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-orange-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h5 className="font-black text-white text-sm">Recomendación Principal</h5>
          </div>
          
          <div className="p-5">
            <div className="flex gap-4">
              <img 
                src={mainRecommendation.image} 
                alt={mainRecommendation.title}
                className="w-24 h-24 rounded-xl object-cover shadow-sm"
              />
              <div className="flex-1">
                <h6 className="font-black text-gray-900 mb-1.5 text-base">
                  {mainRecommendation.title}
                </h6>
                <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                  {mainRecommendation.description}
                </p>
                
                {/* Etiquetas nutricionales */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-2 py-0.5">
                    IG Bajo
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-2 py-0.5">
                    Apto DT2
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-2 py-0.5">
                    {region}
                  </Badge>
                </div>

                {/* Info nutricional compacta */}
                <div className="flex gap-3 text-[10px] text-gray-500 font-medium">
                  <span>⏱️ {mainRecommendation.prepTime}</span>
                  <span>🔥 {mainRecommendation.calories}</span>
                  <span>🥗 {mainRecommendation.carbs}</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => onRecipeClick(mainRecommendation)}
              className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold h-10"
            >
              Ver receta completa
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Receta alternativa ligera */}
      {alternativeRecommendation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-2.5 flex items-center gap-2 border-b border-cyan-100">
            <Salad className="w-4 h-4 text-cyan-700" />
            <h5 className="font-bold text-cyan-900 text-sm">Alternativa Ligera</h5>
          </div>
          
          <div className="p-4">
            <div className="flex gap-3">
              <img 
                src={alternativeRecommendation.image} 
                alt={alternativeRecommendation.title}
                className="w-20 h-20 rounded-lg object-cover shadow-sm"
              />
              <div className="flex-1">
                <h6 className="font-bold text-gray-900 mb-1 text-sm">
                  {alternativeRecommendation.title}
                </h6>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {alternativeRecommendation.description}
                </p>
                
                {/* Etiquetas nutricionales */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-2 py-0.5">
                    IG Bajo
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-2 py-0.5">
                    Apto DT2
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-2 py-0.5">
                    {region}
                  </Badge>
                  <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] px-2 py-0.5">
                    Ligero
                  </Badge>
                </div>

                <div className="flex gap-2 text-[10px] text-gray-500 font-medium">
                  <span>⏱️ {alternativeRecommendation.prepTime}</span>
                  <span>🔥 {alternativeRecommendation.calories}</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => onRecipeClick(alternativeRecommendation)}
              variant="outline"
              className="w-full mt-3 border-cyan-200 text-cyan-700 hover:bg-cyan-50 rounded-xl font-bold h-9 text-sm"
            >
              Ver alternativa
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Consejo práctico del día */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-5"
      >
        <div className="flex items-start gap-3">
          <div className="bg-green-600 p-2.5 rounded-xl shadow-sm">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h5 className="font-black text-green-900 text-sm">Consejo del Día</h5>
              <Badge variant="outline" className="bg-white text-green-700 border-green-300 text-[10px] px-2 py-0.5">
                {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
              </Badge>
            </div>
            <h6 className="font-bold text-green-800 mb-1.5">
              {dailyTip.title}
            </h6>
            <p className="text-sm text-green-700 leading-relaxed">
              {dailyTip.content}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Nota informativa */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 leading-relaxed">
          Las recomendaciones se actualizan automáticamente según la hora del día y tu región. 
          Los consejos rotan diariamente para ofrecerte información variada sobre control glucémico.
        </p>
      </div>
    </div>
  );
}
