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
await caso("PLA-01", "Catálogo", "Consulta del catálogo de platillos", "HTTP 200 y 96 platillos", async () => {
  const r = await api("GET", "/platillos");
  platillos = Array.isArray(r.data) ? r.data : [];
  return [r.status === 200 && platillos.length === 96, `HTTP ${r.status}, ${platillos.length} platillos`];
});
await caso("PLA-02", "Catálogo", "Los nutrientes no se duplican en platillos con varios sabores o preferencias", "Calorías iguales al cálculo directo en todos los platillos", async () => {
  const { rows } = await db.query(`SELECT id_platillo, calorias FROM (${NUTRIENTES_PLATILLO_SQL}) t`);
  const directo = new Map(rows.map((r) => [r.id_platillo, Number(r.calorias)]));
  const distintos = platillos.filter((p) => Math.abs(parseFloat(p.calories) - (directo.get(p.id) || 0)) > 0.2);
  const multiples = platillos.filter((p) => (p.flavors?.length || 0) * (p.preferences?.length || 0) > 1).length;
  return [distintos.length === 0, `${platillos.length - distintos.length} de ${platillos.length} coinciden (${multiples} con varios sabores/preferencias)`];
});
await caso("PLA-03", "Catálogo", "Cada platillo tiene imagen asignada", "96 de 96 con imagen", async () => {
  const con = platillos.filter((p) => p.image).length;
  return [con === platillos.length, `${con} de ${platillos.length} con imagen`];
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
  return [r.status === 200 && r.data.totalPlatillos === 96 && r.data.totalConsumos >= 11, `platillos ${r.data?.totalPlatillos}, consumos ${r.data?.totalConsumos}, usuarios ${r.data?.totalUsuarios}`];
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
  const archivo = urlImagen ? await fetch(urlImagen) : null;
  return [r.status === 201 && archivo?.status === 200, `HTTP ${r.status}, archivo: HTTP ${archivo?.status}`];
});
await caso("REC-04", "Recetas", "Editar el platillo con la imagen subida", "HTTP 200 y cambio guardado", async () => {
  const r = await api("PUT", `/admin/platillos/${idNuevo}`, { token: tokenAdmin, body: { nombre_platillo: "Platillo de prueba editado", nivel_glucemico: "medio", id_categoria: 3, imagen_url: urlImagen, imagen_credito: "Prueba" } });
  const { rows } = await db.query("SELECT nombre_platillo, nivel_glucemico, imagen_url FROM platillos WHERE id_platillo = $1", [idNuevo]);
  return [r.status === 200 && rows[0].nivel_glucemico === "Medio" && rows[0].imagen_url === urlImagen, `HTTP ${r.status}, ${rows[0].nombre_platillo} (${rows[0].nivel_glucemico})`];
});
await caso("REC-05", "Recetas", "Eliminar un platillo que tiene consumos registrados", "HTTP 409 con mensaje", async () => {
  const r = await api("DELETE", `/admin/platillos/${idPlatillo}`, { token: tokenAdmin });
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
  const f = (d) => new Date(hoy.getTime() + d * 86400000).toISOString().slice(0, 10);
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

await db.end();
const aprobados = resultados.filter((r) => r.estado === "Aprobado").length;
writeFileSync(new URL("./resultados_pruebas.json", import.meta.url), JSON.stringify({ fecha: new Date().toISOString(), aprobados, total: resultados.length, resultados }, null, 2));
console.log(`\n${aprobados} de ${resultados.length} casos aprobados\n`);
for (const r of resultados) console.log(`${r.estado === "Aprobado" ? "✔" : "✘"} ${r.id} | ${r.descripcion} | ${r.obtenido}`);
