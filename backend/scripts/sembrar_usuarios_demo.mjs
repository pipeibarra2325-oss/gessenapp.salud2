// Crea 20 pacientes de demostración con 30 días de consumos, calificaciones y favoritos.
// Los datos son sintéticos: correos @demo.gessenapp.co e is_synthetic = true en los registros.
// Se puede ejecutar varias veces: primero borra los usuarios demo anteriores (con sus datos en cascada).
//
// Uso (desde la carpeta backend):
//   DB_NAME=BD_gessenapp_test node scripts/sembrar_usuarios_demo.mjs
//   node scripts/sembrar_usuarios_demo.mjs --si        (base configurada en .env; pide --si por seguridad)
//
// Contraseña de todas las cuentas demo: la constante CLAVE_DEMO de este archivo.
import "../src/config/env.js";
import pkg from "pg";
import { hashPassword } from "../src/utils/password.js";

const CLAVE_DEMO = "PacienteDemo2026!";
const DOMINIO = "demo.gessenapp.co";
const DIAS = 30;

const { Pool } = pkg;
const nombreBD = process.env.DB_NAME;
if (!/test/i.test(nombreBD || "") && !process.argv.includes("--si")) {
  console.error(`La base "${nombreBD}" no es de prueba. Si quieres sembrar los datos demo en ella, agrega --si.`);
  process.exit(1);
}
const db = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: nombreBD,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5433,
});

