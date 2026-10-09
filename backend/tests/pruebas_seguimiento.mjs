// Pruebas del seguimiento clínico: indicadores de laboratorio, curva de peso e IMC, tamizaje de sarcopenia,
// alertas metabólicas, autorización de índice glucémico medio y ajuste del recomendador por IMC.
// Uso (desde backend, con el servidor corriendo sobre la copia de pruebas):
//   DB_NAME=BD_gessenapp_test API_URL=http://127.0.0.1:5055/api node tests/pruebas_seguimiento.mjs
// Solo se ejecuta sobre una base de datos cuyo nombre contenga «test». Los datos creados se conservan.
import { writeFileSync } from "node:fs";
process.env.DB_NAME = process.env.DB_NAME || "BD_gessenapp_test";
if (!/test/i.test(process.env.DB_NAME)) { console.error("Estas pruebas solo se ejecutan sobre una base de datos de pruebas"); process.exit(1); }
const BD = process.env.DB_NAME;
await import("../src/config/env.js");
const { default: pkg } = await import("pg");
const { hashPassword } = await import("../src/utils/password.js");
const { tfgEstimada, evaluarAlertas } = await import("../src/utils/seguimiento.js");
const API = process.env.API_URL || "http://127.0.0.1:5055/api";
const db = new pkg.Pool({ user: process.env.DB_USER, host: process.env.DB_HOST, database: BD, password: process.env.DB_PASSWORD, port: Number(process.env.DB_PORT) });
const suf = Date.now();
const resultados = [];
async function api(m, p, { body, token } = {}) {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  const r = await fetch(API + p, { method: m, headers: h, body: body ? JSON.stringify(body) : undefined });
  let d = null; try { d = await r.json(); } catch { }
  return { s: r.status, d };
}
function caso(id, nombre, ok, detalle = "") {
  resultados.push({ id, caso: nombre, estado: ok ? "Aprobado" : "Fallido", detalle });
  console.log(`${ok ? "OK   " : "FALLA"} ${id} ${nombre}${detalle ? " · " + detalle : ""}`);
}
const tiene = (alertas, indicador) => alertas.some((a) => a.indicador === indicador);

// ---------- Cálculos (sin servidor)
// Valores de referencia de la calculadora CKD-EPI 2021: mujer de 60 años, creatinina 1,0 -> 64; hombre de 60 años, creatinina 1,0 -> 86
caso("SEG-01", "TFG CKD-EPI 2021 (mujer, 60 años, Cr 1,0)", tfgEstimada(1.0, 60, "F") === 64, `obtenido ${tfgEstimada(1.0, 60, "F")}`);
caso("SEG-02", "TFG CKD-EPI 2021 (hombre, 60 años, Cr 1,0)", tfgEstimada(1.0, 60, "M") === 86, `obtenido ${tfgEstimada(1.0, 60, "M")}`);
caso("SEG-03", "Sin alertas con valores en meta", evaluarAlertas({ glucemia_ayunas: 110, hba1c: 6.5, ldl: 80, hdl: 55, trigliceridos: 120, colesterol_total: 170, sarc_f: 1 }, { edad: 60, sexo: "F", imc: 23 }).length === 0);
const al = evaluarAlertas({ glucemia_ayunas: 65, glucemia_postprandial: 210, hba1c: 9.4, ldl: 130, hdl: 35, trigliceridos: 220, colesterol_total: 240, creatinina: 1.6, sarc_f: 6, fuerza_prension: 12, circunferencia_pantorrilla: 29 }, { edad: 66, sexo: "F", imc: 31 });
caso("SEG-04", "Alertas ante valores fuera de meta (12 indicadores)",
  ["Glucemia en ayunas", "Glucemia posprandial", "HbA1c", "Colesterol LDL", "Colesterol HDL", "Triglicéridos", "Colesterol total", "Función renal", "Sarcopenia", "Fuerza de prensión", "Circunferencia de pantorrilla", "IMC"].every((i) => tiene(al, i)),
  `${al.length} alertas`);
caso("SEG-05", "Hipoglucemia y HbA1c ≥ 9 se marcan como prioridad alta", al.find((a) => a.indicador === "Glucemia en ayunas")?.nivel === "alta" && al.find((a) => a.indicador === "HbA1c")?.nivel === "alta");

