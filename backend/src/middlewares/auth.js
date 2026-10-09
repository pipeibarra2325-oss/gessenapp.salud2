import { usuarioDeSesion } from "./sesion.js";

export const auth = async (req, res, next) => {
  try {
    const r = await usuarioDeSesion(req);
    if (r.error) return res.status(r.status).json({ success: false, error: r.error });
    req.user = r.usuario;
    next();
  } catch (error) {
    console.error("❌ Error en auth:", error.message);
    res.status(500).json({ success: false, error: "No se pudo verificar la sesión" });
  }
};
