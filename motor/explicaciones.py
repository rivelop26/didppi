"""Subsistema de explicaciones: anota lo que pasa y lo cuenta con frases.

La ConsultaExplicable decide exactamente igual que la Consulta de la sesión
pasada: cada método llama a super() y solo agrega un evento a la traza.
WHY y HOW no recalculan nada; leen la traza y rellenan una plantilla.

Algoritmos de la sesión:
A  registrar un evento               Traza.registrar
B  anotar la elección de una pregunta ConsultaExplicable.siguiente_pregunta
C  anotar por qué murió una regla     ConsultaExplicable.revisar_reglas
D  aceptar «por qué» como respuesta   ConsultaExplicable.preguntar_usuario
E  WHY                                ConsultaExplicable.why
F  HOW como árbol                     ConsultaExplicable.how_arbol
G  de condición a frase               cond_texto
"""

from motor.certeza import fmt_valor
from motor.consultas import Consulta, FaltaRespuesta

TIPOS_EVENTO = [
    "INICIO",
    "PREGUNTA",
    "WHY_PEDIDO",
    "RESPUESTA",
    "REGLA_DESCARTADA",
    "REGLA_DISPARADA",
    "PARADA",
    "CONCLUSION",
]

PEDIR_PORQUE = ("por que", "por qué", "porque", "why")


# ---------------------------------------------------------------- A · la traza


class Evento:
    def __init__(self, n, tipo, **datos):
        self.n, self.tipo, self.datos = n, tipo, datos

    def __repr__(self):
        detalle = "".join(f", {k}={v!r}" for k, v in self.datos.items())
        return f"Evento({self.n}, {self.tipo!r}{detalle})"


class Traza:
    """Bitácora de solo agregar: nada se borra ni se reescribe."""

    def __init__(self):
        self.eventos = []

    def registrar(self, tipo, **datos):
        if tipo not in TIPOS_EVENTO:
            raise ValueError(f"Tipo de evento desconocido: {tipo}")
        ev = Evento(len(self.eventos) + 1, tipo, **datos)
        self.eventos.append(ev)
        return ev

    def de_tipo(self, tipo):
        return [e for e in self.eventos if e.tipo == tipo]


# ---------------------------------------------------------------- G · plantillas

OPS_TXT = {
    "==": "es",
    "!=": "no es",
    ">=": "es mayor o igual a",
    "<=": "es menor o igual a",
    ">": "es mayor que",
    "<": "es menor que",
}


def cond_texto(c):
    attr, op, val = c
    return f"{attr} {OPS_TXT[op]} {fmt_valor(val)}"


def si_texto(regla):
    return " y ".join(cond_texto(c) for c in regla.si)


def regla_texto(regla):
    nombre, valor = regla.entonces
    return (
        f"SI {si_texto(regla)} ENTONCES {nombre} = {valor} "
        f"(certeza {regla.cf:g}, prioridad {regla.prioridad})"
    )


def datos_de(regla):
    """Los datos que usa la regla, sin repetir: R6 mira la distancia dos veces."""
    return list(dict.fromkeys(c[0] for c in regla.si))


def _lista(ids):
    if len(ids) == 1:
        return ids[0]
    return ", ".join(ids[:-1]) + " y " + ids[-1]


# ---------------------------------------------------------------- la consulta que se explica


