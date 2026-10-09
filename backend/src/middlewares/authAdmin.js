import { usuarioDeSesion } from "./sesion.js";

/**
 * Middleware para verificar autenticación + rol de Administrador (id_rol = 1), consultando el rol actual en la base de datos
 */
export const authAdmin = async (req, res, next) => {
  try {
    const r = await usuarioDeSesion(req);
    if (r.error) return res.status(r.status).json({ success: false, error: r.error });
    if (r.usuario.id_rol !== 1) {
      return res.status(403).json({ success: false, error: "Acceso denegado: Se requiere rol de Administrador" });
    }
    req.user = r.usuario;
    next();
  } catch (error) {
    console.error("❌ Error en authAdmin:", error.message);
    res.status(500).json({ success: false, error: "No se pudo verificar la sesión" });
  }
};
