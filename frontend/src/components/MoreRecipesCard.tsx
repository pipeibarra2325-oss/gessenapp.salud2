import { Card, CardContent } from './ui/card';
import { Plus, Lock, ArrowRight } from 'lucide-react';

interface MoreRecipesCardProps {
  onClick: () => void;
  isLoggedIn: boolean;
}

export function MoreRecipesCard({ onClick, isLoggedIn }: MoreRecipesCardProps) {
  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-green-300 hover:border-green-400 bg-gradient-to-br from-green-50 to-green-100"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] p-6">
        <div className="bg-white rounded-full p-6 mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
          <Plus className="w-16 h-16 text-green-600" />
        </div>
        
        <h3 className="text-2xl font-bold text-center mb-3 text-gray-900 group-hover:text-green-700 transition-colors">
          Más Recetas
        </h3>
        
        <p className="text-sm text-center text-muted-foreground mb-4 max-w-xs">
          {isLoggedIn 
            ? "Explora todo nuestro catálogo extendido con ingredientes locales de Nariño."
            : "Descubre muchas más recetas saludables especialmente diseñadas para ti."}
        </p>
        
        <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
          {isLoggedIn ? (
            <>
              <ArrowRight className="w-4 h-4" />
              <span>Ver catálogo completo</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Inicia sesión para ver más</span>
            </>
          )}
        </div>
        
        <div className="mt-6 text-xs text-center text-muted-foreground">
          <p>Accede a nuestro catálogo completo</p>
          <p className="font-semibold text-green-600 mt-1">+100 recetas disponibles</p>
        </div>
      </CardContent>
    </Card>
  );
}