class ConsultaExplicable(Consulta):
    def __init__(self, reglas, preguntar, meta="decision", salida=print, **opciones):
        super().__init__(reglas, preguntar, **opciones)
        self.meta = meta
        self.salida = salida
        self.persona = preguntar
        self.preguntar = self.preguntar_usuario
        self.traza = Traza()
        self.origen = {}
        self.anotadas = {}
        self.resultado = (None, 0.0)

    def _regla(self, regla_id):
        return next(r for r in self.reglas if r.id == regla_id)

    # ---- B · anotar la elección de una pregunta

    def siguiente_pregunta(self, pendientes):
        attr = super().siguiente_pregunta(pendientes)
        candidatos = sorted({a for _, faltan in pendientes for a in faltan})
        puntajes = {a: round(self.puntaje_pregunta(a, pendientes), 2) for a in candidatos}
        necesitan = [
            dict(regla=r.id, faltan=list(f), aporte=round(r.prioridad * abs(r.cf) / len(f), 2))
            for r, f in pendientes
            if attr in f
        ]
        self.traza.registrar(
            "PREGUNTA",
            dato=attr,
            numero=len(self.preguntas_hechas) + 1,
            puntajes=puntajes,
            necesitan=necesitan,
        )
        return attr

    # ---- C · anotar por qué murió una regla

    def _culpable(self, regla):
        """La condición que mató la regla, en el mismo orden en que la revisa estado_regla."""
        for c in regla.si:
            if c[0] in self.desconocidos:
                return c, "no_se"
            if self.evaluar_condicion(c) is False:
                return c, "falsa"
        return None, None

    def revisar_reglas(self):
        pendientes = super().revisar_reglas()
        for r in self.reglas:
            if r.id in self.anotadas:
                continue
            est, _ = self.estado_regla(r)
            if est in ("FALSA", "DESCARTADA"):
                c, motivo = self._culpable(r)
                self.anotadas[r.id] = est
                self.traza.registrar(
                    "REGLA_DESCARTADA",
                    regla=r.id,
                    condicion=c,
                    motivo=motivo,
                    valor=self.hechos.get(c[0]),
                )
        return pendientes

    def disparar(self, regla):
        _, valor = regla.entonces
        antes = self.conclusiones.get(valor)
        super().disparar(regla)
        self.anotadas[regla.id] = "DISPARADA"
        self.traza.registrar(
            "REGLA_DISPARADA",
            regla=regla.id,
            valor=valor,
            cf=regla.cf,
            antes=antes,
            despues=self.conclusiones[valor],
        )

    # ---- D · aceptar «por qué» como respuesta

    def preguntar_usuario(self, attr):
        nivel = 0
        while True:
            valor = self.persona(attr)
            if isinstance(valor, str) and valor.strip().lower() in PEDIR_PORQUE:
                nivel += 1
                self.traza.registrar("WHY_PEDIDO", dato=attr, nivel=nivel)
                self.salida(self.why(attr, nivel))
                continue
            return valor

    def guardar(self, attr, valor):
        numero = len(self.preguntas_hechas) + 1
        self.traza.registrar("RESPUESTA", dato=attr, valor=valor, pregunta=numero)
        self.origen[attr] = numero
        super().guardar(attr, valor)

    def correr(self):
        self.traza.registrar(
            "INICIO", meta=self.meta, umbral=self.umbral, reglas=[r.id for r in self.reglas]
        )
        valor, cf = super().correr()
        motivo = "umbral" if self.ya_seguro() else "sin_pendientes"
        self.traza.registrar("PARADA", motivo=motivo)
        self.resultado = (valor, cf)
        self.traza.registrar("CONCLUSION", valor=valor, cf=cf)
        return valor, cf

    # ---- E · WHY

    def why(self, attr, nivel=1):
        ev = [e for e in self.traza.de_tipo("PREGUNTA") if e.datos["dato"] == attr][-1]
        nec = ev.datos["necesitan"]
        top = max(nec, key=lambda x: x["aporte"])
        r = self._regla(top["regla"])
        if nivel == 1:
            otras = [n["regla"] for n in nec if n["regla"] != r.id]
            frase = f"Te pregunto por '{attr}' porque la regla {r.id} lo necesita: {regla_texto(r)}."
            if len(top["faltan"]) == 1:
                frase += " Es lo único que le falta."
            if otras:
                frase += f" También lo necesita{'n' if len(otras) > 1 else ''} {_lista(otras)}."
            frase += f" Fue el dato con mayor puntaje ({ev.datos['puntajes'][attr]:.2f})."
            return frase
        if nivel == 2:
            return (
                f"La regla {r.id} me sirve para averiguar la meta '{self.meta}' "
                f"(concluiría {r.entonces[1]}), que es lo que me pediste decidir."
            )
        return f"No hay un nivel más arriba: '{self.meta}' es la meta de esta consulta."

    # ---- F · HOW

    def apoyan(self, valor):
        """Las reglas disparadas que escribieron esta conclusión, en el orden en que se dispararon."""
        disparadas = [self._regla(i) for i in self.disparadas]
        return [r for r in disparadas if r.entonces[1] == valor]

    def how_arbol(self):
        valor, cf = self.resultado
        if valor is None:
            return f"{self.meta} = sin conclusión"
        lineas = [f"{self.meta} = {valor} (CF {cf:.2f})"]
        for r in self.apoyan(valor):
            lineas.append(f"+-- {r.id} (CF {r.cf:g}): {si_texto(r)}")
            for attr in datos_de(r):
                lineas.append(
                    f"    +-- {attr} = {fmt_valor(self.hechos[attr])} <- pregunta {self.origen[attr]}"
                )
        return "\n".join(lineas)

    def how(self):
        valor, cf = self.resultado
        if valor is None:
            no_se = sorted(self.desconocidos)
            frase = f"No llegué a una conclusión sobre '{self.meta}'."
            if no_se:
                frase += f" Me faltó saber {_lista(no_se)}: las reglas que lo necesitaban quedaron descartadas."
            return frase
        partes = []
        for k, r in enumerate(self.apoyan(valor)):
            datos = ", ".join(
                f"{cond_texto(c)} (me lo dijiste en la pregunta {self.origen[c[0]]})" for c in r.si
            )
            verbo = "se cumplió" if r.cf >= 0 else "también se cumplió, en contra,"
            inicio = "porque " if k == 0 else "y además "
            partes.append(f"{inicio}{verbo} la regla {r.id} (certeza {r.cf:g}), ya que {datos}")
        frase = f"Concluí {self.meta} = {valor} con certeza {cf:.2f} " + "; ".join(partes) + "."
        if len(partes) > 1:
            frase += " Las certezas de las reglas se combinaron con combinar_cf."
        return frase

    def por_que_no(self, regla_id):
        """WHY NOT: lee el REGLA_DESCARTADA de esa regla."""
        evs = [e for e in self.traza.de_tipo("REGLA_DESCARTADA") if e.datos["regla"] == regla_id]
        if not evs:
            return f"La regla {regla_id} no se descartó."
        d = evs[0].datos
        attr = d["condicion"][0]
        if d["motivo"] == "no_se":
            return f"La regla {regla_id} no se pudo probar: necesitaba {attr} y me dijiste «no sé»."
        return (
            f"La regla {regla_id} no se usó: «{cond_texto(d['condicion'])}» es falsa, "
            f"porque {attr} = {fmt_valor(d['valor'])}."
        )


def guion_con_porque(pasos):
    """Un preguntar() que contesta en orden. Cada paso es (dato, respuesta); «por qué» vale."""
    cola = list(pasos)

    def preguntar(attr):
        if not cola:
            raise FaltaRespuesta(attr)
        dato, valor = cola[0]
        if dato != attr:
            raise ValueError(f"Se preguntó «{attr}», pero la respuesta es para «{dato}».")
        cola.pop(0)
        return valor

    return preguntar
