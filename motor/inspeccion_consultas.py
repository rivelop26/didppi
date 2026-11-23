"""Proyección del subsistema de consultas para la interfaz.

No decide nada. Corre la Consulta con las respuestas que ya dio el
cliente y cuenta lo que ve: el estado de cada regla, los puntajes de
cada dato que falta, la próxima pregunta y las estructuras en Python.
"""

from motor.casos import CASOS_CONSULTA
from motor.certeza import fmt_cf, fmt_valor
from motor.consultas import PREGUNTABLES, UMBRAL_DECISION, Consulta, FaltaRespuesta, guion
from motor.inspeccion import ETIQUETAS, HECHOS
from motor.politicas import politicas
from motor.reglas import OPS


def limpiar(respuestas):
    """Valida lo que llega de la interfaz. Solo datos preguntables; None es «no sé»."""
    if not isinstance(respuestas, dict):
        raise ValueError("Las respuestas tienen que ser un diccionario.")
    limpias = {}
    for attr, valor in respuestas.items():
        if attr not in PREGUNTABLES:
            raise ValueError(f"No se pregunta «{attr}».")
        if valor is None:
            limpias[attr] = None
        elif attr == "distancia_km":
            limpias[attr] = float(valor)
        elif valor in ("sí", "no"):
            limpias[attr] = valor
        else:
            raise ValueError(f"«{valor}» no es una respuesta para {attr}.")
    return limpias


def correr(respuestas):
    """Corre la consulta hasta el final o hasta la primera pregunta sin respuesta."""
    consulta = Consulta(politicas(), guion(respuestas))
    try:
        consulta.correr()
        return consulta, None
    except FaltaRespuesta as falta:
        return consulta, falta.attr


def _texto(valor):
    return "no sé" if valor is None else fmt_valor(valor)


def _condicion(consulta, cond):
    attr, op, valor = cond
    if attr in consulta.desconocidos:
        estado = "no_se"
    else:
        r = consulta.evaluar_condicion(cond)
        estado = "falta" if r is None else ("verdadera" if r else "falsa")
    return {"hecho": attr, "texto": f"{attr} {op} {fmt_valor(valor)}", "estado": estado}


def _estado(consulta, regla):
    if regla.id in consulta.disparadas:
        return "DISPARADA", []
    return consulta.estado_regla(regla)


def _pendientes(consulta):
    salida = []
    for regla in consulta.reglas:
        estado, faltan = _estado(consulta, regla)
        if estado == "PENDIENTE":
            salida.append((regla, faltan))
    return salida


def _puntajes(consulta, pendientes):
    candidatos = sorted({attr for _, faltan in pendientes for attr in faltan})
    filas = []
    for attr in candidatos:
        desglose = []
        for regla, faltan in pendientes:
            if attr in faltan:
                aporte = regla.prioridad * abs(regla.cf) / len(faltan)
                desglose.append(
                    {
                        "regla": regla.id,
                        "texto": f"{regla.id}: {regla.prioridad} × {abs(regla.cf):.2f} ÷ {len(faltan)} = {aporte:.2f}",
                        "aporte": round(aporte, 2),
                    }
                )
        filas.append(
            {
                "attr": attr,
                "puntaje": round(consulta.puntaje_pregunta(attr, pendientes), 2),
                "desglose": desglose,
            }
        )
    filas.sort(key=lambda fila: -fila["puntaje"])
    return filas


def _repr_reglas(reglas):
    return "[" + ",\n ".join(repr(regla) for regla in reglas) + "]"


def _python(consulta):
    return {
        "hechos": repr(consulta.hechos),
        "desconocidos": repr(consulta.desconocidos),
        "disparadas": repr(consulta.disparadas),
        "conclusiones": repr({k: round(v, 4) for k, v in consulta.conclusiones.items()}),
        "preguntas_hechas": repr(consulta.preguntas_hechas),
    }


def foto(respuestas):
    """El estado de la consulta con estas respuestas."""
    consulta, pregunta = correr(respuestas)
    reglas = []
    for regla in consulta.reglas:
        estado, faltan = _estado(consulta, regla)
        _, valor = regla.entonces
        reglas.append(
            {
                "id": regla.id,
                "prioridad": regla.prioridad,
                "cf": regla.cf,
                "cf_texto": fmt_cf(regla.cf),
                "porque": regla.porque,
                "si": [_condicion(consulta, cond) for cond in regla.si],
                "entonces": {"valor": valor, "etiqueta": ETIQUETAS.get(valor, valor)},
                "estado": estado,
                "faltan": faltan,
            }
        )

    conclusiones = [
        {"valor": v, "etiqueta": ETIQUETAS.get(v, v), "cf": round(cf, 4), "cf_texto": fmt_cf(cf)}
        for v, cf in sorted(consulta.conclusiones.items(), key=lambda t: -t[1])
    ]

    salida = {
        "umbral": UMBRAL_DECISION,
        "umbral_texto": f"{UMBRAL_DECISION:.2f}",
        "reglas": reglas,
        "hechos": [
            {"attr": a, "etiqueta": HECHOS.get(a, a), "valor_texto": _texto(v)} for a, v in consulta.hechos.items()
        ],
        "desconocidos": sorted(consulta.desconocidos),
        "conclusiones": conclusiones,
        "preguntas_hechas": list(consulta.preguntas_hechas),
        "python": _python(consulta),
        "pregunta": None,
        "puntajes": [],
        "fin": None,
    }

    if pregunta is not None:
        info = PREGUNTABLES[pregunta]
        salida["pregunta"] = {
            "attr": pregunta,
            "etiqueta": HECHOS.get(pregunta, pregunta),
            "texto": info["pregunta"],
            "numero": len(consulta.preguntas_hechas) + 1,
            "opciones": [{"valor": op, "texto": fmt_valor(op)} for op in info["opciones"]],
        }
        salida["puntajes"] = _puntajes(consulta, _pendientes(consulta))
    else:
        valor, cf = consulta.respuesta()
        if consulta.ya_seguro():
            motivo = "umbral"
        elif valor is None:
            motivo = "sin_conclusion"
        else:
            motivo = "sin_pendientes"
        salida["fin"] = {
            "motivo": motivo,
            "valor": valor,
            "etiqueta": ETIQUETAS.get(valor, valor) if valor else None,
            "cf": round(cf, 4),
            "cf_texto": fmt_cf(cf),
            "preguntas": len(consulta.preguntas_hechas),
        }
    return salida


