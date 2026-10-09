// backend/src/routes/admin.routes.js
import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { authAdmin } from "../middlewares/authAdmin.js";
import pool from "../config/database.js";
import { hashPasswordAsync, errorPassword } from "../utils/password.js";
import { firmarToken } from "../controllers/usuarios.controller.js";
import { registrarLog } from "../utils/logger.js";
import { NUTRIENTES_PLATILLO_SQL } from "../utils/nutricion.js";
import { validarRegistro } from "../controllers/usuarios.controller.js";
import { construirReporte } from "../utils/reporte.js";
import { entrenar as entrenarModelo, estado as estadoModelo } from "../ml/recomendador.js";
import { fechaValida, validarParamId, idValido, errorTexto, errorNumero } from "../utils/validacion.js";
import { invalidarCatalogo } from "../controllers/platillos.controller.js";
import { construirSeguimiento, validarRegistro as validarSeguimiento, guardarSeguimiento, evolucionPoblacional } from "../utils/seguimiento.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");

// Todas las rutas de este archivo exigen rol de administrador
router.use(authAdmin);
// Los identificadores de las rutas deben ser números enteros positivos (400 en lugar de un error 500)
router.param("id", validarParamId);

const NIVELES = ["Bajo", "Medio", "Alto"];
const normalizarNivel = (n) => {
  const v = String(n || "").trim().toLowerCase();
  return NIVELES.find((x) => x.toLowerCase() === v) || null;
};

// =============================
// 👤 USUARIOS
// =============================
router.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id_usuario, u.nombre, u.apellido, u.email, u.genero, u.fecha_nacimiento,
        u.estatura, u.peso,
        d.nombre_departamento as departamento,
        r.nombre_rol as rol,
        u.fecha_registro,
        -- Activo: registró al menos un consumo en los últimos 30 días
        CASE WHEN EXISTS (SELECT 1 FROM historial_consumo h WHERE h.id_usuario = u.id_usuario
                          AND h.fecha_consumo > CURRENT_DATE - 30) THEN 'Activo' ELSE 'Inactivo' END as estado,
        (SELECT COUNT(*) FROM historial_consumo h WHERE h.id_usuario = u.id_usuario)::int as registros,
        (SELECT MAX(h.fecha_consumo) FROM historial_consumo h WHERE h.id_usuario = u.id_usuario) as ultimo_registro
      FROM usuarios u
      LEFT JOIN departamentos d ON u.id_departamento = d.id_departamento
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      WHERE u.id_rol = 2
      ORDER BY u.fecha_registro DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ success: false, error: "Error al obtener usuarios" });
  }
});

router.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, password } = req.body || {};

    const error = errorTexto(nombre, "El nombre", 100, { obligatorio: true }) || errorTexto(apellido, "El apellido", 100);
    if (error) return res.status(400).json({ success: false, error });
    // Contraseña nueva opcional: el profesional restablece el acceso de un paciente que la olvidó
    if (password != null && password !== "") {
      const ep = errorPassword(password);
      if (ep) return res.status(400).json({ success: false, error: ep });
    }

    // Solo se editan pacientes: los administradores se gestionan en su propia sección
    const result = await pool.query(
      "UPDATE usuarios SET nombre = $1, apellido = COALESCE($2, apellido), password = COALESCE($4, password) WHERE id_usuario = $3 AND id_rol = 2 RETURNING id_usuario",
      [nombre.trim(), apellido?.trim() || null, id, password ? await hashPasswordAsync(password) : null]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: "Paciente no encontrado" });

    await registrarLog(req, "EDITAR_USUARIO", { entidad: "usuarios", id_entidad: Number(id), detalle: { nombre, apellido, restablecio_password: Boolean(password) } });
    res.json({ success: true, message: password ? "Usuario actualizado y contraseña restablecida" : "Usuario actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al actualizar usuario" });
  }
});