// ---------- Datos de prueba
const pass = "Seguimiento2026!";
const emailA = `seg.admin.${suf}@gessen.test`;
await db.query("INSERT INTO usuarios (nombre, apellido, email, password, id_rol, fecha_registro) VALUES ('Profesional', 'Seguimiento', $1, $2, 1, NOW())", [emailA, hashPassword(pass)]);
const tkA = (await api("POST", "/login", { body: { email: emailA, password: pass } })).d?.token;
const emailP = `seg.paciente.${suf}@gessen.test`;
const reg = await api("POST", "/usuarios", { body: { nombre: "Rosa", apellido: "Seguimiento", email: emailP, password: pass, genero: "Femenino", fecha_nacimiento: "1960-03-15", estatura: 155, peso: 72, id_departamento: 32 } });
const idP = reg.d?.id_usuario;
const login = await api("POST", "/login", { body: { email: emailP, password: pass } });
const tkP = login.d?.token;
caso("SEG-06", "El inicio de sesión informa si el paciente tiene IG medio autorizado", login.d?.user?.permiteIgMedio === false);
const inicial = await api("GET", "/usuarios/me/seguimiento", { token: tkP });
caso("SEG-07", "El registro crea la primera medición de la curva de peso", inicial.s === 200 && inicial.d.peso.length === 1 && inicial.d.peso[0].imc === 30, `IMC ${inicial.d?.peso?.[0]?.imc}`);

// ---------- Validación
const malos = [
  [{ hba1c: 50 }, "HbA1c de 50 %"], [{ glucemia_ayunas: -5 }, "glucemia negativa"], [{ sarc_f: 4.5 }, "SARC-F decimal"],
  [{ sarc_f: 11 }, "SARC-F de 11"], [{ ldl: "abc" }, "LDL texto"], [{}, "registro vacío"], [{ peso: 500 }, "peso de 500 kg"],
  [{ hba1c: 7, fecha: "2099-01-01" }, "fecha futura"], [{ hba1c: 7, fecha: "2025-02-30" }, "fecha inexistente"], [{ hba1c: 7, notas: "x".repeat(600) }, "notas de 600 caracteres"],
  [{ hdl: true }, "HDL booleano"],
];
let rechazados = 0;
for (const [b] of malos) if ((await api("POST", "/usuarios/me/seguimiento", { token: tkP, body: b })).s === 400) rechazados++;
caso("SEG-08", "Rechaza valores fuera de rango o inválidos", rechazados === malos.length, `${rechazados}/${malos.length} rechazados con HTTP 400`);
caso("SEG-09", "Sin sesión no se accede al seguimiento", (await api("GET", "/usuarios/me/seguimiento")).s === 401);

// ---------- Registro del paciente
const r1 = await api("POST", "/usuarios/me/seguimiento", { token: tkP, body: { fecha: "2026-07-10", glucemia_ayunas: 165, glucemia_postprandial: 210, hba1c: 8.1, peso: 74 } });
caso("SEG-10", "El paciente registra glucemias, HbA1c y peso", r1.s === 201 && r1.d.seguimiento.registros.length === 1);
const r2 = await api("POST", "/usuarios/me/seguimiento", { token: tkP, body: { fecha: "2026-09-12", colesterol_total: 230, ldl: 145, hdl: 42, trigliceridos: 190, creatinina: 1.3, peso: 71.5 } });
const seg = r2.d?.seguimiento;
caso("SEG-11", "Perfil lipídico y creatinina con TFG estimada", r2.s === 201 && seg.registros[0].tfg != null && seg.tfg === seg.registros[0].tfg, `TFG ${seg?.tfg}`);
caso("SEG-12", "Alertas usan el último valor de cada indicador", tiene(seg.alertas, "HbA1c") && tiene(seg.alertas, "Colesterol LDL") && tiene(seg.alertas, "Función renal") && tiene(seg.alertas, "Colesterol HDL"));
caso("SEG-13", "Curva de peso ordenada por fecha con IMC", seg.peso.length === 3 && seg.peso.map((x) => x.fecha).join() === [...seg.peso.map((x) => x.fecha)].sort().join() && seg.peso.every((x) => x.imc > 0));
const perfilPeso = (await db.query("SELECT peso FROM usuarios WHERE id_usuario = $1", [idP])).rows[0].peso;
caso("SEG-14", "El peso del perfil queda con la medición más reciente", Number(perfilPeso) === 72 || Number(perfilPeso) === 71.5, `peso ${perfilPeso}`);

