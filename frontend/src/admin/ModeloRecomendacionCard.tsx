import { useEffect, useState } from "react";
import { BrainCircuit, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getAuthHeaders, apiUrl } from "../utils/auth";
import { toast } from "sonner";

// Estado y métricas del modelo de recomendación con aprendizaje automático, con opción de reentrenarlo
export function ModeloRecomendacionCard() {
  const [estado, setEstado] = useState<any>(null);
  const [entrenando, setEntrenando] = useState(false);

  const cargar = async () => {
    try {
      const res = await fetch(apiUrl("/admin/ml"), { headers: getAuthHeaders() });
      if (res.ok) setEstado(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { cargar(); }, []);

  const reentrenar = async () => {
    setEntrenando(true);
    try {
      const res = await fetch(apiUrl("/admin/ml/entrenar"), { method: "POST", headers: getAuthHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo entrenar el modelo");
      setEstado(data);
      toast.success("Modelo reentrenado", { description: `${data.interacciones} interacciones de ${data.pacientes} pacientes` });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEntrenando(false);
    }
  };

  const pct = (x?: number) => (x == null ? "—" : `${Math.round(x * 100)} %`);
  const m = estado?.metricas;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-600" />
          Modelo de recomendación (aprendizaje automático)
        </CardTitle>
        <button
          onClick={reentrenar}
          disabled={entrenando}
          className="flex items-center gap-2 border px-4 py-2 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${entrenando ? "animate-spin" : ""}`} />
          {entrenando ? "Entrenando..." : "Reentrenar"}
        </button>
      </CardHeader>
      <CardContent>
        {!estado?.entrenado ? (
          <p className="text-sm text-muted-foreground">El modelo aún no se ha entrenado.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Interacciones</p>
                <p className="text-2xl font-bold">{estado.interacciones}</p>
                <p className="text-xs text-muted-foreground">de {estado.pacientes} pacientes</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">HitRate@10 del modelo híbrido</p>
                <p className="text-2xl font-bold text-indigo-700">{pct(m?.modelo?.hitRate)}</p>
                <p className="text-xs text-muted-foreground">NDCG@10: {m?.modelo?.ndcg}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Línea base (popularidad)</p>
                <p className="text-2xl font-bold">{pct(m?.popularidad?.hitRate)}</p>
                <p className="text-xs text-muted-foreground">NDCG@10: {m?.popularidad?.ndcg}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Último entrenamiento</p>
                <p className="text-sm font-medium">{new Date(estado.entrenadoEn).toLocaleString("es-CO")}</p>
                <p className="text-xs text-muted-foreground">{estado.segundos} s</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Señales por separado: colaborativa {pct(m?.colaborativo?.hitRate)} · contenido {pct(m?.contenido?.hitRate)} · popularidad {pct(m?.popularidad?.hitRate)}.
            </p>
            <p className="text-xs text-muted-foreground">
              {estado.algoritmo}. Validación con {m?.pacientesEvaluados} pacientes y {m?.casosEvaluados} casos: a cada paciente se le
              ocultan sus {estado.parametros?.ocultos} últimos platillos consumidos y se verifica si el modelo los ubica entre sus 10
              primeras sugerencias ({m?.repeticiones} repeticiones).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