router.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id_usuario) {
      return res.status(400).json({ success: false, error: "No puedes eliminar tu propia cuenta" });
    }
    // El historial, favoritos, calificaciones y enfermedades se eliminan en cascada (migración 001)
    // Solo se eliminan pacientes: a un administrador se le quita el rol en su sección (que exige dejar al menos uno)
    const result = await pool.query("DELETE FROM usuarios WHERE id_usuario = $1 AND id_rol = 2 RETURNING email", [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: "Paciente no encontrado" });

    await registrarLog(req, "ELIMINAR_USUARIO", { entidad: "usuarios", id_entidad: Number(id), detalle: { email: result.rows[0].email } });
    res.json({ success: true, message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al eliminar usuario" });
  }
});

// =============================
// 🍽️ PLATILLOS
// =============================
router.get("/categorias", async (req, res) => {
  try {
    const result = await pool.query("SELECT id_categoria, nombre FROM categorias_platillo ORDER BY id_categoria");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener categorías" });
  }
});

router.get("/platillos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id_platillo, p.nombre_platillo, p.descripcion, p.nivel_glucemico,
        p.porcion_gramos, p.id_categoria, c.nombre as categoria, p.tiempo_preparacion,
        p.imagen_url, p.imagen_credito, p.fecha_creacion,
        COALESCE(nt.calorias, 0) as calorias,
        (SELECT COUNT(*) FROM historial_consumo h WHERE h.id_platillo = p.id_platillo)::int as consumos,
        (SELECT COUNT(*) FROM platillos_ingredientes pi WHERE pi.id_platillo = p.id_platillo)::int as ingredientes
      FROM platillos p
      LEFT JOIN categorias_platillo c ON c.id_categoria = p.id_categoria
      LEFT JOIN (${NUTRIENTES_PLATILLO_SQL}) nt ON nt.id_platillo = p.id_platillo
      ORDER BY p.fecha_creacion DESC, p.id_platillo DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener platillos" });
  }
});

const validarPlatillo = (body = {}) => {
  const e = errorTexto(body.nombre_platillo, "El nombre del platillo", 150, { obligatorio: true })
    || errorTexto(body.descripcion, "La descripción", 2000)
    || errorTexto(body.imagen_url, "La dirección de la imagen", 1000)
    || errorTexto(body.imagen_credito, "El crédito de la imagen", 300);
  if (e) return e;
  if (!normalizarNivel(body.nivel_glucemico)) return "El nivel glucémico debe ser Bajo, Medio o Alto";
  if (!body.id_categoria) return "La categoría es obligatoria";
  if (!idValido(body.id_categoria)) return "La categoría no es válida";
  const en = errorNumero(body.tiempo_preparacion, "El tiempo de preparación (min)", 0, 1440)
    || errorNumero(body.porcion_gramos, "La porción (g)", 0, 5000);
  if (en) return en;
  if (body.tiempo_preparacion != null && body.tiempo_preparacion !== "" && !Number.isInteger(Number(body.tiempo_preparacion))) {
    return "El tiempo de preparación debe ser un número entero de minutos";
  }
  return null;
};

router.post("/platillos", async (req, res) => {
  try {
    const error = validarPlatillo(req.body);
    if (error) return res.status(400).json({ success: false, error });

    const { nombre_platillo, descripcion, nivel_glucemico, porcion_gramos,
            id_categoria, tiempo_preparacion, imagen_url, imagen_credito } = req.body;

    const result = await pool.query(`
      INSERT INTO platillos (nombre_platillo, descripcion, nivel_glucemico, porcion_gramos,
                             id_categoria, tiempo_preparacion, imagen_url, imagen_credito, fecha_creacion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id_platillo
    `, [nombre_platillo.trim(), descripcion?.trim() || null, normalizarNivel(nivel_glucemico),
        porcion_gramos || null, id_categoria, tiempo_preparacion || null, imagen_url || null, imagen_credito || null]);

    const id = result.rows[0].id_platillo;
    invalidarCatalogo();
    await registrarLog(req, "CREAR_PLATILLO", { entidad: "platillos", id_entidad: id, detalle: { nombre_platillo } });
    res.status(201).json({ success: true, id_platillo: id, message: "Platillo creado correctamente" });
  } catch (error) {
    if (error.code === "23503") return res.status(400).json({ success: false, error: "La categoría no existe" });
    console.error(error);
    res.status(500).json({ success: false, error: "Error al crear platillo" });
  }
});

