import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, MapPin, Activity, Heart, Scale, Sunrise, Cookie, Moon, Leaf, Utensils } from 'lucide-react';
import { Badge } from './ui/badge';
import { Recipe } from './RecipeCard';

interface SmartSearchTabProps {
  user: any;
  recipes: Recipe[];
  onFilterChange: (filtered: Recipe[]) => void;
}

type SearchOption = {
  id: string;
  label: string;
  icon: any;
  category?: string;
  preferences?: string[];
  description: string;
};

export function SmartSearchTab({ user, recipes, onFilterChange }: SmartSearchTabProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Calcular IMC y prioridad nutricional
  const nutritionalPriority = useMemo(() => {
    const h = parseFloat(user?.height) / 100;
    const w = parseFloat(user?.weight);
    if (!h || !w) return 'mantenimiento';

    const imc = w / (h * h);

    if (imc < 18.5) return 'aumento';
    if (imc < 25) return 'mantenimiento';
    return 'control de peso';
  }, [user]);

  const region = useMemo(() => user?.region || 'Andina', [user?.region]);

  // Opciones de búsqueda
  const searchOptions: SearchOption[] = [
    {
      id: 'desayuno-ligero',
      label: 'Desayuno ligero',
      icon: Sunrise,
      category: 'Desayuno',
      preferences: ['Ligero', 'Vegetariano'],
      description: 'Recetas bajas en calorías para comenzar el día con energía sin elevar tu glucosa.'
    },
    {
      id: 'almuerzo-balanceado',
      label: 'Almuerzo balanceado',
      icon: Utensils,
      category: 'Almuerzo',
      preferences: [],
      description: 'Comidas completas con proteínas, fibra y vegetales para mantener estable tu glucemia.'
    },
    {
      id: 'cena-suave',
      label: 'Cena suave',
      icon: Moon,
      category: 'Cena',
      preferences: ['Ligero'],
      description: 'Opciones ligeras y fáciles de digerir para una cena saludable.'
    },
    {
      id: 'control-peso',
      label: 'Control de peso',
      icon: Scale,
      category: undefined,
      preferences: ['Ligero', 'Vegetariano'],
      description: 'Recetas diseñadas para ayudarte a mantener o reducir tu peso de forma saludable.'
    },
    {
      id: 'tradicional-saludable',
      label: 'Platos tradicionales saludables',
      icon: Leaf,
      category: undefined,
      preferences: ['Tradicional'],
      description: 'Versiones adaptadas de platos típicos de tu región para diabéticos tipo 2.'
    }
  ];

  // Filtrar recetas según la opción seleccionada
  const filteredRecipes = useMemo(() => {
    if (!selectedOption) return [];

    const option = searchOptions.find(o => o.id === selectedOption);
    if (!option) return [];

    let filtered = recipes.filter(recipe => {
      // SIEMPRE filtrar por índice glucémico bajo (requisito para diabetes tipo 2)
      if (recipe.glycemicIndex !== 'bajo') return false;

      // Filtrar por categoría si está definida
      if (option.category && recipe.category !== option.category) return false;

      // Filtrar por preferencias si están definidas
      if (option.preferences && option.preferences.length > 0) {
        // La preferencia llega como lista desde el backend (un platillo puede tener varias)
        const prefs = Array.isArray(recipe.preference) ? recipe.preference : [recipe.preference].filter(Boolean);
        if (!prefs.some((p: string) => option.preferences!.includes(p))) return false;
      }

      return true;
    });

    // Si la prioridad es control de peso, priorizar recetas con menos calorías
    if (nutritionalPriority === 'control de peso') {
      filtered = filtered.sort((a, b) => {
        const calA = parseInt(a.calories) || 999;
        const calB = parseInt(b.calories) || 999;
        return calA - calB;
      });
    }

    return filtered;
  }, [selectedOption, recipes, nutritionalPriority]);

  // Usar useEffect para actualizar el estado del padre
  useEffect(() => {
    onFilterChange(filteredRecipes);
  }, [filteredRecipes, onFilterChange]);

  const handleOptionClick = (optionId: string) => {
    if (selectedOption === optionId) {
      setSelectedOption(null);
    } else {
      setSelectedOption(optionId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bloque explicativo */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-200">
        <div className="flex items-start gap-3">
          <div className="bg-green-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-green-900 mb-1">Personalización para Diabetes Tipo 2</h4>
            <p className="text-sm text-green-800 leading-relaxed">
              Basándonos en tu perfil de salud (edad, peso, altura e IMC), seleccionamos automáticamente recetas con bajo índice glucémico,
              priorizadas según tu región ({region}) y necesidades nutricionales.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros automáticos activos */}
      <div className="space-y-3">
        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtros automáticos activos</h5>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 px-3 py-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Región: {region}
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 px-3 py-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Bajo índice glucémico
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 px-3 py-1.5 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" />
            Adaptado a diabetes tipo 2
          </Badge>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300 px-3 py-1.5 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            Prioridad: {nutritionalPriority === 'control de peso' ? 'Control de peso' : 'Mantenimiento nutricional'}
          </Badge>
        </div>
      </div>

      {/* Selector: ¿Qué buscas hoy? */}
      <div className="space-y-3">
        <h5 className="text-sm font-black text-gray-900">¿Qué buscas hoy?</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {searchOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedOption === option.id;

            return (
              <motion.button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 rounded-xl border-2 transition-all text-left ${isSelected
                    ? 'border-green-600 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/30'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-green-600' : 'bg-gray-100'
                    }`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'
                      }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h6 className={`font-bold ${isSelected ? 'text-green-900' : 'text-gray-900'
                        }`}>
                        {option.label}
                      </h6>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Resultados */}
      {selectedOption && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 border-t border-gray-200"
        >
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-black text-gray-900">
              Resultados encontrados
            </h5>
            <Badge variant="outline" className="bg-green-600 text-white border-green-700 px-3 py-1">
              {filteredRecipes.length} {filteredRecipes.length === 1 ? 'receta' : 'recetas'}
            </Badge>
          </div>
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Cookie className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No se encontraron recetas con estos criterios.</p>
              <p className="text-xs mt-1">Intenta otra opción.</p>
            </div>
          ) : (
            <p className="text-xs text-gray-600">
              Las recetas están filtradas y ordenadas abajo según tus preferencias.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}