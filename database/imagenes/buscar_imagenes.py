"""
Busca en Wikimedia Commons una foto de licencia libre para cada platillo y guarda
el resultado en imagenes_platillos.json (URL, autor, licencia y página de origen).

Uso:  python database/imagenes/buscar_imagenes.py
Luego: python database/imagenes/generar_sql.py  (crea la migración con los UPDATE)
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.error
import urllib.request
from pathlib import Path

AQUI = Path(__file__).parent
UA = "GessenApp-imagenes/1.0 (proyecto academico Universidad CESMAG)"
LICENCIAS_OK = ("CC0", "CC BY", "CC-BY", "Public domain", "PD", "Dominio público")

# id_platillo -> términos de búsqueda (en orden de preferencia)
TERMINOS = {
    1: ["chicken avocado salad"], 2: ["salmon broccoli"], 3: ["quinoa vegetable bowl", "quinoa salad vegetables"],
    4: ["spinach omelette"], 5: ["grilled fish salad"], 6: ["yogurt chia strawberries", "chia pudding strawberries", "yogurt strawberries"],
    7: ["grilled chicken breast salad tomato cucumber", "grilled chicken breast"], 8: ["lentil stew"],
    9: ["tofu stir fry vegetables"], 10: ["broccoli soup"], 11: ["tuna salad"], 12: ["quinoa chicken spinach", "quinoa chicken"],
    13: ["tomato omelette"], 14: ["chicken breast green salad", "grilled chicken salad"], 15: ["chickpeas vegetables", "chickpea stir fry"],
    16: ["chicken wrap"], 17: ["salmon avocado bowl", "salmon poke bowl"], 18: ["lentil soup"], 19: ["spinach egg salad"],
    20: ["fish cauliflower puree", "fish fillet mashed cauliflower", "fish fillet puree"], 21: ["roasted sweet potato chicken", "chicken sweet potato"],
    22: ["overnight oats"], 23: ["yogurt blackberries walnuts", "yogurt blackberries"], 24: ["tofu broccoli carrot", "tofu broccoli"],
    25: ["quinoa chickpea salad"], 26: ["salmon salad"], 27: ["roast chicken vegetables"], 28: ["lentil bowl", "lentil salad"],
    29: ["scrambled eggs avocado"], 30: ["chicken vegetable soup"], 31: ["tuna cucumber salad", "tuna salad cucumber"],
    32: ["chicken brown rice"], 33: ["lemon fish fillet", "fish lemon salad"], 34: ["quinoa tofu pepper", "quinoa tofu"],
    35: ["carrot soup"], 36: ["eggs spinach cheese", "spinach scrambled eggs"], 37: ["green salad chicken bowl", "chicken salad bowl"],
    38: ["chickpea salad"], 39: ["salmon sauteed vegetables", "salmon vegetables"], 40: ["baked chicken broccoli", "chicken broccoli"],
    41: ["avocado toast egg"], 42: ["oatmeal strawberries"], 43: ["lentils spinach"], 44: ["yogurt almonds"],
    45: ["quinoa tuna salad", "tuna quinoa"], 46: ["brown rice chicken", "chicken rice"], 47: ["tuna pasta"],
    48: ["arepa huevo", "arepa egg"], 49: ["bean soup"], 50: ["banana smoothie"], 51: ["salmon rice bowl"],
    52: ["chicken sandwich wholemeal", "chicken sandwich"], 53: ["chickpea sweet potato", "sweet potato chickpea"],
    54: ["oatmeal papaya", "papaya breakfast"], 55: ["cheese tomato toast"], 56: ["chicken pasta"],
    57: ["tofu fried rice vegetables", "tofu fried rice"], 58: ["frijoles arepa", "arepa frijoles"], 59: ["yogurt fruit bowl"],
    60: ["quinoa porridge"], 61: ["baked sweet potato chicken", "sweet potato chicken"], 62: ["tuna wrap"],
    63: ["pasta primavera", "pasta vegetables"], 64: ["lentil potato soup"], 65: ["arepa queso", "arepa cheese"],
    66: ["oatmeal pear", "porridge pear"], 67: ["rice fried egg"], 68: ["rice potatoes"], 69: ["fettuccine alfredo"],
    70: ["arepa con queso", "arepa"], 71: ["bread jam"], 72: ["banana condensed milk", "banana dessert"],
    73: ["fruit milkshake", "fruit smoothie"], 74: ["arroz con pollo"], 75: ["mashed potatoes meat"],
    76: ["breakfast cereal milk"], 77: ["pancakes honey"], 78: ["empanadas colombianas", "empanadas"], 79: ["pizza"],
    80: ["hamburger"], 81: ["lasagna"], 82: ["ice cream cookie"], 83: ["carrot cake"], 84: ["rice and beans"],
    85: ["papa rellena"], 86: ["pain au chocolat"], 87: ["sweet bread coffee", "pan dulce"], 88: ["soda chips", "potato chips soda"],
    89: ["chocolate muffin"], 90: ["waffles syrup"], 91: ["cannelloni"], 92: ["cassava cake"], 93: ["arroz con leche"],
    94: ["bread butter"], 95: ["french fries ketchup"], 96: ["tamal colombiano", "tamale"],
}


def limpiar_html(texto):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", texto or "")).strip()


def buscar(termino):
    params = {
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": 6,
        "gsrsearch": f"{termino} filetype:bitmap", "gsrlimit": 10, "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime", "iiurlwidth": 800,
        "iiextmetadatafilter": "Artist|LicenseShortName",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for intento in range(6):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.load(r)
            break
        except urllib.error.HTTPError as e:
            if e.code != 429 or intento == 5:
                raise
            espera = int(e.headers.get("Retry-After") or 0) or 10 * (intento + 1)
            print(f"    límite de peticiones; esperando {espera} s", flush=True)
            time.sleep(espera)
    paginas = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p["index"])
    candidatos = []
    for p in paginas:
        ii = p["imageinfo"][0]
        meta = ii.get("extmetadata", {})
        licencia = limpiar_html(meta.get("LicenseShortName", {}).get("value"))
        if ii["mime"] != "image/jpeg" or ii["width"] < 800:
            continue
        ratio = ii["width"] / ii["height"]
        if not 1.0 <= ratio <= 2.0:  # solo fotos horizontales, adecuadas para las tarjetas
            continue
        if not licencia.startswith(LICENCIAS_OK):
            continue
        candidatos.append({
            "titulo": p["title"],
            "url": ii["thumburl"].split("?")[0],
            "pagina": ii["descriptionurl"],
            "autor": limpiar_html(meta.get("Artist", {}).get("value"))[:120] or "Autor desconocido",
            "licencia": licencia,
        })
    return candidatos


def main():
    salida = AQUI / "imagenes_platillos.json"
    previas = json.loads(salida.read_text(encoding="utf8")) if salida.exists() else {}
    for id_platillo, terminos in TERMINOS.items():
        clave = str(id_platillo)
        if previas.get(clave):
            continue
        elegido = None
        for termino in terminos:
            candidatos = buscar(termino)
            if candidatos:
                elegido = {**candidatos[0], "termino": termino, "alternativas": candidatos[1:4]}
                break
            time.sleep(2)
        previas[clave] = elegido
        print(f"{id_platillo:>3} {terminos[0][:30]:30} -> {elegido['titulo'][:70] if elegido else 'SIN RESULTADO'}")
        salida.write_text(json.dumps(previas, ensure_ascii=False, indent=1), encoding="utf8")
        time.sleep(2)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
