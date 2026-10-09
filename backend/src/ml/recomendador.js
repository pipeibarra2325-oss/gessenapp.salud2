// Recomendador híbrido con aprendizaje automático.
//
// La puntuación de cada platillo para un paciente combina tres señales normalizadas:
//  1. Colaborativa: factorización de matrices entrenada con BPR (Bayesian Personalized Ranking) sobre
//     las interacciones de todos los pacientes (consumos, favoritos, calificaciones y vistas). Aprende un
//     vector para cada paciente y cada platillo; un platillo con el que el paciente interactuó debe
//     puntuar más alto que uno con el que no.
//  2. De contenido: afinidad del paciente con el nivel glucémico y la categoría (desayuno, almuerzo...)
//     de los platillos, estimada con su propio historial.
//  3. De popularidad entre los pacientes.
// Los pesos de las tres señales se eligieron con la validación descrita en evaluar(). Además, las reglas
// clínicas filtran las sugerencias (solo índice glucémico bajo; el medio, si el profesional lo autoriza al
// paciente; nunca el alto), a los pacientes con sobrepeso u obesidad (IMC de 25 o más) se les priorizan los
// platillos con menos calorías y los pacientes con pocos datos reciben los permitidos más populares (inicio en frío).
import pool from "../config/database.js";
import { NUTRIENTES_PLATILLO_SQL } from "../utils/nutricion.js";

export const PARAMETROS = {
  factores: 16,
  epocas: 60,
  tasa: 0.05,
  regularizacion: 0.05,
  muestrasPorEpoca: 20,   // pares (positivo, negativo) por interacción y época
  minimoInteracciones: 3, // por debajo se usa el modo de inicio en frío
  ocultos: 3,             // platillos consumidos que se ocultan a cada paciente en la validación
  k: 10,
  pesos: { colaborativo: 1, contenido: 0.5, popularidad: 1 }, // elegidos con evaluar() sobre 27 combinaciones
  imcSobrepeso: 25,       // desde este IMC se priorizan los platillos con menos calorías
  pesoCalorias: 0.5,      // cuánto resta al puntaje la energía del platillo (normalizada de 0 a 1)
  penalizacionIgMedio: 0.5, // con IG medio autorizado, los de IG bajo conservan la prioridad
};

let modelo = null;
let entrenando = null;