router.put("/platillos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const error = validarPlatillo(req.body);
    if (error) return res.status(400).json({ success: false, error });

    const { nombre_platillo, descripcion, nivel_glucemico, porcion_gramos,
            id_categoria, tiempo_preparacion, imagen_url, imagen_credito } = req.body;

    const result = await pool.query(`
      UPDATE platillos SET
        nombre_platillo = $1, descripcion = $2, nivel_glucemico = $3,
        porcion_gramos = $4, id_categoria = $5, tiempo_preparacion = $6,
        imagen_url = $7, imagen_credito = $8
      WHERE id_platillo = $9
    `, [nombre_platillo.trim(), descripcion?.trim() || null, normalizarNivel(nivel_glucemico),
        porcion_gramos || null, id_categoria, tiempo_preparacion || null,
        imagen_url || null, imagen_credito || null, id]);

    if (result.rowCount === 0) return res.status(404).json({ success: false, error: "Platillo no encontrado" });

    invalidarCatalogo();
    await registrarLog(req, "EDITAR_PLATILLO", { entidad: "platillos", id_entidad: Number(id), detalle: { nombre_platillo } });
    res.json({ success: true, message: "Platillo actualizado correctamente" });
  } catch (error) {
    if (error.code === "23503") return res.status(400).json({ success: false, error: "La categoría no existe" });
    console.error(error);
    res.status(500).json({ success: false, error: "Error al actualizar platillo" });
  }
});

router.delete("/platillos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const consumos = await pool.query("SELECT COUNT(*)::int AS n FROM historial_consumo WHERE id_platillo = $1", [id]);
    if (consumos.rows[0].n > 0) {
      return res.status(409).json({
        success: false,
        error: `No se puede eliminar: el platillo tiene ${consumos.rows[0].n} consumo(s) registrados en el historial de los pacientes`
      });
    }

    const result = await pool.query("DELETE FROM platillos WHERE id_platillo = $1 RETURNING nombre_platillo", [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: "Platillo no encontrado" });

    invalidarCatalogo();
    await registrarLog(req, "ELIMINAR_PLATILLO", { entidad: "platillos", id_entidad: Number(id), detalle: { nombre_platillo: result.rows[0].nombre_platillo } });
    res.json({ success: true, message: "Platillo eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al eliminar platillo" });
  }
});

// Ingredientes disponibles para armar recetas
router.get("/ingredientes", async (req, res) => {
  try {
    const result = await pool.query("SELECT id_ingrediente, nombre_ingrediente FROM ingredientes ORDER BY nombre_ingrediente");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener ingredientes" });
  }
});

