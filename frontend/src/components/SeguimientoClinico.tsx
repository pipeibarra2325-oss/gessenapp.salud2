// Seguimiento clínico: indicadores de laboratorio, curva de peso e IMC, tamizaje de sarcopenia (SARC-F,
// fuerza de prensión, circunferencia de pantorrilla) y alertas ante desviaciones metabólicas.
// Lo usan el paciente («Mi salud») y el profesional (Progreso del paciente).
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, HeartPulse, Plus, Trash2, X, Scale, FlaskConical } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { apiUrl, getAuthHeaders } from '../utils/auth';

interface Props {
  modo: 'paciente' | 'admin';
  idPaciente?: number;
  // Contenedor de la curva de peso, para incluirla en el PDF
  refCurva?: RefObject<HTMLDivElement>;
  onCambio?: () => void;
}

const GRUPOS: { titulo: string; campos: [string, string, string][] }[] = [
  { titulo: 'Control glucémico', campos: [['glucemia_ayunas', 'Glucemia en ayunas', 'mg/dL'], ['glucemia_postprandial', 'Glucemia posprandial (1-2 h)', 'mg/dL'], ['hba1c', 'HbA1c', '%']] },
  { titulo: 'Perfil lipídico', campos: [['colesterol_total', 'Colesterol total', 'mg/dL'], ['ldl', 'LDL', 'mg/dL'], ['hdl', 'HDL', 'mg/dL'], ['trigliceridos', 'Triglicéridos', 'mg/dL']] },
  { titulo: 'Función renal', campos: [['creatinina', 'Creatinina sérica', 'mg/dL']] },
  { titulo: 'Masa y fuerza muscular', campos: [['circunferencia_pantorrilla', 'Circunferencia de pantorrilla', 'cm'], ['fuerza_prension', 'Fuerza de prensión (dinamómetro)', 'kg']] },
];

const SARC_F: { pregunta: string; opciones: string[] }[] = [
  { pregunta: '¿Qué tanta dificultad tiene para levantar y cargar 4,5 kg?', opciones: ['Ninguna', 'Alguna', 'Mucha o no puede'] },
  { pregunta: '¿Qué tanta dificultad tiene para cruzar caminando una habitación?', opciones: ['Ninguna', 'Alguna', 'Mucha, usa apoyo o no puede'] },
  { pregunta: '¿Qué tanta dificultad tiene para levantarse de una silla o de la cama?', opciones: ['Ninguna', 'Alguna', 'Mucha o no puede sin ayuda'] },
  { pregunta: '¿Qué tanta dificultad tiene para subir 10 escalones?', opciones: ['Ninguna', 'Alguna', 'Mucha o no puede'] },
  { pregunta: '¿Cuántas veces se ha caído en el último año?', opciones: ['Ninguna', '1 a 3 caídas', '4 o más'] },
];

const COLUMNAS: [string, string][] = [
  ['glucemia_ayunas', 'Gluc. ayunas'], ['glucemia_postprandial', 'Gluc. posprandial'], ['hba1c', 'HbA1c'],
  ['colesterol_total', 'CT'], ['ldl', 'LDL'], ['hdl', 'HDL'], ['trigliceridos', 'TG'], ['creatinina', 'Creat.'],
  ['tfg', 'TFGe'], ['circunferencia_pantorrilla', 'Pantorrilla'], ['fuerza_prension', 'Prensión'], ['sarc_f', 'SARC-F'],
];

const hoy = () => new Date().toLocaleDateString('en-CA');
const vacio = () => ({ fecha: hoy(), peso: '', notas: '', ...Object.fromEntries(GRUPOS.flatMap((g) => g.campos.map(([c]) => [c, '']))) }) as Record<string, string>;

