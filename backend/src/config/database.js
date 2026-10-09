import "./env.js";
import pkg from "pg";

const { Pool } = pkg;

// Los valores se leen de backend/.env; los valores por defecto corresponden al entorno local.
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "BD_gessenapp",
  // La contraseña solo se lee de backend/.env: nunca se escribe en el código
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5433,
  max: 20,
  // Si no hay conexiones libres en 10 s, la consulta falla con un error en lugar de dejar el servidor esperando
  connectionTimeoutMillis: 10000,
});

export default pool;
