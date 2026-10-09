// Pruebas exploratorias: entradas inválidas o malintencionadas contra la API.
// Uso (desde backend, con el servidor corriendo sobre la copia de pruebas):
//   DB_NAME=BD_gessenapp_test API_URL=http://127.0.0.1:5055/api node tests/pruebas_exploratorias.mjs
// Solo se ejecuta sobre una base de datos cuyo nombre contenga «test».
import { writeFileSync } from "node:fs";
process.env.DB_NAME = process.env.DB_NAME || "BD_gessenapp_test";
if (!/test/i.test(process.env.DB_NAME)) { console.error("Estas pruebas solo se ejecutan sobre una base de datos de pruebas"); process.exit(1); }
const BD = process.env.DB_NAME;
await import("../src/config/env.js");
const { default: pkg } = await import("pg");
const { hashPassword } = await import("../src/utils/password.js");
const API = process.env.API_URL || "http://127.0.0.1:5055/api";
const db = new pkg.Pool({ user: process.env.DB_USER, host: process.env.DB_HOST, database: BD, password: process.env.DB_PASSWORD, port: Number(process.env.DB_PORT) });
const suf = Date.now();
const out = [];
const resultados = [];
async function api(m, p, { body, token, raw } = {}) {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  const r = await fetch(API + p, { method: m, headers: h, body: raw ?? (body ? JSON.stringify(body) : undefined) });
  let d = null; try { d = await r.json(); } catch { }
  return { s: r.status, d };
}
function caso(nombre, r, esperado) {
  const ok = esperado.includes(r.s);
  resultados.push({ caso: nombre, esperado: esperado.join("/"), obtenido: r.s, estado: ok ? "Aprobado" : "Fallido" });
  out.push(`${ok ? "OK   " : "FALLA"} ${nombre} -> HTTP ${r.s}${ok ? "" : " (esperado " + esperado.join("/") + ")"} ${r.d?.error ? "· " + String(r.d.error).slice(0, 90) : ""}`);
}
const base = { nombre: "Explo", apellido: "Prueba", password: "Clave2026!", genero: "Femenino", fecha_nacimiento: "1970-01-01", estatura: 160, peso: 70, id_departamento: 32 };

// Registro
caso("Registro con correo inválido", await api("POST", "/usuarios", { body: { ...base, email: "no-es-correo" } }), [400]);
caso("Registro con contraseña de 3 caracteres", await api("POST", "/usuarios", { body: { ...base, email: `c3.${suf}@x.test`, password: "abc" } }), [400]);
caso("Registro sin nombre", await api("POST", "/usuarios", { body: { ...base, nombre: "", email: `sn.${suf}@x.test` } }), [400]);
caso("Registro con fecha de nacimiento futura", await api("POST", "/usuarios", { body: { ...base, email: `ff.${suf}@x.test`, fecha_nacimiento: "2099-01-01" } }), [400]);
caso("Registro con departamento inexistente", await api("POST", "/usuarios", { body: { ...base, email: `dx.${suf}@x.test`, id_departamento: 9999 } }), [400]);
caso("Registro con JSON mal formado", await api("POST", "/usuarios", { raw: "{nombre:" }), [400]);
caso("Registro con nombre de 5000 caracteres", await api("POST", "/usuarios", { body: { ...base, nombre: "A".repeat(5000), email: `ln.${suf}@x.test` } }), [400]);
caso("Registro con correo en mayúsculas duplicado", await (async () => {
  await api("POST", "/usuarios", { body: { ...base, email: `dup.${suf}@x.test` } });
  return api("POST", "/usuarios", { body: { ...base, email: `DUP.${suf}@X.TEST` } });
})(), [409]);
const inj = await api("POST", "/login", { body: { email: "' OR '1'='1", password: "' OR '1'='1" } });
caso("Login con inyección SQL", inj, [400, 401]);
caso("Login sin cuerpo", await api("POST", "/login", {}), [400, 401]);

