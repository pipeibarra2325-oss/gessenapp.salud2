import pool from "../config/database.js";
import jwt from "jsonwebtoken";
import { hashPasswordAsync, isHashed, verifyPasswordAsync, errorPassword, huellaPassword } from "../utils/password.js";
import { registrarLog } from "../utils/logger.js";
import { fechaValida, idValido, errorTexto, errorNumero, limitadorPorIp } from "../utils/validacion.js";
import { construirSeguimiento, validarRegistro as validarSeguimiento, guardarSeguimiento, registrarCambioPeso } from "../utils/seguimiento.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lista de usuarios sin contraseñas. La ruta está protegida con authAdmin.
export const obtenerUsuarios = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT id_usuario, nombre, apellido, email, genero, telefono, fecha_nacimiento,
             estatura, peso, id_departamento, id_rol, fecha_registro
      FROM usuarios
      ORDER BY id_usuario
    `);
    res.json(resultado.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error en la base de datos" });
  }
};

// Valida los datos de registro. Devuelve un mensaje de error o null.
// completo: el registro de un paciente exige además los datos de salud (como en el formulario público)
export const validarRegistro = (datos, { completo = false, validarPassword = true } = {}) => {
  const { nombre, apellido, email, password, estatura, peso, telefono, genero, fecha_nacimiento, id_departamento, id_region } = datos || {};
  if (!nombre || !apellido || !email || (validarPassword && !password)) {
    return "Nombre, apellido, correo y contraseña son obligatorios";
  }
  // Tipos y longitudes máximas de las columnas de la tabla usuarios
  const e = errorTexto(nombre, "El nombre", 100, { obligatorio: true }) || errorTexto(apellido, "El apellido", 100, { obligatorio: true })
    || errorTexto(email, "El correo electrónico", 150, { obligatorio: true })
    || errorTexto(telefono == null ? telefono : String(telefono), "El teléfono", 20) || errorTexto(genero, "El género", 20);
  if (e) return e;
  if (!EMAIL_RE.test(email.trim())) return "El correo electrónico no es válido";
  if (validarPassword) { const ep = errorPassword(password); if (ep) return ep; }
  const en = errorNumero(estatura, "La estatura (cm)", 50, 250) || errorNumero(peso, "El peso (kg)", 20, 300);
  if (en) return en;
  if (fecha_nacimiento) {
    const hoy = new Date().toLocaleDateString("en-CA");
    if (!fechaValida(String(fecha_nacimiento).slice(0, 10)) || String(fecha_nacimiento).slice(0, 10) > hoy || String(fecha_nacimiento) < "1900-01-01") {
      return "La fecha de nacimiento no es válida";
    }
  }
  if (id_departamento != null && id_departamento !== "" && !idValido(id_departamento)) return "El departamento no es válido";
  if (id_region != null && id_region !== "" && !idValido(id_region)) return "La región no es válida";
  if (completo) {
    if (!genero || !fecha_nacimiento || estatura == null || estatura === "" || peso == null || peso === "" || !id_departamento) {
      return "Género, fecha de nacimiento, estatura, peso y departamento son obligatorios";
    }
  }
  return null;
};

// Registro público: máximo 20 cuentas por IP cada hora (los administradores no tienen este límite)
const limiteRegistro = limitadorPorIp({ max: 20, ventanaMs: 60 * 60 * 1000, mensaje: "Se crearon demasiadas cuentas desde esta conexión." });
const esAdministrador = (req) => {
  try {
    const t = (req.headers.authorization || "").split(" ")[1];
    const d = t && jwt.verify(t, process.env.JWT_SECRET);
    return d && (d.id_rol === 1 || d.role === 1);
  } catch { return false; }
};

export const crearUsuario = async (req, res) => {
  try {
    const admin = esAdministrador(req);
    if (!admin && limiteRegistro.bloqueado(req, res)) return;
    const error = validarRegistro(req.body, { completo: true });
    if (error) return res.status(400).json({ error });

    const {
      nombre, apellido, email, password, genero,
      telefono, fecha_nacimiento, estatura, peso, id_departamento, id_region
    } = req.body;

    // El registro público siempre crea usuarios normales (id_rol 2).
    const resultado = await pool.query(`
      INSERT INTO usuarios (
        nombre, apellido, email, password, genero, telefono,
        fecha_nacimiento, estatura, peso, id_departamento, id_region,
        id_rol, fecha_registro
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 2, NOW())
      RETURNING id_usuario, nombre, apellido, email, genero, telefono,
                fecha_nacimiento, estatura, peso, id_departamento, id_region, id_rol, fecha_registro;
    `, [
      nombre.trim(), apellido.trim(), email.trim().toLowerCase(), await hashPasswordAsync(password),
      genero || null, telefono || null, fecha_nacimiento || null,
      estatura || null, peso || null, id_departamento || null, id_region || null
    ]);

    const usuario = resultado.rows[0];
    if (!admin) limiteRegistro.contar(req);
    // Primera medición de la curva de peso
    await registrarCambioPeso(usuario.id_usuario, req.user?.id_usuario ?? usuario.id_usuario);
    await registrarLog(req, "REGISTRO_USUARIO", { entidad: "usuarios", id_entidad: usuario.id_usuario, id_usuario: req.user?.id_usuario ?? usuario.id_usuario });
    res.status(201).json(usuario);

  } catch (error) {
    console.error("Error al crear usuario:", error);

    if (error.code === '23505' && error.detail?.includes('email')) {
      return res.status(409).json({ error: "El correo electrónico ya está registrado" });
    }
    if (error.code === '23503') return res.status(400).json({ error: "El departamento o la región no existen" });

    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

// Token de sesión (24 h). Incluye la huella de la contraseña: al cambiarla, las sesiones anteriores se cierran.
export const firmarToken = (usuario, passwordGuardada) => jwt.sign(
  {
    id_usuario: usuario.id_usuario,
    id_rol: usuario.id_rol,
    email: usuario.email,
    role: usuario.id_rol,
    pv: huellaPassword(passwordGuardada)
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Límite de intentos fallidos de inicio de sesión por correo (en memoria del servidor):
// tras 5 fallos en 15 minutos se bloquea ese correo durante 15 minutos
const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
const intentosFallidos = new Map();

const bloqueoRestante = (clave) => {
  const r = intentosFallidos.get(clave);
  if (!r) return 0;
  if (Date.now() - r.desde > VENTANA_MS) { intentosFallidos.delete(clave); return 0; }
  return r.n >= MAX_INTENTOS ? Math.ceil((r.desde + VENTANA_MS - Date.now()) / 60000) : 0;
};

// Además, por IP: desde 20 fallos en 15 minutos cada nuevo intento fallido se retrasa (1 s más por fallo, hasta 10 s),
// sin bloquear a otras personas que comparten la conexión (por ejemplo, la red de una clínica);
// solo con 200 fallos se bloquea la IP, señal de un ataque automatizado.
const limiteLoginIp = limitadorPorIp({ max: 200, ventanaMs: VENTANA_MS, mensaje: "Demasiados intentos fallidos desde esta conexión." });
const RETRASO_DESDE = 20;

const registrarFallo = (clave) => {
  const r = intentosFallidos.get(clave);
  if (!r || Date.now() - r.desde > VENTANA_MS) intentosFallidos.set(clave, { n: 1, desde: Date.now() });
  else r.n += 1;
};

export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        error: "Email y contraseña son obligatorios"
      });
    }
    if (limiteLoginIp.bloqueado(req, res)) return;

    const clave = email.trim().toLowerCase();
    const minutos = bloqueoRestante(clave);
    if (minutos > 0) {
      return res.status(429).json({
        success: false,
        error: `Demasiados intentos fallidos. Intenta de nuevo en ${minutos} minuto(s).`
      });
    }

    const resultado = await pool.query(`
      SELECT
        u.id_usuario, u.nombre, u.apellido, u.email, u.password, u.telefono,
        u.genero, u.estatura, u.peso, u.fecha_nacimiento, u.id_rol, u.id_departamento, u.id_region, u.permite_ig_medio,
        d.nombre_departamento as departamento,
        rg.nombre_region as region,
        r.nombre_rol as rol
      FROM usuarios u
      LEFT JOIN departamentos d ON u.id_departamento = d.id_departamento
      LEFT JOIN regiones rg ON rg.id_region = COALESCE(u.id_region, d.id_region)
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      WHERE u.email = $1;
    `, [email.trim().toLowerCase()]);

    const usuario = resultado.rows[0];

    if (!usuario || !(await verifyPasswordAsync(password, usuario.password))) {
      registrarFallo(clave);
      limiteLoginIp.contar(req);
      // Solo los intentos fallidos se retrasan: quien escribe la contraseña correcta entra sin esperar
      const fallosIp = limiteLoginIp.cuenta(req);
      if (fallosIp >= RETRASO_DESDE) {
        await new Promise((r) => setTimeout(r, Math.min(10000, (fallosIp - RETRASO_DESDE + 1) * 1000)));
      }
      await registrarLog(req, "LOGIN_FALLIDO", { entidad: "usuarios", id_usuario: usuario?.id_usuario ?? null, detalle: { email: email.trim().toLowerCase() } });
      return res.status(401).json({
        success: false,
        error: "Credenciales incorrectas"
      });
    }

    intentosFallidos.delete(clave);

    // Migración: las contraseñas antiguas en texto plano se cifran tras un inicio de sesión correcto.
    let guardada = usuario.password;
    if (!isHashed(usuario.password)) {
      guardada = await hashPasswordAsync(password);
      await pool.query("UPDATE usuarios SET password = $1 WHERE id_usuario = $2", [guardada, usuario.id_usuario]);
    }

    const token = firmarToken(usuario, guardada);

    await registrarLog(req, "LOGIN", { entidad: "usuarios", id_entidad: usuario.id_usuario, id_usuario: usuario.id_usuario });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: usuario.id_usuario,
        id_usuario: usuario.id_usuario,
        name: usuario.nombre,
        lastName: usuario.apellido,
        email: usuario.email,
        phone: usuario.telefono,
        genero: usuario.genero,
        department: usuario.departamento,
        id_departamento: usuario.id_departamento,
        region: usuario.region,
        id_region: usuario.id_region,
        height: usuario.estatura,
        weight: usuario.peso,
        birthDate: usuario.fecha_nacimiento,
        id_role: usuario.id_rol,
        id_rol: usuario.id_rol,
        role: usuario.id_rol,
        rol: usuario.rol,
        permiteIgMedio: usuario.permite_ig_medio
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor"
    });
  }
};

// ==================== PERFIL DEL USUARIO AUTENTICADO ====================
const PERFIL_SQL = `
  SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.telefono, u.genero, u.estatura, u.peso,
         u.fecha_nacimiento, u.id_departamento, u.id_region, u.id_rol, u.permite_ig_medio, d.nombre_departamento AS departamento,
         rg.nombre_region AS region, r.nombre_rol AS rol
  FROM usuarios u
  LEFT JOIN departamentos d ON u.id_departamento = d.id_departamento
  LEFT JOIN regiones rg ON rg.id_region = COALESCE(u.id_region, d.id_region)
  LEFT JOIN roles r ON u.id_rol = r.id_rol
  WHERE u.id_usuario = $1
