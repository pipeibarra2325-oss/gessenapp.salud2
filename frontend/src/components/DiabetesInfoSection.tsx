import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { TrendingUp, AlertTriangle, CheckCircle, Heart, Brain, Eye } from 'lucide-react';

export function DiabetesInfoSection() {
  return (
    <section id="sobre-diabetes" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl text-gray-900 mb-4">
            Sobre la <span className="text-green-600">Diabetes Tipo 2</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Información esencial para entender y manejar la diabetes tipo 2 con una alimentación adecuada.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* What is Type 2 Diabetes */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle as="h3" className="flex items-center text-blue-800 text-base font-medium">
                <TrendingUp className="mr-3 h-6 w-6" />
                ¿Qué es la Diabetes Tipo 2?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                La diabetes tipo 2 es una condición en la que el cuerpo no puede usar la insulina 
                de manera efectiva, causando niveles altos de azúcar en la sangre.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-blue-800 mb-2">Características principales:</h4>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• Resistencia a la insulina</li>
                  <li>• Producción insuficiente de insulina</li>
                  <li>• Niveles elevados de glucosa en sangre</li>
                  <li>• Puede desarrollarse gradualmente</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle as="h3" className="flex items-center text-orange-800 text-base font-medium">
                <AlertTriangle className="mr-3 h-6 w-6" />
                Factores de Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Conocer los factores de riesgo ayuda a la prevención y el manejo temprano de la diabetes.
              </p>
              <div className="space-y-3">
                <div className="flex items-start">
                  <Badge variant="outline" className="mr-3 mt-0.5">Edad</Badge>
                  <span className="text-sm text-gray-700">Mayores de 45 años</span>
                </div>
                <div className="flex items-start">
                  <Badge variant="outline" className="mr-3 mt-0.5">Peso</Badge>
                  <span className="text-sm text-gray-700">Sobrepeso u obesidad</span>
                </div>
                <div className="flex items-start">
                  <Badge variant="outline" className="mr-3 mt-0.5">Genética</Badge>
                  <span className="text-sm text-gray-700">Antecedentes familiares</span>
                </div>
                <div className="flex items-start">
                  <Badge variant="outline" className="mr-3 mt-0.5">Estilo</Badge>
                  <span className="text-sm text-gray-700">Sedentarismo y mala alimentación</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Complications */}
        <div className="mb-12">
          <h3 className="text-2xl text-gray-900 mb-6 text-center">
            Complicaciones a Prevenir
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-red-100 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-red-800">Cardiovasculares</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Enfermedad coronaria</li>
                  <li>• Hipertensión arterial</li>
                  <li>• Accidente cerebrovascular</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-100 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-purple-800">Neurológicas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Neuropatía diabética</li>
                  <li>• Pérdida de sensibilidad</li>
                  <li>• Problemas de equilibrio</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-100 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-green-800">Visuales</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Retinopatía diabética</li>
                  <li>• Cataratas</li>
                  <li>• Glaucoma</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Management */}
        <Card className="border-green-100 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800 text-center justify-center">
              <CheckCircle className="mr-3 h-6 w-6" />
              Manejo Efectivo con Alimentación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-green-800 mb-3">Alimentos Recomendados</h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Vegetales sin almidón (brócoli, espinaca, tomate)
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Proteínas magras (pescado, pollo, legumbres)
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Granos integrales (quinoa, avena, arroz integral)
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Grasas saludables (aguacate, nueces, aceite de oliva)
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-red-800 mb-3">Alimentos a Limitar</h4>
                <ul className="space-y-2 text-sm text-red-700">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                    Azúcares refinados y dulces
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                    Harinas blancas y productos procesados
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                    Bebidas azucaradas y alcohol
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                    Grasas trans y alimentos fritos
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert className="mt-8 border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Importante:</strong> Esta información es educativa y no reemplaza el consejo médico profesional. 
            Siempre consulta con tu médico endocrinólogo o nutricionista para un plan personalizado de manejo de diabetes.
          </AlertDescription>
        </Alert>
      </div>
    </section>
  );
}