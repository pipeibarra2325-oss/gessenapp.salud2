// El proyecto usa un CSS de Tailwind ya compilado (src/index.css), sin paso de compilación.
// Las clases que no estaban en el diseño original no existen en ese archivo y no se aplican
// (por ejemplo, un botón con "bg-emerald-600 text-white" se vería blanco sobre blanco).
//
// Este script busca en src/ las clases usadas que faltan en index.css y genera con Tailwind 4.1.3
// (la misma versión de index.css) el archivo src/styles/utilidades-extra.css, que main.tsx importa.
//
// Uso (desde la carpeta frontend):  node scripts/generar-utilidades-extra.mjs
import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(raiz, "src");
const salida = path.join(src, "styles", "utilidades-extra.css");

const clasesDefinidas = (css) =>
  new Set([...css.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)/g)].map((m) => m[1].replace(/\\/g, "")));
const definidas = clasesDefinidas(fs.readFileSync(path.join(src, "index.css"), "utf8"));

const archivos = [];
const recorrer = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) recorrer(p);
    // components/ui son los componentes base de la plantilla; se dejan tal como venían
    else if (/\.(tsx?|jsx?)$/.test(e.name) && !p.includes(path.join("components", "ui"))) archivos.push(p);
  }
};
recorrer(src);

// Se toman todos los fragmentos entre comillas o acentos graves que parezcan listas de clases
const usadas = new Set();
for (const f of archivos) {
  const codigo = fs.readFileSync(f, "utf8");
  for (const m of codigo.matchAll(/["'`]([^"'`\n]{2,400})["'`]/g)) {
    for (const tok of m[1].replace(/\$\{[^}]*\}/g, " ").split(/\s+/)) {
      const balanceado = (tok.match(/\(/g) || []).length === (tok.match(/\)/g) || []).length
        && (tok.match(/\[/g) || []).length === (tok.match(/\]/g) || []).length;
      if (/^[a-z!-][a-z0-9:\-\[\]/.%#_()]*$/i.test(tok) && balanceado) usadas.add(tok);
    }
  }
}
const faltantes = [...usadas].filter((c) => !definidas.has(c)).sort();

// Colores del tema del proyecto (primary, muted, etc.), tomados de styles/globals.css
const globals = fs.readFileSync(path.join(src, "styles", "globals.css"), "utf8");
const temaInline = globals.match(/@theme inline\s*\{[\s\S]*?\n\}/)?.[0] || "";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tw-extra-"));
const entrada = path.join(tmp, "entrada.css");
fs.writeFileSync(entrada, `@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities) source(none);
${temaInline}
@custom-variant dark (&:is(.dark *));
@source inline("${faltantes.join(" ")}");
`);
const generado = path.join(tmp, "salida.css");
// Tailwind se instala en la carpeta temporal para que resuelva sus propios @import
execSync("npm init -y", { cwd: tmp, stdio: "ignore" });
execSync("npm install --silent --no-audit --no-fund tailwindcss@4.1.3 @tailwindcss/cli@4.1.3", { cwd: tmp, stdio: "inherit" });
execSync(`npx tailwindcss -i "${entrada}" -o "${generado}"`, { cwd: tmp, stdio: "inherit" });

let css = fs.readFileSync(generado, "utf8");
// Solo se conservan las reglas de clases que realmente faltaban (más variables y capas de soporte)
const nuevas = clasesDefinidas(css);
const agregadas = faltantes.filter((c) => nuevas.has(c));
fs.writeFileSync(salida, `/* Generado por scripts/generar-utilidades-extra.mjs: clases de Tailwind que faltan en index.css.
   No editar a mano; volver a ejecutar el script cuando se usen clases nuevas.
   Clases incluidas (${agregadas.length}): ${agregadas.join(" ")} */
${css}`);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Clases usadas que faltaban: ${faltantes.length}. Generadas: ${agregadas.length}. Archivo: ${path.relative(raiz, salida)}`);
const sinGenerar = faltantes.filter((c) => !nuevas.has(c));
if (sinGenerar.length) console.log("No son clases de Tailwind (se ignoran):", sinGenerar.join(" "));
