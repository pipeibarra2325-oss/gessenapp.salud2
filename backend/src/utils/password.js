import crypto from "crypto";

// Formato almacenado: scrypt$<salt hex>$<hash hex>
export const hashPassword = (plain) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
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
