import jwt from "jsonwebtoken";

/**
 * Middleware para verificar autenticación + rol de Administrador (id_rol = 1)
 */
export const authAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No autorizado - Token requerido"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.id_rol !== 1 && decoded.role !== 1) {
      return res.status(403).json({
        success: false,
        error: "Acceso denegado: Se requiere rol de Administrador"
      });
    }

    req.user = decoded;
    next();

  } catch (error) {
    console.error("❌ Error en authAdmin:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Token expirado" });
    }

    res.status(401).json({ success: false, error: "Token inválido" });
  }
};