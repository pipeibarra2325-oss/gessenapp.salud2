import { ImageWithFallback, imagenOptimizada } from './figma/ImageWithFallback';

// Foto de la portada: el navegador elige el tamaño según la pantalla (celular o computador)
const FOTO_PORTADA = 'https://images.unsplash.com/photo-1723985021773-d1f4c4ebfdd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZGlhYmV0aWMlMjBmb29kJTIwc2FsYWR8ZW58MXx8fHwxNzU4NzE4ODc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
import { Button } from './ui/button';
import { ArrowRight, Utensils, Heart, Sparkles, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroSectionProps {
  isLoggedIn: boolean;
  user: any;
  region: string | null;
}

export function HeroSection({ isLoggedIn, user, region }: HeroSectionProps) {
  return (
    <section className="bg-gradient-to-br from-green-50 to-blue-50 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {/* Personalized Greeting for Logged In Users */}
            {isLoggedIn && user ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-10 h-10 text-green-600 animate-pulse" />
                  <h1 className="text-4xl lg:text-6xl text-green-800">
                    ¡Hola, <span className="text-green-600">{user.name}!</span>
                  </h1>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <p className="text-lg text-gray-700">
                    Bienvenido desde <strong className="text-green-700">{user.department}</strong> · Región {region}
                  </p>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Descubre recetas personalizadas, analiza tus platillos y controla tu alimentación con nuestras herramientas inteligentes especialmente diseñadas para ti.
                </p>
              </motion.div>
            ) : (
              <div>
                <h1 className="text-4xl lg:text-6xl text-green-800 mb-4">
                  Recetas Saludables para <span className="text-green-600">Diabéticos</span>
                </h1>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Descubre deliciosas recetas especialmente diseñadas para personas con diabetes tipo 2 
                  en Nariño. Alimentación balanceada con productos locales y sabores tradicionales.
                </p>
              </div>
            )}
            
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-green-100">
              <h2 className="text-green-700 mb-3 text-lg font-medium">¿Por qué elegir nuestras recetas?</h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Bajo índice glucémico
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Ingredientes locales de Nariño
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Información nutricional completa
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Sabores tradicionales adaptados
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-green-700 hover:bg-green-800" onClick={() => document.getElementById('recetas')?.scrollIntoView({behavior: 'smooth'})}>
                <Utensils className="mr-2 h-5 w-5" />
                Ver Recetas
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => document.getElementById('sobre-diabetes')?.scrollIntoView({behavior: 'smooth'})}>
                Aprender más sobre diabetes
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <ImageWithFallback 
                src={imagenOptimizada(FOTO_PORTADA, 960)}
                srcSet={[480, 720, 960].map((w) => `${imagenOptimizada(FOTO_PORTADA, w)} ${w}w`).join(', ')}
                sizes="(min-width: 1024px) 50vw, 100vw"
                alt="Comida saludable para diabéticos"
                width={900}
                height={600}
                loading="eager"
                fetchPriority="high"
                className="w-full h-96 lg:h-[500px] object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-lg border border-green-100">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Heart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-700">Control glucémico</p>
                  <p className="text-xs text-gray-600">Recetas balanceadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}