// Cargar variables de entorno antes que cualquier otro módulo
import "./config/env.js";
import express from "express";
import cors from "cors";
import compression from "compression";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import usuariosRoutes from "./routes/usuarios.routes.js";
import departamentosRoutes from "./routes/departamentos.routes.js";
import platillosRoutes from "./routes/platillos.routes.js";
import adminroutes, { UPLOADS_DIR } from "./routes/admin.routes.js";
import { entrenar as entrenarModelo } from "./ml/recomendador.js";

const app = express();

// ====================== MIDDLEWARES ======================
// Cabeceras de seguridad básicas (sin dependencias externas)
app.disable("x-powered-by");
// Respuestas comprimidas (gzip): el JavaScript y el catálogo pesan cerca de 4 veces menos
app.use(compression());
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Límite ampliado para permitir la subida de imágenes de platillos en base64 (máx. 3 MB por imagen)
app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ extended: true }));

// Imágenes subidas desde el panel de administración
app.use("/uploads", express.static(UPLOADS_DIR, { maxAge: "7d" }));

// ====================== RUTAS ======================
app.use("/api/admin", adminroutes);
app.use("/api", departamentosRoutes);
app.use("/api", usuariosRoutes);
app.use("/api", platillosRoutes);

// Página compilada del frontend (frontend/build): así la aplicación completa funciona desde
// una sola dirección, por ejemplo al compartirla con un enlace público
const FRONTEND_BUILD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../frontend/build");
if (fs.existsSync(path.join(FRONTEND_BUILD, "index.html"))) {
  // Los archivos de /assets llevan una huella en el nombre: se guardan en caché un año.
  // index.html se revisa siempre para que una nueva versión se vea de inmediato.
  app.use(express.static(FRONTEND_BUILD, {
    setHeaders(res, archivo) {
      if (archivo.includes(`${path.sep}assets${path.sep}`)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      else if (archivo.endsWith("index.html")) res.setHeader("Cache-Control", "no-cache");
    },
  }));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    // Un archivo inexistente (con extensión o en /.well-known) responde 404 y no la página principal:
    // así los buscadores y los agentes de IA no reciben HTML cuando esperan JSON o texto
    if (req.path === "/favicon.ico") return res.redirect(301, "/favicon.svg");
    if (req.path.startsWith("/.well-known/") || path.extname(req.path)) {
      return res.status(404).type("text/plain").send("No encontrado");
    }
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(FRONTEND_BUILD, "index.html"));
  });
} else {
  // Ruta de salud
  app.get("/", (req, res) => {
    res.json({
      message: "🚀 Backend de GessenApp funcionando correctamente",
      version: "1.0.0"
    });
  });
}

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
  // El modelo de recomendación se entrena al iniciar, en segundo plano
  entrenarModelo()
    .then((e) => console.log(`🤖 Modelo de recomendación entrenado: ${e.interacciones} interacciones, HitRate@10 = ${e.metricas?.modelo?.hitRate}`))
    .catch((err) => console.error("No se pudo entrenar el modelo de recomendación:", err.message));
});
