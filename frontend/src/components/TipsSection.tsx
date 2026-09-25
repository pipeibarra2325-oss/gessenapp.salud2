import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Heart, Apple, Activity, Clock, Users, Lightbulb } from 'lucide-react';

const tips = [
  {
    icon: Apple,
    title: 'Control de Porciones',
    category: 'Nutrición',
    description: 'Utiliza el método del plato: 1/2 vegetales sin almidón, 1/4 proteína magra, 1/4 carbohidratos complejos.',
    details: [
      'Usa platos más pequeños (23 cm de diámetro)',
      'Mide las porciones de carbohidratos',
      'Incluye vegetales en cada comida',
      'Mastica lentamente y disfruta cada bocado'
    ]
  },
  {
    icon: Clock,
    title: 'Horarios de Comida',
    category: 'Rutina',
    description: 'Mantén horarios regulares para ayudar a controlar los niveles de glucosa durante el día.',
    details: [
      'Desayuna dentro de 1 hora después de levantarte',
      'Come cada 3-4 horas',
      'Cena al menos 2 horas antes de dormir',
      'No te saltes comidas principales'
    ]
  },
  {
    icon: Heart,
    title: 'Ingredientes Locales',
    category: 'Productos de Nariño',
    description: 'Aprovecha los productos frescos y nutritivos que ofrece la región de Nariño.',
    details: [
      'Quinoa: alto en proteína y fibra',
      'Chontaduro: fuente de vitamina A',
      'Aguacate Hass: grasas saludables',
      'Hierbas aromáticas: sabor sin sodio'
    ]
  },
  {
    icon: Activity,
    title: 'Actividad Física',
    category: 'Ejercicio',
    description: 'Combina una alimentación saludable con actividad física regular para mejores resultados.',
    details: [
      'Camina 30 minutos después de las comidas',
      'Realiza ejercicio de resistencia 2-3 veces por semana',
      'Aprovecha las actividades al aire libre en Nariño',
      'Consulta con tu médico antes de iniciar rutinas nuevas'
    ]
  },
  {
    icon: Users,
    title: 'Apoyo Familiar',
    category: 'Social',
    description: 'Involucra a tu familia en el cambio hacia hábitos alimentarios más saludables.',
    details: [
      'Cocinen juntos recetas saludables',
      'Compartan comidas sin distracciones',
      'Apoyen las decisiones alimentarias saludables',
      'Celebren los logros en el control glucémico'
    ]
  },
  {
    icon: Lightbulb,
    title: 'Planificación de Menús',
    category: 'Organización',
    description: 'Planifica tus comidas semanalmente para mantener una alimentación consistente y balanceada.',
    details: [
      'Dedica 30 minutos los domingos a planificar',
      'Haz una lista de compras basada en tu menú',
      'Prepara ingredientes con anticipación',
      'Ten snacks saludables siempre disponibles'
    ]
  }
];

export function TipsSection() {
  return (
    <section id="consejos" className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl text-gray-900 mb-4">
            Consejos para el <span className="text-green-600">Control Diabético</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Recomendaciones prácticas para mantener un estilo de vida saludable y controlar 
            mejor tu diabetes tipo 2.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tips.map((tip, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-green-100">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
                    <tip.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {tip.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg group-hover:text-green-700 transition-colors">
                  {tip.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {tip.description}
                </p>
                <ul className="space-y-2">
                  {tip.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-green-100">
          <div className="text-center">
            <h3 className="text-2xl text-green-800 mb-4">
              🩺 Recuerda siempre consultar con tu médico
            </h3>
            <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Estos consejos son complementarios a tu tratamiento médico. Es importante que mantengas 
              un seguimiento regular con tu equipo de salud y ajustes tu plan alimentario según sus 
              recomendaciones específicas para tu caso.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}