def historia(respuestas):
    """Pregunta por pregunta: qué se preguntó, con qué puntaje y qué cambió en las reglas."""
    consulta, _ = correr(respuestas)
    pasos = []
    for i, attr in enumerate(consulta.preguntas_hechas):
        antes_resp = {a: respuestas[a] for a in consulta.preguntas_hechas[:i]}
        despues_resp = {**antes_resp, attr: respuestas[attr]}
        antes, _ = correr(antes_resp)
        despues, _ = correr(despues_resp)
        puntaje = antes.puntaje_pregunta(attr, _pendientes(antes))
        efectos = []
        for regla in despues.reglas:
            de, _f = _estado(antes, regla)
            a, _f = _estado(despues, regla)
            if de != a:
                efectos.append({"regla": regla.id, "estado": a})
        pasos.append(
            {
                "numero": i + 1,
                "attr": attr,
                "respuesta_texto": _texto(respuestas[attr]),
                "puntaje": round(puntaje, 2),
                "efectos": efectos,
            }
        )
    return pasos


def paso(respuestas):
    respuestas = limpiar(respuestas)
    return {**foto(respuestas), "historia": historia(respuestas)}


def recorrido(caso):
    """Todas las fotos de un caso, desde el momento 0 hasta el final."""
    respuestas = caso["respuestas"]
    consulta, _ = correr(respuestas)
    fotos = []
    for i in range(len(consulta.preguntas_hechas) + 1):
        parcial = {a: respuestas[a] for a in consulta.preguntas_hechas[:i]}
        fotos.append(foto(parcial))
    return {
        "id": caso["id"],
        "nombre": caso["nombre"],
        "titulo": caso["titulo"],
        "relato": caso["relato"],
        "respuestas": {a: v for a, v in respuestas.items()},
        "fotos": fotos,
        "historia": historia(respuestas),
    }


def _ops_texto():
    return "{" + ", ".join(f"{op!r}: <function>" for op in OPS) + "}"


def estructuras(caso_id="marco_sin_reporte"):
    """Cada estructura del subsistema, con su tipo real y su valor al final de un caso."""
    caso = next(c for c in CASOS_CONSULTA if c["id"] == caso_id)
    consulta, _ = correr(caso["respuestas"])
    regla = consulta.reglas[0]
    objetos = [
        ("memoria", "self.hechos", consulta.hechos, repr(consulta.hechos)),
        ("condicion", "regla.si[0]", regla.si[0], repr(regla.si[0])),
        ("regla", "self.reglas[0]", regla, repr(regla)),
        ("base", "self.reglas", consulta.reglas, _repr_reglas(consulta.reglas[:2])[:-1] + ",\n ...]"),
        ("operadores", "OPS", OPS, _ops_texto()),
        ("desconocidos", "self.desconocidos", consulta.desconocidos, repr(consulta.desconocidos)),
        ("disparadas", "self.disparadas", consulta.disparadas, repr(consulta.disparadas)),
        ("conclusiones", "self.conclusiones", consulta.conclusiones, repr(consulta.conclusiones)),
        ("preguntas", "self.preguntas_hechas", consulta.preguntas_hechas, repr(consulta.preguntas_hechas)),
        ("costo", "self.costo", consulta.costo, repr(consulta.costo)),
    ]
    return {
        "caso": {"id": caso["id"], "nombre": caso["nombre"], "relato": caso["relato"]},
        "items": [
            {"id": i, "nombre": nombre, "tipo": type(obj).__name__, "valor": valor}
            for i, nombre, obj, valor in objetos
        ],
    }


def guia():
    """Lo que necesita la interfaz al entrar: casos, recorridos y estructuras."""
    return {
        "umbral": UMBRAL_DECISION,
        "preguntables": {
            attr: {"etiqueta": HECHOS.get(attr, attr), "pregunta": info["pregunta"]}
            for attr, info in PREGUNTABLES.items()
        },
        "casos": [recorrido(caso) for caso in CASOS_CONSULTA],
        "estructuras": estructuras(),
    }
