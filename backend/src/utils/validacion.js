// Validaciones compartidas por los controladores y las rutas.

// Identificador numérico positivo que cabe en un INTEGER de PostgreSQL
export const idValido = (v) => /^\d{1,10}$/.test(String(v)) && Number(v) > 0 && Number(v) <= 2147483647;

// Fecha real con formato AAAA-MM-DD (rechaza, por ejemplo, 2026-13-45)
export const fechaValida = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
  const [a, m, d] = String(s).split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
};

// Middleware para router.param: responde 400 si el parámetro no es un identificador válido
export const validarParamId = (req, res, next, valor) =>
  idValido(valor) ? next() : res.status(400).json({ success: false, error: "El identificador no es válido" });

// Texto obligatorio u opcional con longitud máxima. Devuelve un mensaje de error o null.
export const errorTexto = (valor, etiqueta, max, { obligatorio = false } = {}) => {
  if (valor == null || valor === "") return obligatorio ? `${etiqueta} es obligatorio` : null;
  if (typeof valor !== "string") return `${etiqueta} no es válido`;
  if (obligatorio && !valor.trim()) return `${etiqueta} es obligatorio`;
  if (valor.trim().length > max) return `${etiqueta} admite hasta ${max} caracteres`;
  return null;
};

// Número opcional dentro de un rango. Devuelve un mensaje de error o null.
export const errorNumero = (valor, etiqueta, min, max) => {
  if (valor == null || valor === "") return null;
  const n = Number(valor);
  if (typeof valor === "boolean" || !Number.isFinite(n) || n < min || n > max) return `${etiqueta} debe estar entre ${min} y ${max}`;
  return null;
};

// Límite de solicitudes por IP en una ventana de tiempo (en memoria del servidor)
export const limitadorPorIp = ({ max, ventanaMs, mensaje }) => {
  const registros = new Map();
  const ipDe = (req) => (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").toString().split(",")[0].trim();
  return {
    // Responde 429 si la IP superó el límite; devuelve true si respondió
    bloqueado(req, res) {
      const r = registros.get(ipDe(req));
      if (r && Date.now() - r.desde < ventanaMs && r.n >= max) {
        const minutos = Math.ceil((r.desde + ventanaMs - Date.now()) / 60000);
        res.status(429).json({ success: false, error: `${mensaje} Intenta de nuevo en ${minutos} minuto(s).` });
        return true;
      }
      return false;
    },
    // Número de eventos de la IP en la ventana actual
    cuenta(req) {
      const r = registros.get(ipDe(req));
      return r && Date.now() - r.desde < ventanaMs ? r.n : 0;
    },
    contar(req) {
      const ip = ipDe(req);
      const r = registros.get(ip);
      if (!r || Date.now() - r.desde >= ventanaMs) registros.set(ip, { n: 1, desde: Date.now() });
      else r.n += 1;
      if (registros.size > 10000) registros.clear();
    },
  };
};
