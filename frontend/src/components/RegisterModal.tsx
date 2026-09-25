import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { User, Mail, Lock, Phone, UserPlus, Ruler, Weight, Calendar, AlertCircle, MapPin, Users } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { toast } from "sonner";
import { obtenerDepartamentos } from "../services/api";
import { crearUsuario } from "../services/api";

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
  onRegisterSuccess?: (userData: any) => void;
}

export function RegisterModal({ open, onClose, onSwitchToLogin, onRegisterSuccess }: RegisterModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    genero: '',
    height: '',
    weight: '',
    birthDate: '',
    departmentId: '',
    acceptedTerms: false
  });
  const [departments, setDepartments] = useState<{ id_departamento: number; nombre_departamento: string; region: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Función para reiniciar el formulario
  const resetForm = () => {
    setStep(1);
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      genero: '',
      height: '',
      weight: '',
      birthDate: '',
      departmentId: '',
      acceptedTerms: false
    });
    setErrors({});
  };

  // Cargar departamentos desde la BD cuando se abre el modal
  useEffect(() => {
    if (!open) return;

    const fetchDepartments = async () => {
      try {
        const data = await obtenerDepartamentos();
        setDepartments(data);

        // Valor por defecto (igual que antes con "Nariño")
        if (data.length > 0 && !formData.departmentId) {
          setFormData(prev => ({
            ...prev,
            departmentId: data[0].id_departamento.toString()
          }));
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar departamentos");
      }
    };

    fetchDepartments();
  }, [open]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    // Clear error when typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.genero) {
      newErrors.genero = 'Debes seleccionar tu género';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres';
    }
    if (!formData.email.includes('@')) {
      newErrors.email = 'Correo electrónico no válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    // Altura: entre 50cm y 250cm
    const heightNum = parseFloat(formData.height);
    if (isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
      newErrors.height = 'Altura no válida (50-250 cm)';
    }

    // Peso: entre 30kg y 300kg
    const weightNum = parseFloat(formData.weight);
    if (isNaN(weightNum) || weightNum < 30 || weightNum > 300) {
      newErrors.weight = 'Peso no válido (30-300 kg)';
    }

    // Validación IMC: IMC = peso / (altura/100)^2
    // Rango saludable expandido: 10 a 60 (para detectar valores extremos irreales)
    if (!newErrors.height && !newErrors.weight) {
      const imc = weightNum / ((heightNum / 100) ** 2);
      if (imc < 10 || imc > 65) {
        newErrors.weight = 'La relación peso/altura es improbable';
        newErrors.height = 'Revisa tus medidas';
      }
    }

    // Edad: mínimo 17 años
    if (formData.birthDate) {
      const birth = new Date(formData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 17) {
        newErrors.birthDate = 'Debes ser mayor de 17 años';
      }
    } else {
      newErrors.birthDate = 'Fecha requerida';
    }

    if (!formData.acceptedTerms) {
      newErrors.acceptedTerms = 'Debes aceptar los términos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        nombre: formData.firstName,
        apellido: formData.lastName,
        telefono: formData.phone,
        email: formData.email,
        password: formData.password,
        genero: formData.genero,
        estatura: formData.height,
        peso: formData.weight,
        fecha_nacimiento: formData.birthDate,
        id_departamento: formData.departmentId ? Number(formData.departmentId) : null
      };

      const respuesta = await crearUsuario(userData);

      toast.success("Usuario registrado correctamente");

      //Iniciar sesión automáticamente después del registro
      if (onRegisterSuccess) {
        onRegisterSuccess({
          name: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          genero: formData.genero,
          department: departments.find(d => d.id_departamento === Number(formData.departmentId))?.nombre_departamento,
          region: departments.find(d => d.id_departamento === Number(formData.departmentId))?.region,
          height: formData.height,
          weight: formData.weight,
          birthDate: formData.birthDate
        });
      }

      onClose();
      resetForm();

    } catch (error: any) {
      console.error("Error en registro:", error);

      if (error.response?.status === 409) {
        toast.error("El correo electrónico ya está registrado", {
          description: "Por favor usa otro correo o inicia sesión",
          action: {
            label: "Ir a Iniciar Sesión",
            onClick: () => onSwitchToLogin?.(),
          },
        });

        setStep(1);
        setErrors(prev => ({
          ...prev,
          email: "Este correo ya está registrado"
        }));

      } else if (error.response?.status === 500) {
        toast.error("Error del servidor. Inténtalo de nuevo.");
      } else {
        toast.error("Error al registrar usuario. Verifica tu conexión.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val: boolean) => {
      if (!val) {
        onClose();
        setTimeout(() => {
          setStep(1);
          setErrors({});
        }, 300);
      }
    }}>
      <DialogContent
        className="sm:max-w-md max-h-[95vh] overflow-y-auto"
        aria-describedby="register-description"
      >
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              {step === 1 ? 'Crear Cuenta' : 'Información de Salud'}
            </DialogTitle>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Paso {step} de 2
            </span>
          </div>
          <DialogDescription id="register-description">
            {step === 1
              ? 'Regístrate en GessenApp para acceder a todas nuestras recetas.'
              : 'Cuéntanos un poco más sobre ti para personalizar tu experiencia.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Juan"
                    value={formData.firstName}
                    onChange={handleChange('firstName')}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Pérez"
                    value={formData.lastName}
                    onChange={handleChange('lastName')}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Número de Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+57 300 123 4567"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange('email')}
                  className="pl-10"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="genero">Género</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <select
                  id="genero"
                  value={formData.genero}
                  onChange={handleChange('genero')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Selecciona tu género</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              {errors.genero && (
                <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.genero}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange('password')}
                  className={`pl-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  minLength={8}
                  required
                />
              </div>
              {errors.password && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  className={`pl-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                  minLength={8}
                  required
                />
              </div>
              {errors.confirmPassword && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
              Siguiente Paso
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Inicia sesión aquí
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Estatura (cm)</Label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={formData.height}
                    onChange={handleChange('height')}
                    className={`pl-10 ${errors.height ? 'border-red-500 focus:ring-red-500' : ''}`}
                    required
                  />
                </div>
                {errors.height && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.height}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <div className="relative">
                  <Weight className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={formData.weight}
                    onChange={handleChange('weight')}
                    className={`pl-10 ${errors.weight ? 'border-red-500 focus:ring-red-500' : ''}`}
                    required
                  />
                </div>
                {errors.weight && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.weight}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleChange('birthDate')}
                  className={`pl-10 ${errors.birthDate ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
              </div>
              {errors.birthDate && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.birthDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  id="department"
                  value={formData.departmentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                  required
                >
                  {departments.length > 0 ? (
                    departments.map(dept => (
                      <option key={dept.id_departamento} value={dept.id_departamento}
                      >
                        {dept.nombre_departamento}
                      </option>
                    ))
                  ) : (
                    <option value="">Cargando departamentos...</option>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={formData.acceptedTerms}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, acceptedTerms: !!checked }))
                  }
                  className="mt-1"
                />
                <Label htmlFor="terms" className={`text-xs leading-normal cursor-pointer ${errors.acceptedTerms ? 'text-red-500' : 'text-gray-600'}`}>
                  Acepto la <span className="text-green-600 font-bold underline">Política de Privacidad</span> y los <span className="text-green-600 font-bold underline">Términos y Condiciones</span> de GessenApp.
                </Label>
              </div>
              {errors.acceptedTerms && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.acceptedTerms}</p>}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-1/3"
                onClick={() => setStep(1)}
              >
                Atrás
              </Button>
              <Button
                type="submit"
                className="w-2/3 bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Finalizando...' : 'Completar Registro'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