// Ingredientes de un platillo con su cantidad en gramos
router.get("/platillos/:id/ingredientes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pi.id_ingrediente, i.nombre_ingrediente, pi.cantidad::float AS cantidad
      FROM platillos_ingredientes pi
      JOIN ingredientes i ON i.id_ingrediente = pi.id_ingrediente
      WHERE pi.id_platillo = $1
      ORDER BY pi.cantidad DESC, i.nombre_ingrediente
    `, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener los ingredientes del platillo" });
  }
});

// Reemplaza los ingredientes de un platillo. Body: { ingredientes: [{ id_ingrediente, cantidad }] }
router.put("/platillos/:id/ingredientes", async (req, res) => {
  const lista = req.body?.ingredientes;
  if (!Array.isArray(lista) || lista.length === 0) {
    return res.status(400).json({ success: false, error: "Agrega al menos un ingrediente" });
  }
  const ids = lista.map((x) => Number(x.id_ingrediente));
  if (ids.some((x) => !Number.isInteger(x) || x <= 0)) {
    return res.status(400).json({ success: false, error: "Hay un ingrediente no válido" });
  }
  if (new Set(ids).size !== ids.length) {
    return res.status(400).json({ success: false, error: "Un ingrediente está repetido" });
  }
  if (lista.some((x) => !(Number(x.cantidad) > 0 && Number(x.cantidad) <= 2000))) {
    return res.status(400).json({ success: false, error: "Cada cantidad debe estar entre 1 y 2000 g" });
  }

  let nombrePlatillo, gramos;
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    // FOR UPDATE: dos ediciones simultáneas de la misma receta se aplican una después de la otra
    const plat = await cliente.query("SELECT nombre_platillo FROM platillos WHERE id_platillo = $1 FOR UPDATE", [req.params.id]);
    if (plat.rowCount === 0) {
      await cliente.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Platillo no encontrado" });
    }
    await cliente.query("DELETE FROM platillos_ingredientes WHERE id_platillo = $1", [req.params.id]);
    for (const x of lista) {
      await cliente.query(
        "INSERT INTO platillos_ingredientes (id_platillo, id_ingrediente, cantidad, unidad) VALUES ($1, $2, $3, 'g')",
        [req.params.id, Number(x.id_ingrediente), Number(x.cantidad)]
      );
    }
    const total = lista.reduce((s, x) => s + Number(x.cantidad), 0);
    await cliente.query("UPDATE platillos SET porcion_gramos = $1 WHERE id_platillo = $2", [total, req.params.id]);
    await cliente.query("COMMIT");
    nombrePlatillo = plat.rows[0].nombre_platillo;
    gramos = total;
  } catch (error) {
    await cliente.query("ROLLBACK").catch(() => {});
    if (error.code === "23503") return res.status(400).json({ success: false, error: "Un ingrediente no existe" });
    console.error(error);
    return res.status(500).json({ success: false, error: "Error al actualizar los ingredientes" });
  } finally {
    // Se libera antes de registrar el log y consultar los nutrientes, que usan otra conexión
    cliente.release();
  }

  try {
    invalidarCatalogo();
    await registrarLog(req, "EDITAR_INGREDIENTES_PLATILLO", {
      entidad: "platillos", id_entidad: Number(req.params.id),
      detalle: { nombre_platillo: nombrePlatillo, ingredientes: lista.length, gramos },
    });
    const nutr = await pool.query(`SELECT * FROM (${NUTRIENTES_PLATILLO_SQL}) nt WHERE nt.id_platillo = $1`, [req.params.id]);
    res.json({ success: true, message: "Ingredientes actualizados", nutrientes: nutr.rows[0] || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Los ingredientes se guardaron, pero no se pudieron calcular los nutrientes" });
  }
});

// =============================
// 🤖 MODELO DE RECOMENDACIÓN (aprendizaje automático)
// =============================
router.get("/ml", async (req, res) => {
  res.json(estadoModelo());
});

router.post("/ml/entrenar", async (req, res) => {
  try {
    const estado = await entrenarModelo();
    await registrarLog(req, "ENTRENAR_MODELO", {
      entidad: "modelo_recomendacion",
      detalle: { interacciones: estado.interacciones, hitRate: estado.metricas?.modelo?.hitRate },
    });
    res.json({ success: true, ...estado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al entrenar el modelo" });
  }
});

// Subida de imagen de un platillo (se envía como data URL en base64)
const TIPOS_IMAGEN = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_IMAGEN_BYTES = 3 * 1024 * 1024;

router.post("/imagenes", async (req, res) => {
  try {
    const { dataUrl } = req.body || {};
    const match = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl || "");
    if (!match || !TIPOS_IMAGEN[match[1]]) {
      return res.status(400).json({ success: false, error: "La imagen debe ser JPG, PNG o WEBP" });
    }

    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > MAX_IMAGEN_BYTES) {
      return res.status(400).json({ success: false, error: "La imagen no puede superar 3 MB" });
    }

    const carpeta = path.join(UPLOADS_DIR, "platillos");
    fs.mkdirSync(carpeta, { recursive: true });
    const nombre = `${crypto.randomUUID()}.${TIPOS_IMAGEN[match[1]]}`;
    fs.writeFileSync(path.join(carpeta, nombre), buffer);

    // Ruta relativa: la imagen se ve igual desde localhost que desde un enlace público
    const url = `/uploads/platillos/${nombre}`;
    await registrarLog(req, "SUBIR_IMAGEN", { entidad: "platillos", detalle: { archivo: nombre, bytes: buffer.length } });
    res.status(201).json({ success: true, url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al subir la imagen" });
  }
});

// =============================
// 🛡️ ADMINISTRADORES
// =============================
router.get("/administradores", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id_usuario, u.nombre, u.apellido, u.email,
        d.nombre_departamento as departamento, u.fecha_registro
      FROM usuarios u
      LEFT JOIN departamentos d ON u.id_departamento = d.id_departamento
      WHERE u.id_rol = 1
      ORDER BY u.fecha_registro DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener administradores" });
  }
});

router.post("/administradores", async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body || {};
    const error = validarRegistro({ nombre, apellido, email, password });
    if (error) return res.status(400).json({ success: false, error });

    const correo = email.trim().toLowerCase();
    const existe = await pool.query("SELECT 1 FROM usuarios WHERE email = $1", [correo]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ success: false, error: "El correo ya está registrado" });
    }

    const result = await pool.query(`
      INSERT INTO usuarios (nombre, apellido, email, password, id_rol, fecha_registro)
      VALUES ($1, $2, $3, $4, 1, NOW())
      RETURNING id_usuario
    `, [nombre.trim(), apellido.trim(), correo, await hashPasswordAsync(password)]);

    await registrarLog(req, "CREAR_ADMINISTRADOR", { entidad: "usuarios", id_entidad: result.rows[0].id_usuario, detalle: { email: correo } });
    res.status(201).json({ success: true, message: "Administrador creado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al crear administrador" });
  }
});

router.put("/administradores/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido } = req.body || {};
    const error = errorTexto(nombre, "El nombre", 100, { obligatorio: true }) || errorTexto(apellido, "El apellido", 100, { obligatorio: true });
    if (error) return res.status(400).json({ success: false, error });

    const result = await pool.query(
      "UPDATE usuarios SET nombre = $1, apellido = $2 WHERE id_usuario = $3 AND id_rol = 1",
      [nombre.trim(), apellido.trim(), id]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: "Administrador no encontrado" });

    await registrarLog(req, "EDITAR_ADMINISTRADOR", { entidad: "usuarios", id_entidad: Number(id), detalle: { nombre, apellido } });
    res.json({ success: true, message: "Administrador actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al actualizar administrador" });
  }
});

router.delete("/administradores/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id_usuario) {
      return res.status(400).json({ success: false, error: "No puedes quitarte el rol de administrador a ti mismo" });
    }
    const admins = await pool.query("SELECT COUNT(*)::int AS n FROM usuarios WHERE id_rol = 1");
    if (admins.rows[0].n <= 1) {
      return res.status(400).json({ success: false, error: "Debe existir al menos un administrador" });
    }

    const result = await pool.query("UPDATE usuarios SET id_rol = 2 WHERE id_usuario = $1 AND id_rol = 1 RETURNING email, nombre, apellido", [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: "Administrador no encontrado" });

    const quitado = result.rows[0];
    await registrarLog(req, "QUITAR_ADMINISTRADOR", { entidad: "usuarios", id_entidad: Number(id), detalle: { email: quitado.email, nombre: `${quitado.nombre} ${quitado.apellido}` } });
    res.json({ success: true, message: "Administrador degradado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al degradar administrador" });
  }
});

// =============================
// 📊 DASHBOARD
// =============================
router.get("/dashboard", async (req, res) => {
  try {
    const [usuarios, admins, platillos, activos, consumos] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM usuarios WHERE id_rol = 2"),
      pool.query("SELECT COUNT(*) FROM usuarios WHERE id_rol = 1"),
      pool.query("SELECT COUNT(*) FROM platillos"),
      pool.query("SELECT COUNT(DISTINCT h.id_usuario) FROM historial_consumo h JOIN usuarios u ON u.id_usuario = h.id_usuario WHERE u.id_rol = 2 AND h.fecha_consumo > CURRENT_DATE - 30"),
      pool.query("SELECT COUNT(*) FROM historial_consumo"),
    ]);

    res.json({
      totalUsuarios: parseInt(usuarios.rows[0].count),
      totalAdmins: parseInt(admins.rows[0].count),
      totalPlatillos: parseInt(platillos.rows[0].count),
      usuariosActivos: parseInt(activos.rows[0].count),
      totalConsumos: parseInt(consumos.rows[0].count),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error en dashboard" });
  }
});

router.get("/crecimiento-usuarios", async (req, res) => {
  try {
    // Todos los meses desde el primer registro hasta el actual (incluidos los meses sin registros),
    // con los pacientes nuevos del mes y el total acumulado
    const result = await pool.query(`
      WITH meses AS (
        SELECT generate_series(DATE_TRUNC('month', MIN(fecha_registro)), DATE_TRUNC('month', NOW()), INTERVAL '1 month') AS mes
        FROM usuarios WHERE id_rol = 2
      ), nuevos AS (
        SELECT DATE_TRUNC('month', fecha_registro) AS mes, COUNT(*)::int AS n
        FROM usuarios WHERE id_rol = 2 GROUP BY 1
      )
      SELECT TO_CHAR(m.mes, 'MM/YYYY') AS mes,
             COALESCE(n.n, 0)::int AS nuevos,
             (SUM(COALESCE(n.n, 0)) OVER (ORDER BY m.mes))::int AS total
      FROM meses m LEFT JOIN nuevos n ON n.mes = m.mes
      ORDER BY m.mes
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error obteniendo crecimiento" });
  }
});

