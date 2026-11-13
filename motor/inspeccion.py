"""Proyección del motor para la interfaz.

No decide qué se le muestra al estudiante. Cuenta lo que el motor hace
con este pedido: cada premisa, la agenda, el orden y la recomendación.
"""

from motor.certeza import UMBRAL, fmt_cf, fmt_valor
from motor.motor import Motor
from motor.politicas import politicas

ETIQUETAS = {
    "enviar": "Preparar y enviar",
    "esperar_lluvia": "Preparar y esperar un claro",
    "cancelar": "Cancelar antes de empezar",
    "fuera_de_zona": "No iniciar: fuera de zona",
}

HECHOS = {
    "pago_confirmado": "Pago confirmado",
    "distancia_km": "Distancia",
    "llueve": "Está lloviendo",
    "pidio_cancelar": "Pidió cancelar",
}


def _condicion(motor, cond):
    nombre, op, esperado = cond
    return {
        "hecho": nombre,
        "op": op,
        "valor": esperado,
        "texto": f"{nombre} {op} {fmt_valor(esperado)}",
        "cf": motor.cf_condicion(cond),
        "cf_texto": fmt_cf(motor.cf_condicion(cond)),
    }


def _recomendacion(hecho):
    if hecho is None:
        return None
    return {
        "valor": hecho.valor,
        "etiqueta": ETIQUETAS.get(hecho.valor, str(hecho.valor)),
        "cf": hecho.cf,
        "cf_texto": fmt_cf(hecho.cf),
        "origen": hecho.origen,
    }


def inspeccionar(hechos, caso=""):
    if not isinstance(hechos, dict) or not hechos:
        raise ValueError("El pedido no trae hechos.")

    motor = Motor(politicas(), "Despacho")
    motor.cargar(hechos, caso)

    reglas = []
    for regla in motor.bc:
        premisas = [_condicion(motor, cond) for cond in regla.si]
        cf_si = motor.cf_premisas(regla)
        nombre, valor = regla.entonces
        reglas.append(
            {
                "id": regla.id,
                "prioridad": regla.prioridad,
                "cf": regla.cf,
                "cf_texto": fmt_cf(regla.cf),
                "especificidad": regla.especificidad,
                "porque": regla.porque,
                "si": premisas,
                "cf_si": cf_si,
                "cf_si_texto": fmt_cf(cf_si),
                "entra": cf_si > UMBRAL,
                "entonces": {
                    "hecho": nombre,
                    "valor": valor,
                    "etiqueta": ETIQUETAS.get(valor, str(valor)),
                },
            }
        )

    agenda = [regla.id for regla in motor.agenda()]
    primera = motor.resolver(motor.agenda())
    motor.adelante(verbose=False)

    ciclos = []
    for paso in motor.pasos:
        valor = paso["valor"]
        ciclos.append(
            {
                **paso,
                "etiqueta": ETIQUETAS.get(valor, str(valor)),
                "cf_si_texto": fmt_cf(paso["cf_si"]),
                "cf_regla_texto": fmt_cf(paso["cf_regla"]),
                "aporte_cf_texto": fmt_cf(paso["aporte"]),
                "antes_texto": None if paso["antes"] is None else fmt_cf(paso["antes"]),
            }
        )

    return {
        "caso": caso,
        "umbral": UMBRAL,
        "umbral_texto": fmt_cf(UMBRAL),
        "hechos": motor.bf.filas(),
        "etiquetas_hechos": HECHOS,
        "reglas": reglas,
        "agenda": agenda,
        "primera": None if primera is None else primera.id,
        "ciclos": ciclos,
        "recomendacion": _recomendacion(motor.bf.recomendacion()),
    }
