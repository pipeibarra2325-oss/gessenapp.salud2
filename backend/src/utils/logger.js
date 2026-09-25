import pool from "../config/database.js";

/**
 * Registra una acción en la tabla logs. Nunca interrumpe la petición si falla.
 * @param {object} req         petición de Express (para el usuario del token y la IP)
 * @param {string} accion      ej. "LOGIN", "CREAR_PLATILLO"
 * @param {object} [opciones]  { entidad, id_entidad, detalle, id_usuario }
 */
export async function registrarLog(req, accion, { entidad = null, id_entidad = null, detalle = null, id_usuario } = {}) {
  try {
    const usuario = id_usuario ?? req?.user?.id_usuario ?? null;
    const ip = (req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || "").toString().split(",")[0].trim() || null;
    await pool.query(
      `INSERT INTO logs (id_usuario, accion, entidad, id_entidad, detalle, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [usuario, accion, entidad, id_entidad, detalle ? JSON.stringify(detalle) : null, ip]
    );
  } catch (error) {
    console.error("No se pudo registrar el log:", error.message);
  }
}