// =============================
// 📈 PROGRESO Y REPORTE NUTRICIONAL
// =============================
// Historial con el aporte nutricional de cada registro (receta × porción)
// Valida el rango de fechas y que el usuario sea un paciente. Devuelve true si ya respondió con un error.
async function rangoOPacienteInvalido(req, res) {
  const { desde, hasta } = req.query;
  if ((desde && !fechaValida(desde)) || (hasta && !fechaValida(hasta))) {
    res.status(400).json({ success: false, error: "Las fechas deben tener el formato AAAA-MM-DD" });
    return true;
  }
  if (desde && hasta && desde > hasta) {
    res.status(400).json({ success: false, error: "La fecha inicial no puede ser posterior a la fecha final" });
    return true;
  }
  const { rows } = await pool.query("SELECT id_rol FROM usuarios WHERE id_usuario = $1", [req.params.id]);
  if (!rows[0] || rows[0].id_rol !== 2) {
    res.status(404).json({ success: false, error: "Paciente no encontrado" });
    return true;
  }
  return false;
}

router.get("/historial-consumo/:id", async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (await rangoOPacienteInvalido(req, res)) return;
    const reporte = await construirReporte(req.params.id, { desde, hasta });
    if (!reporte) return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    res.json(reporte.registros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error obteniendo historial" });
  }
});