// Generador pseudoaleatorio con semilla fija: cada ejecución produce los mismos datos
let semilla = 2026;
const azar = () => {
  semilla |= 0; semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const entre = (a, b) => a + Math.floor(azar() * (b - a + 1));
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
const quitarTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Perfil de alimentación: probabilidad de elegir un platillo de índice glucémico bajo, medio o alto
const PERFILES = {
  adherente: { bajo: 0.75, medio: 0.2, alto: 0.05, constancia: 0.9 },
  mixto: { bajo: 0.45, medio: 0.35, alto: 0.2, constancia: 0.75 },
  riesgo: { bajo: 0.2, medio: 0.3, alto: 0.5, constancia: 0.6 },
};

// [nombre, apellido, género, año de nacimiento, estatura cm, peso kg, departamento, región elegida o null, perfil]
const PACIENTES = [
  ["María Elena", "Rosero", "Femenino", 1962, 156, 71, "Nariño", "Andina", "adherente"],
  ["José Luis", "Benavides", "Masculino", 1958, 168, 84, "Nariño", "Andina", "mixto"],
  ["Carmen", "Guerrero", "Femenino", 1966, 152, 78, "Nariño", "Andina", "riesgo"],
  ["Luis Alberto", "Delgado", "Masculino", 1955, 170, 76, "Nariño", "Andina", "adherente"],
  ["Rosa Amelia", "Mora", "Femenino", 1970, 158, 82, "Nariño", "Pacífica", "mixto"],
  ["Jorge Enrique", "Ortiz", "Masculino", 1963, 172, 95, "Nariño", "Andina", "riesgo"],
  ["Blanca Nubia", "Erazo", "Femenino", 1959, 150, 64, "Nariño", "Andina", "adherente"],
  ["Hernán", "Cabrera", "Masculino", 1968, 166, 88, "Nariño", "Pacífica", "mixto"],
  ["Gloria Esperanza", "Muñoz", "Femenino", 1961, 155, 69, "Nariño", "Andina", "adherente"],
  ["Álvaro", "Insuasty", "Masculino", 1957, 169, 81, "Nariño", "Andina", "mixto"],
  ["Martha Lucía", "Burbano", "Femenino", 1972, 160, 90, "Nariño", "Andina", "riesgo"],
  ["Segundo", "Chamorro", "Masculino", 1960, 164, 73, "Nariño", "Andina", "adherente"],
  ["Luz Dary", "Jurado", "Femenino", 1967, 154, 75, "Nariño", "Andina", "mixto"],
  ["Édgar", "Villota", "Masculino", 1964, 175, 99, "Nariño", "Pacífica", "riesgo"],
  ["Aura María", "Paz", "Femenino", 1956, 151, 62, "Nariño", "Andina", "adherente"],
  ["Fabio", "Narváez", "Masculino", 1969, 171, 86, "Cauca", null, "mixto"],
  ["Nelly", "Santacruz", "Femenino", 1965, 157, 80, "Putumayo", null, "mixto"],
  ["Ricardo", "Portilla", "Masculino", 1961, 167, 79, "Nariño", "Andina", "adherente"],
  ["Stella", "Obando", "Femenino", 1971, 159, 87, "Valle del Cauca", null, "riesgo"],
  ["Germán", "Enríquez", "Masculino", 1954, 165, 70, "Nariño", "Andina", "adherente"],
];

const MOMENTOS = [
  // [momento, categorías del platillo, probabilidad, rango de horas]
  ["Desayuno", ["Desayuno"], 0.88, [6, 8]],
  ["Almuerzo", ["Almuerzo"], 0.95, [12, 13]],
  ["Merienda", ["Merienda", "Snack", "Postre"], 0.35, [15, 16]],
  ["Snack", ["Snack", "Postre", "Merienda"], 0.2, [10, 10]],
  ["Cena", ["Cena"], 0.85, [18, 20]],
];
const COMENTARIOS = ["Muy rico", "Fácil de preparar", "Me dejó satisfecho", "Un poco pesado", "Lo repetiría", "Le faltó sal", null, null, null];

const cliente = await db.connect();
try {
  await cliente.query("BEGIN");

  const borrados = await cliente.query("DELETE FROM usuarios WHERE email LIKE $1", [`%@${DOMINIO}`]);

  const deps = (await cliente.query("SELECT id_departamento, nombre_departamento FROM departamentos")).rows;
  const regiones = (await cliente.query("SELECT id_region, nombre_region FROM regiones")).rows;
  const idDep = (n) => deps.find((d) => quitarTildes(d.nombre_departamento) === quitarTildes(n))?.id_departamento;
  const idReg = (n) => regiones.find((r) => r.nombre_region === n)?.id_region;
  const enf = (await cliente.query("SELECT id_enfermedad, nombre_enfermedad AS nombre FROM enfermedades")).rows;
  const idDiabetes = enf.find((e) => /diabetes/i.test(e.nombre))?.id_enfermedad;
  const idObesidad = enf.find((e) => /obesidad/i.test(e.nombre))?.id_enfermedad;

  const platillos = (await cliente.query(`
    SELECT p.id_platillo, LOWER(p.nivel_glucemico) AS nivel, c.nombre AS categoria, COALESCE(p.porcion_gramos, 300)::float AS gramos
    FROM platillos p JOIN categorias_platillo c ON c.id_categoria = p.id_categoria
    WHERE p.is_synthetic`)).rows;

  const hash = hashPassword(CLAVE_DEMO);
  let totalConsumos = 0;

  for (const [nombre, apellido, genero, anio, estatura, peso, dep, region, perfilNombre] of PACIENTES) {
    const perfil = PERFILES[perfilNombre];
    const email = `${quitarTildes(nombre).split(" ")[0]}.${quitarTildes(apellido)}@${DOMINIO}`;
    const registroHace = entre(35, 120);
    const { rows: [u] } = await cliente.query(`
      INSERT INTO usuarios (nombre, apellido, email, password, genero, telefono, fecha_nacimiento, estatura, peso,
                            id_departamento, id_region, id_rol, fecha_registro)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 2, NOW() - make_interval(days => $12))
      RETURNING id_usuario`,
      [nombre, apellido, email, hash, genero, `31${entre(10000000, 99999999)}`, `${anio}-${String(entre(1, 12)).padStart(2, "0")}-${String(entre(1, 28)).padStart(2, "0")}`,
       estatura, peso, idDep(dep) ?? null, region ? idReg(region) : null, registroHace]);

    if (idDiabetes) await cliente.query("INSERT INTO usuarios_enfermedades (id_usuario, id_enfermedad) VALUES ($1, $2)", [u.id_usuario, idDiabetes]);
    if (idObesidad && peso / (estatura / 100) ** 2 >= 30) {
      await cliente.query("INSERT INTO usuarios_enfermedades (id_usuario, id_enfermedad) VALUES ($1, $2)", [u.id_usuario, idObesidad]);
    }

    const conteo = new Map();
    for (let dia = DIAS - 1; dia >= 0; dia--) {
      if (azar() > perfil.constancia) continue; // día sin registro
      for (const [momento, categorias, prob, [h1, h2]] of MOMENTOS) {
        if (azar() > (momento === "Desayuno" && perfilNombre === "riesgo" ? 0.6 : prob)) continue;
        const r = azar();
        const nivel = r < perfil.bajo ? "bajo" : r < perfil.bajo + perfil.medio ? "medio" : "alto";
        let opciones = platillos.filter((p) => categorias.includes(p.categoria) && p.nivel === nivel);
        if (opciones.length === 0) opciones = platillos.filter((p) => categorias.includes(p.categoria));
        const plat = elegir(opciones);
        const porcion = elegir([1, 1, 1, 1, 0.5, 1.5]);
        const calificar = azar() < 0.4;
        const rating = calificar ? entre(perfilNombre === "riesgo" && plat.nivel === "alto" ? 4 : 3, 5) : null;
        const comentario = calificar ? elegir(COMENTARIOS) : null;
        const hora = `${String(entre(h1, h2)).padStart(2, "0")}:${String(entre(0, 59)).padStart(2, "0")}`;

        await cliente.query(`
          INSERT INTO historial_consumo (id_usuario, id_platillo, fecha_consumo, porcion_consumida, meal_time,
                                         rating_usuario, fecha_registro, is_synthetic, porcion_gramos, comentario)
          VALUES ($1, $2, CURRENT_DATE - $3::int, $4, $5, $6, (CURRENT_DATE - $3::int) + $7::time, true, $8, $9)`,
          [u.id_usuario, plat.id_platillo, dia, porcion, momento, rating, hora, Math.round(plat.gramos * porcion), comentario]);
        totalConsumos++;
        if (rating) {
          await cliente.query(`
            INSERT INTO platillo_calificaciones (id_usuario, id_platillo, rating, comentario, fecha_calificacion, is_synthetic)
            VALUES ($1, $2, $3, $4, (CURRENT_DATE - $5::int) + $6::time, true)
            ON CONFLICT (id_usuario, id_platillo) DO UPDATE
              SET rating = EXCLUDED.rating, comentario = EXCLUDED.comentario, fecha_calificacion = EXCLUDED.fecha_calificacion`,
            [u.id_usuario, plat.id_platillo, rating, comentario, dia, hora]);
        }
        conteo.set(plat.id_platillo, (conteo.get(plat.id_platillo) || 0) + 1);
      }
    }

    // Favoritos: los platillos que más consumió
    const favoritos = [...conteo.entries()].sort((a, b) => b[1] - a[1]).slice(0, entre(3, 6));
    for (const [idPlat] of favoritos) {
      await cliente.query("INSERT INTO usuarios_favoritos (id_usuario, id_platillo, is_synthetic) VALUES ($1, $2, true)", [u.id_usuario, idPlat]);
    }
    console.log(`${nombre} ${apellido} (${perfilNombre}): ${[...conteo.values()].reduce((a, b) => a + b, 0)} consumos`);
  }

  await cliente.query("COMMIT");
  // Solo queda una calificación por paciente y platillo (la más reciente)
  const { rows: [c] } = await cliente.query(
    "SELECT COUNT(*)::int AS n FROM platillo_calificaciones pc JOIN usuarios u USING (id_usuario) WHERE u.email LIKE $1", [`%@${DOMINIO}`]);
  console.log(`\nBase: ${nombreBD}. Usuarios demo anteriores borrados: ${borrados.rowCount}.`);
  console.log(`Creados ${PACIENTES.length} pacientes, ${totalConsumos} consumos y ${c.n} calificaciones (una por paciente y platillo).`);
} catch (error) {
  await cliente.query("ROLLBACK");
  console.error("Error al sembrar los datos demo:", error);
  process.exitCode = 1;
} finally {
  cliente.release();
  await db.end();
}
