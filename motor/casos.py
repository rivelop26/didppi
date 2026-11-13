"""Pedidos de ejemplo. Cada certeza viaja con su dato.

Edita los números para armar otro caso de clase. La interfaz también
deja mover pago, distancia, lluvia y cancelación sin tocar este archivo.
"""


def _hecho(valor, cf=1.0, origen="dato"):
    return {"valor": valor, "cf": cf, "origen": origen}


PRESETS = [
    {
        "id": "ana",
        "nombre": "Ana",
        "titulo": "Cerca y seco",
        "relato": "Torre del centro, a 2 km. El pago entró, no llueve y no pidió cancelar.",
        "hechos": {
            "pago_confirmado": _hecho("sí", 1.0, "pasarela"),
            "distancia_km": _hecho(2, 1.0, "mapa"),
            "llueve": _hecho("no", 1.0, "reporte"),
            "pidio_cancelar": _hecho("no", 1.0, "cliente"),
        },
    },
    {
        "id": "luis",
        "nombre": "Luis",
        "titulo": "Lluvia a medias",
        "relato": "Está a 2,5 km y el pago entró. El reporte de lluvia llega con certeza 0.60.",
        "hechos": {
            "pago_confirmado": _hecho("sí", 1.0, "pasarela"),
            "distancia_km": _hecho(2.5, 1.0, "mapa"),
            "llueve": _hecho("sí", 0.60, "reporte"),
            "pidio_cancelar": _hecho("no", 1.0, "cliente"),
        },
    },
    {
        "id": "sofia",
        "nombre": "Sofía",
        "titulo": "Pidió cancelar",
        "relato": "Está cerca y ya pagó, pero escribió que quiere cancelar. El mensaje se lee con certeza 0.80.",
        "hechos": {
            "pago_confirmado": _hecho("sí", 1.0, "pasarela"),
            "distancia_km": _hecho(3, 1.0, "mapa"),
            "llueve": _hecho("no", 1.0, "reporte"),
            "pidio_cancelar": _hecho("sí", 0.80, "cliente"),
        },
    },
    {
        "id": "marco",
        "nombre": "Marco",
        "titulo": "Zona media con lluvia",
        "relato": "Está a 6 km, con pago confirmado, y sí está lloviendo. Una regla empuja a enviar y otra lo frena.",
        "hechos": {
            "pago_confirmado": _hecho("sí", 1.0, "pasarela"),
            "distancia_km": _hecho(6, 1.0, "mapa"),
            "llueve": _hecho("sí", 1.0, "reporte"),
            "pidio_cancelar": _hecho("no", 1.0, "cliente"),
        },
    },
    {
        "id": "hugo",
        "nombre": "Hugo",
        "titulo": "Sin pago y lejos",
        "relato": "Está a 10 km y la pasarela no confirmó el pago. Dos conclusiones distintas levantan la mano.",
        "hechos": {
            "pago_confirmado": _hecho("no", 1.0, "pasarela"),
            "distancia_km": _hecho(10, 1.0, "mapa"),
            "llueve": _hecho("no", 1.0, "reporte"),
            "pidio_cancelar": _hecho("no", 1.0, "cliente"),
        },
    },
    {
        "id": "nube",
        "nombre": "Nube",
        "titulo": "Pago ilegible",
        "relato": "El comprobante casi no se lee: la certeza del pago es 0.15. El resto del pedido está claro.",
        "hechos": {
            "pago_confirmado": _hecho("sí", 0.15, "pasarela"),
            "distancia_km": _hecho(2, 1.0, "mapa"),
            "llueve": _hecho("no", 1.0, "reporte"),
            "pidio_cancelar": _hecho("no", 1.0, "cliente"),
        },
    },
]


def preset_por_id(caso_id):
    for preset in PRESETS:
        if preset["id"] == caso_id:
            return preset
    return None
