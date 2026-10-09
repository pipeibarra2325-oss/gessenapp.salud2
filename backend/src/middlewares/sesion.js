import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import { huellaPassword } from "../utils/password.js";

// Verifica el token y, en la base de datos, que la cuenta siga existiendo y cuál es su rol actual.
// Así, una cuenta eliminada o un administrador al que se le quitó el rol pierden el acceso de inmediato,
// sin esperar a que venza el token (24 h).
export async function usuarioDeSesion(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return { status: 401, error: "No autorizado - Token requerido" };
  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch (error) {
    return { status: 401, error: error.name === "TokenExpiredError" ? "Token expirado" : "Token inválido" };
  }
  const { rows } = await pool.query("SELECT id_rol, email, password FROM usuarios WHERE id_usuario = $1", [decoded.id_usuario]);
  if (!rows[0]) return { status: 401, error: "La sesión ya no es válida: la cuenta no existe" };
  // La contraseña cambió después de emitir el token: la sesión se cierra
  if (decoded.pv !== huellaPassword(rows[0].password)) {
    return { status: 401, error: "La sesión ya no es válida: la contraseña cambió. Inicia sesión de nuevo" };
  }
  return { usuario: { ...decoded, id_rol: rows[0].id_rol, role: rows[0].id_rol, email: rows[0].email } };
}
