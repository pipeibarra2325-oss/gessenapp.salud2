import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';
import { Clock, Users, TrendingDown, X, Star, Info, ChevronRight, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ConsumptionRegisterModal } from './ConsumptionRegisterModal';

interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  imageCredit?: string | null;
  prepTime: string;
  servings: number;
  category: string;
  glycemicIndex: 'bajo' | 'medio' | 'alto';
  calories: string;
  carbs: string;
  protein: string;
  fiber: string;
  fats: string;
  sugars: string;
  sodium: string;
  caloricLevel: string;
  glycemicLoad: string;
  macroDistribution: { carbs: number; protein: number; fat: number; };
  ingredients: string[];
  instructions: string[];
  rating?: number;
}

interface RecipeModalProps {
  recipe: Recipe | null;
  open: boolean;
  onClose: () => void;
  onRegisterConsumption: (recipe: Recipe) => void;
}

export function RecipeModal({ recipe, open, onClose, onRegisterConsumption }: RecipeModalProps) {
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  if (!recipe) return null;

  const rating = recipe.rating || 4.5;

  const macroData = [
    { name: 'Carbohidratos', value: recipe.macroDistribution.carbs, color: '#3b82f6' },
    { name: 'Proteínas', value: recipe.macroDistribution.protein, color: '#f97316' },
    { name: 'Grasas', value: recipe.macroDistribution.fat, color: '#eab308' },
  ];

  const handleOpenConsumptionModal = () => {
    setIsConsumptionModalOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="max-w-[95vw] lg:max-w-6xl max-h-[92vh] overflow-y-auto p-0 border-none shadow-2xl rounded-2xl"
          aria-describedby="recipe-description"
        >
          <div className="sr-only">
            <DialogTitle>{recipe.title}</DialogTitle>
            <DialogDescription id="recipe-description">{recipe.description}</DialogDescription>
          </div>

          <div className="grid lg:grid-cols-[450px_1fr] h-full">

            {/* Columna Izquierda: Imagen e Info Nutricional */}
            <div className="bg-gray-50/50 border-r border-gray-100 flex flex-col h-full">
              <div className="relative aspect-video lg:aspect-square overflow-hidden">
                <ImageWithFallback
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
                {recipe.imageCredit && (
                  <p className="absolute bottom-0 inset-x-0 bg-black/45 text-white/90 text-[10px] px-2 py-1 truncate">
                    Foto: {recipe.imageCredit}
                  </p>
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <Badge
                    variant={recipe.glycemicIndex === 'bajo' ? 'default' : recipe.glycemicIndex === 'medio' ? 'secondary' : 'tertiary'
                    }
                    className={`${recipe.glycemicIndex === 'bajo' ? 'bg-green-600' : recipe.glycemicIndex === 'medio' ? 'bg-yellow-600' : 'bg-red-600'} text-white shadow-lg border-none px-3 py-1`}
                  >
                    <TrendingDown className="w-3 h-3 mr-2" />
                    IG {recipe.glycemicIndex.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="p-8 space-y-8 flex-grow">
                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4" />Perfil Nutricional
                  </h4>

                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm transition-hover hover:border-green-300">
                      <p className="text-green-600 text-[10px] uppercase font-bold tracking-tighter mb-1">Carbohidratos</p>
                      <p className="text-xl font-black text-green-900 leading-none">{recipe.carbs}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm transition-hover hover:border-blue-300">
                      <p className="text-blue-600 text-[10px] uppercase font-bold tracking-tighter mb-1">Proteína</p>
                      <p className="text-xl font-black text-blue-900 leading-none">{recipe.protein}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm transition-hover hover:border-orange-300">
                      <p className="text-orange-600 text-[10px] uppercase font-bold tracking-tighter mb-1">Fibra</p>
                      <p className="text-xl font-black text-orange-900 leading-none">{recipe.fiber}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm transition-hover hover:border-purple-300">
                      <p className="text-purple-600 text-[10px] uppercase font-bold tracking-tighter mb-1">Calorías</p>
                      <p className="text-xl font-black text-purple-900 leading-none">{recipe.calories}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm transition-hover hover:border-orange-300">
                      <p className="text-yellow-600 text-[10px] uppercase font-bold tracking-tighter mb-1">Grasas</p>
                      <p className="text-xl font-black text-yellow-600 leading-none">{recipe.fats}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm transition-hover hover:border-orange-300">
                      <p className="text-yellow-600 text-[10px] uppercase font-bold tracking-tighter mb-1">Azúcares</p>
                      <p className="text-xl font-black text-yellow-600 leading-none">{recipe.sugars}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm transition-hover hover:border-orange-300">
                      <p className="text-yellow-600 text-[10px] uppercase font-bold tracking-tighter mb-1">Sodio</p>
                      <p className="text-xl font-black text-yellow-600 leading-none">{recipe.sodium}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm transition-hover hover:border-red-300">
                      <p className="text-red-600 text-[10px] uppercase font-bold tracking-tighter mb-1">Carga Glucémica estimada</p>
                      <p className="text-xl font-black text-red-600 leading-none">{recipe.glycemicLoad}</p>
                    </div>
                  </div>

                  {/* Gráfico de Macronutrientes */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Distribución de Macronutrientes</p>
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={macroData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            dataKey="value"
                          >
                            {macroData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center mt-6">
                      <div>
                        <div className="text-blue-600 font-bold text-xl">{recipe.macroDistribution.carbs}%</div>
                        <div className="text-xs text-gray-500">Carbohidratos</div>
                      </div>
                      <div>
                        <div className="text-orange-600 font-bold text-xl">{recipe.macroDistribution.protein}%</div>
                        <div className="text-xs text-gray-500">Proteínas</div>
                      </div>
                      <div>
                        <div className="text-yellow-600 font-bold text-xl">{recipe.macroDistribution.fat}%</div>
                        <div className="text-xs text-gray-500">Grasas</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-600 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <TrendingDown className="w-24 h-24" />
                  </div>
                  <h5 className="font-bold mb-2 flex items-center gap-2 text-sm relative z-10">
                    <span className="bg-white/20 p-1 rounded-lg">💡</span>
                    Sabías que...
                  </h5>
                  <p className="text-xs text-green-50 leading-relaxed relative z-10">
                    Los ingredientes de Nariño en esta receta han sido seleccionados por su bajo índice glucémico, ayudando a mantener tus niveles de energía estables.
                  </p>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Contenido Principal */}
            <div className="p-8 lg:p-12 overflow-y-auto">
              <div className="flex items-start justify-between mb-8">
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-bold px-3 py-1">
                      {recipe.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-current' : 'text-gray-200'}`} />
                      ))}
                      <span className="text-xs text-gray-400 font-bold ml-1">({rating})</span>
                    </div>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight">{recipe.title}</h2>
                  <p className="text-gray-600 text-lg leading-relaxed">{recipe.description}</p>

                  <div className="flex flex-wrap items-center gap-8 pt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tiempo Preparación</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-5 h-5 text-green-600" />
                        <span className="text-lg font-bold text-gray-800">{recipe.prepTime}</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Porciones</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-5 h-5 text-green-600" />
                        <span className="text-lg font-bold text-gray-800">{recipe.servings} pers.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-10 opacity-50" />

              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h4 className="text-xl font-black text-gray-900 flex items-center gap-3">
                    <span className="bg-green-100 text-green-600 p-2 rounded-xl">
                      <ChevronRight className="w-5 h-5" />
                    </span>
                    Ingredientes
                  </h4>
                  <div className="space-y-3">
                    {recipe.ingredients.map((ing, index) => (
                      <div key={index} className="flex items-center p-3 rounded-xl hover:bg-green-50/50 transition-colors border border-transparent hover:border-green-100">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-4 shadow-sm" />
                        <span className="text-gray-700 font-medium">{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xl font-black text-gray-900 flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                      <Info className="w-5 h-5" />
                    </span>
                    Preparación
                  </h4>
                  <div className="space-y-6">
                    {recipe.instructions.map((step, index) => (
                      <div key={index} className="flex gap-5 group">
                        <div className="flex flex-col items-center">
                          <div className="bg-gray-900 text-white font-black rounded-xl w-8 h-8 flex items-center justify-center text-sm shadow-lg shrink-0 group-hover:scale-110 transition-transform">
                            {index + 1}
                          </div>
                          {index < recipe.instructions.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-100 mt-2" />
                          )}
                        </div>
                        <p className="text-gray-600 leading-relaxed font-medium pt-1">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-16 flex justify-between">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-2xl text-lg font-bold shadow-xl shadow-green-100 transition-all hover:-translate-y-1 active:scale-95"
                  onClick={onClose}
                >
                  Cerrar Receta
                </Button>
                <Button
                  onClick={handleOpenConsumptionModal}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-2xl text-lg font-bold shadow-xl shadow-green-100 transition-all hover:-translate-y-1 active:scale-95"
                >
                  <PlusCircle className="w-5 h-5" />
                  Registrar Consumo
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* ====================== NUEVO MODAL DE REGISTRO DE CONSUMO ====================== */}
      <ConsumptionRegisterModal
        recipe={recipe}
        open={isConsumptionModalOpen}
        onClose={() => setIsConsumptionModalOpen(false)}
        onSaveConsumption={(consumptionData) => {
          onRegisterConsumption(consumptionData);
          // El consumo real se maneja en RecipesSection
        }}
      />
    </>
  );
}
