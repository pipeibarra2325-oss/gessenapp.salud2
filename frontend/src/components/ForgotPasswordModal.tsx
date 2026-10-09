import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { KeyRound, ArrowLeft, UserCog, Mail } from 'lucide-react';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

// GessenApp no envía correos: el profesional de la salud (administrador) restablece la contraseña
// del paciente desde Panel → Usuarios → Editar. Esta ventana explica ese procedimiento.
export function ForgotPasswordModal({ open, onClose, onBackToLogin }: ForgotPasswordModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl" aria-describedby="forgot-password-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <KeyRound className="w-5 h-5 text-blue-600" />
            Recuperar Contraseña
          </DialogTitle>
          <DialogDescription id="forgot-password-description">
            Tu profesional de la salud puede restablecer tu acceso.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <UserCog className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900 leading-relaxed">
              Comunícate con el nutricionista o el médico que te acompaña en GessenApp. Desde el panel de administración
              puede asignarte una contraseña nueva; luego podrás cambiarla desde el menú de tu perfil, en <strong>Configuración</strong>.
            </p>
          </div>
          <div className="flex gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <Mail className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">
              La recuperación automática por correo electrónico estará disponible próximamente.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            onClick={onBackToLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-12"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio de sesión
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-medium h-10"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
