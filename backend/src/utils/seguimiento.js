// Seguimiento clínico: indicadores de laboratorio, peso, fuerza muscular y alertas ante desviaciones metabólicas.
// Los umbrales son metas generales de referencia (ADA Standards of Care 2025, EWGSOP2, KDIGO) y orientan
// al profesional; no reemplazan su valoración individual.
import pool from "../config/database.js";
import { fechaValida } from "./validacion.js";

// Campo -> etiqueta, unidad y rango aceptado al registrar
export const CAMPOS = {
  glucemia_ayunas: { etiqueta: "Glucemia en ayunas", unidad: "mg/dL", min: 20, max: 800 },
  glucemia_postprandial: { etiqueta: "Glucemia posprandial", unidad: "mg/dL", min: 20, max: 800 },
  hba1c: { etiqueta: "HbA1c", unidad: "%", min: 3, max: 20 },
  colesterol_total: { etiqueta: "Colesterol total", unidad: "mg/dL", min: 50, max: 600 },
  ldl: { etiqueta: "Colesterol LDL", unidad: "mg/dL", min: 10, max: 400 },
  hdl: { etiqueta: "Colesterol HDL", unidad: "mg/dL", min: 5, max: 200 },
  trigliceridos: { etiqueta: "Triglicéridos", unidad: "mg/dL", min: 20, max: 3000 },
  creatinina: { etiqueta: "Creatinina", unidad: "mg/dL", min: 0.1, max: 20 },
  circunferencia_pantorrilla: { etiqueta: "Circunferencia de pantorrilla", unidad: "cm", min: 15, max: 70 },
  fuerza_prension: { etiqueta: "Fuerza de prensión", unidad: "kg", min: 0, max: 100 },
  sarc_f: { etiqueta: "Cuestionario SARC-F", unidad: "puntos", min: 0, max: 10, entero: true },
};

// Valida un registro. Devuelve { error } o { datos } con los valores numéricos normalizados.
export function validarRegistro(body = {}) {
  const datos = {};
  for (const [campo, c] of Object.entries(CAMPOS)) {
    const v = body[campo];
    if (v == null || v === "") continue;
    const n = Number(v);
    if (typeof v === "boolean" || !Number.isFinite(n) || n < c.min || n > c.max) {
      return { error: `${c.etiqueta} debe estar entre ${c.min} y ${c.max} ${c.unidad}` };
    }
    if (c.entero && !Number.isInteger(n)) return { error: `${c.etiqueta} debe ser un número entero` };
    datos[campo] = n;
  }
  let peso = null;
  if (body.peso != null && body.peso !== "") {
    peso = Number(body.peso);
    if (typeof body.peso === "boolean" || !Number.isFinite(peso) || peso < 20 || peso > 300) return { error: "El peso debe estar entre 20 y 300 kg" };
  }
  if (Object.keys(datos).length === 0 && peso == null) {
    return { error: "Registra al menos un valor (peso, glucemia, HbA1c, perfil lipídico, creatinina o fuerza muscular)" };
  }
  const hoy = new Date().toLocaleDateString("en-CA");
  const fecha = body.fecha || hoy;
  if (!fechaValida(fecha) || fecha > hoy || fecha < "2000-01-01") return { error: "La fecha debe ser válida y no posterior a hoy" };
  if (body.notas != null && (typeof body.notas !== "string" || body.notas.length > 500)) return { error: "Las notas admiten hasta 500 caracteres" };
  return { datos, peso, fecha, notas: body.notas?.trim() || null };
}

const edadDe = (fecha) => {
  if (!fecha) return null;
  const n = new Date(fecha), h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--;
  return e;
};
const sexoDe = (genero) => (/^fem/i.test(genero || "") ? "F" : /^masc/i.test(genero || "") ? "M" : null);