// Paciente válido
const email = `explo.${suf}@x.test`;
await api("POST", "/usuarios", { body: { ...base, nombre: "<script>alert(1)</script>", email } });
const tk = (await api("POST", "/login", { body: { email, password: base.password } })).d?.token;
const id = (await db.query("SELECT id_usuario FROM usuarios WHERE email=$1", [email])).rows[0]?.id_usuario;
caso("Token mal formado", await api("GET", "/platillos/consumos", { token: "abc.def.ghi" }), [401, 403]);
caso("Consumo con porción 0", await api("POST", "/platillos/consumo", { token: tk, body: { platilloId: 42, mealTime: "Desayuno", portions: 0 } }), [400]);
caso("Consumo con porción negativa", await api("POST", "/platillos/consumo", { token: tk, body: { platilloId: 42, mealTime: "Desayuno", portions: -3 } }), [400]);
caso("Consumo con porción 500", await api("POST", "/platillos/consumo", { token: tk, body: { platilloId: 42, mealTime: "Desayuno", portions: 500 } }), [400]);
caso("Consumo con calificación 9", await api("POST", "/platillos/consumo", { token: tk, body: { platilloId: 42, mealTime: "Desayuno", portions: 1, rating: 9 } }), [400]);
caso("Consumo con platillo texto", await api("POST", "/platillos/consumo", { token: tk, body: { platilloId: "abc", mealTime: "Desayuno", portions: 1 } }), [400, 404]);
caso("Consumo con comentario de 20000 caracteres", await api("POST", "/platillos/consumo", { token: tk, body: { platilloId: 42, mealTime: "Desayuno", portions: 1, comment: "x".repeat(20000) } }), [400]);
caso("Eliminar consumo con id texto", await api("DELETE", "/platillos/consumo/abc", { token: tk }), [400, 404]);
caso("Eliminar consumo inexistente", await api("DELETE", "/platillos/consumo/999999999", { token: tk }), [404]);
caso("Consultar consumos con fecha inválida", await api("GET", "/platillos/consumos?fecha=2026-13-45", { token: tk }), [400]);
caso("Favoritos de otro usuario", await api("GET", `/platillos/favoritos/${id + 100000}`, { token: tk }), [403, 404]);
caso("Favorito con platillo inexistente", await api("POST", "/platillos/favorito/toggle", { token: tk, body: { userId: id, platilloId: 999999 } }), [400, 404]);
caso("Favorito a nombre de otro usuario", await api("POST", "/platillos/favorito/toggle", { token: tk, body: { userId: 1, platilloId: 42 } }), [403, 200]);
caso("Recomendaciones IA con límite -5", await api("GET", "/platillos/recomendaciones-ml?limite=-5", { token: tk }), [200, 400]);
caso("Recomendaciones IA con límite 100000", await api("GET", "/platillos/recomendaciones-ml?limite=100000", { token: tk }), [200, 400]);
caso("Perfil con peso texto", await api("PUT", "/usuarios/me", { token: tk, body: { peso: "mucho" } }), [400]);
caso("Perfil con estatura 0", await api("PUT", "/usuarios/me", { token: tk, body: { estatura: 0 } }), [400]);
caso("Cambiar a rol administrador desde el perfil", await (async () => {
  await api("PUT", "/usuarios/me", { token: tk, body: { id_rol: 1, rol: 1 } });
  const r = (await db.query("SELECT id_rol FROM usuarios WHERE id_usuario=$1", [id])).rows[0];
  return { s: r.id_rol === 1 ? 500 : 200, d: { error: `rol final ${r.id_rol}` } };
})(), [200]);
caso("Paciente usa ruta de admin (dashboard)", await api("GET", "/admin/dashboard", { token: tk }), [403]);
caso("Paciente crea administrador", await api("POST", "/admin/administradores", { token: tk, body: { nombre: "x", apellido: "y", email: `a.${suf}@x.test`, password: "Clave2026!" } }), [403]);

