// Cargar variables de entorno antes que cualquier otro módulo
import "./config/env.js";
import express from "express";
import cors from "cors";

import usuariosRoutes from "./routes/usuarios.routes.js";
import departamentosRoutes from "./routes/departamentos.routes.js";
import platillosRoutes from "./routes/platillos.routes.js";
import adminroutes, { UPLOADS_DIR } from "./routes/admin.routes.js";

const app = express();

// ====================== MIDDLEWARES ======================
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Límite ampliado para permitir la subida de imágenes de platillos en base64 (máx. 3 MB por imagen)
app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ extended: true }));

// Imágenes subidas desde el panel de administración
app.use("/uploads", express.static(UPLOADS_DIR));

// ====================== RUTAS ======================
app.use("/api/admin", adminroutes);
app.use("/api", departamentosRoutes);
app.use("/api", usuariosRoutes);
app.use("/api", platillosRoutes);

// Ruta de salud
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Backend de GessenApp funcionando correctamente",
    version: "1.0.0"
  });
});

// 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada"
  });
});

// Error handler global (incluye JSON mal formado o demasiado grande)
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, error: "La solicitud es demasiado grande" });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, error: "JSON mal formado" });
  }
  console.error("❌ Error no controlado:", err);
  res.status(500).json({
    success: false,
    error: "Error interno del servidor"
  });
});

// ====================== INICIAR SERVIDOR ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📍 Rutas Admin disponibles en: http://localhost:${PORT}/api/admin`);
});