// Reporte completo para la vista de progreso y el PDF dirigido al médico
// Parámetros opcionales: desde=AAAA-MM-DD, hasta=AAAA-MM-DD, registrar=1 (deja constancia en logs)
router.get("/reporte/:id", async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (await rangoOPacienteInvalido(req, res)) return;

    const reporte = await construirReporte(req.params.id, { desde, hasta });
    if (!reporte) return res.status(404).json({ success: false, error: "Usuario no encontrado" });

    if (req.query.registrar === "1") {
      await registrarLog(req, "DESCARGAR_REPORTE_PDF", {
        entidad: "usuarios", id_entidad: Number(req.params.id),
        detalle: { desde: desde || null, hasta: hasta || null, registros: reporte.periodo.total_registros }
      });
    }
    res.json(reporte);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error generando el reporte" });
  }
});

// =============================
// 🩺 SEGUIMIENTO CLÍNICO
// =============================
// Indicadores de laboratorio, peso, tamizaje de sarcopenia y alertas de un paciente
router.get("/seguimiento/:id", async (req, res) => {
  try {
    if (await rangoOPacienteInvalido(req, res)) return;
    res.json(await construirSeguimiento(req.params.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error obteniendo el seguimiento clínico" });
  }
});

router.post("/seguimiento/:id", async (req, res) => {
  try {
    if (await rangoOPacienteInvalido(req, res)) return;
    const v = validarSeguimiento(req.body);
    if (v.error) return res.status(400).json({ success: false, error: v.error });
    const idSeg = await guardarSeguimiento(req.params.id, req.user.id_usuario, v);
    await registrarLog(req, "REGISTRAR_SEGUIMIENTO", {
      entidad: "seguimiento_clinico", id_entidad: idSeg,
      detalle: { paciente: Number(req.params.id), campos: Object.keys(v.datos), peso: v.peso, fecha: v.fecha }
    });
    res.status(201).json({ success: true, id_seguimiento: idSeg, seguimiento: await construirSeguimiento(req.params.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error guardando el registro clínico" });
  }
});

router.delete("/seguimiento/:id/:idSeg", async (req, res) => {
  try {
    if (!idValido(req.params.idSeg)) return res.status(400).json({ success: false, error: "Identificador inválido" });
    const r = await pool.query("DELETE FROM seguimiento_clinico WHERE id_seguimiento = $1 AND id_usuario = $2 RETURNING id_seguimiento",
      [req.params.idSeg, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, error: "Registro no encontrado" });
    await registrarLog(req, "ELIMINAR_SEGUIMIENTO", { entidad: "seguimiento_clinico", id_entidad: Number(req.params.idSeg), detalle: { paciente: Number(req.params.id) } });
    res.json({ success: true, seguimiento: await construirSeguimiento(req.params.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error eliminando el registro" });
  }
});

// El profesional autoriza (o retira) platillos de índice glucémico medio para un paciente
router.put("/usuarios/:id/ig-medio", async (req, res) => {
  try {
    if (typeof req.body?.permitir !== "boolean") return res.status(400).json({ success: false, error: "Indica permitir: true o false" });
    const r = await pool.query("UPDATE usuarios SET permite_ig_medio = $1 WHERE id_usuario = $2 AND id_rol = 2 RETURNING id_usuario, email",
      [req.body.permitir, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, error: "Paciente no encontrado" });
    await registrarLog(req, req.body.permitir ? "PERMITIR_IG_MEDIO" : "RETIRAR_IG_MEDIO", { entidad: "usuarios", id_entidad: Number(req.params.id), detalle: { email: r.rows[0].email } });
    res.json({ success: true, permite_ig_medio: req.body.permitir });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error actualizando la autorización" });
  }
});

// IMC y peso promedio de los pacientes por mes
router.get("/evolucion-imc", async (req, res) => {
  try {
    res.json(await evolucionPoblacional());
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error obteniendo la evolución del IMC" });
  }
});

// =============================
// ⚙️ CONFIGURACIÓN
// =============================
router.get("/configuracion", async (req, res) => {
  try {
    const result = await pool.query("SELECT clave, valor FROM configuracion");
    const config = Object.fromEntries(result.rows.map((r) => [r.clave, r.valor]));
    const tamano = await pool.query("SELECT pg_size_pretty(pg_database_size(current_database())) AS tamano");
    res.json({ ...config, tamano_bd: tamano.rows[0].tamano });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener la configuración" });
  }
});

router.post("/configuracion", async (req, res) => {
  const { appName, idioma, zona, notiUsuarios, notiRecetas, password, confirmPassword } = req.body || {};

  const error = errorTexto(appName, "El nombre de la aplicación", 40) || errorTexto(idioma, "El idioma", 10) || errorTexto(zona, "La zona horaria", 60);
  if (error) return res.status(400).json({ success: false, error });
  if (password) {
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: "Las contraseñas no coinciden" });
    }
    const ep = errorPassword(password);
    if (ep) return res.status(400).json({ success: false, error: ep });
  }

  const valores = {
    app_name: appName?.trim() || "GessenApp",
    idioma: idioma || "es",
    zona_horaria: zona || "GMT-5 Colombia",
    notificar_usuarios: String(Boolean(notiUsuarios)),
    notificar_recetas: String(Boolean(notiRecetas)),
  };
  const hash = password ? await hashPasswordAsync(password) : null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [clave, valor] of Object.entries(valores)) {
      await client.query(`
        INSERT INTO configuracion (clave, valor, actualizado_por, fecha_actualizacion)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor,
          actualizado_por = EXCLUDED.actualizado_por, fecha_actualizacion = NOW()
      `, [clave, valor, req.user.id_usuario]);
    }
    if (hash) {
      await client.query("UPDATE usuarios SET password = $1 WHERE id_usuario = $2", [hash, req.user.id_usuario]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(error);
    return res.status(500).json({ success: false, error: "Error al guardar la configuración" });
  } finally {
    // Se libera antes de registrar el log, que usa otra conexión
    client.release();
  }

  await registrarLog(req, "ACTUALIZAR_CONFIGURACION", { entidad: "configuracion", detalle: { ...valores, cambio_password: Boolean(password) } });
  // Si cambió la contraseña, las demás sesiones del administrador se cierran y esta sigue con un token nuevo
  res.json({ success: true, message: "Configuración guardada correctamente", ...(hash ? { token: firmarToken(req.user, hash) } : {}) });
});

// =============================
// 📜 LOGS
// =============================
router.get("/logs", async (req, res) => {
  try {
    const limite = Math.min(Math.max(parseInt(req.query.limite) || 50, 1), 200);
    const pagina = Math.min(Math.max(parseInt(req.query.pagina) || 1, 1), 1000000);
    const filtros = [];
    const params = [];

    if (req.query.accion) {
      params.push(String(req.query.accion).slice(0, 60));
      filtros.push(`l.accion = $${params.length}`);
    }
    if (req.query.buscar) {
      params.push(`%${String(req.query.buscar).slice(0, 100)}%`);
      filtros.push(`(u.email ILIKE $${params.length} OR u.nombre ILIKE $${params.length} OR l.detalle::text ILIKE $${params.length})`);
    }
    const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

    const total = await pool.query(`SELECT COUNT(*)::int AS n FROM logs l LEFT JOIN usuarios u ON u.id_usuario = l.id_usuario ${where}`, params);
    const result = await pool.query(`
      SELECT l.id_log, l.accion, l.entidad, l.id_entidad, l.detalle, l.ip, l.fecha,
             u.nombre, u.apellido, u.email
      FROM logs l
      LEFT JOIN usuarios u ON u.id_usuario = l.id_usuario
      ${where}
      ORDER BY l.fecha DESC, l.id_log DESC
      LIMIT ${limite} OFFSET ${(pagina - 1) * limite}
    `, params);

    res.json({ total: total.rows[0].n, pagina, limite, logs: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener los logs" });
  }
});

router.get("/logs/acciones", async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT accion FROM logs ORDER BY accion");
    res.json(result.rows.map((r) => r.accion));
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al obtener las acciones" });
  }
});

export default router;
