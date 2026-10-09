import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Plus, X, MapPin, Activity, Heart, Search, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Recipe } from './RecipeCard';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface InventoryTabProps {
  user: any;
  recipes: Recipe[];
  onFilterChange: (filtered: Recipe[]) => void;
}

// Ingredientes sugeridos por región
const REGIONAL_INGREDIENTS: Record<string, string[]> = {
  'Pacífico': ['pescado', 'trucha', 'plátano verde', 'coco', 'mariscos', 'cilantro', 'limón', 'aguacate'],
  // Nombre con el que la base de datos registra la región de Nariño
  'Pacífica': ['pescado', 'trucha', 'plátano verde', 'coco', 'mariscos', 'cilantro', 'limón', 'aguacate'],
  'Andina': ['papa criolla', 'quinoa', 'trucha', 'aguacate', 'maíz', 'habas', 'cebolla larga', 'tomate chonto', 'cilantro', 'zanahoria'],
  'Caribe': ['pescado', 'yuca', 'plátano', 'coco', 'limón', 'ñame', 'tomate', 'pimentón'],
  'Orinoquía': ['carne magra', 'yuca', 'plátano', 'pescado', 'maíz', 'cilantro'],
  'Amazonía': ['pescado', 'yuca', 'plátano', 'frutas tropicales', 'cilantro', 'limón'],
  'Insular': ['pescado', 'coco', 'frutas tropicales', 'mariscos', 'plátano', 'limón']
};