// Cambio de peso desde el perfil
await api("PUT", "/usuarios/me", { token: tkP, body: { peso: 70 } });
await api("PUT", "/usuarios/me", { token: tkP, body: { peso: 70 } });
const trasPerfil = (await api("GET", "/usuarios/me/seguimiento", { token: tkP })).d;
caso("SEG-15", "Actualizar el peso en el perfil agrega una medición (sin duplicar)", trasPerfil.peso.filter((x) => x.peso === 70).length === 1, `${trasPerfil.peso.length} mediciones`);

// ---------- Profesional
const sarc = await api("POST", `/admin/seguimiento/${idP}`, { token: tkA, body: { sarc_f: 5, fuerza_prension: 14, circunferencia_pantorrilla: 30, notas: "Tamizaje en consulta" } });
caso("SEG-16", "El profesional registra el tamizaje de sarcopenia", sarc.s === 201 && tiene(sarc.d.seguimiento.alertas, "Sarcopenia") && tiene(sarc.d.seguimiento.alertas, "Fuerza de prensión"));
caso("SEG-17", "El registro indica quién lo hizo", /profesional/.test(sarc.d?.seguimiento?.registros?.[0]?.registrado_por || ""));
const vistaPac = (await api("GET", "/usuarios/me/seguimiento", { token: tkP })).d;
caso("SEG-18", "El paciente ve lo que registró el profesional", vistaPac.registros.some((r) => r.sarc_f === 5));
caso("SEG-19", "Un paciente no accede al seguimiento de otros (ruta admin)", (await api("GET", `/admin/seguimiento/${idP}`, { token: tkP })).s === 403);
const idAdmin = (await db.query("SELECT id_usuario FROM usuarios WHERE email = $1", [emailA])).rows[0].id_usuario;
caso("SEG-20", "El seguimiento de un administrador no existe (404)", (await api("GET", `/admin/seguimiento/${idAdmin}`, { token: tkA })).s === 404);
caso("SEG-21", "Identificador no numérico responde 400", (await api("GET", "/admin/seguimiento/abc", { token: tkA })).s === 400);

// Eliminación
const idBorrar = r1.d.id_seguimiento;
caso("SEG-22", "Un paciente no elimina registros de otro paciente", (await api("DELETE", `/usuarios/me/seguimiento/${sarc.d.id_seguimiento}`, { token: (await (async () => {
  const e = `seg.otro.${suf}@gessen.test`;
  await api("POST", "/usuarios", { body: { nombre: "Otro", apellido: "Paciente", email: e, password: pass, genero: "Masculino", fecha_nacimiento: "1965-01-01", estatura: 170, peso: 68, id_departamento: 32 } });
  return (await api("POST", "/login", { body: { email: e, password: pass } })).d?.token;
})()) })).s === 404);
const borr = await api("DELETE", `/admin/seguimiento/${idP}/${idBorrar}`, { token: tkA });
caso("SEG-23", "El profesional elimina un registro (y queda en el log)", borr.s === 200 && !borr.d.seguimiento.registros.some((r) => r.id_seguimiento === idBorrar)
  && (await db.query("SELECT 1 FROM logs WHERE accion = 'ELIMINAR_SEGUIMIENTO' AND id_entidad = $1", [idBorrar])).rows.length > 0);
// Se vuelve a registrar para que el paciente de prueba conserve sus datos
await api("POST", "/usuarios/me/seguimiento", { token: tkP, body: { fecha: "2026-07-10", glucemia_ayunas: 165, glucemia_postprandial: 210, hba1c: 8.1 } });

// ---------- IG medio y recomendador
caso("SEG-24", "Autorización IG medio valida el cuerpo", (await api("PUT", `/admin/usuarios/${idP}/ig-medio`, { token: tkA, body: { permitir: "si" } })).s === 400);
caso("SEG-25", "No se autoriza IG medio a un administrador", (await api("PUT", `/admin/usuarios/${idAdmin}/ig-medio`, { token: tkA, body: { permitir: true } })).s === 404);
const niveles = new Map((await db.query("SELECT id_platillo, LOWER(nivel_glucemico) n FROM platillos")).rows.map((r) => [String(r.id_platillo), r.n]));
const recSin = (await api("GET", "/platillos/recomendaciones-ml?limite=12", { token: tkP })).d;
caso("SEG-26", "Sin autorización, la IA solo sugiere IG bajo", recSin?.recomendaciones?.length > 0 && recSin.recomendaciones.every((r) => niveles.get(r.id) === "bajo"), `${recSin?.recomendaciones?.length} sugerencias`);
const aut = await api("PUT", `/admin/usuarios/${idP}/ig-medio`, { token: tkA, body: { permitir: true } });
const login2 = await api("POST", "/login", { body: { email: emailP, password: pass } });
caso("SEG-27", "El profesional autoriza IG medio y el paciente lo recibe al iniciar sesión", aut.s === 200 && login2.d?.user?.permiteIgMedio === true);
const recCon = (await api("GET", "/platillos/recomendaciones-ml?limite=30", { token: tkP })).d;
caso("SEG-28", "Con autorización, la IA puede sugerir IG medio y nunca alto", recCon.recomendaciones.every((r) => ["bajo", "medio"].includes(niveles.get(r.id))) && recCon.reglas?.niveles?.includes("medio"),
  `${recCon.recomendaciones.filter((r) => niveles.get(r.id) === "medio").length} de IG medio`);
