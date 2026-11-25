"""Proyección del subsistema de explicaciones para la interfaz.

Corre la ConsultaExplicable con los pasos que ya dio la persona (respuestas
y «por qué», en orden) y cuenta lo que quedó en la traza: los eventos, el
diálogo, el WHY de cada nivel, el HOW y las estructuras en Python.
"""

import inspect
import textwrap

from motor import explicaciones as ex
from motor.casos import CASOS_EXPLICACION
from motor.certeza import fmt_cf, fmt_valor
from motor.consultas import PREGUNTABLES, UMBRAL_DECISION, FaltaRespuesta
from motor.inspeccion import ETIQUETAS, HECHOS
from motor.politicas import politicas

POR_QUE = "por qué"
MAX_PASOS = 40


def limpiar(pasos):
    """Valida lo que llega de la interfaz: una lista de [dato, respuesta]."""
    if not isinstance(pasos, list):
        raise ValueError("Los pasos tienen que ser una lista.")
    if len(pasos) > MAX_PASOS:
        raise ValueError("Demasiados pasos para una consulta.")
    limpios = []
    for paso in pasos:
        if not isinstance(paso, (list, tuple)) or len(paso) != 2:
            raise ValueError("Cada paso es [dato, respuesta].")
        attr, valor = paso
        if attr not in PREGUNTABLES:
            raise ValueError(f"No se pregunta «{attr}».")
        if valor is None:
            limpios.append((attr, None))
        elif isinstance(valor, str) and valor.strip().lower() in ex.PEDIR_PORQUE:
            limpios.append((attr, POR_QUE))
        elif attr == "distancia_km":
            limpios.append((attr, float(valor)))
        elif valor in ("sí", "no"):
            limpios.append((attr, valor))
        else:
            raise ValueError(f"«{valor}» no es una respuesta para {attr}.")
    return limpios


def correr(pasos):
    """Corre hasta el final o hasta la primera pregunta sin respuesta."""
    dichos = []
    consulta = ex.ConsultaExplicable(politicas(), ex.guion_con_porque(pasos), salida=dichos.append)
    try:
        consulta.correr()
        return consulta, None, dichos
    except FaltaRespuesta as falta:
        return consulta, falta.attr, dichos


def pasos_del_caso(caso):
    """Convierte respuestas + «por qué» en la lista ordenada de pasos que vería la interfaz."""
    pedidos = dict(caso["porque"])
    pasos = []

    def preguntar(attr):
        if pedidos.get(attr, 0) > 0:
            pedidos[attr] -= 1
            pasos.append([attr, POR_QUE])
            return POR_QUE
        valor = caso["respuestas"][attr]
        pasos.append([attr, valor])
        return valor

    ex.ConsultaExplicable(politicas(), preguntar, salida=lambda _texto: None).correr()
    return pasos


# ---------------------------------------------------------------- textos de la traza


def _texto(valor):
    return "no sé" if valor is None else fmt_valor(valor)


def _seguro(valor):
    """Lo mismo, pero que JSON entienda: las tuplas pasan a listas."""
    if isinstance(valor, tuple):
        return [_seguro(v) for v in valor]
    if isinstance(valor, list):
        return [_seguro(v) for v in valor]
    if isinstance(valor, dict):
        return {k: _seguro(v) for k, v in valor.items()}
    return valor


def resumen(ev):
    d = ev.datos
    t = ev.tipo
    if t == "INICIO":
        return f"meta '{d['meta']}', umbral {d['umbral']:.2f}, reglas: {', '.join(d['reglas'])}"
    if t == "PREGUNTA":
        quienes = ", ".join(n["regla"] for n in d["necesitan"])
        return f"pregunta {d['numero']}: {d['dato']} (puntaje {d['puntajes'][d['dato']]:.2f}) · la necesitan {quienes}"
    if t == "WHY_PEDIDO":
        return f"nivel {d['nivel']} sobre {d['dato']}"
    if t == "RESPUESTA":
        return f"pregunta {d['pregunta']}: {d['dato']} = {_texto(d['valor'])}"
    if t == "REGLA_DESCARTADA":
        c = d["condicion"]
        if d["motivo"] == "no_se":
            return f"{d['regla']}: necesitaba {c[0]} y la respuesta fue «no sé»"
        return f"{d['regla']}: «{ex.cond_texto(c)}» es falsa, porque {c[0]} = {fmt_valor(d['valor'])}"
    if t == "REGLA_DISPARADA":
        if d["antes"] is None:
            return f"{d['regla']} → {d['valor']} (CF {fmt_cf(d['cf'])})"
        return f"{d['regla']} → {d['valor']} (CF {fmt_cf(d['cf'])}): {fmt_cf(d['antes'])} pasa a {fmt_cf(d['despues'])}"
    if t == "PARADA":
        if d["motivo"] == "umbral":
            return f"una conclusión llegó al umbral de {UMBRAL_DECISION:.2f}"
        return "no quedan reglas pendientes por probar"
    if t == "CONCLUSION":
        if d["valor"] is None:
            return "sin conclusión"
        return f"{d['valor']} (CF {fmt_cf(d['cf'])})"
    return ""