export function InventoryTab({ user, recipes, onFilterChange }: InventoryTabProps) {
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState({
    avoidFried: false,
    noAddedSugar: false,
    reduceRefinedFlours: false
  });
  const [hasSearched, setHasSearched] = useState(false);

  const region = useMemo(() => user?.region || 'Andina', [user?.region]);

  const suggestedIngredients = useMemo(() => {
    return REGIONAL_INGREDIENTS[region] || REGIONAL_INGREDIENTS['Andina'];
  }, [region]);

  // Combinar ingredientes del input y seleccionados
  const allIngredients = useMemo(() => {
    const fromInput = ingredientsInput
      .split(',')
      .map(i => i.trim().toLowerCase())
      .filter(i => i.length > 0);
    
    const combined = [...new Set([...selectedIngredients.map(i => i.toLowerCase()), ...fromInput])];
    return combined;
  }, [ingredientsInput, selectedIngredients]);

  // Filtrar recetas. «exactas» indica si hubo coincidencias con los ingredientes; si no, se ofrecen
  // recetas de índice glucémico bajo como alternativa y la pantalla lo dice
  const resultado = useMemo(() => {
    if (!hasSearched || allIngredients.length === 0) return { lista: [] as Recipe[], exactas: false };
    const tiene = (recipe: Recipe, palabras: string[]) =>
      recipe.ingredients.some(ing => palabras.some(p => ing.toLowerCase().includes(p)));

    let filtered = recipes.filter(recipe => {
      // SIEMPRE filtrar por índice glucémico bajo (requisito para diabetes tipo 2)
      if (recipe.glycemicIndex !== 'bajo') return false;

      // Verificar si al menos un ingrediente coincide
      const hasMatchingIngredient = allIngredients.some(userIngredient => 
        recipe.ingredients.some(recipeIngredient => 
          recipeIngredient.toLowerCase().includes(userIngredient) ||
          userIngredient.includes(recipeIngredient.toLowerCase())
        )
      );

      if (!hasMatchingIngredient) return false;

      // Aplicar exclusiones
      if (exclusions.avoidFried) {
        const hasFried = recipe.title.toLowerCase().includes('frit') || 
                        recipe.description.toLowerCase().includes('frit');
        if (hasFried) return false;
      }

      if (exclusions.noAddedSugar) {
        // Azúcar añadida en el nombre, la descripción o los ingredientes de la receta
        const hasSugar = recipe.title.toLowerCase().includes('azúcar') ||
                        recipe.description.toLowerCase().includes('azúcar') ||
                        tiene(recipe, ['azúcar', 'leche condensada', 'mermelada', 'panela', 'miel']);
        if (hasSugar) return false;
      }

      if (exclusions.reduceRefinedFlours) {
        // Harinas refinadas entre los ingredientes
        if (tiene(recipe, ['harina', 'pan blanco', 'galleta', 'pasta'])) return false;
      }

      return true;
    });

    if (filtered.length > 0) return { lista: filtered, exactas: true };
    // Sin coincidencias: alternativa de 5 recetas de índice glucémico bajo
    return { lista: recipes.filter(recipe => recipe.glycemicIndex === 'bajo').slice(0, 5), exactas: false };
  }, [recipes, allIngredients, exclusions, hasSearched]);
  const filteredRecipes = resultado.lista;

  useEffect(() => {
    if (hasSearched) {
      onFilterChange(filteredRecipes);
    }
  }, [filteredRecipes, onFilterChange, hasSearched]);

  const handleChipClick = (ingredient: string) => {
    if (selectedIngredients.includes(ingredient)) {
      setSelectedIngredients(prev => prev.filter(i => i !== ingredient));
    } else {
      setSelectedIngredients(prev => [...prev, ingredient]);
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => prev.filter(i => i !== ingredient));
  };

  const handleSearch = () => {
    setHasSearched(true);
  };

  const handleReset = () => {
    setIngredientsInput('');
    setSelectedIngredients([]);
    setExclusions({
      avoidFried: false,
      noAddedSugar: false,
      reduceRefinedFlours: false
    });
    setHasSearched(false);
    onFilterChange([]);
  };

  const activeFiltersCount = Object.values(exclusions).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Bloque explicativo */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-blue-900 mb-1">Encuentra recetas con lo que tienes</h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              Ingresa los ingredientes que tengas disponibles y te sugeriremos recetas saludables para diabetes tipo 2 
              que puedas preparar ahora mismo.
            </p>
          </div>
        </div>
      </div>

      {/* Campo de ingredientes */}
      <div className="space-y-3">
        <Label htmlFor="ingredients-input" className="text-sm font-black text-gray-900">
          ¿Qué ingredientes tienes?
        </Label>
        <div className="relative">
          <Input
            id="ingredients-input"
            type="text"
            placeholder="pescado, arroz integral, plátano verde, aguacate..."
            value={ingredientsInput}
            onChange={(e) => setIngredientsInput(e.target.value)}
            className="pr-10 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        
        {/* Chips de ingredientes seleccionados */}
        {selectedIngredients.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            {selectedIngredients.map((ingredient) => (
              <Badge
                key={ingredient}
                variant="secondary"
                className="bg-blue-600 text-white border-0 px-3 py-1.5 flex items-center gap-1.5"
              >
                {ingredient}
                <button
                  onClick={() => handleRemoveIngredient(ingredient)}
                  className="hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Ingredientes sugeridos por región */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <h5 className="text-sm font-black text-gray-900">
            Ingredientes típicos de la Región {region}
          </h5>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedIngredients.map((ingredient) => {
            const isSelected = selectedIngredients.includes(ingredient);
            return (
              <button
                key={ingredient}
                onClick={() => handleChipClick(ingredient)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                {isSelected && <Plus className="w-3.5 h-3.5 rotate-45" />}
                {!isSelected && <Plus className="w-3.5 h-3.5" />}
                {ingredient}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exclusiones */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <h5 className="text-sm font-black text-gray-900">Preferencias adicionales (opcional)</h5>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="avoid-fried"
              checked={exclusions.avoidFried}
              onCheckedChange={(checked: boolean) => 
                setExclusions(prev => ({ ...prev, avoidFried: checked }))
              }
            />
            <Label
              htmlFor="avoid-fried"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Evitar fritos
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="no-sugar"
              checked={exclusions.noAddedSugar}
              onCheckedChange={(checked: boolean) => 
                setExclusions(prev => ({ ...prev, noAddedSugar: checked }))
              }
            />
            <Label
              htmlFor="no-sugar"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Sin azúcar añadida
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reduce-flours"
              checked={exclusions.reduceRefinedFlours}
              onCheckedChange={(checked: boolean) => 
                setExclusions(prev => ({ ...prev, reduceRefinedFlours: checked }))
              }
            />
            <Label
              htmlFor="reduce-flours"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Reducir harinas refinadas
            </Label>
          </div>
        </div>
      </div>

      {/* Filtros automáticos activos */}
      <div className="space-y-3">
        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtros automáticos activos</h5>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 px-3 py-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Ingredientes sugeridos de la región {region}
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 px-3 py-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Índice glucémico bajo
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 px-3 py-1.5 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" />
            Apto para diabetes tipo 2
          </Badge>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300 px-3 py-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {activeFiltersCount} {activeFiltersCount === 1 ? 'exclusión' : 'exclusiones'}
            </Badge>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSearch}
          disabled={allIngredients.length === 0}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-bold shadow-md disabled:opacity-50"
        >
          <Search className="w-5 h-5 mr-2" />
          Buscar recetas
        </Button>
        {hasSearched && (
          <Button
            onClick={handleReset}
            variant="outline"
            className="h-12 rounded-xl font-bold border-gray-300 hover:bg-gray-50"
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* Resultados */}
      {hasSearched && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 border-t border-gray-200"
        >
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-black text-gray-900">
              {resultado.exactas ? 'Recetas encontradas' : 'No hay coincidencias exactas'}
            </h5>
            <Badge variant="outline" className="bg-blue-600 text-white border-blue-700 px-3 py-1">
              {filteredRecipes.length} {filteredRecipes.length === 1 ? 'receta' : 'recetas'}
            </Badge>
          </div>
          {!resultado.exactas ? (
            <div className="text-center py-6 bg-yellow-50 rounded-xl border border-yellow-200">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-yellow-600" />
              <p className="text-sm text-yellow-800 font-medium">No encontramos recetas con estos ingredientes.</p>
              <p className="text-xs text-yellow-700 mt-1">
                {filteredRecipes.length > 0
                  ? 'Abajo te mostramos recetas de índice glucémico bajo como alternativa. Intenta con otros ingredientes o reduce las exclusiones.'
                  : 'Intenta con otros ingredientes o reduce las exclusiones.'}
              </p>
            </div>
          ) : (
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <p className="text-xs text-green-800">
                Las recetas están filtradas y ordenadas abajo según tus ingredientes disponibles. 
                {filteredRecipes.length > 5 && ' Mostrando las mejores coincidencias.'}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