caso("SEG-29", "Con IMC ≥ 25 la IA prioriza menos calorías y lo explica", recCon.reglas?.prioriza_menos_calorias === true && recCon.recomendaciones.some((r) => /calorías/.test(r.explicacion)), `IMC ${recCon.reglas?.imc}`);

// Efecto del IMC: el mismo paciente con IMC normal recibe sugerencias de más calorías en promedio
const cal = new Map((await db.query(`SELECT pi.id_platillo, SUM(v.cantidad_por_100g * pi.cantidad / 100.0)::float c
  FROM platillos_ingredientes pi JOIN ingrediente_valores_nutricionales v ON v.id_ingrediente = pi.id_ingrediente
  JOIN nutrientes n ON n.id_nutriente = v.id_nutriente AND n.nombre = 'Calorías' GROUP BY pi.id_platillo`)).rows.map((r) => [String(r.id_platillo), r.c]));
const prom = (l) => l.reduce((s, r) => s + (cal.get(r.id) || 0), 0) / l.length;
const calObeso = prom(recCon.recomendaciones.slice(0, 6));
await db.query("UPDATE usuarios SET peso = 55 WHERE id_usuario = $1", [idP]);
const recNormal = (await api("GET", "/platillos/recomendaciones-ml?limite=30", { token: tkP })).d;
await db.query("UPDATE usuarios SET peso = 70 WHERE id_usuario = $1", [idP]);
const calNormal = prom(recNormal.recomendaciones.slice(0, 6));
caso("SEG-30", "Las 6 primeras sugerencias con IMC ≥ 25 tienen menos calorías que con IMC normal", calObeso < calNormal && recNormal.reglas?.prioriza_menos_calorias === false,
  `${Math.round(calObeso)} kcal frente a ${Math.round(calNormal)} kcal`);

// ---------- Reporte y población
const rep = (await api("GET", `/admin/reporte/${idP}`, { token: tkA })).d;
caso("SEG-31", "El reporte del paciente incluye el seguimiento clínico", rep?.seguimiento?.registros?.length >= 3 && rep.seguimiento.alertas.length > 0);
const evo = await api("GET", "/admin/evolucion-imc", { token: tkA });
caso("SEG-32", "Evolución del IMC promedio de la población por mes", evo.s === 200 && evo.d.length > 0 && evo.d.every((m) => m.imc_promedio > 10 && m.pacientes > 0), `${evo.d?.length} meses`);
caso("SEG-33", "La evolución poblacional exige rol de administrador", (await api("GET", "/admin/evolucion-imc", { token: tkP })).s === 403);
const quitar = await api("PUT", `/admin/usuarios/${idP}/ig-medio`, { token: tkA, body: { permitir: false } });
const recQuitado = (await api("GET", "/platillos/recomendaciones-ml?limite=30", { token: tkP })).d;
caso("SEG-34", "Al retirar la autorización vuelve a solo IG bajo", quitar.s === 200 && recQuitado.recomendaciones.every((r) => niveles.get(r.id) === "bajo"));
// El paciente de prueba queda con IG medio autorizado para revisarlo en la interfaz
await api("PUT", `/admin/usuarios/${idP}/ig-medio`, { token: tkA, body: { permitir: true } });

const aprobados = resultados.filter((r) => r.estado === "Aprobado").length;
console.log(`\n${aprobados}/${resultados.length} pruebas aprobadas · paciente ${emailP}`);
writeFileSync(new URL("./resultados_seguimiento.json", import.meta.url), JSON.stringify({ fecha: new Date().toISOString(), base_datos: BD, aprobados, total: resultados.length, resultados }, null, 2));
await db.end();
process.exit(aprobados === resultados.length ? 0 : 1);
