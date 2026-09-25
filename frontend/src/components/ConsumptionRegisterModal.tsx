import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { PlusCircle, Star } from 'lucide-react';

interface Recipe {
    id: string;
    title: string;
    glycemicIndex: string;
    calories: string;
    carbs: string;
    protein: string;
    fiber: string;
}

interface ConsumptionRegisterModalProps {
    recipe: Recipe | null;
    open: boolean;
    onClose: () => void;
    onSaveConsumption: (consumptionData: any) => void;
}

export function ConsumptionRegisterModal({
    recipe,
    open,
    onClose,
    onSaveConsumption
}: ConsumptionRegisterModalProps) {

    const [mealTime, setMealTime] = useState<'Desayuno' | 'Almuerzo' | 'Cena' | 'Merienda'>('Almuerzo');
    const [portions, setPortions] = useState<number>(1);
    const [consumptionTime, setConsumptionTime] = useState(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const [rating, setRating] = useState<number>(5);
    const [comment, setComment] = useState<string>('');

    if (!recipe) return null;

    const handleSave = () => {
        onSaveConsumption({
            recipeName: recipe.title,
            recipeId: recipe.id,
            mealTime,
            time: consumptionTime,
            portions,
            glycemicIndex: recipe.glycemicIndex,
            carbs: Number(recipe.carbs.replace(/[^0-9.]/g, '')) * portions,
            protein: Number(recipe.protein.replace(/[^0-9.]/g, '')) * portions,
            fiber: Number(recipe.fiber.replace(/[^0-9.]/g, '')) * portions,
            calories: Number(recipe.calories.replace(/[^0-9.]/g, '')) * portions,
            rating,
            comment: comment.trim() || null
        });

        // El mensaje de éxito o error lo muestra RecipesSection según la respuesta del servidor
        onClose();
    };

    const renderStars = () => {
        return Array.from({ length: 5 }, (_, i) => {
            const starValue = i + 1;
            return (
                <button
                    key={i}
                    type="button"
                    onClick={() => setRating(starValue)}
                    className="focus:outline-none transition-transform hover:scale-110"
                >
                    <Star
                        className={`w-8 h-8 transition-colors ${starValue <= rating
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-gray-300 hover:text-yellow-300'
                            }`}
                    />
                </button>
            );
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-green-600" />
                    Registrar Consumo
                </DialogTitle>
                <DialogDescription>
                    ¿Cuándo consumiste esta receta?
                </DialogDescription>

                <div className="space-y-6 py-6">
                    <div>
                        <Label className="text-sm font-medium">Plato</Label>
                        <p className="font-semibold text-lg mt-1">{recipe.title}</p>
                    </div>

                    <div>
                        <Label>Momento del día</Label>
                        <Select value={mealTime} onValueChange={(val: any) => setMealTime(val)}>
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Desayuno">🌅 Desayuno</SelectItem>
                                <SelectItem value="Almuerzo">🍽️ Almuerzo</SelectItem>
                                <SelectItem value="Cena">🌙 Cena</SelectItem>
                                <SelectItem value="Merienda">🥪 Merienda</SelectItem>
                                <SelectItem value="Snack">🥪 Snack</SelectItem>
                                <SelectItem value="Postre">🍰 Postre</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Porciones consumidas</Label>
                        <Input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={portions}
                            onChange={(e) => setPortions(parseFloat(e.target.value) || 1)}
                            className="mt-1 text-center text-lg"
                        />
                    </div>

                    <div>
                        <Label>Hora del consumo</Label>
                        <Input
                            type="time"
                            value={consumptionTime}
                            onChange={(e) => setConsumptionTime(e.target.value)}
                            className="mt-1"
                        />
                    </div>

                    {/*Calificación con estrellas === */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">
                            ¿Cómo calificarías este platillo?
                        </Label>
                        <div className="flex gap-1 justify-center py-2">
                            {renderStars()}
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-1">
                            {rating} estrella{rating !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/*Comentario opcional === */}
                    <div>
                        <Label>Comentario (opcional)</Label>
                        <Textarea
                            placeholder="¿Qué te pareció la receta? ¿Algo que mejorarías?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="mt-1 min-h-[80px] resize-y"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
                        Guardar Consumo
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}