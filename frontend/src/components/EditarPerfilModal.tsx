import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UserCog, Save } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl, getAuthHeaders } from '../utils/auth';

interface EditarPerfilModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onUpdateUser: (userData: any) => void;
}

const aFecha = (valor: any) => (valor ? String(valor).slice(0, 10) : '');

// Formulario para que el usuario actualice sus datos personales y biométricos
export function EditarPerfilModal({ open, onClose, user, onUpdateUser }: EditarPerfilModalProps) {
  const [departamentos, setDepartamentos] = useState<{ id_departamento: number; nombre_departamento: string; region?: string }[]>([]);
  const [regiones, setRegiones] = useState<{ id_region: number; nombre_region: string }[]>([]);
  const [form, setForm] = useState<any>({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/departamentos'))
      .then(r => (r.ok ? r.json() : []))
      .then(setDepartamentos)
      .catch(() => setDepartamentos([]));
    fetch(apiUrl('/regiones'))
      .then(r => (r.ok ? r.json() : []))
      .then(setRegiones)
      .catch(() => setRegiones([]));
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    setForm({
      nombre: user.name || user.nombre || '',
      apellido: user.lastName || user.apellido || '',
      telefono: user.phone || user.telefono || '',
      genero: user.genero || '',
      fecha_nacimiento: aFecha(user.birthDate || user.fecha_nacimiento),
      estatura: user.height ?? user.estatura ?? '',
      peso: user.weight ?? user.peso ?? '',
      id_departamento: user.id_departamento ?? '',
      id_region: user.id_region ?? '',
    });
  }, [open, user]);

  // Si la sesión es antigua y no trae el id del departamento, se deduce por el nombre
  useEffect(() => {
    if (open && !form.id_departamento && user?.department && departamentos.length) {
      const d = departamentos.find(x => x.nombre_departamento === user.department);
      if (d) setForm((f: any) => ({ ...f, id_departamento: d.id_departamento }));
    }
  }, [open, departamentos, user?.department, form.id_departamento]);

  const regionDepartamento = departamentos.find(d => String(d.id_departamento) === String(form.id_departamento))?.region;

  const cambiar = (campo: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [campo]: e.target.value });

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre?.trim() || !form.apellido?.trim()) {
      toast.error('El nombre y el apellido son obligatorios');
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch(apiUrl('/usuarios/me'), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...form,
          estatura: form.estatura === '' ? null : Number(form.estatura),
          peso: form.peso === '' ? null : Number(form.peso),
          id_departamento: form.id_departamento === '' ? null : Number(form.id_departamento),
          id_region: form.id_region === '' || form.id_region == null ? null : Number(form.id_region),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el perfil');
      onUpdateUser(data.user);
      toast.success('Perfil actualizado');
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-3xl" aria-describedby="editar-perfil-descripcion">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <UserCog className="w-5 h-5 text-green-600" />
            Editar información
          </DialogTitle>
          <DialogDescription id="editar-perfil-descripcion">
            Mantén actualizados tus datos: el peso y la estatura se usan para calcular tu IMC.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={guardar} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ep-nombre">Nombre</Label>
              <Input id="ep-nombre" value={form.nombre || ''} onChange={cambiar('nombre')} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ep-apellido">Apellido</Label>
              <Input id="ep-apellido" value={form.apellido || ''} onChange={cambiar('apellido')} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ep-telefono">Teléfono</Label>
              <Input id="ep-telefono" value={form.telefono || ''} onChange={cambiar('telefono')} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ep-genero">Género</Label>
              <select id="ep-genero" value={form.genero || ''} onChange={cambiar('genero')} className="w-full h-9 border rounded-xl px-3 text-sm">
                <option value="">Sin especificar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ep-fecha">Fecha de nacimiento</Label>
              <Input id="ep-fecha" type="date" value={form.fecha_nacimiento || ''} onChange={cambiar('fecha_nacimiento')} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ep-departamento">Departamento</Label>
              <select id="ep-departamento" value={form.id_departamento ?? ''} onChange={cambiar('id_departamento')} className="w-full h-9 border rounded-xl px-3 text-sm">
                <option value="">Sin especificar</option>
                {departamentos.map(d => <option key={d.id_departamento} value={d.id_departamento}>{d.nombre_departamento}</option>)}
              </select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label htmlFor="ep-region">Región alimentaria</Label>
              <select id="ep-region" value={form.id_region ?? ''} onChange={cambiar('id_region')} className="w-full h-9 border rounded-xl px-3 text-sm">
                <option value="">Según mi departamento{regionDepartamento ? ` (${regionDepartamento})` : ''}</option>
                {regiones.map(r => <option key={r.id_region} value={r.id_region}>{r.nombre_region}</option>)}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Se usa para priorizar ingredientes de tu zona. En departamentos con varias zonas, como Nariño (Pasto es andino y Tumaco es pacífico), elige la tuya.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ep-estatura">Estatura (cm)</Label>
              <Input id="ep-estatura" type="number" min={50} max={250} value={form.estatura ?? ''} onChange={cambiar('estatura')} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ep-peso">Peso (kg)</Label>
              <Input id="ep-peso" type="number" min={20} max={300} step="0.1" value={form.peso ?? ''} onChange={cambiar('peso')} className="rounded-xl" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold" disabled={guardando}>
              <Save className="w-4 h-4 mr-2" />
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
