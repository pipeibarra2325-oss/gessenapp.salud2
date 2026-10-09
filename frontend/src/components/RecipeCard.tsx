import { ImageWithFallback } from './figma/ImageWithFallback';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Users, TrendingDown, Star, Heart } from 'lucide-react';
import { Button } from './ui/button';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  imageCredit?: string | null;
  prepTime: string;
  servings: number;
  category: string;
  flavor?: string[];
  preference?: string[];
  glycemicIndex: 'bajo' | 'medio' | 'alto';
  carbs: string;
  protein: string;
  fiber: string;
  calories: string;
  fats: string;
  sugars: string;
  sodium: string;
  caloricLevel: string;
  glycemicLoad: string;
  macroDistribution: {
    carbs: number;
    protein: number;
    fat: number;
  };
  ingredients: string[];
  instructions: string[];
  rating?: number | null;
  ratingCount?: number;
  isFavorite?: boolean;
}

interface RecipeCardProps {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
  onFavoriteToggle?: (recipeId: string, e: React.MouseEvent) => void;
}

export function RecipeCard({ recipe, onClick, onFavoriteToggle }: RecipeCardProps) {
  // Estrellas según el promedio de calificaciones de los usuarios
  const rating = recipe.rating || 0;
  const fullStars = Math.round(rating);
  const sinCalificaciones = !recipe.ratingCount;

  return (
    <Card
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-green-100 hover:border-green-200 relative flex flex-col h-full"
      onClick={() => onClick(recipe)}
    >
      <div className="relative overflow-hidden aspect-video">
        <ImageWithFallback
          src={recipe.image}
          ancho={500}
          width={500}
          height={281}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges y Controles flotantes */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge
            variant={recipe.glycemicIndex === 'bajo' ? 'default' : recipe.glycemicIndex === 'medio' ? 'secondary' : 'tertiary'
            }
            className={`${recipe.glycemicIndex === 'bajo' ? 'bg-green-700' : recipe.glycemicIndex === 'medio' ? 'bg-amber-700' : 'bg-red-700'} text-white shadow-lg border-none px-3 py-1`}
          >
            <TrendingDown className="w-3 h-3 mr-1" />
            IG {recipe.glycemicIndex}
          </Badge>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="icon"
            aria-label={recipe.isFavorite ? `Quitar ${recipe.title} de favoritos` : `Agregar ${recipe.title} a favoritos`}
            aria-pressed={!!recipe.isFavorite}
            className={`rounded-full h-8 w-8 shadow-md transition-all ${recipe.isFavorite ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-white/90 text-gray-400 hover:text-red-500'}`}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onFavoriteToggle?.(recipe.id, e);
            }}
          >
            <Heart className={`h-4 w-4 ${recipe.isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>

        <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
          <Badge variant="outline" className="bg-white/90 text-green-800 border-green-200 text-[10px] py-0">
            {recipe.category}
          </Badge>
          {recipe.flavor && recipe.flavor.length > 0 && (
            <Badge variant="outline" className="bg-white/90 text-blue-800 border-blue-100 text-[10px] py-0">
              {recipe.flavor.join(', ')}
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center gap-1 mb-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < fullStars ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">{sinCalificaciones ? 'Sin calificaciones' : `(${rating} · ${recipe.ratingCount})`}</span>
        </div>
        <h3 className="text-base font-bold leading-tight line-clamp-2 group-hover:text-green-700 transition-colors">
          {recipe.title}
        </h3>
      </CardHeader>

      <CardContent className="pt-0 flex-grow">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {recipe.description}
        </p>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-4 font-medium">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1 text-green-600" />
            {recipe.prepTime}
          </div>
          <div className="flex items-center">
            <Users className="w-3 h-3 mr-1 text-green-600" />
            {recipe.servings} pers.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mt-auto">
          <div className="bg-green-50/50 p-1.5 rounded-md border border-green-100/50">
            <p className="text-[9px] text-green-800 uppercase font-bold tracking-tighter">Carbos</p>
            <p className="text-[11px] font-semibold text-green-900 leading-none">{recipe.carbs}</p>
          </div>
          <div className="bg-blue-50/50 p-1.5 rounded-md border border-blue-100/50">
            <p className="text-[9px] text-blue-800 uppercase font-bold tracking-tighter">Prot</p>
            <p className="text-[11px] font-semibold text-blue-900 leading-none">{recipe.protein}</p>
          </div>
        </div>

        {/* Distribución macronutrientes */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-[10px] mb-1">
            <span>Macros</span>
            <span className="text-green-700 font-medium">Nivel calórico: {recipe.caloricLevel}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex [background:linear-gradient(to_right,#3b82f6_0%,#f97316_50%,#eab308_100%)]">
            <div className="h-full bg-blue-500" style={{ width: `${recipe.macroDistribution?.carbs || 0}%` }} />
            <div className="h-full bg-orange-500" style={{ width: `${recipe.macroDistribution?.protein || 0}%` }} />
            <div className="h-full bg-yellow-600" style={{ width: `${recipe.macroDistribution?.fat || 0}%` }} />
          </div>
          {/*mostrar porcentajes debajo */}
          <div className="flex justify-between text-[9px] text-gray-600 mt-1">
            <span>C: {recipe.macroDistribution?.carbs}%</span>
            <span>P: {recipe.macroDistribution?.protein}%</span>
            <span>G: {recipe.macroDistribution?.fat}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
