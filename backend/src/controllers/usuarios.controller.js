import pool from "../config/database.js";
import jwt from "jsonwebtoken";
import { hashPassword, isHashed, verifyPassword } from "../utils/password.js";
import { registrarLog } from "../utils/logger.js";

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
export const validarRegistro = ({ nombre, apellido, email, password, estatura, peso }) => {
  if (!nombre?.trim() || !apellido?.trim() || !email?.trim() || !password) {
    return "Nombre, apellido, correo y contraseña son obligatorios";
  }
  if (!EMAIL_RE.test(email.trim())) return "El correo electrónico no es válido";
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres";
  if (estatura != null && estatura !== "" && (Number(estatura) < 50 || Number(estatura) > 250)) {
    return "La estatura debe estar entre 50 y 250 cm";
  }
  if (peso != null && peso !== "" && (Number(peso) < 20 || Number(peso) > 300)) {
    return "El peso debe estar entre 20 y 300 kg";
  }
  return null;
};

export const crearUsuario = async (req, res) => {
  try {
    const error = validarRegistro(req.body);
    if (error) return res.status(400).json({ error });

    const {
      nombre, apellido, email, password, genero,
      telefono, fecha_nacimiento, estatura, peso, id_departamento
    } = req.body;

    // El registro público siempre crea usuarios normales (id_rol 2).
    const resultado = await pool.query(`
      INSERT INTO usuarios (
        nombre, apellido, email, password, genero, telefono,
        fecha_nacimiento, estatura, peso, id_departamento,
        id_rol, fecha_registro
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 2, NOW())
      RETURNING id_usuario, nombre, apellido, email, genero, telefono,
                fecha_nacimiento, estatura, peso, id_departamento, id_rol, fecha_registro;
    `, [
      nombre.trim(), apellido.trim(), email.trim().toLowerCase(), hashPassword(password),
      genero || null, telefono || null, fecha_nacimiento || null,
      estatura || null, peso || null, id_departamento || null
    ]);

    const usuario = resultado.rows[0];
    await registrarLog(req, "REGISTRO_USUARIO", { entidad: "usuarios", id_entidad: usuario.id_usuario, id_usuario: req.user?.id_usuario ?? usuario.id_usuario });
    res.status(201).json(usuario);

  } catch (error) {
    console.error("Error al crear usuario:", error);

    if (error.code === '23505' && error.detail?.includes('email')) {
      return res.status(409).json({ error: "El correo electrónico ya está registrado" });
    }

    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        error: "Email y contraseña son obligatorios"
      });
    }

    const resultado = await pool.query(`
      SELECT
        u.id_usuario, u.nombre, u.apellido, u.email, u.password, u.telefono,
        u.genero, u.estatura, u.peso, u.fecha_nacimiento, u.id_rol, u.id_departamento,
        d.nombre_departamento as departamento,
        rg.nombre_region as region,
        r.nombre_rol as rol
      FROM usuarios u
      LEFT JOIN departamentos d ON u.id_departamento = d.id_departamento
      LEFT JOIN regiones rg ON d.id_region = rg.id_region
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      WHERE u.email = $1;
    `, [email.trim().toLowerCase()]);

    const usuario = resultado.rows[0];

    if (!usuario || !verifyPassword(password, usuario.password)) {
      await registrarLog(req, "LOGIN_FALLIDO", { entidad: "usuarios", id_usuario: usuario?.id_usuario ?? null, detalle: { email: email.trim().toLowerCase() } });
      return res.status(401).json({
        success: false,
        error: "Credenciales incorrectas"
      });
    }

    // Migración: las contraseñas antiguas en texto plano se cifran tras un inicio de sesión correcto.
    if (!isHashed(usuario.password)) {
      await pool.query("UPDATE usuarios SET password = $1 WHERE id_usuario = $2", [
        hashPassword(password), usuario.id_usuario
      ]);
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        id_rol: usuario.id_rol,
        email: usuario.email,
        role: usuario.id_rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

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
        height: usuario.estatura,
        weight: usuario.peso,
        birthDate: usuario.fecha_nacimiento,
        id_role: usuario.id_rol,
        id_rol: usuario.id_rol,
        role: usuario.id_rol,
        rol: usuario.rol
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
         u.fecha_nacimiento, u.id_departamento, u.id_rol, d.nombre_departamento AS departamento,
         rg.nombre_region AS region, r.nombre_rol AS rol
  FROM usuarios u
  LEFT JOIN departamentos d ON u.id_departamento = d.id_departamento
  LEFT JOIN regiones rg ON d.id_region = rg.id_region
  LEFT JOIN roles r ON u.id_rol = r.id_rol
  WHERE u.id_usuario = $1
`;

// Mismo formato de usuario que devuelve el inicio de sesión
const formatoUsuario = (u) => ({
  id: u.id_usuario, id_usuario: u.id_usuario, name: u.nombre, lastName: u.apellido, email: u.email,
  phone: u.telefono, genero: u.genero, department: u.departamento, id_departamento: u.id_departamento,
  region: u.region, height: u.estatura, weight: u.peso, birthDate: u.fecha_nacimiento,
  id_role: u.id_rol, id_rol: u.id_rol, role: u.id_rol, rol: u.rol,
});

export const actualizarMiPerfil = async (req, res) => {
  try {
    const id = req.user.id_usuario;
    const actual = (await pool.query("SELECT nombre, apellido, email FROM usuarios WHERE id_usuario = $1", [id])).rows[0];
    if (!actual) return res.status(404).json({ error: "Usuario no encontrado" });

    const datos = {
      nombre: req.body.nombre ?? actual.nombre,
      apellido: req.body.apellido ?? actual.apellido,
      email: (req.body.email ?? actual.email).trim().toLowerCase(),
      password: "no-se-valida-aqui",
      estatura: req.body.estatura,
      peso: req.body.peso,
    };
    const error = validarRegistro(datos);
    if (error) return res.status(400).json({ error });

    await pool.query(`
      UPDATE usuarios SET
        nombre = $1, apellido = $2, email = $3,
        telefono = COALESCE($4, telefono), genero = COALESCE($5, genero),
        fecha_nacimiento = COALESCE($6, fecha_nacimiento),
        estatura = COALESCE($7, estatura), peso = COALESCE($8, peso),
        id_departamento = COALESCE($9, id_departamento)
      WHERE id_usuario = $10
    `, [datos.nombre.trim(), datos.apellido.trim(), datos.email,
        req.body.telefono || null, req.body.genero || null, req.body.fecha_nacimiento || null,
        req.body.estatura || null, req.body.peso || null, req.body.id_departamento || null, id]);

    const usuario = (await pool.query(PERFIL_SQL, [id])).rows[0];
    await registrarLog(req, "ACTUALIZAR_PERFIL", { entidad: "usuarios", id_entidad: id, detalle: { campos: Object.keys(req.body) } });
    res.json({ success: true, user: formatoUsuario(usuario) });
  } catch (error) {
    if (error.code === "23505" && error.detail?.includes("email")) {
      return res.status(409).json({ error: "El correo electrónico ya está registrado" });
    }
    if (error.code === "23503") return res.status(400).json({ error: "El departamento no existe" });
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ error: "Error al actualizar el perfil" });
  }
};

export const cambiarMiPassword = async (req, res) => {
  try {
    const { actual, nueva } = req.body || {};
    if (!actual || !nueva) return res.status(400).json({ error: "Debes indicar la contraseña actual y la nueva" });
    if (nueva.length < 6) return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });

    const { rows } = await pool.query("SELECT password FROM usuarios WHERE id_usuario = $1", [req.user.id_usuario]);
    if (!rows[0] || !verifyPassword(actual, rows[0].password)) {
      return res.status(400).json({ error: "La contraseña actual no es correcta" });
    }

    await pool.query("UPDATE usuarios SET password = $1 WHERE id_usuario = $2", [hashPassword(nueva), req.user.id_usuario]);
    await registrarLog(req, "CAMBIAR_PASSWORD", { entidad: "usuarios", id_entidad: req.user.id_usuario });
    res.json({ success: true, message: "Contraseña actualizada" });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ error: "Error al cambiar la contraseña" });
  }
};