export function SeguimientoClinico({ modo, idPaciente, refCurva, onCambio }: Props) {
  const [datos, setDatos] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(vacio);
  const [sarc, setSarc] = useState<(number | null)[]>([null, null, null, null, null]);
  const [guardando, setGuardando] = useState(false);
  // Bloqueo inmediato: un doble clic llega antes de que React actualice «guardando»
  const enviando = useRef(false);
  const [cambiandoIg, setCambiandoIg] = useState(false);

  const base = modo === 'admin' ? `/admin/seguimiento/${idPaciente}` : '/usuarios/me/seguimiento';

  const aplicar = (d: any) => {
    setDatos(d);
    // El paciente conserva en su sesión el peso y la autorización de IG medio vigentes
    if (modo === 'paciente' && d?.paciente) {
      try {
        const u = JSON.parse(sessionStorage.getItem('user') || '{}');
        sessionStorage.setItem('user', JSON.stringify({ ...u, weight: d.paciente.peso, permiteIgMedio: d.paciente.permite_ig_medio }));
      } catch { /* sesión no disponible */ }
    }
  };

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await fetch(apiUrl(base), { headers: getAuthHeaders() });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'No se pudo cargar el seguimiento clínico');
      aplicar(d);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { if (modo === 'paciente' || idPaciente) cargar(); }, [idPaciente]);

  const etiqueta = (c: string) => datos?.campos?.[c];
  const sarcTotal = sarc.every((v) => v != null) ? sarc.reduce((s: number, v) => s + (v as number), 0) : null;
  const sarcParcial = sarc.some((v) => v != null) && sarcTotal == null;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando.current) return;
    if (sarcParcial) { toast.error('Responde las 5 preguntas del SARC-F o déjalas todas sin responder'); return; }
    const body: Record<string, any> = { fecha: form.fecha };
    for (const [k, v] of Object.entries(form)) {
      if (k === 'fecha' || k === 'notas' || v.trim() === '') continue;
      const n = Number(v.trim().replace(',', '.'));
      if (!Number.isFinite(n)) { toast.error(`${etiqueta(k)?.etiqueta || 'El peso'} debe ser un número`); return; }
      body[k] = n;
    }
    if (form.notas.trim()) body.notas = form.notas.trim();
    if (sarcTotal != null) body.sarc_f = sarcTotal;
    enviando.current = true;
    setGuardando(true);
    try {
      const res = await fetch(apiUrl(base), { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'No se pudo guardar el registro');
      aplicar(d.seguimiento);
      setForm(vacio());
      setSarc([null, null, null, null, null]);
      setAbierto(false);
      toast.success('Registro clínico guardado');
      onCambio?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      enviando.current = false;
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Eliminar este registro clínico?')) return;
    try {
      const url = modo === 'admin' ? `${base}/${id}` : `/usuarios/me/seguimiento/${id}`;
      const res = await fetch(apiUrl(url), { method: 'DELETE', headers: getAuthHeaders() });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'No se pudo eliminar');
      aplicar(d.seguimiento);
      toast.success('Registro eliminado');
      onCambio?.();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const cambiarIg = async () => {
    if (!datos || cambiandoIg) return;
    const permitir = !datos.paciente.permite_ig_medio;
    setCambiandoIg(true);
    try {
      const res = await fetch(apiUrl(`/admin/usuarios/${idPaciente}/ig-medio`), { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ permitir }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'No se pudo cambiar la autorización');
      setDatos({ ...datos, paciente: { ...datos.paciente, permite_ig_medio: permitir } });
      toast.success(permitir ? 'Platillos de IG medio autorizados para este paciente' : 'Autorización de IG medio retirada');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCambiandoIg(false);
    }
  };

  // Curva de laboratorio: glucemia en ayunas y HbA1c en orden cronológico
  const curvaLab = useMemo(() => (datos?.registros || [])
    .filter((r: any) => r.glucemia_ayunas != null || r.hba1c != null)
    .map((r: any) => ({ fecha: r.fecha, glucemia: r.glucemia_ayunas, hba1c: r.hba1c }))
    .reverse(), [datos]);

  if (cargando && !datos) return <p className="text-sm text-gray-500 py-6 text-center">Cargando seguimiento clínico...</p>;
  if (!datos) return null;

  const p = datos.paciente;
  const ult = datos.ultimos || {};

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Dato titulo="Peso actual" valor={p.peso != null ? `${p.peso} kg` : '—'} />
        <Dato titulo="IMC" valor={p.imc != null ? `${p.imc} kg/m²` : '—'} />
        <Dato titulo="Última HbA1c" valor={ult.hba1c != null ? `${ult.hba1c} %` : '—'} pie={datos.fechaUltimo?.hba1c} />
        <Dato titulo="TFG estimada" valor={datos.tfg != null ? `${datos.tfg} mL/min` : '—'} pie={datos.tfg != null ? 'CKD-EPI 2021' : undefined} />
      </div>

      {modo === 'admin' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-indigo-200 bg-indigo-50">
          <div>
            <p className="font-semibold text-indigo-900 text-sm">Platillos de índice glucémico medio</p>
            <p className="text-xs text-indigo-800">
              {p.permite_ig_medio
                ? 'Autorizados: las recomendaciones del día y la IA pueden incluirlos, dando prioridad a los de IG bajo.'
                : 'No autorizados: el paciente solo recibe sugerencias de índice glucémico bajo.'}
            </p>
          </div>
          <button
            type="button" role="switch" aria-checked={p.permite_ig_medio} onClick={cambiarIg} disabled={cambiandoIg}
            aria-label="Autorizar platillos de índice glucémico medio"
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${p.permite_ig_medio ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${p.permite_ig_medio ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      )}

      {/* Alertas */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><HeartPulse className="w-4 h-4 text-rose-600" /> Alertas clínicas</p>
        {datos.alertas.length === 0 ? (
          <p className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />
            {datos.registros.length ? 'Los últimos valores registrados están dentro de las metas de referencia.' : 'Aún no hay indicadores registrados.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {datos.alertas.map((a: any, i: number) => (
              <li key={i} className={`flex items-start gap-2 text-sm p-2.5 rounded-lg ${a.nivel === 'alta' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}`}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{a.mensaje}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-500 mt-3">
          Alertas orientativas según las metas generales de la ADA (Standards of Care 2025), EWGSOP2 para sarcopenia y KDIGO para función renal.
          No reemplazan la valoración del profesional de salud.
        </p>
      </div>

      {/* Curvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Scale className="w-4 h-4 text-blue-600" /> Evolución del peso y del IMC</p>
          {datos.peso.length < 2 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Se necesitan al menos dos mediciones de peso para trazar la curva.</p>
          ) : (
            <div ref={refCurva} style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={datos.peso} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" fontSize={11} />
                  <YAxis yAxisId="peso" fontSize={11} domain={['auto', 'auto']} />
                  <YAxis yAxisId="imc" orientation="right" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine yAxisId="imc" y={25} stroke="#f59e0b" strokeDasharray="4 4" />
                  <Line yAxisId="peso" type="linear" dataKey="peso" name="Peso (kg)" stroke="#2563eb" strokeWidth={2} isAnimationActive={false} />
                  <Line yAxisId="imc" type="linear" dataKey="imc" name="IMC" stroke="#10b981" strokeWidth={2} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><FlaskConical className="w-4 h-4 text-purple-600" /> Glucemia en ayunas y HbA1c</p>
          {curvaLab.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Aún no hay glucemias ni HbA1c registradas.</p>
          ) : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={curvaLab} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" fontSize={11} />
                  <YAxis yAxisId="g" fontSize={11} domain={['auto', 'auto']} />
                  <YAxis yAxisId="h" orientation="right" fontSize={11} domain={[4, 'auto']} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine yAxisId="h" y={7} stroke="#ef4444" strokeDasharray="4 4" />
                  <Line yAxisId="g" type="linear" dataKey="glucemia" name="Glucemia ayunas (mg/dL)" stroke="#7c3aed" strokeWidth={2} connectNulls isAnimationActive={false} />
                  <Line yAxisId="h" type="linear" dataKey="hba1c" name="HbA1c (%)" stroke="#ef4444" strokeWidth={2} connectNulls isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Nuevo registro */}
      {!abierto ? (
        <button type="button" onClick={() => setAbierto(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> Registrar resultados o medidas
        </button>
      ) : (
        <form onSubmit={guardar} className="rounded-xl border border-emerald-200 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">Nuevo registro clínico</p>
            <button type="button" onClick={() => setAbierto(false)} className="p-1 rounded hover:bg-gray-100" aria-label="Cerrar formulario"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-gray-500">Llena solo los valores que tengas; los demás pueden quedar vacíos.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo etiqueta="Fecha del examen o medición" tipo="date" valor={form.fecha} max={hoy()} onChange={(v) => setForm({ ...form, fecha: v })} />
            <Campo etiqueta="Peso (kg)" valor={form.peso} onChange={(v) => setForm({ ...form, peso: v })} />
          </div>
          {GRUPOS.map((g) => (
            <fieldset key={g.titulo}>
              <legend className="text-sm font-semibold text-gray-700 mb-2">{g.titulo}</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {g.campos.map(([c, l, u]) => (
                  <Campo key={c} etiqueta={`${l} (${u})`} valor={form[c]} onChange={(v) => setForm({ ...form, [c]: v })}
                    ayuda={etiqueta(c) ? `${etiqueta(c).min} a ${etiqueta(c).max}` : undefined} />
                ))}
              </div>
            </fieldset>
          ))}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-1">Cuestionario SARC-F (tamizaje de sarcopenia)</legend>
            <p className="text-xs text-gray-500 mb-2">Opcional. Con 4 puntos o más se sugiere evaluar la fuerza y la masa muscular.</p>
            <div className="space-y-2">
              {SARC_F.map((q, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                  <span className="flex-1 text-gray-700">{i + 1}. {q.pregunta}</span>
                  <select value={sarc[i] ?? ''} aria-label={q.pregunta}
                    onChange={(e) => setSarc(sarc.map((v, j) => (j === i ? (e.target.value === '' ? null : Number(e.target.value)) : v)))}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 bg-white sm:w-56">
                    <option value="">Sin responder</option>
                    {q.opciones.map((o, k) => <option key={k} value={k}>{o} ({k})</option>)}
                  </select>
                </div>
              ))}
            </div>
            {sarcTotal != null && (
              <p className={`text-sm font-semibold mt-2 ${sarcTotal >= 4 ? 'text-amber-700' : 'text-emerald-700'}`}>
                Puntaje SARC-F: {sarcTotal} / 10 {sarcTotal >= 4 ? '· riesgo de sarcopenia' : '· sin riesgo'}
              </p>
            )}
          </fieldset>
          <label className="block text-sm">
            <span className="text-gray-700">Notas (opcional)</span>
            <textarea value={form.notas} maxLength={500} rows={2} onChange={(e) => setForm({ ...form, notas: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAbierto(false)} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={guardando} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Guardar registro'}
            </button>
          </div>
        </form>
      )}

      {/* Historial */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="font-semibold text-gray-900 mb-2">Historial de indicadores</p>
        {datos.registros.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">Sin registros clínicos todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3">Fecha</th>
                  {COLUMNAS.map(([, t]) => <th key={t} className="py-2 pr-3 text-right whitespace-nowrap">{t}</th>)}
                  <th className="py-2 pr-3">Registró</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {datos.registros.map((r: any) => (
                  <tr key={r.id_seguimiento} className="border-b last:border-0 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{r.fecha}{r.alertas.length > 0 && <AlertTriangle className="inline w-3 h-3 ml-1 text-amber-600" aria-label="Con alertas" />}</td>
                    {COLUMNAS.map(([c]) => <td key={c} className="py-2 pr-3 text-right">{r[c] ?? '—'}</td>)}
                    <td className="py-2 pr-3">{r.registrado_por || '—'}{r.notas ? <span className="block text-gray-500">{r.notas}</span> : null}</td>
                    <td className="py-2">
                      <button type="button" onClick={() => eliminar(r.id_seguimiento)} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50" aria-label={`Eliminar registro del ${r.fecha}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">Unidades: glucemias, colesterol y triglicéridos en mg/dL; HbA1c en %; creatinina en mg/dL; TFGe en mL/min/1,73 m²; pantorrilla en cm; prensión en kg.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Dato({ titulo, valor, pie }: { titulo: string; valor: string; pie?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="text-lg font-bold text-gray-900">{valor}</p>
      {pie && <p className="text-xs text-gray-400">{pie}</p>}
    </div>
  );
}

function Campo({ etiqueta, valor, onChange, tipo = 'text', max, ayuda }: { etiqueta: string; valor: string; onChange: (v: string) => void; tipo?: string; max?: string; ayuda?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">{etiqueta}</span>
      <input type={tipo} inputMode={tipo === 'text' ? 'decimal' : undefined} value={valor} max={max} placeholder={ayuda}
        onChange={(e) => onChange(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
    </label>
  );
}
