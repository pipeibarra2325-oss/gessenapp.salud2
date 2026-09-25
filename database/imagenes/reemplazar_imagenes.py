"""Vuelve a buscar las imágenes que no correspondían al platillo tras la revisión visual."""
import json, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from buscar_imagenes import buscar

NUEVOS = {
    6: ["strawberry yogurt bowl", "yogurt strawberries", "strawberries yogurt"],
    13: ["tortilla de tomate", "tomato omelet", "omelette with tomato"],
    15: ["chickpea curry vegetables", "chana masala", "chickpea stew"],
    19: ["spinach salad boiled egg", "egg spinach salad", "spinach egg"],
    20: ["baked fish fillet vegetables", "fish fillet plate", "fish fillet puree"],
    24: ["tofu broccoli stir fry", "tofu vegetables stir fry", "tofu broccoli"],
    25: ["quinoa salad chickpeas", "chickpea quinoa", "quinoa chickpea"],
    26: ["smoked salmon salad", "salmon salad plate", "salmon salad"],
    27: ["roast chicken with vegetables", "roasted chicken vegetables oven", "chicken roasted vegetables"],
    31: ["tuna salad bowl", "cucumber tuna salad", "tuna salad plate"],
    44: ["greek yogurt nuts", "yogurt with almonds", "yogurt nuts bowl"],
    45: ["quinoa salad bowl", "quinoa salad", "quinoa tuna"],
    47: ["pasta with tuna", "tuna pasta dish", "pasta tonno"],
    56: ["pasta with chicken", "chicken pasta dish", "chicken penne"],
    60: ["quinoa porridge", "sweet quinoa breakfast", "quinoa pudding"],
    68: ["rice and potatoes", "white rice potatoes plate", "rice potato dish"],
    70: ["arepas de queso", "arepa de queso", "arepas"],
    72: ["banana dessert", "banana split", "banana pudding"],
    77: ["pancakes with honey", "pancakes stack", "pancakes"],
    84: ["rice and beans plate", "arroz con frijoles", "beans and rice"],
    88: ["soda and chips", "potato chips snack", "potato chips"],
    89: ["chocolate muffins", "chocolate cupcake", "chocolate muffin"],
    90: ["belgian waffles syrup", "waffles with syrup", "waffles"],
    94: ["buttered toast", "bread and butter", "toast butter"],
    96: ["tamales", "tamal tolimense", "tamale"],
}

ruta = Path(__file__).parent / "imagenes_platillos.json"
datos = json.loads(ruta.read_text(encoding="utf8"))
usados = {v["titulo"] for v in datos.values() if v}
for id_platillo, terminos in NUEVOS.items():
    rechazado = datos.get(str(id_platillo), {}) or {}
    elegido = None
    for termino in terminos:
        for c in buscar(termino):
            if c["titulo"] != rechazado.get("titulo") and c["titulo"] not in usados:
                elegido = {**c, "termino": termino}
                break
        time.sleep(2)
        if elegido:
            break
    if elegido:
        datos[str(id_platillo)] = elegido
        usados.add(elegido["titulo"])
    print(f"{id_platillo:>3} -> {elegido['titulo'][:75] if elegido else 'SIN CAMBIO'}", flush=True)
    ruta.write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding="utf8")