`;

// Mismo formato de usuario que devuelve el inicio de sesión
const formatoUsuario = (u) => ({
  id: u.id_usuario, id_usuario: u.id_usuario, name: u.nombre, lastName: u.apellido, email: u.email,
  phone: u.telefono, genero: u.genero, department: u.departamento, id_departamento: u.id_departamento,
  region: u.region, id_region: u.id_region, height: u.estatura, weight: u.peso, birthDate: u.fecha_nacimiento,
  id_role: u.id_rol, id_rol: u.id_rol, role: u.id_rol, rol: u.rol, permiteIgMedio: u.permite_ig_medio,
});

export const actualizarMiPerfil = async (req, res) => {
  try {
    const id = req.user.id_usuario;
    const actual = (await pool.query("SELECT nombre, apellido, email, peso, estatura FROM usuarios WHERE id_usuario = $1", [id])).rows[0];
    if (!actual) return res.status(404).json({ error: "Usuario no encontrado" });

    const datos = {
      nombre: req.body.nombre ?? actual.nombre,
      apellido: req.body.apellido ?? actual.apellido,
      email: typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : (req.body.email ?? actual.email),
      estatura: req.body.estatura,
      peso: req.body.peso,
      telefono: req.body.telefono,
      genero: req.body.genero,
      fecha_nacimiento: req.body.fecha_nacimiento,
    };
    const error = validarRegistro({ ...datos, id_departamento: req.body.id_departamento, id_region: req.body.id_region }, { validarPassword: false });
    if (error) return res.status(400).json({ error });

    await pool.query(`
      UPDATE usuarios SET
        nombre = $1, apellido = $2, email = $3,
        telefono = COALESCE($4, telefono), genero = COALESCE($5, genero),
        fecha_nacimiento = COALESCE($6, fecha_nacimiento),
        estatura = COALESCE($7, estatura), peso = COALESCE($8, peso),
        id_departamento = COALESCE($9, id_departamento),
        id_region = CASE WHEN $11 THEN $12::int ELSE id_region END
      WHERE id_usuario = $10
    `, [datos.nombre.trim(), datos.apellido.trim(), datos.email,
        req.body.telefono || null, req.body.genero || null, req.body.fecha_nacimiento || null,
        req.body.estatura || null, req.body.peso || null, req.body.id_departamento || null, id,
        "id_region" in req.body, req.body.id_region || null]);

    const usuario = (await pool.query(PERFIL_SQL, [id])).rows[0];
    // Un cambio de peso o estatura queda en el historial (curva de peso e IMC)
    if (Number(usuario.peso) !== Number(actual.peso) || Number(usuario.estatura) !== Number(actual.estatura)) {
      await registrarCambioPeso(id, id);
    }
    await registrarLog(req, "ACTUALIZAR_PERFIL", { entidad: "usuarios", id_entidad: id, detalle: { campos: Object.keys(req.body) } });
    res.json({ success: true, user: formatoUsuario(usuario) });
  } catch (error) {
    if (error.code === "23505" && error.detail?.includes("email")) {
      return res.status(409).json({ error: "El correo electrónico ya está registrado" });
    }
    if (error.code === "23503") return res.status(400).json({ error: "El departamento o la región no existen" });
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ error: "Error al actualizar el perfil" });
  }
};

export const cambiarMiPassword = async (req, res) => {
  try {
    const { actual, nueva } = req.body || {};
    if (!actual || !nueva) return res.status(400).json({ error: "Debes indicar la contraseña actual y la nueva" });
    const ep = errorPassword(nueva);
    if (ep) return res.status(400).json({ error: ep.replace("La contraseña", "La nueva contraseña") });

    const { rows } = await pool.query("SELECT password FROM usuarios WHERE id_usuario = $1", [req.user.id_usuario]);
    if (!rows[0] || !(await verifyPasswordAsync(String(actual), rows[0].password))) {
      return res.status(400).json({ error: "La contraseña actual no es correcta" });
    }

    const hash = await hashPasswordAsync(nueva);
    await pool.query("UPDATE usuarios SET password = $1 WHERE id_usuario = $2", [hash, req.user.id_usuario]);
    await registrarLog(req, "CAMBIAR_PASSWORD", { entidad: "usuarios", id_entidad: req.user.id_usuario });
    // Las demás sesiones se cierran; esta continúa con un token nuevo
    res.json({ success: true, message: "Contraseña actualizada", token: firmarToken(req.user, hash) });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ error: "Error al cambiar la contraseña" });
  }
};

// ==================== SEGUIMIENTO CLÍNICO DEL PACIENTE ====================
export const obtenerMiSeguimiento = async (req, res) => {
  try {
    const seg = await construirSeguimiento(req.user.id_usuario);
    if (!seg) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(seg);
  } catch (error) {
    console.error("Error obteniendo seguimiento:", error);
    res.status(500).json({ error: "Error obteniendo el seguimiento clínico" });
  }
};

export const registrarMiSeguimiento = async (req, res) => {
  try {
    const v = validarSeguimiento(req.body);
    if (v.error) return res.status(400).json({ error: v.error });
    const id = req.user.id_usuario;
    const idSeg = await guardarSeguimiento(id, id, v);
    await registrarLog(req, "REGISTRAR_SEGUIMIENTO", { entidad: "seguimiento_clinico", id_entidad: idSeg, detalle: { paciente: id, campos: Object.keys(v.datos), peso: v.peso, fecha: v.fecha } });
    res.status(201).json({ success: true, id_seguimiento: idSeg, seguimiento: await construirSeguimiento(id) });
  } catch (error) {
    console.error("Error registrando seguimiento:", error);
    res.status(500).json({ error: "Error guardando el registro clínico" });
  }
};

export const eliminarMiSeguimiento = async (req, res) => {
  try {
    if (!idValido(req.params.idSeg)) return res.status(400).json({ error: "Identificador inválido" });
    const r = await pool.query("DELETE FROM seguimiento_clinico WHERE id_seguimiento = $1 AND id_usuario = $2 RETURNING id_seguimiento",
      [req.params.idSeg, req.user.id_usuario]);
    if (!r.rows[0]) return res.status(404).json({ error: "Registro no encontrado" });
    await registrarLog(req, "ELIMINAR_SEGUIMIENTO", { entidad: "seguimiento_clinico", id_entidad: Number(req.params.idSeg), detalle: { paciente: req.user.id_usuario } });
    res.json({ success: true, seguimiento: await construirSeguimiento(req.user.id_usuario) });
  } catch (error) {
    console.error("Error eliminando seguimiento:", error);
    res.status(500).json({ error: "Error eliminando el registro" });
  }
};
