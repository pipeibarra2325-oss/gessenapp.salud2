import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { User, Ruler, Weight, TrendingUp, X, CheckCircle2, HeartPulse, Sparkles, MapPin, CalendarDays, Edit3, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AboutMeModalProps {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  user: any;
  region: string | null;
  onEdit: () => void;
}

export function AboutMeModal({ open, onClose, isLoggedIn, user, region, onEdit }: AboutMeModalProps) {
  const imcData = useMemo(() => {
    const h = parseFloat(user?.height) / 100;
    const w = parseFloat(user?.weight);
    if (!h || !w) return null;
    const imc = parseFloat((w / (h * h)).toFixed(1));

    let category = "";
    let color = "";
    let habits: string[] = [];

    if (imc < 18.5) {
      category = "Bajo peso";
      color = "#3b82f6";
      habits = ["Aumenta el consumo de grasas saludables.", "Incluye proteínas en todas tus comidas.", "Realiza ejercicios de fuerza."];
    }
    else if (imc < 25) {
      category = "Normal";
      color = "#22c55e";
      habits = ["¡Excelente! Mantén tu dieta balanceada.", "Realiza 30 min de actividad física.", "Asegura un descanso de 7-8 horas."];
    }
    else if (imc < 30) {
      category = "Sobrepeso";
      color = "#eab308";
      habits = ["Reduce harinas refinadas y azúcares.", "Aumenta la ingesta de fibra.", "Prioriza ejercicios aeróbicos."];
    }
    else {
      category = "Obesidad";
      color = "#ef4444";
      habits = ["Prioriza vegetales de hoja verde.", "Evita el sedentarismo.", "Consulta un plan nutricional guiado."];
    }

    return { value: imc, category, color, habits };
  }, [user, region, isLoggedIn]);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "--";
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl" aria-describedby="about-me-description">
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <HeartPulse className="w-64 h-64" />
          </div>
          <DialogHeader className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-black flex items-center gap-2 text-white">
                  <User className="w-6 h-6" />
                  Sobre Mí
                </DialogTitle>
                <DialogDescription id="about-me-description" className="text-green-100">
                  Resumen de tu información personal y perfil nutricional.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold opacity-80">Nombre Completo</p>
                  <p className="text-lg font-black">{user?.name} {user?.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold opacity-80">Edad</p>
                  <p className="text-lg font-black">{calculateAge(user?.birthDate)} años</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold opacity-80">Ubicación</p>
                  <p className="text-lg font-black">
                    {user?.department} • Región {region || user?.region || "No especificada"}</p>
                </div>
              </div>
              <Button
                onClick={onEdit}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 w-full md:w-auto"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Editar información
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white">
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Perfil Biométrico</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
                  <Ruler className="w-5 h-5 text-green-600 mb-1" />
                  <span className="text-[10px] font-bold text-gray-400">Altura</span>
                  <span className="text-xl font-black text-gray-800">{user?.height} cm</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
                  <Weight className="w-5 h-5 text-green-600 mb-1" />
                  <span className="text-[10px] font-bold text-gray-400">Peso</span>
                  <span className="text-xl font-black text-gray-800">{user?.weight} kg</span>
                </div>
              </div>

              <div className="mt-4 bg-white p-6 rounded-2xl border border-gray-100 flex flex-col items-center">
                <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-[10px] font-bold text-gray-400">IMC (Índice de Masa Corporal)</span>
                <span className="text-3xl font-black" style={{ color: imcData?.color }}>{imcData?.value}</span>
                <div className="mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase" style={{ backgroundColor: `${imcData?.color}15`, color: imcData?.color }}>
                  {imcData?.category}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                <strong className="block mb-1">Nota Informativa:</strong>
                El IMC es un indicador referencial de salud y no constituye un diagnóstico médico clínico. Se recomienda consultar con un profesional para una evaluación detallada.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Hábitos Recomendados
            </h3>

            <div className="space-y-3">
              {imcData?.habits.map((habit, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <p className="text-sm text-gray-700 font-medium">{habit}</p>
                </div>
              ))}
            </div>

            <div className="p-5 bg-green-50 rounded-3xl border border-green-100">
              <p className="text-xs text-green-800 font-bold mb-2">🌿 Contexto Regional:</p>
              <p className="text-[13px] text-green-700 leading-relaxed">
                Como te encuentras en la región <strong>{user?.region || 'No especificada'}</strong>, priorizamos recomendaciones basadas en alimentos locales de esta zona para facilitar el manejo de tu alimentación.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}