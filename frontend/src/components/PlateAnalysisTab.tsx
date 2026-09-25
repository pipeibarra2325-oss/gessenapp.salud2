import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, X, Scan, AlertCircle, CheckCircle2, Info, Sparkles, Plus, Clock, Coffee, Sun, Apple, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { toast } from "sonner";

interface PlateAnalysisTabProps {
  user: any;
  onAddToConsumptions?: (consumption: {
    dishName: string;
    mealTime: 'Desayuno' | 'Almuerzo' | 'Snack' | 'Cena';
    time: string;
    glycemicIndex: 'bajo' | 'medio' | 'alto';
    carbs: number;
    protein: number;
    fiber: number;
    calories: number;
  }) => void;
}

export function PlateAnalysisTab({ user, onAddToConsumptions }: PlateAnalysisTabProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showMealTimeDialog, setShowMealTimeDialog] = useState(false);
  const [selectedMealTime, setSelectedMealTime] = useState<'Desayuno' | 'Almuerzo' | 'Snack' | 'Cena'>('Almuerzo');
  const [selectedTime, setSelectedTime] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen es muy grande", {
          description: "Por favor selecciona una imagen menor a 5MB"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    
    // Simulación de análisis de IA
    setTimeout(() => {
      setAnalysisResult({
        dishName: "Arroz con pollo y ensalada",
        compatibility: "moderada",
        compatibilityScore: 65,
        ingredients: [
          { name: "Arroz blanco", status: "warning", note: "Porción moderada recomendada (1/2 taza)" },
          { name: "Pechuga de pollo", status: "good", note: "Excelente fuente de proteína magra" },
          { name: "Lechuga", status: "good", note: "Rica en fibra, sin impacto glucémico" },
          { name: "Tomate", status: "good", note: "Bajo índice glucémico" },
          { name: "Zanahoria", status: "warning", note: "Consumir con moderación" }
        ],
        recommendations: [
          "Reduce la porción de arroz a 1/2 taza cocida",
          "Aumenta la cantidad de vegetales verdes",
          "Considera sustituir el arroz blanco por arroz integral o quinoa",
          "Asegúrate de comer las proteínas primero para mejor control glucémico"
        ],
        nutritionalEstimate: {
          carbs: "42g",
          protein: "28g",
          fiber: "6g",
          calories: "380 kcal"
        }
      });
      setIsAnalyzing(false);
      toast.success("Análisis completado", {
        description: "Revisa las recomendaciones para tu plato"
      });
    }, 2500);
  };

  const handleClear = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleOpenAddDialog = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setSelectedTime(`${hours}:${minutes}`);
    setShowMealTimeDialog(true);
  };

  const handleConfirmAdd = () => {
    if (!selectedTime || !onAddToConsumptions) return;

    const carbs = parseFloat(analysisResult.nutritionalEstimate.carbs.replace('g', ''));
    const protein = parseFloat(analysisResult.nutritionalEstimate.protein.replace('g', ''));
    const fiber = parseFloat(analysisResult.nutritionalEstimate.fiber.replace('g', ''));
    const calories = parseFloat(analysisResult.nutritionalEstimate.calories.replace(' kcal', ''));
    
    onAddToConsumptions({
      dishName: analysisResult.dishName,
      mealTime: selectedMealTime,
      time: selectedTime,
      glycemicIndex: analysisResult.compatibility === 'baja' ? 'alto' : analysisResult.compatibility === 'alta' ? 'bajo' : 'medio',
      carbs,
      protein,
      fiber,
      calories
    });

    setShowMealTimeDialog(false);
    handleClear();
    toast.success('Plato agregado a consumos', {
      description: `${analysisResult.dishName} registrado en ${selectedMealTime}`
    });
  };

  const getCompatibilityColor = (compatibility: string) => {
    switch (compatibility) {
      case 'alta': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderada': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'baja': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'bad': return <X className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMealIcon = (mealTime: string) => {
    switch (mealTime) {
      case 'Desayuno': return Coffee;
      case 'Almuerzo': return Sun;
      case 'Snack': return Apple;
      case 'Cena': return Moon;
      default: return Sun;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100">
          <Scan className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-gray-900 mb-1">Análisis Inteligente de Platos</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Sube una foto de tu comida y te diremos qué tan compatible es para tu control glucémico, 
            identificando ingredientes y dando recomendaciones personalizadas.
          </p>
        </div>
      </div>

      <div className="flex gap-2 items-start p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          <strong>Función en demostración:</strong> el reconocimiento de platos con IA aún no está conectado.
          El resultado que se muestra es un ejemplo fijo y no se guarda en tu historial; para registrar lo que
          comiste, usa el catálogo de recetas o la pestaña "Tus Consumos".
        </p>
      </div>

      {/* Upload Section */}
      {!uploadedImage ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 p-8 bg-white border-2 border-dashed border-gray-200 rounded-2xl hover:border-purple-400 hover:bg-purple-50/50 transition-all group"
          >
            <div className="p-4 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
              <Upload className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 mb-1">Subir Foto</p>
              <p className="text-xs text-gray-500">Desde tu galería</p>
            </div>
          </button>

          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 p-8 bg-white border-2 border-dashed border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
          >
            <div className="p-4 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 mb-1">Tomar Foto</p>
              <p className="text-xs text-gray-500">Con tu cámara</p>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
            <img 
              src={uploadedImage} 
              alt="Plato cargado" 
              className="w-full h-64 object-cover"
            />
            <button
              onClick={handleClear}
              className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-all"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Analyze Button */}
          {!analysisResult && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 rounded-xl font-bold shadow-lg shadow-purple-100"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Analizando plato...
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5 mr-2" />
                  Analizar Plato
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header with compatibility */}
            <div className={`p-5 rounded-2xl border-2 ${getCompatibilityColor(analysisResult.compatibility)}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-black text-lg mb-1">{analysisResult.dishName}</h4>
                  <p className="text-sm font-medium opacity-80">
                    Compatibilidad: {analysisResult.compatibility.charAt(0).toUpperCase() + analysisResult.compatibility.slice(1)}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black">{analysisResult.compatibilityScore}%</div>
                  <div className="text-xs font-medium opacity-80">Score</div>
                </div>
              </div>
            </div>

            {/* Nutritional Estimate */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200">
              <h5 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Estimación Nutricional
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <div className="text-xs text-blue-600 font-bold mb-1">Carbohidratos</div>
                  <div className="font-black text-blue-900">{analysisResult.nutritionalEstimate.carbs}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <div className="text-xs text-green-600 font-bold mb-1">Proteína</div>
                  <div className="font-black text-green-900">{analysisResult.nutritionalEstimate.protein}</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-xl">
                  <div className="text-xs text-orange-600 font-bold mb-1">Fibra</div>
                  <div className="font-black text-orange-900">{analysisResult.nutritionalEstimate.fiber}</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-xl">
                  <div className="text-xs text-purple-600 font-bold mb-1">Calorías</div>
                  <div className="font-black text-purple-900">{analysisResult.nutritionalEstimate.calories}</div>
                </div>
              </div>
            </div>

            {/* Ingredients Analysis */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200">
              <h5 className="font-black text-gray-900 mb-3">Ingredientes Detectados</h5>
              <div className="space-y-2">
                {analysisResult.ingredients.map((ingredient: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    {getStatusIcon(ingredient.status)}
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{ingredient.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{ingredient.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-5 rounded-2xl border border-green-200">
              <h5 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                Recomendaciones Personalizadas
              </h5>
              <ul className="space-y-2">
                {analysisResult.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-600 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleClear}
                variant="outline"
                className="flex-1 h-11 rounded-xl border-gray-200 font-bold"
              >
                Analizar otro plato
              </Button>
              {onAddToConsumptions && (
                <Button
                  onClick={handleOpenAddDialog}
                  className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Agregar a Consumos
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Notice */}
      <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 leading-relaxed">
          <strong>Nota:</strong> Cuando se conecte el reconocimiento con inteligencia artificial, los resultados serán
          estimaciones y podrán variar. Para un control preciso, consulta con tu profesional de salud.
        </p>
      </div>

      {/* Meal Time Dialog */}
      <Dialog open={showMealTimeDialog} onOpenChange={setShowMealTimeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Selecciona el momento de la comida</DialogTitle>
            <DialogDescription>
              Elige el momento del día en que consumirás este plato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Label className="w-5 h-5 text-gray-600">
                <Coffee className="w-5 h-5" />
              </Label>
              <Button
                onClick={() => setSelectedMealTime('Desayuno')}
                className={`flex-1 h-11 rounded-xl ${selectedMealTime === 'Desayuno' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-900'}`}
              >
                Desayuno
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-5 h-5 text-gray-600">
                <Sun className="w-5 h-5" />
              </Label>
              <Button
                onClick={() => setSelectedMealTime('Almuerzo')}
                className={`flex-1 h-11 rounded-xl ${selectedMealTime === 'Almuerzo' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-900'}`}
              >
                Almuerzo
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-5 h-5 text-gray-600">
                <Apple className="w-5 h-5" />
              </Label>
              <Button
                onClick={() => setSelectedMealTime('Snack')}
                className={`flex-1 h-11 rounded-xl ${selectedMealTime === 'Snack' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-900'}`}
              >
                Snack
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-5 h-5 text-gray-600">
                <Moon className="w-5 h-5" />
              </Label>
              <Button
                onClick={() => setSelectedMealTime('Cena')}
                className={`flex-1 h-11 rounded-xl ${selectedMealTime === 'Cena' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-900'}`}
              >
                Cena
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-5 h-5 text-gray-600">
                <Clock className="w-5 h-5" />
              </Label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="flex-1 h-11 rounded-xl border-gray-200 text-gray-900"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button
              onClick={() => setShowMealTimeDialog(false)}
              variant="outline"
              className="h-11 rounded-xl border-gray-200 font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAdd}
              className="h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              Agregar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}