// Tasa de filtración glomerular estimada (CKD-EPI 2021, sin coeficiente de raza)
export function tfgEstimada(creatinina, edad, sexo) {
  if (creatinina == null || edad == null || !sexo) return null;
  const k = sexo === "F" ? 0.7 : 0.9;
  const a = sexo === "F" ? -0.241 : -0.302;
  const r = creatinina / k;
  const tfg = 142 * Math.min(r, 1) ** a * Math.max(r, 1) ** -1.2 * 0.9938 ** edad * (sexo === "F" ? 1.012 : 1);
  return Math.round(tfg);
}

// Alertas ante desviaciones metabólicas y de fuerza muscular, a partir del último valor de cada indicador
export function evaluarAlertas(ultimos, { edad, sexo, imc }) {
  const a = [];
  const add = (nivel, indicador, mensaje) => a.push({ nivel, indicador, mensaje });
  const g = ultimos.glucemia_ayunas;
  if (g != null) {
    if (g < 70) add("alta", "Glucemia en ayunas", `Glucemia en ayunas de ${g} mg/dL: hipoglucemia (menor de 70 mg/dL). Requiere atención.`);
    else if (g >= 250) add("alta", "Glucemia en ayunas", `Glucemia en ayunas de ${g} mg/dL: hiperglucemia marcada (250 mg/dL o más).`);
    else if (g > 130) add("media", "Glucemia en ayunas", `Glucemia en ayunas de ${g} mg/dL, por encima de la meta de 80-130 mg/dL.`);
  }
  const gp = ultimos.glucemia_postprandial;
  if (gp != null) {
    if (gp < 70) add("alta", "Glucemia posprandial", `Glucemia posprandial de ${gp} mg/dL: hipoglucemia.`);
    else if (gp > 180) add("media", "Glucemia posprandial", `Glucemia posprandial de ${gp} mg/dL, por encima de la meta de menos de 180 mg/dL.`);
  }
  const h = ultimos.hba1c;
  if (h != null) {
    if (h >= 9) add("alta", "HbA1c", `HbA1c de ${h} %: control glucémico muy por encima de la meta (menos de 7 %).`);
    else if (h >= 7) add("media", "HbA1c", `HbA1c de ${h} %, por encima de la meta general de menos de 7 %.`);
  }
  if (ultimos.ldl != null && ultimos.ldl >= 100) add("media", "Colesterol LDL", `LDL de ${ultimos.ldl} mg/dL, por encima de la meta de menos de 100 mg/dL (menos de 70 si hay alto riesgo cardiovascular).`);
  if (ultimos.hdl != null) {
    const min = sexo === "F" ? 50 : 40;
    if (ultimos.hdl < min) add("media", "Colesterol HDL", `HDL de ${ultimos.hdl} mg/dL, por debajo de ${min} mg/dL.`);
  }
  if (ultimos.trigliceridos != null) {
    if (ultimos.trigliceridos >= 500) add("alta", "Triglicéridos", `Triglicéridos de ${ultimos.trigliceridos} mg/dL (500 o más): riesgo de pancreatitis.`);
    else if (ultimos.trigliceridos >= 150) add("media", "Triglicéridos", `Triglicéridos de ${ultimos.trigliceridos} mg/dL, por encima de 150 mg/dL.`);
  }
  if (ultimos.colesterol_total != null && ultimos.colesterol_total >= 200) add("media", "Colesterol total", `Colesterol total de ${ultimos.colesterol_total} mg/dL, por encima de 200 mg/dL.`);
  const tfg = tfgEstimada(ultimos.creatinina, edad, sexo);
  if (tfg != null && tfg < 60) add(tfg < 30 ? "alta" : "media", "Función renal", `Tasa de filtración estimada de ${tfg} mL/min/1,73 m² (menos de 60): posible enfermedad renal; revisar la ingesta proteica con el profesional.`);
  if (ultimos.sarc_f != null && ultimos.sarc_f >= 4) add("media", "Sarcopenia", `SARC-F de ${ultimos.sarc_f} puntos (4 o más): riesgo de sarcopenia; se sugiere evaluar fuerza y masa muscular.`);
  if (ultimos.fuerza_prension != null && sexo) {
    const min = sexo === "F" ? 16 : 27;
    if (ultimos.fuerza_prension < min) add("media", "Fuerza de prensión", `Fuerza de prensión de ${ultimos.fuerza_prension} kg, por debajo de ${min} kg: fuerza muscular baja.`);
  }
  if (ultimos.circunferencia_pantorrilla != null && ultimos.circunferencia_pantorrilla < 31) add("media", "Circunferencia de pantorrilla", `Circunferencia de pantorrilla de ${ultimos.circunferencia_pantorrilla} cm (menos de 31 cm): posible masa muscular baja.`);
  if (imc != null) {
    if (imc >= 30) add("media", "IMC", `IMC de ${imc} kg/m²: obesidad.`);
    else if (imc < 18.5) add("media", "IMC", `IMC de ${imc} kg/m²: bajo peso.`);
  }
  return a;
}

