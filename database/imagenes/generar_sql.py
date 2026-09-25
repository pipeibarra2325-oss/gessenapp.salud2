"""
Genera database/migraciones/003_imagenes_platillos.sql y docs/CREDITOS_IMAGENES.md
a partir de imagenes_platillos.json (resultado de buscar_imagenes.py y de la revisión visual).
Uso: python database/imagenes/generar_sql.py
"""
import json
from pathlib import Path

AQUI = Path(__file__).parent
RAIZ = AQUI.parent.parent
datos = json.loads((AQUI / "imagenes_platillos.json").read_text(encoding="utf8"))

sql = [
    "-- =====================================================================",
    "-- Migración 003: imágenes de los platillos (Wikimedia Commons, licencias libres)",
    "-- Generado con database/imagenes/generar_sql.py. Cada foto conserva su crédito",
    "-- (autor y licencia) en platillos.imagen_credito, como exigen las licencias CC.",
    "-- Requiere la migración 001 (columna imagen_credito).",
    "-- =====================================================================",
    "BEGIN;",
]
creditos = [
    "# Créditos de las imágenes de los platillos",
    "",
    "Las fotografías provienen de [Wikimedia Commons](https://commons.wikimedia.org) y se usan bajo sus licencias libres.",
    "Las licencias CC BY y CC BY-SA exigen citar al autor y la licencia; el crédito se guarda en `platillos.imagen_credito`",
    "y se muestra en la aplicación.",
    "",
    "| ID | Imagen | Autor | Licencia |",
    "|---|---|---|---|",
]

q = lambda s: (s or "").replace("'", "''")
for clave in sorted(datos, key=int):
    v = datos[clave]
    credito = f"{v['autor']} · {v['licencia']} · Wikimedia Commons"
    sql.append(f"UPDATE public.platillos SET imagen_url = '{q(v['url'])}', imagen_credito = '{q(credito)}' WHERE id_platillo = {int(clave)};")
    creditos.append(f"| {clave} | [{v['titulo'][5:]}]({v['pagina']}) | {v['autor'].replace('|', '/')} | {v['licencia']} |")

sql.append("COMMIT;")
destino_sql = RAIZ / "database" / "migraciones" / "003_imagenes_platillos.sql"
destino_md = RAIZ / "docs" / "CREDITOS_IMAGENES.md"
destino_sql.write_text("\n".join(sql) + "\n", encoding="utf8")
destino_md.write_text("\n".join(creditos) + "\n", encoding="utf8")
print(f"{len(datos)} platillos -> {destino_sql.name} y {destino_md.name}")