// Administrador temporal
const aemail = `admexplo.${suf}@x.test`;
await db.query("INSERT INTO usuarios (nombre, apellido, email, password, id_rol, fecha_registro) VALUES ('Adm','Explo',$1,$2,1,NOW())", [aemail, hashPassword("Clave2026!")]);
const ta = (await api("POST", "/login", { body: { email: aemail, password: "Clave2026!" } })).d?.token;
caso("Reporte con desde > hasta", await api("GET", `/admin/reporte/${id}?desde=2026-12-31&hasta=2026-01-01`, { token: ta }), [200, 400]);
caso("Reporte de usuario inexistente", await api("GET", `/admin/reporte/999999999`, { token: ta }), [404]);
caso("Reporte con id texto", await api("GET", `/admin/reporte/abc`, { token: ta }), [400, 404]);
caso("Historial de usuario con id texto", await api("GET", `/admin/historial-consumo/abc`, { token: ta }), [400, 404]);
caso("Editar platillo inexistente", await api("PUT", `/admin/platillos/999999`, { token: ta, body: { nombre_platillo: "X", nivel_glucemico: "Bajo", id_categoria: 1 } }), [404, 400]);
caso("Crear platillo sin nombre", await api("POST", `/admin/platillos`, { token: ta, body: { nombre_platillo: "", nivel_glucemico: "Bajo", id_categoria: 1 } }), [400]);
caso("Ingredientes con lista vacía", await api("PUT", `/admin/platillos/42/ingredientes`, { token: ta, body: { ingredientes: [] } }), [400]);
caso("Ingredientes con id texto", await api("PUT", `/admin/platillos/42/ingredientes`, { token: ta, body: { ingredientes: [{ id_ingrediente: "x", cantidad: 10 }] } }), [400]);
caso("Subir imagen que no es imagen", await api("POST", `/admin/imagenes`, { token: ta, body: { dataUrl: "data:text/html;base64,PHNjcmlwdD4=" } }), [400]);
caso("Editar usuario inexistente", await api("PUT", `/admin/usuarios/999999999`, { token: ta, body: { nombre: "x" } }), [404, 400]);
caso("Eliminar usuario con id texto", await api("DELETE", `/admin/usuarios/abc`, { token: ta }), [400, 404]);
caso("Logs con límite enorme", await api("GET", `/admin/logs?limite=99999999`, { token: ta }), [200, 400]);
caso("Logs con acción inyectada", await api("GET", `/admin/logs?accion=' OR 1=1 --`, { token: ta }), [200]);
caso("Administrador con correo inválido", await api("POST", `/admin/administradores`, { token: ta, body: { nombre: "x", apellido: "y", email: "malo", password: "Clave2026!" } }), [400]);
caso("Administrador con contraseña corta", await api("POST", `/admin/administradores`, { token: ta, body: { nombre: "x", apellido: "y", email: `ac.${suf}@x.test`, password: "12" } }), [400]);

// Restablecer contraseña desde el panel y límite de intentos
caso("Admin edita nombre de 300 caracteres", await api("PUT", `/admin/usuarios/${id}`, { token: ta, body: { nombre: "N".repeat(300) } }), [400]);
caso("Admin restablece contraseña corta", await api("PUT", `/admin/usuarios/${id}`, { token: ta, body: { nombre: "Explo", password: "123" } }), [400]);
caso("Admin restablece la contraseña del paciente", await api("PUT", `/admin/usuarios/${id}`, { token: ta, body: { nombre: "Explo", password: "Nueva2026!" } }), [200]);
caso("Paciente entra con la contraseña restablecida", await api("POST", "/login", { body: { email, password: "Nueva2026!" } }), [200]);
caso("La contraseña anterior ya no sirve", await api("POST", "/login", { body: { email, password: base.password } }), [401]);
for (let i = 0; i < 4; i++) await api("POST", "/login", { body: { email, password: "incorrecta" } });
caso("Sexto intento fallido seguido queda bloqueado", await api("POST", "/login", { body: { email, password: "incorrecta" } }), [429]);
caso("Bloqueado aunque la contraseña sea correcta", await api("POST", "/login", { body: { email, password: "Nueva2026!" } }), [429]);
caso("Otro correo no se bloquea", await api("POST", "/login", { body: { email: aemail, password: "Clave2026!" } }), [200]);

// Limpieza
await db.query("DELETE FROM usuarios WHERE email LIKE $1", [`%.${suf}@x.test`]);
await db.query("DELETE FROM usuarios WHERE lower(email) LIKE $1", [`%.${suf}@x.test`]);
await db.end();
console.log(out.join("\n"));
const aprobados = resultados.filter((r) => r.estado === "Aprobado").length;
console.log(`\n${aprobados} de ${resultados.length} casos aprobados`);
writeFileSync(new URL("./resultados_exploratorias.json", import.meta.url),
  JSON.stringify({ fecha: new Date().toISOString(), aprobados, total: resultados.length, resultados }, null, 2));