// Generador pseudoaleatorio con semilla: el mismo conjunto de datos produce el mismo modelo
function crearAzar(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function cargarDatos() {
  const platillos = (await pool.query(`
    SELECT p.id_platillo, p.nombre_platillo, LOWER(p.nivel_glucemico) AS nivel, c.nombre AS categoria,
           COALESCE(nt.calorias, 0)::float AS calorias
    FROM platillos p LEFT JOIN categorias_platillo c ON c.id_categoria = p.id_categoria
    LEFT JOIN (${NUTRIENTES_PLATILLO_SQL}) nt ON nt.id_platillo = p.id_platillo
    WHERE EXISTS (SELECT 1 FROM platillos_ingredientes pi WHERE pi.id_platillo = p.id_platillo)
    ORDER BY p.id_platillo`)).rows;

  // Peso de cada interacción: consumos repetidos, favoritos, buenas calificaciones y vistas suman;
  // una calificación de 1 o 2 estrellas descarta el platillo como preferencia del paciente.
  const filas = (await pool.query(`
    WITH consumos AS (
      SELECT id_usuario, id_platillo, COUNT(*)::int AS veces, MAX(fecha_consumo) AS ultima
      FROM historial_consumo GROUP BY id_usuario, id_platillo
    ), favoritos AS (
      SELECT id_usuario, id_platillo, 1 AS fav FROM usuarios_favoritos
    ), calificaciones AS (
      SELECT id_usuario, id_platillo, rating FROM platillo_calificaciones
    ), vistas AS (
      SELECT id_usuario, entity_id AS id_platillo, COUNT(*)::int AS vistas
      FROM user_interactions
      WHERE entity_type = 'platillo' AND event_type IN ('view', 'click') AND entity_id IS NOT NULL
      GROUP BY id_usuario, entity_id
    )
    SELECT COALESCE(c.id_usuario, f.id_usuario, r.id_usuario, w.id_usuario) AS id_usuario,
           COALESCE(c.id_platillo, f.id_platillo, r.id_platillo, w.id_platillo) AS id_platillo,
           COALESCE(c.veces, 0) AS veces, c.ultima, COALESCE(f.fav, 0) AS fav, r.rating, COALESCE(w.vistas, 0) AS vistas
    FROM consumos c
    FULL JOIN favoritos f ON f.id_usuario = c.id_usuario AND f.id_platillo = c.id_platillo
    FULL JOIN calificaciones r ON r.id_usuario = COALESCE(c.id_usuario, f.id_usuario)
                               AND r.id_platillo = COALESCE(c.id_platillo, f.id_platillo)
    FULL JOIN vistas w ON w.id_usuario = COALESCE(c.id_usuario, f.id_usuario, r.id_usuario)
                       AND w.id_platillo = COALESCE(c.id_platillo, f.id_platillo, r.id_platillo)
    JOIN usuarios u ON u.id_usuario = COALESCE(c.id_usuario, f.id_usuario, r.id_usuario, w.id_usuario) AND u.id_rol = 2
    JOIN platillos p ON p.id_platillo = COALESCE(c.id_platillo, f.id_platillo, r.id_platillo, w.id_platillo)`)).rows;

  // Popularidad de la vista platillos_populares (favoritos, consumos e interacciones), para el inicio en frío
  const populares = new Map((await pool.query("SELECT id_platillo, popularity_score FROM platillos_populares")).rows
    .map((r) => [r.id_platillo, Number(r.popularity_score) || 0]));

  const interacciones = new Map(); // id_usuario -> [{ item, peso, ultima }]
  const candidatos = new Set(platillos.map((x) => x.id_platillo));
  for (const f of filas) {
    if (!candidatos.has(f.id_platillo)) continue; // receta sin ingredientes: no participa en el modelo
    if (f.rating != null && f.rating <= 2) continue;
    // Una vista del detalle es una señal débil; un consumo, un favorito o una buena calificación pesan más
    const peso = Math.log1p(f.veces) + (f.fav ? 1 : 0) + (f.rating >= 4 ? 0.5 : 0) + 0.25 * Math.log1p(f.vistas);
    if (peso <= 0) continue;
    if (!interacciones.has(f.id_usuario)) interacciones.set(f.id_usuario, []);
    interacciones.get(f.id_usuario).push({ item: f.id_platillo, peso, ultima: f.ultima ? new Date(f.ultima).getTime() : 0 });
  }
  return { platillos, interacciones, populares };
}

// ---------------------------------------------------------------- señal colaborativa (BPR)
async function entrenarBPR(interacciones, items, p = PARAMETROS, semilla = 2026) {
  const azar = crearAzar(semilla);
  const indice = new Map(items.map((id, i) => [id, i]));
  const usuarios = [...interacciones.keys()];
  const nI = items.length, K = p.factores;
  const inicial = () => Float64Array.from({ length: K }, () => (azar() - 0.5) * 0.1);
  const U = new Map(usuarios.map((u) => [u, inicial()]));
  const V = items.map(() => inicial());
  const b = new Float64Array(nI);

  const pares = [];
  const vistos = new Map();
  for (const u of usuarios) {
    const lista = interacciones.get(u);
    vistos.set(u, new Set(lista.map((x) => indice.get(x.item))));
    for (const x of lista) pares.push([u, indice.get(x.item), x.peso]);
  }
  const pesoMax = Math.max(...pares.map((x) => x[2]), 1);

  for (let e = 0; e < p.epocas; e++) {
    // Cede el turno entre épocas para que el servidor siga atendiendo solicitudes mientras entrena
    await new Promise((r) => setImmediate(r));
    const pasos = pares.length * p.muestrasPorEpoca;
    for (let s = 0; s < pasos; s++) {
      const [u, i, peso] = pares[Math.floor(azar() * pares.length)];
      const vis = vistos.get(u);
      if (vis.size >= nI) continue;
      let j;
      do { j = Math.floor(azar() * nI); } while (vis.has(j));
      const pu = U.get(u), qi = V[i], qj = V[j];
      let x = b[i] - b[j];
      for (let f = 0; f < K; f++) x += pu[f] * (qi[f] - qj[f]);
      const g = (1 / (1 + Math.exp(x))) * (0.5 + 0.5 * peso / pesoMax) * p.tasa;
      b[i] += g - p.tasa * p.regularizacion * b[i];
      b[j] += -g - p.tasa * p.regularizacion * b[j];
      for (let f = 0; f < K; f++) {
        const puf = pu[f];
        pu[f] += g * (qi[f] - qj[f]) - p.tasa * p.regularizacion * puf;
        qi[f] += g * puf - p.tasa * p.regularizacion * qi[f];
        qj[f] += -g * puf - p.tasa * p.regularizacion * qj[f];
      }
    }
  }
  return { U, V, b, indice, items };
}

function puntuarBPR(m, idUsuario) {
  const pu = m.U.get(idUsuario);
  if (!pu) return m.items.map(() => 0);
  return m.items.map((id, i) => {
    let s = m.b[i];
    for (let f = 0; f < pu.length; f++) s += pu[f] * m.V[i][f];
    return s;
  });
}

// ---------------------------------------------------------------- señales de contenido y popularidad
// Afinidad con nivel glucémico y categoría: log P(nivel | paciente) + log P(categoría | paciente),
// estimadas con el historial del paciente y suavizado de Laplace.
function puntuarContenido(lista, items, info) {
  const cuenta = (campo) => {
    const c = new Map();
    let total = 0;
    for (const x of lista) {
      const v = info.get(x.item)?.[campo];
      c.set(v, (c.get(v) || 0) + x.peso);
      total += x.peso;
    }
    const valores = new Set(items.map((id) => info.get(id)?.[campo]));
    return (v) => Math.log(((c.get(v) || 0) + 1) / (total + valores.size));
  };
  const pNivel = cuenta("nivel");
  const pCategoria = cuenta("categoria");
  return items.map((id) => pNivel(info.get(id)?.nivel) + pCategoria(info.get(id)?.categoria));
}

function popularidadDe(interacciones) {
  const pop = new Map();
  for (const lista of interacciones.values()) for (const x of lista) pop.set(x.item, (pop.get(x.item) || 0) + x.peso);
  return pop;
}

const normalizar = (arr) => {
  const media = arr.reduce((s, x) => s + x, 0) / arr.length;
  const de = Math.sqrt(arr.reduce((s, x) => s + (x - media) ** 2, 0) / arr.length) || 1;
  return arr.map((x) => (x - media) / de);
};

// Las tres señales de un paciente, normalizadas sobre todos los platillos
function componentes(m, u, lista, items, info, pop) {
  return {
    colaborativo: normalizar(puntuarBPR(m, u)),
    contenido: normalizar(puntuarContenido(lista, items, info)),
    popularidad: normalizar(items.map((id) => Math.log1p(pop.get(id) || 0))),
  };
}

const combinar = (c, w) => c.colaborativo.map((_, i) =>
  w.colaborativo * c.colaborativo[i] + w.contenido * c.contenido[i] + w.popularidad * c.popularidad[i]);

// ---------------------------------------------------------------- validación
// "Leave-last-out": a cada paciente con historial suficiente se le ocultan sus últimos platillos
// consumidos (p.ocultos), se entrena sin ellos y se mide si cada uno aparece entre las k primeras
// sugerencias (HitRate@k) y en qué posición (NDCG@k). El modelo se entrena con varias semillas y se
// promedia. Se reportan el híbrido y cada señal por separado; la señal de popularidad sola es la línea base.
export async function evaluar(interacciones, items, info, p = PARAMETROS, semillas = [7, 11, 13], listaPesos = [p.pesos]) {
  const entrenamiento = new Map();
  const ocultos = new Map();
  for (const [u, lista] of interacciones) {
    const consumidos = lista.filter((x) => x.ultima > 0).sort((a, b) => b.ultima - a.ultima);
    if (lista.length < p.minimoInteracciones + p.ocultos || consumidos.length < p.ocultos) {
      entrenamiento.set(u, lista);
      continue;
    }
    const retirar = new Set(consumidos.slice(0, p.ocultos).map((x) => x.item));
    ocultos.set(u, [...retirar]);
    entrenamiento.set(u, lista.filter((x) => !retirar.has(x.item)));
  }
  const pop = popularidadDe(entrenamiento);
  const indice = new Map(items.map((id, i) => [id, i]));
  const medir = (puntos, u, oculto) => {
    const conocidos = new Set(entrenamiento.get(u).map((x) => x.item));
    const ranking = items.filter((id) => !conocidos.has(id)).sort((a, b) => puntos[indice.get(b)] - puntos[indice.get(a)]);
    const pos = ranking.indexOf(oculto);
    return pos >= 0 && pos < p.k ? [1, 1 / Math.log2(pos + 2)] : [0, 0];
  };
  const unicos = [
    { colaborativo: 1, contenido: 0, popularidad: 0 },
    { colaborativo: 0, contenido: 1, popularidad: 0 },
    { colaborativo: 0, contenido: 0, popularidad: 1 },
    ...listaPesos,
  ];
  const suma = unicos.map(() => [0, 0]);
  let casos = 0;
  for (const semilla of semillas) {
    const m = await entrenarBPR(entrenamiento, items, p, semilla);
    for (const [u, lista] of ocultos) {
      const c = componentes(m, u, entrenamiento.get(u), items, info, pop);
      unicos.forEach((w, k) => {
        const puntos = combinar(c, w);
        for (const o of lista) { const [h, n] = medir(puntos, u, o); suma[k][0] += h; suma[k][1] += n; }
      });
      if (semilla === semillas[0]) casos += lista.length;
    }
  }
  const total = casos * semillas.length || 1;
  const r = ([h, n]) => ({ hitRate: Math.round((h / total) * 1000) / 1000, ndcg: Math.round((n / total) * 1000) / 1000 });
  return {
    pacientesEvaluados: ocultos.size,
    casosEvaluados: casos,
    repeticiones: semillas.length,
    modelo: r(suma[3]),
    colaborativo: r(suma[0]),
    contenido: r(suma[1]),
    popularidad: r(suma[2]),
    combinaciones: listaPesos.map((w, k) => ({ pesos: w, ...r(suma[3 + k]) })),
  };
}

// ---------------------------------------------------------------- entrenamiento y uso
export async function entrenar() {
  if (entrenando) return entrenando;
  entrenando = (async () => {
    const inicio = Date.now();
    const { platillos, interacciones, populares } = await cargarDatos();
    const items = platillos.map((x) => x.id_platillo);
    const info = new Map(platillos.map((x) => [x.id_platillo, x]));
    const metricas = await evaluar(interacciones, items, info);
    delete metricas.combinaciones;
    const m = await entrenarBPR(interacciones, items);
    modelo = {
      ...m,
      platillos: info,
      interacciones,
      popularidadInteracciones: popularidadDe(interacciones),
      popularidad: populares,
      entrenadoEn: new Date().toISOString(),
      segundos: Math.round((Date.now() - inicio) / 100) / 10,
      resumen: {
        pacientes: interacciones.size,
        platillos: items.length,
        interacciones: [...interacciones.values()].reduce((s, l) => s + l.length, 0),
      },
      metricas,
    };
    return estado();
  })();
  try {
    return await entrenando;
  } finally {
    entrenando = null;
  }
}

export function estado() {
  if (!modelo) return { entrenado: false };
  return {
    entrenado: true,
    algoritmo: "Híbrido: filtrado colaborativo (factorización de matrices con BPR), afinidad de contenido y popularidad, con filtro de reglas clínicas",
    entrenadoEn: modelo.entrenadoEn,
    segundos: modelo.segundos,
    parametros: PARAMETROS,
    ...modelo.resumen,
    metricas: modelo.metricas,
  };
}

const coseno = (a, b) => {
  let d = 0, na = 0, nb = 0;
  for (let f = 0; f < a.length; f++) { d += a[f] * b[f]; na += a[f] * a[f]; nb += b[f] * b[f]; }
  return d / (Math.sqrt(na * nb) || 1);
};

// Sugerencias para un paciente: solo platillos de índice glucémico bajo (o también medio si el profesional lo
// autorizó), sin los que consumió en los últimos días; con IMC de 25 o más se priorizan los de menos calorías.
// Cada sugerencia se explica con el platillo más parecido de su historial.
export async function recomendar(idUsuario, limite = 6) {
  if (!modelo) await entrenar();
  else if (Date.now() - new Date(modelo.entrenadoEn).getTime() > 15 * 60 * 1000) entrenar().catch(() => {});

  const recientes = new Set((await pool.query(
    "SELECT DISTINCT id_platillo FROM historial_consumo WHERE id_usuario = $1 AND fecha_consumo > CURRENT_DATE - 3",
    [idUsuario])).rows.map((r) => r.id_platillo));
  const pac = (await pool.query("SELECT peso, estatura, permite_ig_medio FROM usuarios WHERE id_usuario = $1", [idUsuario])).rows[0] || {};
  const imc = pac.peso && pac.estatura ? Math.round((pac.peso / (pac.estatura / 100) ** 2) * 10) / 10 : null;
  const niveles = pac.permite_ig_medio ? ["bajo", "medio"] : ["bajo"];
  const permitido = (id) => niveles.includes(modelo.platillos.get(id)?.nivel) && !recientes.has(id);
  // Energía de cada platillo normalizada de 0 a 1 entre los candidatos
  const cal = modelo.items.map((id) => modelo.platillos.get(id)?.calorias || 0);
  const calMin = Math.min(...cal), calMax = Math.max(...cal);
  const calNorm = cal.map((v) => (calMax > calMin ? (v - calMin) / (calMax - calMin) : 0));
  const priorizarCalorias = imc != null && imc >= PARAMETROS.imcSobrepeso;
  const ajusteImc = (i) => (priorizarCalorias ? -PARAMETROS.pesoCalorias * calNorm[i] : 0)
    - (modelo.platillos.get(modelo.items[i])?.nivel === "medio" ? PARAMETROS.penalizacionIgMedio : 0);
  const imcTexto = String(imc).replace(".", ",");
  const medianaCal = [...cal].sort((a, b) => a - b)[Math.floor(cal.length / 2)] || 0;
  const motivoImc = (i) => (priorizarCalorias && cal[i] <= medianaCal
    ? `aporta pocas calorías (${Math.round(cal[i])} kcal la receta), algo que se prioriza con tu IMC de ${imcTexto}` : null);
  const reglas = {
    niveles, imc, prioriza_menos_calorias: priorizarCalorias,
    descripcion: [
      pac.permite_ig_medio ? "Índice glucémico bajo y, en segundo lugar, medio (autorizado por tu profesional)" : "Solo platillos de índice glucémico bajo",
      priorizarCalorias ? `IMC de ${imcTexto}: se priorizan los platillos con menos calorías` : null,
    ].filter(Boolean),
  };
  const propias = modelo.interacciones.get(idUsuario) || [];

  if (propias.length < PARAMETROS.minimoInteracciones || !modelo.U.has(idUsuario)) {
    const popMax = Math.max(1, ...modelo.items.map((id) => modelo.popularidad.get(id) || 0));
    const ids = modelo.items.map((id, i) => ({ id, i, s: (modelo.popularidad.get(id) || 0) / popMax + ajusteImc(i) }))
      .filter((x) => permitido(x.id))
      .sort((a, b) => b.s - a.s)
      .slice(0, limite);
    return {
      modo: "inicio_en_frio",
      mensaje: `Registra al menos ${PARAMETROS.minimoInteracciones} platillos distintos para recibir sugerencias personalizadas; mientras tanto se muestran los más elegidos por otros pacientes.`,
      recomendaciones: ids.map((x) => {
        const texto = ["Elegido con frecuencia por otros pacientes", motivoImc(x.i)].filter(Boolean).join("; ");
        return { id: String(x.id), explicacion: texto };
      }),
      reglas,
      modelo: estado(),
    };
  }

  const c = componentes(modelo, idUsuario, propias, modelo.items, modelo.platillos, modelo.popularidadInteracciones);
  const s = combinar(c, PARAMETROS.pesos).map((v, i) => v + ajusteImc(i));
  const propiosIdx = propias.map((x) => ({ ...x, i: modelo.indice.get(x.item) }));
  const ids = modelo.items.map((id, i) => ({ id, s: s[i], i }))
    .filter((x) => permitido(x.id))
    .sort((a, b) => b.s - a.s)
    .slice(0, limite);
  return {
    modo: "ml",
    reglas,
    recomendaciones: ids.map((x) => {
      const plat = modelo.platillos.get(x.id);
      const parecido = propiosIdx
        .filter((p) => p.item !== x.id)
        .map((p) => ({ nombre: modelo.platillos.get(p.item)?.nombre_platillo, sim: coseno(modelo.V[x.i], modelo.V[p.i]) }))
        .sort((a, b) => b.sim - a.sim)[0];
      const partes = [];
      if (parecido) partes.push(`Se relaciona con «${parecido.nombre}», que ya consumiste`);
      if (c.contenido[x.i] > 0.5) partes.push(`coincide con los platillos de ${String(plat?.categoria || "").toLowerCase()} de nivel glucémico ${plat?.nivel} que sueles elegir`);
      if (motivoImc(x.i)) partes.push(motivoImc(x.i));
      partes.push("pacientes con hábitos parecidos también lo eligen");
      const texto = partes.join("; ");
      return {
        id: String(x.id),
        puntaje: Math.round(x.s * 1000) / 1000,
        explicacion: texto.charAt(0).toUpperCase() + texto.slice(1),
      };
    }),
    modelo: estado(),
  };
}