def _eventos(consulta):
    return [
        {"n": ev.n, "tipo": ev.tipo, "datos": _seguro(ev.datos), "resumen": resumen(ev), "python": repr(ev)}
        for ev in consulta.traza.eventos
    ]


def _dialogo(consulta, dichos):
    """El chat que vio la persona, armado solo con la traza."""
    lineas = []
    whys = iter(dichos)
    for ev in consulta.traza.eventos:
        d = ev.datos
        if ev.tipo == "PREGUNTA":
            lineas.append({"quien": "sistema", "texto": PREGUNTABLES[d["dato"]]["pregunta"], "evento": ev.n})
        elif ev.tipo == "WHY_PEDIDO":
            lineas.append({"quien": "persona", "texto": POR_QUE, "evento": ev.n})
            lineas.append({"quien": "why", "nivel": d["nivel"], "texto": next(whys), "evento": ev.n})
        elif ev.tipo == "RESPUESTA":
            lineas.append({"quien": "persona", "texto": _texto(d["valor"]), "evento": ev.n})
    return lineas


def _arbol(consulta):
    valor, cf = consulta.resultado
    if valor is None:
        return None
    return {
        "meta": consulta.meta,
        "valor": valor,
        "etiqueta": ETIQUETAS.get(valor, valor),
        "cf": cf,
        "cf_texto": fmt_cf(cf),
        "reglas": [
            {
                "id": r.id,
                "cf": r.cf,
                "cf_texto": fmt_cf(r.cf),
                "si": ex.si_texto(r),
                "datos": [
                    {"attr": a, "valor_texto": fmt_valor(consulta.hechos[a]), "pregunta": consulta.origen[a]}
                    for a in ex.datos_de(r)
                ],
            }
            for r in consulta.apoyan(valor)
        ],
    }


def _python(consulta):
    eventos = consulta.traza.eventos
    ultimos = [repr(e) for e in eventos[-3:]]
    if len(eventos) > 3:
        ultimos.insert(0, f"... {len(eventos) - 3} eventos antes")
    return {
        "eventos": "[" + ",\n ".join(ultimos) + "]",
        "origen": repr(consulta.origen),
        "anotadas": repr(consulta.anotadas),
        "resultado": repr(consulta.resultado),
    }


def foto(pasos):
    consulta, pendiente, dichos = correr(pasos)
    salida = {
        "umbral": UMBRAL_DECISION,
        "eventos": _eventos(consulta),
        "dialogo": _dialogo(consulta, dichos),
        "python": _python(consulta),
        "pregunta": None,
        "fin": None,
    }
    if pendiente is not None:
        ultima = [e for e in consulta.traza.de_tipo("PREGUNTA") if e.datos["dato"] == pendiente][-1]
        niveles = [e for e in consulta.traza.de_tipo("WHY_PEDIDO") if e.n > ultima.n]
        info = PREGUNTABLES[pendiente]
        salida["pregunta"] = {
            "attr": pendiente,
            "etiqueta": HECHOS.get(pendiente, pendiente),
            "texto": info["pregunta"],
            "numero": ultima.datos["numero"],
            "nivel": len(niveles),
            "opciones": [{"valor": op, "texto": fmt_valor(op)} for op in info["opciones"]],
        }
        return salida
    valor, cf = consulta.resultado
    salida["fin"] = {
        "valor": valor,
        "etiqueta": ETIQUETAS.get(valor, valor) if valor else None,
        "cf": cf,
        "cf_texto": fmt_cf(cf),
        "motivo": consulta.traza.de_tipo("PARADA")[-1].datos["motivo"],
        "preguntas": len(consulta.preguntas_hechas),
        "how": consulta.how(),
        "how_arbol": consulta.how_arbol(),
        "arbol": _arbol(consulta),
        "descartadas": [
            {"regla": e.datos["regla"], "texto": consulta.por_que_no(e.datos["regla"])}
            for e in consulta.traza.de_tipo("REGLA_DESCARTADA")
        ],
    }
    return salida


def paso(pasos):
    return foto(limpiar(pasos))


def recorrido(caso):
    pasos = pasos_del_caso(caso)
    return {
        "id": caso["id"],
        "nombre": caso["nombre"],
        "titulo": caso["titulo"],
        "relato": caso["relato"],
        "pasos": pasos,
        "final": foto(pasos),
    }


# ---------------------------------------------------------------- estructuras y código


