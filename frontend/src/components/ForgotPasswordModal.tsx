import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Mail, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from "sonner";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export function ForgotPasswordModal({ open, onClose, onBackToLogin }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Por favor ingresa tu correo electrónico");
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Por favor ingresa un correo electrónico válido");
      return;
    }

    setIsLoading(true);
    
    // Simular envío de correo de recuperación
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      toast.success("Correo de recuperación enviado", {
        description: `Hemos enviado un enlace de recuperación a ${email}`
      });
    }, 1500);
  };

  const handleClose = () => {
    setEmail('');
    setIsSubmitted(false);
    onClose();
  };

  const handleBackToLogin = () => {
    setEmail('');
    setIsSubmitted(false);
    onBackToLogin();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-3xl" aria-describedby="forgot-password-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <Mail className="w-5 h-5 text-blue-600" />
            Recuperar Contraseña
          </DialogTitle>
          <DialogDescription id="forgot-password-description">
            {isSubmitted 
              ? "Revisa tu correo electrónico para continuar con el proceso de recuperación."
              : "Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña."
            }
          </DialogDescription>
        </DialogHeader>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-email" className="text-sm font-bold text-gray-700">
                Correo Electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="recovery-email"
                  type="email" 
                  placeholder="tu@correo.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="pl-10 h-12 rounded-xl bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-12"
                disabled={isLoading}
              >
                <Send className="w-4 h-4 mr-2" />
                {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </Button>

              <Button 
                type="button"
                variant="ghost" 
                className="w-full text-gray-600 hover:text-gray-900 rounded-xl font-medium h-10"
                onClick={handleBackToLogin}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio de sesión
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-green-50 p-4 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900">¡Correo enviado con éxito!</h4>
                <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
                  Hemos enviado un enlace de recuperación a <strong className="text-gray-900">{email}</strong>. 
                  Por favor revisa tu bandeja de entrada y sigue las instrucciones.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left w-full">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong className="block mb-1">💡 Consejo:</strong>
                  Si no recibes el correo en los próximos minutos, revisa tu carpeta de spam o correo no deseado.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleBackToLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio de sesión
              </Button>

              <Button 
                variant="outline"
                onClick={handleClose}
                className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-medium h-10"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
