import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
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

    req.user = decoded;
    next();

  } catch (error) {
    console.error("❌ Error en auth:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Token expirado" });
    }

    res.status(401).json({ success: false, error: "Token inválido" });
  }
};