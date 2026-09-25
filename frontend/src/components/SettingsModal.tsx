import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Settings, Mail, Lock, LogOut, Save } from 'lucide-react';
import { toast } from "sonner";
import { apiUrl, getAuthHeaders } from '../utils/auth';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onUpdateUser: (userData: any) => void;
  onLogout: () => void;
}

// Lee el mensaje de error que envía el backend ({ error: "..." })
const leerError = async (res: Response, porDefecto: string) => {
  const data = await res.json().catch(() => null);
  return data?.error || porDefecto;
};

export function SettingsModal({ open, onClose, user, onUpdateUser, onLogout }: SettingsModalProps) {
  const vacio = { email: user?.email || '', currentPassword: '', newPassword: '', confirmPassword: '' };
  const [formData, setFormData] = useState(vacio);
  const [isLoading, setIsLoading] = useState(false);

  // Al abrir, se cargan los datos actuales y se limpian las contraseñas
  useEffect(() => {
    if (open) setFormData({ ...vacio, email: user?.email || '' });
  }, [open, user?.email]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cambiaEmail = formData.email.trim().toLowerCase() !== (user?.email || '').toLowerCase();
    const cambiaPassword = formData.newPassword.length > 0;

    if (!cambiaEmail && !cambiaPassword) {
      toast.info("No hay cambios para guardar");
      return;
    }
    if (cambiaPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("Las contraseñas nuevas no coinciden");
        return;
      }
      if (!formData.currentPassword) {
        toast.error("Escribe tu contraseña actual para cambiarla");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (cambiaEmail) {
        const res = await fetch(apiUrl('/usuarios/me'), {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ email: formData.email.trim() }),
        });
        if (!res.ok) throw new Error(await leerError(res, "No se pudo actualizar el correo"));
        const data = await res.json();
        onUpdateUser(data.user);
      }

      if (cambiaPassword) {
        const res = await fetch(apiUrl('/usuarios/me/password'), {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ actual: formData.currentPassword, nueva: formData.newPassword }),
        });
        if (!res.ok) throw new Error(await leerError(res, "No se pudo cambiar la contraseña"));
      }

      toast.success("Configuración actualizada");
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl" aria-describedby="settings-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <Settings className="w-5 h-5 text-gray-700" />
            Configuración de Cuenta
          </DialogTitle>
          <DialogDescription id="settings-description">
            Gestiona el correo y la contraseña de tu cuenta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Cambiar contraseña (opcional)</Label>
              <div className="space-y-3 mt-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Contraseña actual"
                    autoComplete="current-password"
                    value={formData.currentPassword}
                    onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="pl-10 rounded-xl"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Nueva contraseña (mínimo 6 caracteres)"
                    autoComplete="new-password"
                    value={formData.newPassword}
                    onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                    className="pl-10 rounded-xl"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Confirmar nueva contraseña"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold h-11" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Guardando cambios...' : 'Guardar Cambios'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold h-11"
              onClick={() => {
                onLogout();
                onClose();
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
