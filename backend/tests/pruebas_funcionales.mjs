// Pruebas funcionales de caja negra de GessenApp (backend).
// Uso, con el backend corriendo sobre una COPIA de la base de datos:
//   API_URL=http://127.0.0.1:5000/api DB_NAME=BD_gessenapp_test node tests/pruebas_funcionales.mjs
// IMPORTANTE: crea, modifica y elimina registros. No ejecutar sobre la base de datos real.
import "../src/config/env.js";
import pkg from "pg";
import { writeFileSync } from "fs";
import { hashPassword } from "../src/utils/password.js";
import { NUTRIENTES_PLATILLO_SQL } from "../src/utils/nutricion.js";

const API = process.env.API_URL || "http://127.0.0.1:5000/api";
const BASE = API.replace(/\/api$/, "");
const { Pool } = pkg;
const db = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5433,
});
if (!/test/i.test(process.env.DB_NAME || "")) {
  console.error("Por seguridad, DB_NAME debe ser una base de datos de prueba (debe contener 'test').");
  process.exit(1);
}

const resultados = [];
const sufijo = Date.now();

async function api(method, path, { body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const inicio = performance.now();
  const res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const ms = performance.now() - inicio;
  let data = null;
  try { data = await res.json(); } catch { /* sin cuerpo JSON */ }
  return { status: res.status, data, ms };
}

async function caso(id, modulo, descripcion, esperado, fn) {
  let obtenido, ok;
  try {
    [ok, obtenido] = await fn();
  } catch (e) {
    ok = false;
    obtenido = "Error: " + e.message;
  }
  resultados.push({ id, modulo, descripcion, esperado, obtenido, estado: ok ? "Aprobado" : "Fallido" });
}

const contarLogs = async (accion) => (await db.query("SELECT COUNT(*)::int n FROM logs WHERE accion = $1", [accion])).rows[0].n;

const paciente = {
  nombre: "Paciente", apellido: "Prueba", email: `paciente.${sufijo}@correo.com`, password: "Clave2026!",
  genero: "Femenino", fecha_nacimiento: "1974-03-10", estatura: 155, peso: 78, id_departamento: 32,
};
let tokenPaciente, idPaciente, tokenAdmin, idAdmin, platillos = [];

// ---------- Autenticación ----------
await caso("AUT-01", "Autenticación", "Registro de un usuario con datos válidos", "HTTP 201", async () => {
  const r = await api("POST", "/usuarios", { body: paciente });
  idPaciente = r.data?.id_usuario;
  return [r.status === 201 && !!idPaciente && r.data.password === undefined, `HTTP ${r.status}, contraseña en respuesta: ${r.data?.password !== undefined ? "sí" : "no"}`];
});
await caso("AUT-02", "Autenticación", "Registro con correo duplicado", "HTTP 409", async () => {
  const r = await api("POST", "/usuarios", { body: paciente });
  return [r.status === 409, `HTTP ${r.status}`];
});
await caso("AUT-03", "Autenticación", "Registro con datos inválidos (peso de -5 kg)", "HTTP 400", async () => {
  const r = await api("POST", "/usuarios", { body: { ...paciente, email: `x.${sufijo}@correo.com`, peso: -5 } });
  return [r.status === 400, `HTTP ${r.status}: ${r.data?.error}`];
});
await caso("AUT-04", "Autenticación", "La contraseña se almacena cifrada", "Formato scrypt", async () => {
  const { rows } = await db.query("SELECT password FROM usuarios WHERE id_usuario = $1", [idPaciente]);
  return [rows[0]?.password?.startsWith("scrypt$"), rows[0]?.password?.startsWith("scrypt$") ? "Cifrada" : "Texto plano"];
});
await caso("AUT-05", "Autenticación", "Inicio de sesión correcto devuelve token e id del usuario", "HTTP 200 con user.id", async () => {
  const r = await api("POST", "/login", { body: { email: paciente.email, password: paciente.password } });
  tokenPaciente = r.data?.token;
  return [r.status === 200 && r.data?.user?.id === idPaciente, `HTTP ${r.status}, user.id = ${r.data?.user?.id}, región: ${r.data?.user?.region}`];
});
await caso("AUT-06", "Autenticación", "Inicio de sesión con contraseña incorrecta queda en los logs", "HTTP 401 y log LOGIN_FALLIDO", async () => {
  const antes = await contarLogs("LOGIN_FALLIDO");
  const r = await api("POST", "/login", { body: { email: paciente.email, password: "incorrecta" } });
  const despues = await contarLogs("LOGIN_FALLIDO");
  return [r.status === 401 && despues === antes + 1, `HTTP ${r.status}, logs LOGIN_FALLIDO: ${antes} → ${despues}`];
});
await caso("AUT-07", "Seguridad", "Lista de usuarios sin sesión", "HTTP 401", async () => {
  const r = await api("GET", "/usuarios");
  return [r.status === 401, `HTTP ${r.status}`];
});
await caso("AUT-08", "Seguridad", "Paciente intenta entrar al panel de administración", "HTTP 403", async () => {
  const r = await api("GET", "/admin/dashboard", { token: tokenPaciente });
  return [r.status === 403, `HTTP ${r.status}`];
});

// ---------- Catálogo ----------
await caso("PLA-01", "Catálogo", "Consulta del catálogo de platillos (solo se publican las recetas con ingredientes)", "HTTP 200 y todas las recetas con ingredientes", async () => {
  const r = await api("GET", "/platillos");
  platillos = Array.isArray(r.data) ? r.data : [];
  const { rows } = await db.query("SELECT COUNT(*)::int AS n FROM platillos p WHERE EXISTS (SELECT 1 FROM platillos_ingredientes pi WHERE pi.id_platillo = p.id_platillo)");
  return [r.status === 200 && platillos.length === rows[0].n && platillos.length >= 96, `HTTP ${r.status}, ${platillos.length} platillos publicados de ${rows[0].n} con ingredientes`];
});
await caso("PLA-02", "Catálogo", "Los nutrientes no se duplican en platillos con varios sabores o preferencias", "Calorías iguales al cálculo directo en todos los platillos", async () => {
  const { rows } = await db.query(`SELECT id_platillo, calorias FROM (${NUTRIENTES_PLATILLO_SQL}) t`);
  const directo = new Map(rows.map((r) => [r.id_platillo, Number(r.calorias)]));
  const distintos = platillos.filter((p) => Math.abs(parseFloat(p.calories) - (directo.get(p.id) || 0)) > 0.2);
  const multiples = platillos.filter((p) => (p.flavors?.length || 0) * (p.preferences?.length || 0) > 1).length;
  return [distintos.length === 0, `${platillos.length - distintos.length} de ${platillos.length} coinciden (${multiples} con varios sabores/preferencias)`];
});
await caso("PLA-03", "Catálogo", "Los 96 platillos del catálogo base tienen imagen asignada", "96 o más con imagen", async () => {
  const con = platillos.filter((p) => p.image).length;
  return [con >= 96, `${con} de ${platillos.length} con imagen`];
});

await caso("PLA-04", "Catálogo", "Coherencia de las recetas: cada platillo publicado tiene ingredientes y ninguno lleva más de 20 g de aceite", "Todos los publicados coherentes", async () => {
  const { rows } = await db.query(`
    SELECT p.nombre_platillo,
           COUNT(pi.id_ingrediente)::int AS n,
           COALESCE(SUM(pi.cantidad) FILTER (WHERE i.nombre_ingrediente ILIKE 'aceite%'), 0)::float AS aceite
    FROM platillos p
    LEFT JOIN platillos_ingredientes pi ON pi.id_platillo = p.id_platillo
    LEFT JOIN ingredientes i ON i.id_ingrediente = pi.id_ingrediente
    GROUP BY p.nombre_platillo`);
  const publicados = new Set(platillos.map((p) => p.title));
  const malos = rows.filter((r) => publicados.has(r.nombre_platillo) && (r.n === 0 || r.aceite > 20));
  rows.splice(0, rows.length, ...rows.filter((r) => publicados.has(r.nombre_platillo)));
  const pan = platillos.find((p) => p.title === "Pan blanco con mermelada");
  const panOk = pan?.ingredients?.some((i) => i.startsWith("Pan blanco")) && pan?.ingredients?.some((i) => i.startsWith("Mermelada"));
  return [malos.length === 0 && panOk, `${rows.length - malos.length} de ${rows.length} coherentes; Pan blanco con mermelada: ${pan?.ingredients?.join(", ")}`];
});

await caso("PLA-05", "Catálogo", "Carga glucémica calculada con el índice glucémico y los carbohidratos de cada ingrediente", "Igual al cálculo directo (Pan blanco con mermelada)", async () => {
  const pan = platillos.find((p) => p.title === "Pan blanco con mermelada");
  const { rows } = await db.query(`
    SELECT ROUND(SUM(v.cantidad_por_100g * pi.cantidad / 100.0 * COALESCE(v.indice_glucemico, 0) / 100.0))::int AS cg
    FROM platillos_ingredientes pi
    JOIN ingrediente_valores_nutricionales v ON v.id_ingrediente = pi.id_ingrediente
    JOIN nutrientes n ON n.id_nutriente = v.id_nutriente AND n.nombre = 'Carbohidratos'
    WHERE pi.id_platillo = $1`, [Number(pan.id)]);
  return [Number(pan.glycemicLoad) === rows[0].cg && rows[0].cg > 0, `API: ${pan.glycemicLoad}; cálculo directo: ${rows[0].cg}`];
});

// ---------- Favoritos y consumo ----------
const idPlatillo = platillos[0]?.id;
await caso("FAV-01", "Favoritos", "Paciente agrega un favorito", "HTTP 200, isFavorite = true", async () => {
  const r = await api("POST", "/platillos/favorito/toggle", { token: tokenPaciente, body: { platilloId: idPlatillo } });
  return [r.status === 200 && r.data?.isFavorite === true, `HTTP ${r.status}, isFavorite = ${r.data?.isFavorite}`];
});
await caso("FAV-02", "Favoritos", "Paciente consulta sus favoritos", "Lista con el platillo agregado", async () => {
  const r = await api("GET", `/platillos/favoritos/${idPaciente}`, { token: tokenPaciente });
  return [r.status === 200 && r.data?.includes(String(idPlatillo)), `HTTP ${r.status}, ${JSON.stringify(r.data)}`];
});
await caso("FAV-03", "Favoritos", "Consulta de favoritos sin sesión", "HTTP 401", async () => {
  const r = await api("GET", `/platillos/favoritos/${idPaciente}`);
  return [r.status === 401, `HTTP ${r.status}`];
});
await caso("CON-01", "Registro de consumos", "Paciente registra un consumo", "HTTP 201 y log REGISTRAR_CONSUMO", async () => {
  const antes = await contarLogs("REGISTRAR_CONSUMO");
  const r = await api("POST", "/platillos/consumo", { token: tokenPaciente, body: { platilloId: idPlatillo, mealTime: "Almuerzo", portions: 1, rating: 5 } });
  const despues = await contarLogs("REGISTRAR_CONSUMO");
  return [r.status === 201 && despues === antes + 1, `HTTP ${r.status}, logs: ${antes} → ${despues}`];
});
await caso("CAL-01", "Catálogo", "La calificación registrada con el consumo aparece en el catálogo", "Promedio y total iguales a los de la base, con la calificación del paciente", async () => {
  const r = await api("GET", "/platillos");
  const p = (r.data || []).find((x) => x.id === idPlatillo);
  const { rows: [bd] } = await db.query(
    `SELECT ROUND(AVG(rating)::numeric, 1)::float AS promedio, COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE id_usuario = $2 AND rating = 5)::int AS del_paciente
     FROM platillo_calificaciones WHERE id_platillo = $1`, [idPlatillo, idPaciente]);
  const ok = r.status === 200 && p?.rating === bd.promedio && p?.ratingCount === bd.total && bd.del_paciente === 1;
  return [ok, `HTTP ${r.status}, catálogo: ${p?.rating} con ${p?.ratingCount}; base: ${bd.promedio} con ${bd.total}`];
});
await caso("CON-02", "Registro de consumos", "Registro sin sesión", "HTTP 401", async () => {
  const r = await api("POST", "/platillos/consumo", { body: { platilloId: idPlatillo, mealTime: "Cena" } });
  return [r.status === 401, `HTTP ${r.status}`];
});
await caso("CON-03", "Registro de consumos", "Registro con momento del día inválido", "HTTP 400", async () => {
  const r = await api("POST", "/platillos/consumo", { token: tokenPaciente, body: { platilloId: idPlatillo, mealTime: "Madrugada" } });
  return [r.status === 400, `HTTP ${r.status}`];
});
await caso("CON-04", "Registro de consumos", "Registro de un platillo inexistente", "HTTP 404", async () => {
  const r = await api("POST", "/platillos/consumo", { token: tokenPaciente, body: { platilloId: 999999, mealTime: "Cena" } });
  return [r.status === 404, `HTTP ${r.status}`];
});

await caso("CON-05", "Registro de consumos", "Paciente consulta sus consumos de hoy con su aporte nutricional", "El consumo registrado aparece con calorías y hora", async () => {
  const r = await api("GET", "/platillos/consumos", { token: tokenPaciente });
  const reg = r.data?.[0];
  return [r.status === 200 && r.data.length === 1 && reg.calorias_consumidas > 0 && !!reg.hora, `HTTP ${r.status}, ${r.data?.length} registro(s): ${reg?.nombre_platillo} ${reg?.calorias_consumidas} kcal a las ${reg?.hora}`];
});
await caso("CON-06", "Registro de consumos", "Paciente elimina su propio consumo", "HTTP 200 y ya no aparece", async () => {
  const lista = (await api("GET", "/platillos/consumos", { token: tokenPaciente })).data;
  const r = await api("DELETE", `/platillos/consumo/${lista[0].id_historial}`, { token: tokenPaciente });
  const despues = (await api("GET", "/platillos/consumos", { token: tokenPaciente })).data;
  return [r.status === 200 && despues.length === 0, `HTTP ${r.status}, quedan ${despues.length}`];
});
await caso("CON-08", "Registro de consumos", "Registro con la hora indicada por el paciente", "HTTP 201 y la hora guardada es 07:30", async () => {
  const r = await api("POST", "/platillos/consumo", { token: tokenPaciente, body: { platilloId: idPlatillo, mealTime: "Desayuno", portions: 1, hora: "07:30" } });
  const hoy = (await api("GET", "/platillos/consumos", { token: tokenPaciente })).data || [];
  const reg = hoy.find((x) => x.id_historial === r.data?.id);
  if (r.data?.id) await api("DELETE", `/platillos/consumo/${r.data.id}`, { token: tokenPaciente });
  return [r.status === 201 && reg?.hora === "07:30", `HTTP ${r.status}, hora guardada: ${reg?.hora}`];
});
await caso("CON-09", "Registro de consumos", "Registro con una hora inválida", "HTTP 400", async () => {
  const r = await api("POST", "/platillos/consumo", { token: tokenPaciente, body: { platilloId: idPlatillo, mealTime: "Cena", hora: "25:00" } });
  return [r.status === 400, `HTTP ${r.status}: ${r.data?.error}`];
});
await caso("CON-07", "Seguridad", "Un paciente intenta eliminar un consumo de otro usuario", "HTTP 403", async () => {
  const otro = await db.query("SELECT id_historial FROM historial_consumo WHERE id_usuario <> $1 LIMIT 1", [idPaciente]);
  if (!otro.rows.length) return [true, "sin consumos de otros usuarios en la copia (caso no aplicable)"];
  const r = await api("DELETE", `/platillos/consumo/${otro.rows[0].id_historial}`, { token: tokenPaciente });
  return [r.status === 403, `HTTP ${r.status}`];
});

// ---------- Perfil del paciente ----------
await caso("PER-01", "Perfil", "Paciente actualiza su peso y teléfono", "HTTP 200 y datos guardados", async () => {
  const r = await api("PUT", "/usuarios/me", { token: tokenPaciente, body: { peso: 75.5, telefono: "3001234567" } });
  const { rows } = await db.query("SELECT peso, telefono FROM usuarios WHERE id_usuario = $1", [idPaciente]);
  return [r.status === 200 && Number(rows[0].peso) === 75.5 && rows[0].telefono === "3001234567" && r.data?.user?.weight == 75.5,
    `HTTP ${r.status}, peso ${rows[0].peso}, teléfono ${rows[0].telefono}`];
});
await caso("PER-02", "Perfil", "Actualizar el perfil con una estatura imposible", "HTTP 400", async () => {
  const r = await api("PUT", "/usuarios/me", { token: tokenPaciente, body: { estatura: 900 } });
  return [r.status === 400, `HTTP ${r.status}: ${r.data?.error}`];
});
await caso("PER-03", "Perfil", "Cambiar el correo a uno que ya usa otra cuenta", "HTTP 409", async () => {
  const otro = (await db.query("SELECT email FROM usuarios WHERE id_usuario <> $1 LIMIT 1", [idPaciente])).rows[0].email;
  const r = await api("PUT", "/usuarios/me", { token: tokenPaciente, body: { email: otro } });
  return [r.status === 409, `HTTP ${r.status}`];
});
await caso("PER-04", "Perfil", "Cambiar la contraseña con la contraseña actual incorrecta", "HTTP 400", async () => {
  const r = await api("PUT", "/usuarios/me/password", { token: tokenPaciente, body: { actual: "equivocada", nueva: "Nueva2026!" } });
  return [r.status === 400, `HTTP ${r.status}: ${r.data?.error}`];
});
await caso("PER-05", "Perfil", "Cambiar la contraseña correctamente y entrar con la nueva", "HTTP 200 y login con la nueva", async () => {
  const r = await api("PUT", "/usuarios/me/password", { token: tokenPaciente, body: { actual: paciente.password, nueva: "Nueva2026!" } });
  const viejo = await api("POST", "/login", { body: { email: paciente.email, password: paciente.password } });
  const nuevo = await api("POST", "/login", { body: { email: paciente.email, password: "Nueva2026!" } });
  if (nuevo.data?.token) tokenPaciente = nuevo.data.token;
  return [r.status === 200 && viejo.status === 401 && nuevo.status === 200, `cambio HTTP ${r.status}; contraseña anterior HTTP ${viejo.status}; nueva HTTP ${nuevo.status}`];
});
await caso("PER-07", "Perfil", "Paciente de la costa de Nariño elige la región Pacífica y el inicio de sesión la devuelve", "Región Pacífica; al restablecer, Andina (región por defecto de Nariño)", async () => {
  const { rows } = await db.query("SELECT id_region FROM regiones WHERE nombre_region = 'Pacífica'");
  const r1 = await api("PUT", "/usuarios/me", { token: tokenPaciente, body: { id_region: rows[0].id_region } });
  const l1 = await api("POST", "/login", { body: { email: paciente.email, password: "Nueva2026!" } });
  const r2 = await api("PUT", "/usuarios/me", { token: tokenPaciente, body: { id_region: null } });
  const l2 = await api("POST", "/login", { body: { email: paciente.email, password: "Nueva2026!" } });
  const ok = r1.status === 200 && r2.status === 200 && l1.data?.user?.region === "Pacífica" && l2.data?.user?.region === "Andina";
  return [ok, `elegida: ${l1.data?.user?.region}; por departamento: ${l2.data?.user?.region}`];
});
await caso("PER-06", "Perfil", "Actualizar el perfil sin sesión", "HTTP 401", async () => {
  const r = await api("PUT", "/usuarios/me", { body: { peso: 70 } });
  return [r.status === 401, `HTTP ${r.status}`];
});

// Historial de varios días para el reporte (datos de prueba)
const porNombre = (n) => platillos.find((p) => p.title === n)?.id;
const plan = [
  [-4, "Desayuno", "Avena con papaya"], [-4, "Almuerzo", "Arroz integral con pollo"], [-4, "Cena", "Sopa de lentejas casera"],
  [-3, "Desayuno", "Pan blanco con mermelada"], [-3, "Almuerzo", "Hamburguesa con pan blanco"], [-3, "Merienda", "Gaseosa y snack"],
  [-2, "Almuerzo", "Pollo con verduras al horno"], [-2, "Cena", "Pizza individual tradicional"],
  [-1, "Desayuno", "Huevos revueltos con aguacate"], [-1, "Almuerzo", "Lentejas con espinaca"], [-1, "Cena", "Salmón con brócoli al vapor"],
];
for (const [dias, momento, nombre] of plan) {
  await db.query(
    "INSERT INTO historial_consumo (id_usuario, id_platillo, fecha_consumo, porcion_consumida, meal_time) VALUES ($1, $2, CURRENT_DATE + $3::int, 1, $4)",
    [idPaciente, porNombre(nombre), dias, momento]
  );
}

// ---------- Panel de administración ----------
const admin = { email: `admin.${sufijo}@gessenapp.salud.co`, password: "Admin2026!" };
idAdmin = (await db.query(
  "INSERT INTO usuarios (nombre, apellido, email, password, id_rol, fecha_registro) VALUES ('Admin', 'Prueba', $1, $2, 1, NOW()) RETURNING id_usuario",
  [admin.email, hashPassword(admin.password)]
)).rows[0].id_usuario;

await caso("ADM-01", "Panel", "Inicio de sesión del administrador", "HTTP 200 y rol 1", async () => {
  const r = await api("POST", "/login", { body: admin });
  tokenAdmin = r.data?.token;
  return [r.status === 200 && r.data?.user?.role === 1, `HTTP ${r.status}, rol ${r.data?.user?.role}`];
});
await caso("ADM-02", "Panel", "Dashboard con indicadores", "HTTP 200 con totales", async () => {
  const r = await api("GET", "/admin/dashboard", { token: tokenAdmin });
  const { rows } = await db.query("SELECT COUNT(*)::int AS n FROM platillos");
  return [r.status === 200 && r.data.totalPlatillos === rows[0].n && r.data.totalConsumos >= 11, `platillos ${r.data?.totalPlatillos}, consumos ${r.data?.totalConsumos}, usuarios ${r.data?.totalUsuarios}`];
});
await caso("ADM-03", "Panel", "Lista de usuarios con número de registros", "El paciente aparece con 11 registros", async () => {
  const r = await api("GET", "/admin/usuarios", { token: tokenAdmin });
  const u = r.data?.find((x) => x.id_usuario === idPaciente);
  return [r.status === 200 && u?.registros === 11, `HTTP ${r.status}, registros del paciente: ${u?.registros}`];
});

let idNuevo;
await caso("REC-01", "Recetas", "Crear un platillo desde el panel", "HTTP 201 y log CREAR_PLATILLO", async () => {
  const r = await api("POST", "/admin/platillos", { token: tokenAdmin, body: { nombre_platillo: "Platillo de prueba", descripcion: "Prueba", nivel_glucemico: "Bajo", id_categoria: 2, tiempo_preparacion: 15 } });
  idNuevo = r.data?.id_platillo;
  return [r.status === 201 && !!idNuevo && (await contarLogs("CREAR_PLATILLO")) >= 1, `HTTP ${r.status}, id ${idNuevo}`];
});
await caso("REC-02", "Recetas", "Crear platillo con nivel glucémico inválido", "HTTP 400", async () => {
  const r = await api("POST", "/admin/platillos", { token: tokenAdmin, body: { nombre_platillo: "X", nivel_glucemico: "Altísimo", id_categoria: 2 } });
  return [r.status === 400, `HTTP ${r.status}: ${r.data?.error}`];
});
let urlImagen;
await caso("REC-03", "Recetas", "Subir una imagen de platillo", "HTTP 201 y archivo accesible", async () => {
  const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const r = await api("POST", "/admin/imagenes", { token: tokenAdmin, body: { dataUrl: png } });
  urlImagen = r.data?.url;
  const archivo = urlImagen ? await fetch(new URL(urlImagen, BASE)) : null;
  return [r.status === 201 && archivo?.status === 200, `HTTP ${r.status}, archivo: HTTP ${archivo?.status}`];
});
await caso("REC-04", "Recetas", "Editar el platillo con la imagen subida", "HTTP 200 y cambio guardado", async () => {
  const r = await api("PUT", `/admin/platillos/${idNuevo}`, { token: tokenAdmin, body: { nombre_platillo: "Platillo de prueba editado", nivel_glucemico: "medio", id_categoria: 3, imagen_url: urlImagen, imagen_credito: "Prueba" } });
  const { rows } = await db.query("SELECT nombre_platillo, nivel_glucemico, imagen_url FROM platillos WHERE id_platillo = $1", [idNuevo]);
  return [r.status === 200 && rows[0].nivel_glucemico === "Medio" && rows[0].imagen_url === urlImagen, `HTTP ${r.status}, ${rows[0].nombre_platillo} (${rows[0].nivel_glucemico})`];
});
await caso("ING-01", "Recetas", "Lista de ingredientes disponibles en el panel", "HTTP 200 con 72 ingredientes", async () => {
  const r = await api("GET", "/admin/ingredientes", { token: tokenAdmin });
  return [r.status === 200 && r.data?.length === 72, `HTTP ${r.status}, ${r.data?.length} ingredientes`];
});
await caso("ING-02", "Recetas", "Asignar ingredientes a un platillo desde el panel recalcula su aporte", "100 g de pollo + 100 g de brócoli = 199 kcal", async () => {
  const ing = (await api("GET", "/admin/ingredientes", { token: tokenAdmin })).data || [];
  const id = (n) => ing.find((x) => x.nombre_ingrediente === n)?.id_ingrediente;
  const antes = await contarLogs("EDITAR_INGREDIENTES_PLATILLO");
  const r = await api("PUT", `/admin/platillos/${idNuevo}/ingredientes`, { token: tokenAdmin, body: { ingredientes: [{ id_ingrediente: id("Pollo"), cantidad: 100 }, { id_ingrediente: id("Brócoli"), cantidad: 100 }] } });
  const despues = await contarLogs("EDITAR_INGREDIENTES_PLATILLO");
  const kcal = Number(r.data?.nutrientes?.calorias);
  return [r.status === 200 && kcal === 199 && despues === antes + 1, `HTTP ${r.status}, ${kcal} kcal, log: ${antes} → ${despues}`];
});
await caso("ING-03", "Recetas", "Asignar un ingrediente con cantidad inválida", "HTTP 400", async () => {
  const r = await api("PUT", `/admin/platillos/${idNuevo}/ingredientes`, { token: tokenAdmin, body: { ingredientes: [{ id_ingrediente: 1, cantidad: 0 }] } });
  return [r.status === 400, `HTTP ${r.status}: ${r.data?.error}`];
});
await caso("ING-04", "Seguridad", "Paciente intenta cambiar los ingredientes de un platillo", "HTTP 403", async () => {
  const r = await api("PUT", `/admin/platillos/${idNuevo}/ingredientes`, { token: tokenPaciente, body: { ingredientes: [{ id_ingrediente: 1, cantidad: 100 }] } });
  return [r.status === 403, `HTTP ${r.status}`];
});
await caso("REC-05", "Recetas", "Eliminar un platillo que tiene consumos registrados", "HTTP 409 con mensaje", async () => {
  // "Avena con papaya" tiene un consumo en el historial de prueba sembrado arriba
  const r = await api("DELETE", `/admin/platillos/${porNombre("Avena con papaya")}`, { token: tokenAdmin });
  return [r.status === 409, `HTTP ${r.status}: ${r.data?.error}`];
});
await caso("REC-06", "Recetas", "Eliminar un platillo sin consumos", "HTTP 200", async () => {
  const r = await api("DELETE", `/admin/platillos/${idNuevo}`, { token: tokenAdmin });
  return [r.status === 200, `HTTP ${r.status}`];
});

// ---------- Reporte para el médico ----------
let reporte;
await caso("REP-01", "Reporte PDF", "Reporte nutricional del paciente", "4 días, 11 registros y observaciones", async () => {
  const r = await api("GET", `/admin/reporte/${idPaciente}`, { token: tokenAdmin });
  reporte = r.data;
  return [r.status === 200 && reporte.periodo.dias_con_registro === 4 && reporte.periodo.total_registros === 11 && reporte.observaciones.length >= 4,
    `HTTP ${r.status}, ${reporte?.periodo?.dias_con_registro} días, ${reporte?.periodo?.total_registros} registros, ${reporte?.observaciones?.length} observaciones`];
});
await caso("REP-02", "Reporte PDF", "Los totales del reporte coinciden con la suma de los registros", "Diferencia menor de 1 kcal", async () => {
  const suma = reporte.registros.reduce((a, r) => a + r.calorias_consumidas, 0);
  return [Math.abs(suma - reporte.totales.calorias) < 1, `suma ${suma.toFixed(1)} kcal; total ${reporte.totales.calorias} kcal; promedio diario ${reporte.promedios.calorias} kcal`];
});
await caso("REP-03", "Reporte PDF", "El reporte detecta días sin desayuno y platillos de IG alto", "Observaciones presentes", async () => {
  const sinDesayuno = reporte.observaciones.some((o) => o.includes("desayuno"));
  const ig = reporte.observaciones.some((o) => o.includes("índice glucémico alto"));
  return [sinDesayuno && ig, `sin desayuno: ${sinDesayuno ? "sí" : "no"}; IG alto: ${ig ? "sí" : "no"}`];
});
await caso("REP-04", "Reporte PDF", "Filtro por rango de fechas", "Solo los días del rango", async () => {
  const hoy = new Date();
  // Fecha local (la misma que CURRENT_DATE de la base), no UTC
  const f = (d) => new Date(hoy.getTime() + d * 86400000).toLocaleDateString("en-CA");
  const r = await api("GET", `/admin/reporte/${idPaciente}?desde=${f(-2)}&hasta=${f(-1)}`, { token: tokenAdmin });
  return [r.status === 200 && r.data.periodo.dias_con_registro === 2, `HTTP ${r.status}, ${r.data?.periodo?.dias_con_registro} días en el rango`];
});
await caso("REP-05", "Reporte PDF", "La descarga del informe queda en los logs", "Log DESCARGAR_REPORTE_PDF", async () => {
  const antes = await contarLogs("DESCARGAR_REPORTE_PDF");
  await api("GET", `/admin/reporte/${idPaciente}?registrar=1`, { token: tokenAdmin });
  const despues = await contarLogs("DESCARGAR_REPORTE_PDF");
  return [despues === antes + 1, `logs: ${antes} → ${despues}`];
});
await caso("REP-06", "Reporte PDF", "Fecha con formato inválido", "HTTP 400", async () => {
  const r = await api("GET", `/admin/reporte/${idPaciente}?desde=25-09-2026`, { token: tokenAdmin });
  return [r.status === 400, `HTTP ${r.status}`];
});

await caso("CON-10", "Registro de consumos", "Historial completo del paciente para «Mis consumos»", "11 registros, del más reciente al más antiguo, con fecha y hora", async () => {
  const r = await api("GET", "/platillos/consumos?todos=1", { token: tokenPaciente });
  const l = r.data || [];
  const ordenado = l.every((x, i) => i === 0 || l[i - 1].fecha_consumo >= x.fecha_consumo);
  const completos = l.every((x) => x.fecha_consumo && x.hora && x.meal_time && x.nombre_platillo);
  return [r.status === 200 && l.length === 11 && ordenado && completos, `HTTP ${r.status}, ${l.length} registros, ordenados: ${ordenado ? "sí" : "no"}, con fecha, hora y momento: ${completos ? "sí" : "no"}`];
});

// ---------- Recomendador con aprendizaje automático ----------
await caso("ML-01", "Aprendizaje automático", "Estado del modelo de recomendación en el panel", "Modelo entrenado con métricas de validación", async () => {
  const r = await api("GET", "/admin/ml", { token: tokenAdmin });
  const m = r.data?.metricas;
  return [r.status === 200 && r.data?.entrenado === true && m?.modelo?.hitRate != null && m?.popularidad?.hitRate != null,
    `HTTP ${r.status}, HitRate@10 modelo ${m?.modelo?.hitRate}, popularidad ${m?.popularidad?.hitRate}`];
});
await caso("ML-02", "Aprendizaje automático", "Reentrenar el modelo desde el panel", "HTTP 200 y log ENTRENAR_MODELO", async () => {
  const antes = await contarLogs("ENTRENAR_MODELO");
  const r = await api("POST", "/admin/ml/entrenar", { token: tokenAdmin });
  const despues = await contarLogs("ENTRENAR_MODELO");
  return [r.status === 200 && r.data?.interacciones > 0 && despues === antes + 1,
    `HTTP ${r.status}, ${r.data?.interacciones} interacciones de ${r.data?.pacientes} pacientes, log: ${antes} → ${despues}`];
});
await caso("ML-03", "Aprendizaje automático", "Sugerencias personalizadas para un paciente con historial", "Modo ml, 6 sugerencias y ninguna de índice glucémico alto", async () => {
  const r = await api("GET", "/platillos/recomendaciones-ml?limite=6", { token: tokenPaciente });
  const ids = (r.data?.recomendaciones || []).map((x) => Number(x.id));
  const { rows } = ids.length ? await db.query("SELECT COUNT(*)::int AS n FROM platillos WHERE id_platillo = ANY($1) AND LOWER(nivel_glucemico) = 'alto'", [ids]) : { rows: [{ n: 0 }] };
  return [r.status === 200 && r.data?.modo === "ml" && ids.length === 6 && rows[0].n === 0,
    `HTTP ${r.status}, modo ${r.data?.modo}, ${ids.length} sugerencias, de IG alto: ${rows[0].n}`];
});
await caso("ML-04", "Aprendizaje automático", "Usuario sin historial recibe sugerencias de inicio en frío", "Modo inicio_en_frio", async () => {
  const r = await api("GET", "/platillos/recomendaciones-ml", { token: tokenAdmin });
  return [r.status === 200 && r.data?.modo === "inicio_en_frio" && r.data?.recomendaciones?.length > 0, `HTTP ${r.status}, modo ${r.data?.modo}`];
});
await caso("ML-06", "Aprendizaje automático", "La vista del detalle de un platillo queda como interacción para el modelo", "HTTP 201 y evento view en user_interactions", async () => {
  const antes = (await db.query("SELECT COUNT(*)::int AS n FROM user_interactions WHERE id_usuario = $1 AND event_type = 'view'", [idPaciente])).rows[0].n;
  const r = await api("POST", "/platillos/interaccion", { token: tokenPaciente, body: { platilloId: idPlatillo } });
  const despues = (await db.query("SELECT COUNT(*)::int AS n FROM user_interactions WHERE id_usuario = $1 AND event_type = 'view'", [idPaciente])).rows[0].n;
  const invalido = await api("POST", "/platillos/interaccion", { token: tokenPaciente, body: { platilloId: "x" } });
  return [r.status === 201 && despues === antes + 1 && invalido.status === 400, `HTTP ${r.status}, vistas: ${antes} → ${despues}; id inválido: HTTP ${invalido.status}`];
});
await caso("ML-05", "Seguridad", "Paciente intenta reentrenar el modelo", "HTTP 403", async () => {
  const r = await api("POST", "/admin/ml/entrenar", { token: tokenPaciente });
  return [r.status === 403, `HTTP ${r.status}`];
});

// ---------- Administradores, configuración y logs ----------
await caso("ADM-04", "Administradores", "Un administrador no puede quitarse su propio rol", "HTTP 400", async () => {
  const r = await api("DELETE", `/admin/administradores/${idAdmin}`, { token: tokenAdmin });
  return [r.status === 400, `HTTP ${r.status}: ${r.data?.error}`];
});
await caso("ADM-05", "Administradores", "Crear un administrador con contraseña cifrada", "HTTP 201", async () => {
  const email = `admin2.${sufijo}@gessenapp.salud.co`;
  const r = await api("POST", "/admin/administradores", { token: tokenAdmin, body: { nombre: "Otro", apellido: "Admin", email, password: "Admin2026!" } });
  const { rows } = await db.query("SELECT password FROM usuarios WHERE email = $1", [email]);
  return [r.status === 201 && rows[0]?.password?.startsWith("scrypt$"), `HTTP ${r.status}`];
});
await caso("CFG-01", "Configuración", "Guardar y leer la configuración", "El valor guardado se lee de vuelta", async () => {
  const w = await api("POST", "/admin/configuracion", { token: tokenAdmin, body: { appName: "GessenApp Pruebas", idioma: "es", zona: "GMT-5 Colombia", notiUsuarios: false, notiRecetas: true } });
  const r = await api("GET", "/admin/configuracion", { token: tokenAdmin });
  return [w.status === 200 && r.data?.app_name === "GessenApp Pruebas" && r.data?.notificar_usuarios === "false", `HTTP ${w.status}, app_name = ${r.data?.app_name}, tamaño BD = ${r.data?.tamano_bd}`];
});
await caso("CFG-02", "Configuración", "Cambio de contraseña con confirmación distinta", "HTTP 400", async () => {
  const r = await api("POST", "/admin/configuracion", { token: tokenAdmin, body: { password: "Nueva2026!", confirmPassword: "otra" } });
  return [r.status === 400, `HTTP ${r.status}`];
});
await caso("LOG-01", "Logs", "Consulta de los logs", "Incluye inicios de sesión y acciones del panel", async () => {
  const r = await api("GET", "/admin/logs?limite=200", { token: tokenAdmin });
  const acciones = new Set(r.data?.logs?.map((l) => l.accion));
  const esperadas = ["LOGIN", "LOGIN_FALLIDO", "REGISTRO_USUARIO", "CREAR_PLATILLO", "ELIMINAR_PLATILLO", "DESCARGAR_REPORTE_PDF", "ACTUALIZAR_CONFIGURACION"];
  const faltan = esperadas.filter((a) => !acciones.has(a));
  return [r.status === 200 && faltan.length === 0, `HTTP ${r.status}, ${r.data?.total} eventos${faltan.length ? `; faltan: ${faltan.join(", ")}` : ""}`];
});
await caso("LOG-02", "Logs", "Filtro de logs por acción", "Solo eventos de la acción elegida", async () => {
  const r = await api("GET", "/admin/logs?accion=LOGIN", { token: tokenAdmin });
  return [r.status === 200 && r.data.logs.length > 0 && r.data.logs.every((l) => l.accion === "LOGIN"), `${r.data?.logs?.length} eventos LOGIN`];
});
await caso("LOG-03", "Logs", "Paciente intenta consultar los logs", "HTTP 403", async () => {
  const r = await api("GET", "/admin/logs", { token: tokenPaciente });
  return [r.status === 403, `HTTP ${r.status}`];
});
await caso("USR-01", "Usuarios", "Eliminar un usuario con historial (borrado en cascada)", "HTTP 200 y sin registros huérfanos", async () => {
  const r = await api("DELETE", `/admin/usuarios/${idPaciente}`, { token: tokenAdmin });
  const { rows } = await db.query("SELECT COUNT(*)::int n FROM historial_consumo WHERE id_usuario = $1", [idPaciente]);
  return [r.status === 200 && rows[0].n === 0, `HTTP ${r.status}, registros restantes: ${rows[0].n}`];
});

// ---------- Desempeño ----------
await caso("REN-01", "Desempeño", "Tiempo de respuesta del catálogo (30 solicitudes)", "Percentil 95 menor de 1000 ms", async () => {
  const t = [];
  for (let i = 0; i < 30; i++) t.push((await api("GET", "/platillos")).ms);
  t.sort((a, b) => a - b);
  const media = t.reduce((a, b) => a + b, 0) / t.length;
  return [t[28] < 1000, `media ${media.toFixed(0)} ms; p95 ${t[28].toFixed(0)} ms`];
});

// Limpieza: se eliminan los administradores temporales creados por esta ejecución (el paciente y
// el platillo de prueba ya se eliminaron en USR-01 y REC-06)
try {
  await db.query("DELETE FROM usuarios WHERE email = ANY($1)", [[admin.email, `admin2.${sufijo}@gessenapp.salud.co`]]);
} catch (e) {
  console.warn("No se pudieron eliminar los administradores de prueba:", e.message);
}

await db.end();
const aprobados = resultados.filter((r) => r.estado === "Aprobado").length;
writeFileSync(new URL("./resultados_pruebas.json", import.meta.url), JSON.stringify({ fecha: new Date().toISOString(), aprobados, total: resultados.length, resultados }, null, 2));
console.log(`\n${aprobados} de ${resultados.length} casos aprobados\n`);
for (const r of resultados) console.log(`${r.estado === "Aprobado" ? "✔" : "✘"} ${r.id} | ${r.descripcion} | ${r.obtenido}`);
