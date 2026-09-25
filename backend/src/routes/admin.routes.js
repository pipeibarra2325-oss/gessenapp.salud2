// backend/src/routes/admin.routes.js
import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { authAdmin } from "../middlewares/authAdmin.js";
import pool from "../config/database.js";
import { hashPassword } from "../utils/password.js";
import { registrarLog } from "../utils/logger.js";
import { NUTRIENTES_PLATILLO_SQL } from "../utils/nutricion.js";
import { validarRegistro } from "../controllers/usuarios.controller.js";
import { construirReporte } from "../utils/reporte.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");

// Todas las rutas de este archivo exigen rol de administrador
router.use(authAdmin);

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
        CASE WHEN u.fecha_registro > NOW() - INTERVAL '30 days' THEN 'Activo' ELSE 'Inactivo' END as estado,
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
    const { nombre, apellido } = req.body;

    if (!nombre?.trim()) {
      return res.status(400).json({ success: false, error: "El nombre es obligatorio" });
    }

    const result = await pool.query(
      "UPDATE usuarios SET nombre = $1, apellido = COALESCE($2, apellido) WHERE id_usuario = $3 RETURNING id_usuario",
      [nombre.trim(), apellido?.trim() || null, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: "Usuario no encontrado" });

    await registrarLog(req, "EDITAR_USUARIO", { entidad: "usuarios", id_entidad: Number(id), detalle: { nombre, apellido } });
    res.json({ success: true, message: "Usuario actualizado correctamente" });
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
    const result = await pool.query("DELETE FROM usuarios WHERE id_usuario = $1 RETURNING email", [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: "Usuario no encontrado" });

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
        (SELECT COUNT(*) FROM historial_consumo h WHERE h.id_platillo = p.id_platillo)::int as consumos
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

const validarPlatillo = (body) => {
  if (!body.nombre_platillo?.trim()) return "El nombre del platillo es obligatorio";
  if (!normalizarNivel(body.nivel_glucemico)) return "El nivel glucémico debe ser Bajo, Medio o Alto";
  if (!body.id_categoria) return "La categoría es obligatoria";
  if (body.tiempo_preparacion != null && body.tiempo_preparacion !== "" && !(Number(body.tiempo_preparacion) >= 0)) {
    return "El tiempo de preparación no es válido";
  }
  if (body.porcion_gramos != null && body.porcion_gramos !== "" && !(Number(body.porcion_gramos) >= 0)) {
    return "La porción no es válida";
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

    await registrarLog(req, "ELIMINAR_PLATILLO", { entidad: "platillos", id_entidad: Number(id), detalle: { nombre_platillo: result.rows[0].nombre_platillo } });
    res.json({ success: true, message: "Platillo eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error al eliminar platillo" });
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

    const url = `${req.protocol}://${req.get("host")}/uploads/platillos/${nombre}`;
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
    const { nombre, apellido, email, password } = req.body;
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
    `, [nombre.trim(), apellido.trim(), correo, hashPassword(password)]);

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
    const { nombre, apellido } = req.body;
    if (!nombre?.trim() || !apellido?.trim()) {
      return res.status(400).json({ success: false, error: "Nombre y apellido son obligatorios" });
    }

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

    const result = await pool.query("UPDATE usuarios SET id_rol = 2 WHERE id_usuario = $1 AND id_rol = 1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: "Administrador no encontrado" });

    await registrarLog(req, "QUITAR_ADMINISTRADOR", { entidad: "usuarios", id_entidad: Number(id) });
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
      pool.query("SELECT COUNT(*) FROM usuarios WHERE id_rol = 2 AND fecha_registro > NOW() - INTERVAL '30 days'"),
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
    // Agrupa por año y mes para no mezclar el mismo mes de años distintos
    const result = await pool.query(`
      SELECT TO_CHAR(DATE_TRUNC('month', fecha_registro), 'MM/YYYY') as mes, COUNT(*)::int as total
      FROM usuarios
      WHERE id_rol = 2
      GROUP BY DATE_TRUNC('month', fecha_registro)
      ORDER BY DATE_TRUNC('month', fecha_registro)
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
router.get("/historial-consumo/:id", async (req, res) => {
  try {
    const reporte = await construirReporte(req.params.id, req.query);
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
    const fechaValida = (f) => !f || /^\d{4}-\d{2}-\d{2}$/.test(f);
    if (!fechaValida(desde) || !fechaValida(hasta)) {
      return res.status(400).json({ success: false, error: "Las fechas deben tener el formato AAAA-MM-DD" });
    }

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
  const client = await pool.connect();
  try {
    const { appName, idioma, zona, notiUsuarios, notiRecetas, password, confirmPassword } = req.body || {};

    if (password) {
      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, error: "Las contraseñas no coinciden" });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: "La contraseña debe tener al menos 6 caracteres" });
      }
    }

    const valores = {
      app_name: appName?.trim() || "GessenApp",
      idioma: idioma || "es",
      zona_horaria: zona || "GMT-5 Colombia",
      notificar_usuarios: String(Boolean(notiUsuarios)),
      notificar_recetas: String(Boolean(notiRecetas)),
    };

    await client.query("BEGIN");
    for (const [clave, valor] of Object.entries(valores)) {
      await client.query(`
        INSERT INTO configuracion (clave, valor, actualizado_por, fecha_actualizacion)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor,
          actualizado_por = EXCLUDED.actualizado_por, fecha_actualizacion = NOW()
      `, [clave, valor, req.user.id_usuario]);
    }
    if (password) {
      await client.query("UPDATE usuarios SET password = $1 WHERE id_usuario = $2", [hashPassword(password), req.user.id_usuario]);
    }
    await client.query("COMMIT");

    await registrarLog(req, "ACTUALIZAR_CONFIGURACION", { entidad: "configuracion", detalle: { ...valores, cambio_password: Boolean(password) } });
    res.json({ success: true, message: "Configuración guardada correctamente" });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(error);
    res.status(500).json({ success: false, error: "Error al guardar la configuración" });
  } finally {
    client.release();
  }
});

// =============================
// 📜 LOGS
// =============================
router.get("/logs", async (req, res) => {
  try {
    const limite = Math.min(Math.max(parseInt(req.query.limite) || 50, 1), 200);
    const pagina = Math.max(parseInt(req.query.pagina) || 1, 1);
    const filtros = [];
    const params = [];

    if (req.query.accion) {
      params.push(req.query.accion);
      filtros.push(`l.accion = $${params.length}`);
    }
    if (req.query.buscar) {
      params.push(`%${req.query.buscar}%`);
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