const num = (v) => (v == null ? null : Number(v));
const imcDe = (peso, estatura) => (peso && estatura ? Math.round((peso / (estatura / 100) ** 2) * 10) / 10 : null);

// Seguimiento completo de un usuario: datos base, curva de peso, registros con alertas y alertas actuales
export async function construirSeguimiento(idUsuario) {
  const u = (await pool.query(
    "SELECT id_usuario, genero, fecha_nacimiento, estatura, peso, permite_ig_medio FROM usuarios WHERE id_usuario = $1",
    [idUsuario])).rows[0];
  if (!u) return null;
  const edad = edadDe(u.fecha_nacimiento);
  const sexo = sexoDe(u.genero);
  const estatura = num(u.estatura);
  const peso = (await pool.query(
    "SELECT fecha, peso, estatura FROM mediciones_peso WHERE id_usuario = $1 ORDER BY fecha, id_medicion", [idUsuario])).rows
    .map((m) => ({ fecha: new Date(m.fecha).toLocaleDateString("en-CA"), peso: num(m.peso), imc: imcDe(num(m.peso), num(m.estatura) || estatura) }))
    // Una medición por día en la curva: la última registrada ese día
    .filter((m, i, l) => l[i + 1]?.fecha !== m.fecha);
  const filas = (await pool.query(`
    SELECT s.*, r.nombre AS reg_nombre, r.apellido AS reg_apellido, r.id_rol AS reg_rol
    FROM seguimiento_clinico s LEFT JOIN usuarios r ON r.id_usuario = s.registrado_por
    WHERE s.id_usuario = $1 ORDER BY s.fecha DESC, s.id_seguimiento DESC`, [idUsuario])).rows;
  const imcActual = imcDe(num(u.peso), estatura);
  const registros = filas.map((f) => {
    const valores = Object.fromEntries(Object.keys(CAMPOS).map((c) => [c, num(f[c])]));
    return {
      id_seguimiento: f.id_seguimiento,
      fecha: new Date(f.fecha).toLocaleDateString("en-CA"),
      ...valores,
      tfg: tfgEstimada(valores.creatinina, edad, sexo),
      notas: f.notas,
      registrado_por: f.reg_nombre ? `${f.reg_nombre} ${f.reg_apellido}${f.reg_rol === 1 ? " (profesional)" : ""}` : null,
      alertas: evaluarAlertas(valores, { edad, sexo, imc: null }),
    };
  });
  // Último valor registrado de cada indicador (los registros vienen del más reciente al más antiguo)
  const ultimos = {};
  const fechaUltimo = {};
  for (const r of registros) for (const c of Object.keys(CAMPOS)) {
    if (ultimos[c] == null && r[c] != null) { ultimos[c] = r[c]; fechaUltimo[c] = r.fecha; }
  }
  return {
    paciente: { edad, sexo, estatura, peso: num(u.peso), imc: imcActual, permite_ig_medio: u.permite_ig_medio },
    campos: CAMPOS,
    peso,
    registros,
    ultimos,
    fechaUltimo,
    tfg: tfgEstimada(ultimos.creatinina, edad, sexo),
    alertas: evaluarAlertas(ultimos, { edad, sexo, imc: imcActual }),
  };
}

