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


def _respuestas(caso_id, **cambios):
    respuestas = {nombre: info["valor"] for nombre, info in preset_por_id(caso_id)["hechos"].items()}
    respuestas.update(cambios)
    return respuestas


# Subsistema de consultas: el pedido llega vacío y el cliente contesta.
# None es «no sé». Las respuestas entran con certeza 1.0.
CASOS_CONSULTA = [
    {
        "id": "ana",
        "nombre": "Ana",
        "titulo": "Cerca y seco",
        "relato": "A 2 km, pagó, no llueve y no pidió cancelar. El motor necesita las cuatro respuestas.",
        "respuestas": _respuestas("ana"),
    },
    {
        "id": "sofia",
        "nombre": "Sofía",
        "titulo": "Pidió cancelar",
        "relato": "Escribió que quiere cancelar. ¿Hace falta preguntarle algo más?",
        "respuestas": _respuestas("sofia"),
    },
    {
        "id": "hugo",
        "nombre": "Hugo",
        "titulo": "Sin pago y lejos",
        "relato": "La pasarela no confirmó el pago y vive a 10 km.",
        "respuestas": _respuestas("hugo"),
    },
    {
        "id": "luis",
        "nombre": "Luis",
        "titulo": "Lluvia cerca",
        "relato": "A 2,5 km, pagó y está lloviendo.",
        "respuestas": _respuestas("luis"),
    },
    {
        "id": "marco",
        "nombre": "Marco",
        "titulo": "Zona media con lluvia",
        "relato": "A 6 km, pagó y llueve. Una regla empuja a enviar y otra lo frena.",
        "respuestas": _respuestas("marco"),
    },
    {
        "id": "marco_sin_reporte",
        "nombre": "Marco sin reporte",
        "titulo": "No sabe si llueve",
        "relato": "El mismo Marco, pero no sabe si está lloviendo.",
        "respuestas": _respuestas("marco", llueve=None),
    },
    {
        "id": "ana_sin_reporte",
        "nombre": "Ana sin reporte",
        "titulo": "No sabe si llueve",
        "relato": "La misma Ana, pero no sabe si está lloviendo.",
        "respuestas": _respuestas("ana", llueve=None),
    },
]
