import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

export type DocumentoLegal = 'privacidad' | 'terminos';

interface LegalModalProps {
  documento: DocumentoLegal | null;
  onClose: () => void;
}

// Política de privacidad y términos de uso que la persona acepta al registrarse
export function LegalModal({ documento, onClose }: LegalModalProps) {
  // Se conserva el último documento para que el contenido no cambie durante la animación de cierre
  const ultimo = useRef<DocumentoLegal>('privacidad');
  if (documento) ultimo.current = documento;
  const privacidad = ultimo.current === 'privacidad';
  return (
    <Dialog open={documento !== null} onOpenChange={(abierto) => { if (!abierto) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{privacidad ? 'Política de Privacidad' : 'Términos y Condiciones'}</DialogTitle>
          <DialogDescription>
            GessenApp, proyecto de investigación del Programa de Ingeniería de Sistemas de la Universidad CESMAG (Pasto, Nariño).
          </DialogDescription>
        </DialogHeader>

        {privacidad ? (
          <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
            <p><strong>Datos que se recogen.</strong> Nombre, apellido, correo, teléfono, género, fecha de nacimiento, estatura, peso, departamento y región alimentaria, y los consumos, calificaciones y favoritos que registres en la aplicación.</p>
            <p><strong>Para qué se usan.</strong> Para mostrarte recetas y sugerencias acordes con tu perfil, calcular el aporte nutricional de lo que registras y permitir que el profesional de la salud que te acompaña revise tu progreso y genere un informe. No se venden ni se comparten con terceros.</p>
            <p><strong>Datos de salud.</strong> El peso, la estatura y los consumos son datos sensibles. Su suministro es voluntario y se tratan con la reserva de la información clínica, conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 de Colombia.</p>
            <p><strong>Seguridad.</strong> Las contraseñas se guardan cifradas, el acceso a los datos exige iniciar sesión y las acciones del panel del profesional quedan registradas.</p>
            <p><strong>Tus derechos.</strong> Puedes conocer, actualizar y corregir tus datos desde tu perfil, y solicitar su eliminación o revocar esta autorización escribiendo a <strong>gessenapp@gmail.com</strong>.</p>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
            <p><strong>Finalidad.</strong> GessenApp es una herramienta educativa de apoyo a la orientación alimentaria de personas con diabetes tipo II. Sus recetas, sugerencias, alertas y valores nutricionales son orientativos.</p>
            <p><strong>No reemplaza la atención profesional.</strong> La aplicación no realiza diagnósticos ni prescribe tratamientos. Antes de cambiar tu alimentación o tu medicación, consulta con tu médico o nutricionista.</p>
            <p><strong>Exactitud de la información.</strong> Los valores nutricionales se calculan con los ingredientes de cada receta y pueden diferir de los alimentos que consumes. La aplicación se encuentra en fase de evaluación académica.</p>
            <p><strong>Tu cuenta.</strong> Eres responsable de la veracidad de los datos que registras y de mantener tu contraseña en reserva. La cuenta es personal.</p>
            <p><strong>Contacto.</strong> Para preguntas o solicitudes, escribe a <strong>gessenapp@gmail.com</strong>.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