def estructuras(caso_id="hugo"):
    caso = next(c for c in CASOS_EXPLICACION if c["id"] == caso_id)
    consulta, _, _ = correr(pasos_del_caso(caso))
    traza = consulta.traza
    pregunta = traza.de_tipo("PREGUNTA")[0]
    descarte = traza.de_tipo("REGLA_DESCARTADA")[0]
    eventos = traza.eventos
    objetos = [
        ("evento", "self.traza.eventos[1]", pregunta, repr(pregunta)),
        ("traza", "self.traza", traza, f"<Traza con {len(eventos)} eventos>"),
        ("eventos", "self.traza.eventos", eventos, "[" + ",\n ".join(repr(e) for e in eventos[:3]) + ",\n ...]"),
        ("datos", "ev.datos", pregunta.datos, repr(pregunta.datos)),
        ("necesitan", 'ev.datos["necesitan"]', pregunta.datos["necesitan"], repr(pregunta.datos["necesitan"])),
        ("condicion", 'ev.datos["condicion"]', descarte.datos["condicion"], repr(descarte.datos["condicion"])),
        ("origen", "self.origen", consulta.origen, repr(consulta.origen)),
        ("anotadas", "self.anotadas", consulta.anotadas, repr(consulta.anotadas)),
        ("resultado", "self.resultado", consulta.resultado, repr(consulta.resultado)),
        ("ops_txt", "OPS_TXT", ex.OPS_TXT, repr(ex.OPS_TXT)),
        ("arbol", "self.how_arbol()", consulta.how_arbol(), consulta.how_arbol()),
    ]
    return {
        "caso": {"id": caso["id"], "nombre": caso["nombre"], "relato": caso["relato"]},
        "items": [
            {"id": i, "nombre": nombre, "tipo": type(obj).__name__, "valor": valor}
            for i, nombre, obj, valor in objetos
        ],
    }


SECCIONES = [
    ("A", "Registrar un evento", "La traza: una lista a la que solo se le agrega al final.", ["Evento", "Traza"]),
    ("G", "De condición a frase", "Las plantillas que convierten una condición en texto.",
     ["OPS_TXT", "cond_texto", "si_texto", "regla_texto", "datos_de"]),
    ("·", "La consulta que se explica", "Hereda de Consulta: decide igual, y además anota.",
     ["ConsultaExplicable.__init__"]),
    ("B", "Anotar la elección de una pregunta", "super() elige igual que antes; aquí se guarda el porqué.",
     ["ConsultaExplicable.siguiente_pregunta"]),
    ("C", "Anotar por qué murió una regla", "La condición culpable y su valor real: la base del WHY NOT.",
     ["ConsultaExplicable._culpable", "ConsultaExplicable.revisar_reglas", "ConsultaExplicable.disparar"]),
    ("D", "Aceptar «por qué» como respuesta", "Explica y vuelve a hacer la misma pregunta.",
     ["ConsultaExplicable.preguntar_usuario", "ConsultaExplicable.guardar", "ConsultaExplicable.correr"]),
    ("E", "WHY", "Busca el último PREGUNTA de ese dato y rellena la plantilla del nivel.",
     ["ConsultaExplicable.why"]),
    ("F", "HOW", "Recorre hacia atrás: conclusión, reglas, datos y pregunta de origen.",
     ["ConsultaExplicable.apoyan", "ConsultaExplicable.how_arbol", "ConsultaExplicable.how",
      "ConsultaExplicable.por_que_no"]),
]


def _fuente(nombre):
    if nombre == "OPS_TXT":
        texto = inspect.getsource(ex)
        inicio = texto.index("OPS_TXT = {")
        return texto[inicio : texto.index("\n}\n", inicio) + 2]
    obj = ex
    for parte in nombre.split("."):
        obj = getattr(obj, parte)
    return textwrap.dedent(inspect.getsource(obj)).rstrip() + "\n"


def codigo():
    return {
        "archivo": "motor/explicaciones.py",
        "completo": inspect.getsource(ex),
        "secciones": [
            {"letra": letra, "titulo": titulo, "texto": texto, "codigo": "\n".join(_fuente(n) for n in nombres)}
            for letra, titulo, texto, nombres in SECCIONES
        ],
    }


def guia():
    return {
        "umbral": UMBRAL_DECISION,
        "tipos_evento": ex.TIPOS_EVENTO,
        "reglas": [
            {
                "id": r.id,
                "texto": ex.regla_texto(r),
                "si": [{"cond": _seguro(c), "texto": ex.cond_texto(c)} for c in r.si],
                "valor": r.entonces[1],
            }
            for r in politicas()
        ],
        "preguntables": {
            attr: {"etiqueta": HECHOS.get(attr, attr), "pregunta": info["pregunta"]}
            for attr, info in PREGUNTABLES.items()
        },
        "casos": [recorrido(caso) for caso in CASOS_EXPLICACION],
        "estructuras": estructuras(),
        "codigo": codigo(),
    }
