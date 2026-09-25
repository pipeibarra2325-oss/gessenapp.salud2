import { Heart, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Link } from 'lucide-react';
import { Button } from './ui/button';

export function Footer() {
  return (
    <footer id="contacto" className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="text-white">GessenApp</h3>
                <p className="text-sm text-gray-400">Recetas saludables</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Dedicados a mejorar la calidad de vida de las personas con diabetes tipo 2 
              en Nariño a través de una alimentación balanceada y deliciosa.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#recetas" className="text-gray-400 hover:text-green-500 transition-colors">
                  Recetas
                </a>
              </li>
              <li>
                <a href="#consejos" className="text-gray-400 hover:text-green-500 transition-colors">
                  Consejos Nutricionales
                </a>
              </li>
              <li>
                <a href="#sobre-diabetes" className="text-gray-400 hover:text-green-500 transition-colors">
                  Sobre Diabetes
                </a>
              </li>
              <li>
                <a href="#contacto" className="text-gray-400 hover:text-green-500 transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center text-gray-400">
                <MapPin className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                <span>Pasto, Nariño, Colombia</span>
              </li>
              <li className="flex items-center text-gray-400">
                <Mail className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                <span> gessenapp@gmail.com </span>
              </li>
              <li className="flex items-center text-gray-400">
                <Phone className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                <span>+57 3012345678</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white mb-4">Mantente Informado</h4>
            <p className="text-gray-400 text-sm mb-4">
              Recibe nuevas recetas y consejos nutricionales directamente en tu correo.
            </p>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
              />
              <Button className="w-full bg-green-600 hover:bg-green-700 text-sm">
                Suscribirse
              </Button>
            </div>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-4 mb-4 md:mb-0">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-green-500">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-green-500">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-green-500">
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
            <div className="text-sm text-gray-400 text-center md:text-left">
              <p>© 2024 GessenApp. Todos los derechos reservados.</p>
              <p className="mt-1">
                <span className="text-green-500">Hecho con ❤️</span> para la comunidad de Nariño
              </p>
            </div>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            <strong className="text-gray-300">Aviso Médico:</strong> Las recetas y consejos presentados en este sitio 
            son de carácter informativo y no constituyen consejo médico profesional. Siempre consulte con su médico 
            o nutricionista antes de realizar cambios significativos en su dieta, especialmente si tiene condiciones médicas.
          </p>
        </div>
      </div>
    </footer>
  );
}