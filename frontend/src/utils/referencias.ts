// Valores de referencia orientativos compartidos por el registro diario del paciente.
// Deben coincidir con REFERENCIAS de backend/src/utils/reporte.js (informe del profesional).
export const REFERENCIAS = {
  fibra_min_g: 25,        // ingesta diaria de fibra recomendada: 25-30 g
  sodio_max_mg: 2300,     // límite diario de sodio para adultos con diabetes (ADA)
  azucares_max_pct: 10,   // azúcares < 10 % de la energía total (OMS)
  // Energía diaria de referencia: mientras el día no la alcanza, el porcentaje de azúcares se
  // calcula sobre ella (10 % de 2000 kcal ≈ 50 g), para no alertar por un solo desayuno
  energia_referencia_kcal: 2000,
  // Carga glucémica acumulada del día (umbrales de diseño): baja hasta 80, alta desde 120
  carga_dia_baja: 80,
  carga_dia_alta: 120,
};

export interface AlertaNutricional {
  clave: 'sodio' | 'azucares';
  titulo: string;
  mensaje: string;
}

// Alertas del día por sodio y azúcares a partir de los consumos registrados
export function calcularAlertas(consumos: { calories: number; sugar?: number; sodium?: number }[]): AlertaNutricional[] {
  const calorias = consumos.reduce((s, c) => s + (c.calories || 0), 0);
  const azucares = consumos.reduce((s, c) => s + (c.sugar || 0), 0);
  const sodio = consumos.reduce((s, c) => s + (c.sodium || 0), 0);
  const alertas: AlertaNutricional[] = [];
  if (sodio > REFERENCIAS.sodio_max_mg) {
    alertas.push({
      clave: 'sodio',
      titulo: 'Sodio elevado',
      mensaje: `Llevas ${Math.round(sodio)} mg de sodio hoy, por encima del límite orientativo de ${REFERENCIAS.sodio_max_mg} mg/día. Prefiere preparaciones con menos sal y evita embutidos y productos de paquete.`,
    });
  }
  // El 10 % se mide sobre la energía total del día; mientras el día está incompleto se usa la
  // energía de referencia, de modo que un desayuno con fruta no dispara la alerta
  const diaCompleto = calorias >= REFERENCIAS.energia_referencia_kcal;
  const base = Math.max(calorias, REFERENCIAS.energia_referencia_kcal);
  const pctAzucares = (azucares * 4 / base) * 100;
  if (pctAzucares > REFERENCIAS.azucares_max_pct) {
    alertas.push({
      clave: 'azucares',
      titulo: 'Azúcares elevados',
      mensaje: diaCompleto
        ? `Los azúcares aportan el ${pctAzucares.toFixed(1)} % de la energía de hoy (referencia: menos del ${REFERENCIAS.azucares_max_pct} %). Modera dulces, bebidas azucaradas y postres.`
        : `Llevas ${Math.round(azucares)} g de azúcares hoy, más del ${REFERENCIAS.azucares_max_pct} % de una ingesta de referencia de ${REFERENCIAS.energia_referencia_kcal} kcal (unos ${Math.round(REFERENCIAS.energia_referencia_kcal * REFERENCIAS.azucares_max_pct / 400)} g). Modera dulces, bebidas azucaradas y postres.`,
    });
  }
  return alertas;
}
