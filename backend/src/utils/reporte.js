import pool from "../config/database.js";
import { NUTRIENTES_PLATILLO_SQL } from "./nutricion.js";
import { construirSeguimiento } from "./seguimiento.js";

// Valores de referencia usados en las observaciones automáticas.
// Son orientativos y deben ajustarse a la valoración individual del profesional.
export const REFERENCIAS = {
  fibra_min_g: 25,          // ingesta diaria de fibra recomendada: 25-30 g
  sodio_max_mg: 2300,       // límite diario de sodio para adultos con diabetes (ADA)
  azucares_max_pct: 10,     // azúcares < 10 % de la energía total (OMS)
  ig_alto_max_pct: 30,      // proporción de platillos de índice glucémico alto
};

const NUTRIENTES = ["calorias", "carbohidratos", "azucares", "grasas", "proteinas", "fibra", "sodio"];
const MOMENTOS = ["Desayuno", "Almuerzo", "Merienda", "Snack", "Cena"];
const redondear = (n, d = 1) => Math.round(Number(n || 0) * 10 ** d) / 10 ** d;

const calcularEdad = (fecha) => {
  if (!fecha) return null;
  const nac = new Date(fecha);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

const clasificarImc = (imc) => {
  if (imc == null) return null;
  if (imc < 18.5) return "Bajo peso";
  if (imc < 25) return "Peso normal";
  if (imc < 30) return "Sobrepeso";
  return "Obesidad";
};

/**
 * Construye el reporte nutricional de un usuario. Devuelve null si el usuario no existe.
 * @param {number|string} idUsuario
 * @param {{desde?: string, hasta?: string}} rango  fechas AAAA-MM-DD opcionales
 */
export async function construirReporte(idUsuario, { desde, hasta } = {}) {
  const usuarioRes = await pool.query(`
    SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.genero, u.fecha_nacimiento,
           u.estatura, u.peso, d.nombre_departamento AS departamento,
           (SELECT STRING_AGG(e.nombre_enfermedad, ', ' ORDER BY e.nombre_enfermedad)
              FROM usuarios_enfermedades ue JOIN enfermedades e ON e.id_enfermedad = ue.id_enfermedad
             WHERE ue.id_usuario = u.id_usuario) AS enfermedades
    FROM usuarios u
    LEFT JOIN departamentos d ON d.id_departamento = u.id_departamento
    WHERE u.id_usuario = $1
  `, [idUsuario]);

  const u = usuarioRes.rows[0];
  if (!u) return null;

  const params = [idUsuario];
  let filtroFecha = "";
  if (desde) { params.push(desde); filtroFecha += ` AND h.fecha_consumo >= $${params.length}`; }
  if (hasta) { params.push(hasta); filtroFecha += ` AND h.fecha_consumo <= $${params.length}`; }

  const registrosRes = await pool.query(`
    SELECT
      h.id_historial,
      TO_CHAR(h.fecha_consumo, 'YYYY-MM-DD') AS fecha_consumo,
      TO_CHAR(h.fecha_registro, 'HH24:MI') AS hora,
      h.meal_time,
      COALESCE(h.porcion_consumida, 1)::float AS porcion_consumida,
      h.rating_usuario,
      h.comentario,
      p.id_platillo,
      p.nombre_platillo,
      INITCAP(LOWER(p.nivel_glucemico)) AS nivel_glucemico,
      c.nombre AS categoria,
      ROUND(COALESCE(nt.calorias, 0)      * COALESCE(h.porcion_consumida, 1), 1)::float AS calorias_consumidas,
      ROUND(COALESCE(nt.carbohidratos, 0) * COALESCE(h.porcion_consumida, 1), 1)::float AS carbs_consumidos,
      ROUND(COALESCE(nt.azucares, 0)      * COALESCE(h.porcion_consumida, 1), 1)::float AS azucares_consumidos,
      ROUND(COALESCE(nt.grasas, 0)        * COALESCE(h.porcion_consumida, 1), 1)::float AS grasas_consumidas,
      ROUND(COALESCE(nt.proteinas, 0)     * COALESCE(h.porcion_consumida, 1), 1)::float AS proteinas_consumidas,
      ROUND(COALESCE(nt.fibra, 0)         * COALESCE(h.porcion_consumida, 1), 1)::float AS fibra_consumida,
      ROUND(COALESCE(nt.sodio, 0)         * COALESCE(h.porcion_consumida, 1), 1)::float AS sodio_consumido
    FROM historial_consumo h
    JOIN platillos p ON p.id_platillo = h.id_platillo
    LEFT JOIN categorias_platillo c ON c.id_categoria = p.id_categoria
    LEFT JOIN (${NUTRIENTES_PLATILLO_SQL}) nt ON nt.id_platillo = h.id_platillo
    WHERE h.id_usuario = $1 ${filtroFecha}
    ORDER BY h.fecha_consumo, h.id_historial
  `, params);

  const registros = registrosRes.rows;
  const campo = {
    calorias: "calorias_consumidas", carbohidratos: "carbs_consumidos", azucares: "azucares_consumidos",
    grasas: "grasas_consumidas", proteinas: "proteinas_consumidas", fibra: "fibra_consumida", sodio: "sodio_consumido",
  };

  // ---- Totales por día ----
  const dias = new Map();
  for (const r of registros) {
    if (!dias.has(r.fecha_consumo)) {
      dias.set(r.fecha_consumo, { fecha: r.fecha_consumo, registros: 0, momentos: new Set(), ...Object.fromEntries(NUTRIENTES.map((n) => [n, 0])) });
    }
    const d = dias.get(r.fecha_consumo);
    d.registros++;
    d.momentos.add(r.meal_time);
    for (const n of NUTRIENTES) d[n] += r[campo[n]];
  }
  const porDia = [...dias.values()].map(({ momentos, ...d }) => ({
    ...d, ...Object.fromEntries(NUTRIENTES.map((n) => [n, redondear(d[n])])), sinDesayuno: !momentos.has("Desayuno"),
  }));

  const nDias = porDia.length;
  const totales = Object.fromEntries(NUTRIENTES.map((n) => [n, redondear(registros.reduce((a, r) => a + r[campo[n]], 0))]));
  const promedios = Object.fromEntries(NUTRIENTES.map((n) => [n, nDias ? redondear(totales[n] / nDias) : 0]));

  // Distribución de la energía (4 kcal/g carbohidratos y proteínas, 9 kcal/g grasas)
  const kcalMacros = promedios.carbohidratos * 4 + promedios.proteinas * 4 + promedios.grasas * 9;
  const pct = (kcal) => (kcalMacros > 0 ? redondear((kcal / kcalMacros) * 100) : 0);
  const distribucionEnergia = {
    carbohidratos: pct(promedios.carbohidratos * 4),
    proteinas: pct(promedios.proteinas * 4),
    grasas: pct(promedios.grasas * 9),
  };
  const azucaresPctEnergia = promedios.calorias > 0 ? redondear((promedios.azucares * 4 / promedios.calorias) * 100) : 0;

  // ---- Distribuciones ----
  const contar = (clave, orden) => {
    const m = new Map();
    for (const r of registros) {
      const k = r[clave] || "Sin dato";
      m.set(k, (m.get(k) || 0) + 1);
    }
    const lista = [...m.entries()].map(([nombre, cantidad]) => ({ nombre, cantidad }));
    return orden ? lista.sort((a, b) => orden.indexOf(a.nombre) - orden.indexOf(b.nombre)) : lista;
  };
  const porMomento = contar("meal_time", MOMENTOS);
  const porNivelGlucemico = contar("nivel_glucemico", ["Bajo", "Medio", "Alto", "Sin dato"]);

  const frecuencia = new Map();
  for (const r of registros) frecuencia.set(r.nombre_platillo, (frecuencia.get(r.nombre_platillo) || 0) + 1);
  const platillosFrecuentes = [...frecuencia.entries()]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  // ---- Datos del paciente ----
  const estatura = u.estatura ? Number(u.estatura) : null;
  const peso = u.peso ? Number(u.peso) : null;
  const imc = estatura && peso ? redondear(peso / (estatura / 100) ** 2) : null;

  // ---- Observaciones automáticas (orientativas) ----
  const obs = [];
  const nAlto = porNivelGlucemico.find((x) => x.nombre === "Alto")?.cantidad || 0;
  const pctAlto = registros.length ? redondear((nAlto / registros.length) * 100, 0) : 0;
  const diasSinDesayuno = porDia.filter((d) => d.sinDesayuno).length;

  if (registros.length === 0) {
    obs.push("El paciente no tiene consumos registrados en el periodo seleccionado; no es posible valorar su alimentación.");
  } else {
    if (nDias < 3) {
      obs.push(`El periodo incluye solo ${nDias} día(s) con registro; las conclusiones deben tomarse con cautela.`);
    }
    obs.push(`Aporte energético promedio de ${promedios.calorias} kcal por día con registro, distribuido en ${distribucionEnergia.carbohidratos} % carbohidratos, ${distribucionEnergia.proteinas} % proteínas y ${distribucionEnergia.grasas} % grasas.`);

    obs.push(promedios.fibra < REFERENCIAS.fibra_min_g
      ? `Consumo de fibra bajo: ${promedios.fibra} g/día, por debajo de los ${REFERENCIAS.fibra_min_g} g/día recomendados. Considerar reforzar verduras, legumbres y granos integrales.`
      : `Consumo de fibra adecuado: ${promedios.fibra} g/día.`);

    if (promedios.sodio > REFERENCIAS.sodio_max_mg) {
      obs.push(`Consumo de sodio elevado: ${promedios.sodio} mg/día, por encima del límite de ${REFERENCIAS.sodio_max_mg} mg/día.`);
    } else {
      obs.push(`Consumo de sodio dentro del límite: ${promedios.sodio} mg/día (límite ${REFERENCIAS.sodio_max_mg} mg/día).`);
    }

    if (azucaresPctEnergia > REFERENCIAS.azucares_max_pct) {
      obs.push(`Los azúcares representan el ${azucaresPctEnergia} % de la energía, por encima del ${REFERENCIAS.azucares_max_pct} % recomendado.`);
    } else {
      obs.push(`Los azúcares representan el ${azucaresPctEnergia} % de la energía (referencia: menos del ${REFERENCIAS.azucares_max_pct} %).`);
    }

    obs.push(pctAlto > REFERENCIAS.ig_alto_max_pct
      ? `El ${pctAlto} % de los platillos consumidos son de índice glucémico alto; se sugiere revisar estas elecciones con el paciente.`
      : `El ${pctAlto} % de los platillos consumidos son de índice glucémico alto.`);

    if (diasSinDesayuno > 0) {
      obs.push(`No se registró desayuno en ${diasSinDesayuno} de ${nDias} día(s) con registro.`);
    }
  }
  if (imc != null) {
    obs.push(`IMC calculado con los datos del perfil: ${imc} kg/m² (${clasificarImc(imc)}).`);
  }

  return {
    generado: new Date().toISOString(),
    usuario: {
      id_usuario: u.id_usuario,
      nombre: `${u.nombre} ${u.apellido}`.trim(),
      email: u.email,
      genero: u.genero,
      edad: calcularEdad(u.fecha_nacimiento),
      estatura, peso, imc, clasificacion_imc: clasificarImc(imc),
      departamento: u.departamento,
      enfermedades: u.enfermedades,
    },
    periodo: {
      desde: desde || porDia[0]?.fecha || null,
      hasta: hasta || porDia[nDias - 1]?.fecha || null,
      dias_con_registro: nDias,
      total_registros: registros.length,
    },
    totales,
    promedios,
    distribucionEnergia,
    azucaresPctEnergia,
    porDia,
    porMomento,
    porNivelGlucemico,
    platillosFrecuentes,
    observaciones: obs,
    referencias: REFERENCIAS,
    registros,
    seguimiento: await construirSeguimiento(idUsuario),
  };
}
