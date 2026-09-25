import "./env.js";
import pkg from "pg";

const { Pool } = pkg;

// Los valores se leen de backend/.env; los valores por defecto corresponden al entorno local.
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "BD_gessenapp",
  password: process.env.DB_PASSWORD || "2003",
  port: Number(process.env.DB_PORT) || 5433,
});

export default pool;
