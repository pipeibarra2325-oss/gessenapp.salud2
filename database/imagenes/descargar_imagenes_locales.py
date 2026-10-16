"""Descarga las fotos de los platillos (Wikimedia Commons) y la de la portada (Unsplash), las convierte a WebP
liviano y las guarda en frontend/public, para que la aplicación las sirva desde su propio servidor.

Uso (desde la carpeta del proyecto):
    python database/imagenes/descargar_imagenes_locales.py <archivo.json con [{id_platillo, imagen_url}]>

Genera además database/migraciones/008_imagenes_locales.sql, que cambia imagen_url a la ruta local.
Los créditos de autor y licencia de cada foto se conservan en platillos.imagen_credito.
"""
import io, json, re, sys, time, urllib.request
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
DESTINO = RAIZ / 'frontend' / 'public' / 'platillos'
PORTADA = RAIZ / 'frontend' / 'public' / 'img'
AGENTE = 'GessenApp/1.0 (proyecto de grado, Universidad CESMAG; contacto: gessenapp@gmail.com)'
ANCHO_TARJETA = 560   # las tarjetas se muestran a unos 300 px; cubre pantallas de alta densidad
CALIDAD = 72


def bajar(url):
    req = urllib.request.Request(url, headers={'User-Agent': AGENTE})
    for intento in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read()
        except Exception as e:  # Wikimedia limita la frecuencia: se reintenta con espera
            if intento == 3:
                raise
            time.sleep(3 * (intento + 1))


def a_webp(datos, ancho, destino):
    im = Image.open(io.BytesIO(datos)).convert('RGB')
    if im.width > ancho:
        im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    im.save(destino, 'WEBP', quality=CALIDAD, method=6)
    return destino.stat().st_size


def main(lista_json):
    DESTINO.mkdir(parents=True, exist_ok=True)
    PORTADA.mkdir(parents=True, exist_ok=True)
    platillos = json.load(open(lista_json, encoding='utf8'))
    sql = ['-- 008: imágenes de los platillos servidas desde la propia aplicación (frontend/public/platillos)',
           '-- Generado por database/imagenes/descargar_imagenes_locales.py. Solo cambia las filas que aún tienen',
           '-- la dirección original de Wikimedia; los créditos (imagen_credito) no cambian.', 'BEGIN;']
    total = 0
    for p in platillos:
        url = p['imagen_url']
        # Wikimedia sirve miniaturas en anchos fijos; 960 px es más de lo necesario para una tarjeta
        origen = re.sub(r'/\d+px-', '/960px-', url)
        archivo = DESTINO / f"{p['id_platillo']}.webp"
        if not archivo.exists():
            total += a_webp(bajar(origen), ANCHO_TARJETA, archivo)
            time.sleep(0.4)
        else:
            total += archivo.stat().st_size
        sql.append(f"UPDATE platillos SET imagen_url = '/platillos/{p['id_platillo']}.webp' "
                   f"WHERE id_platillo = {p['id_platillo']} AND imagen_url = '{url.replace(chr(39), chr(39) * 2)}';")
        print('ok', p['id_platillo'], archivo.stat().st_size // 1024, 'KB')
    sql.append('COMMIT;')
    (RAIZ / 'database' / 'migraciones' / '008_imagenes_locales.sql').write_text('\n'.join(sql) + '\n', encoding='utf8')

    foto = ('https://images.unsplash.com/photo-1723985021773-d1f4c4ebfdd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg'
            '&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZGlhYmV0aWMlMjBmb29kJTIwc2FsYWR8ZW58MXx8fHwxNzU4NzE4ODc5fDA'
            '&ixlib=rb-4.1.0&q=85&w=1200')
    datos = bajar(foto)
    for ancho in (480, 720, 960):
        print('portada', ancho, a_webp(datos, ancho, PORTADA / f'portada-{ancho}.webp') // 1024, 'KB')
    print('platillos:', len(platillos), 'imágenes,', total // 1024, 'KB en total')


if __name__ == '__main__':
    main(sys.argv[1])
