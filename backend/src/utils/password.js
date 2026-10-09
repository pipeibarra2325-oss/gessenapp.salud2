import crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt);

// Longitud mínima de contraseña en todo el sistema (registro, perfil, panel y configuración)
export const MIN_PASSWORD = 8;

// Formato almacenado: scrypt$<salt hex>$<hash hex>
// Versión síncrona: solo para scripts y pruebas. En las rutas se usa la versión asíncrona,
// porque scrypt tarda decenas de milisegundos y la síncrona detiene el servidor mientras calcula.
export const hashPassword = (plain) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

export const hashPasswordAsync = async (plain) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await scryptAsync(String(plain), salt, 64)).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

export const isHashed = (stored) => typeof stored === "string" && stored.startsWith("scrypt$");

// Devuelve true si la contraseña coincide. Acepta contraseñas antiguas en texto plano
// para que puedan migrarse al formato cifrado en el siguiente inicio de sesión.
export const verifyPassword = (plain, stored) => {
  if (!stored || typeof plain !== "string") return false;
  if (!isHashed(stored)) return plain === stored;
  const [, salt, hash] = stored.split("$");
  const candidate = crypto.scryptSync(plain, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);
};

export const verifyPasswordAsync = async (plain, stored) => {
  if (!stored || typeof plain !== "string") return false;
  if (!isHashed(stored)) return plain === stored;
  const [, salt, hash] = stored.split("$");
  const candidate = await scryptAsync(plain, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);
};

// Huella de la contraseña guardada (no revela el hash). Se incluye en el token: si la contraseña cambia,
// la huella deja de coincidir y las sesiones abiertas con la contraseña anterior se cierran.
export const huellaPassword = (stored) =>
  crypto.createHash("sha256").update(String(stored || "")).digest("base64url").slice(0, 16);

// Valida una contraseña nueva. Devuelve un mensaje de error o null.
export const errorPassword = (p) => {
  if (typeof p !== "string") return "La contraseña no es válida";
  if (p.length < MIN_PASSWORD) return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`;
  if (p.length > 128) return "La contraseña admite hasta 128 caracteres";
  return null;
};