// Guarda un registro clínico (y, si trae peso, una medición de peso que actualiza el perfil)
export async function guardarSeguimiento(idUsuario, registradoPor, { datos, peso, fecha, notas }) {
  const cliente = await pool.connect();
  let id = null;
  try {
    await cliente.query("BEGIN");
    if (Object.keys(datos).length > 0 || notas) {
      const campos = Object.keys(datos);
      const r = await cliente.query(
        `INSERT INTO seguimiento_clinico (id_usuario, fecha, ${campos.map((c) => c).join(", ")}${campos.length ? ", " : ""}notas, registrado_por)
         VALUES ($1, $2, ${campos.map((_, i) => `$${i + 3}`).join(", ")}${campos.length ? ", " : ""}$${campos.length + 3}, $${campos.length + 4})
         RETURNING id_seguimiento`,
        [idUsuario, fecha, ...campos.map((c) => datos[c]), notas, registradoPor]);
      id = r.rows[0].id_seguimiento;
    }
    if (peso != null) {
      const est = (await cliente.query("SELECT estatura FROM usuarios WHERE id_usuario = $1", [idUsuario])).rows[0]?.estatura;
      await cliente.query("INSERT INTO mediciones_peso (id_usuario, fecha, peso, estatura, registrado_por) VALUES ($1, $2, $3, $4, $5)",
        [idUsuario, fecha, peso, est, registradoPor]);
      // El peso del perfil es el de la medición más reciente
      await cliente.query(`UPDATE usuarios SET peso = (SELECT peso FROM mediciones_peso WHERE id_usuario = $1 ORDER BY fecha DESC, id_medicion DESC LIMIT 1)
                           WHERE id_usuario = $1`, [idUsuario]);
    }
    await cliente.query("COMMIT");
  } catch (e) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    cliente.release();
  }
  return id;
}

// Registra en el historial un cambio de peso hecho desde el perfil
export async function registrarCambioPeso(idUsuario, registradoPor) {
  await pool.query(`
    INSERT INTO mediciones_peso (id_usuario, fecha, peso, estatura, registrado_por)
    SELECT id_usuario, CURRENT_DATE, peso, estatura, $2 FROM usuarios
    WHERE id_usuario = $1 AND peso BETWEEN 20 AND 300
      AND NOT EXISTS (SELECT 1 FROM mediciones_peso m WHERE m.id_usuario = $1 AND m.fecha = CURRENT_DATE AND m.peso = usuarios.peso)`,
    [idUsuario, registradoPor]);
}

// IMC promedio de los pacientes por mes (con la última medición de cada paciente en ese mes)
export async function evolucionPoblacional() {
  const r = await pool.query(`
    WITH ult AS (
      SELECT DISTINCT ON (m.id_usuario, DATE_TRUNC('month', m.fecha))
             m.id_usuario, DATE_TRUNC('month', m.fecha) AS mes, m.peso, COALESCE(m.estatura, u.estatura) AS estatura
      FROM mediciones_peso m JOIN usuarios u ON u.id_usuario = m.id_usuario
      WHERE u.id_rol = 2
      ORDER BY m.id_usuario, DATE_TRUNC('month', m.fecha), m.fecha DESC, m.id_medicion DESC
    )
    SELECT TO_CHAR(mes, 'MM/YYYY') AS mes,
           ROUND(AVG(peso / POWER(estatura / 100.0, 2))::numeric, 1)::float AS imc_promedio,
           ROUND(AVG(peso)::numeric, 1)::float AS peso_promedio,
           COUNT(*)::int AS pacientes
    FROM ult WHERE estatura > 0
    GROUP BY mes ORDER BY mes`);
  return r.rows;
}
