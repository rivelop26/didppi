"""Subsistema de consultas: detecta el dato que falta y pregunta lo mínimo.

Usa las mismas políticas del restaurante. Aquí el pedido no llega completo:
el motor revisa las reglas con lo que ya sabe, elige el dato que más ayuda
a decidir, lo pregunta y vuelve a revisar. Para cuando ya está seguro o
cuando no queda ninguna regla por probar.

Cada respuesta del usuario entra con certeza 1.0. La certeza que sí se
acumula es la de las reglas que se disparan.
"""

from motor.certeza import combinar_cf
from motor.reglas import OPS

UMBRAL_DECISION = 0.85

PREGUNTABLES = {
    "pidio_cancelar": {"pregunta": "¿El cliente pidió cancelar?", "opciones": ["sí", "no"]},
    "pago_confirmado": {"pregunta": "¿El pago está confirmado?", "opciones": ["sí", "no"]},
    "distancia_km": {
        "pregunta": "¿A cuántos kilómetros está el cliente?",
        "opciones": [1, 2, 2.5, 3, 5, 6, 10],
    },
    "llueve": {"pregunta": "¿Está lloviendo?", "opciones": ["sí", "no"]},
}


class FaltaRespuesta(Exception):
    """La consulta necesita un dato que todavía nadie contestó."""

    def __init__(self, attr):
        super().__init__(attr)
        self.attr = attr


def guion(respuestas):
    """Un preguntar() que contesta con un diccionario. None quiere decir «no sé»."""

    def preguntar(attr):
        if attr not in respuestas:
            raise FaltaRespuesta(attr)
        return respuestas[attr]

    return preguntar


def preguntar_por_consola(attr):
    """El mismo motor en la terminal. Enter vacío es «no sé»."""
    texto = PREGUNTABLES.get(attr, {}).get("pregunta", f"¿{attr}?")
    txt = input(f"{texto} (Enter = no sé): ").strip().lower()
    if txt == "":
        return None
    try:
        return float(txt)
    except ValueError:
        return "sí" if txt in ("si", "sí") else txt


class Consulta:
    def __init__(self, reglas, preguntar, umbral=UMBRAL_DECISION, costo=None):
        self.reglas = sorted(reglas, key=lambda regla: -regla.prioridad)
        self.preguntar = preguntar
        self.umbral = umbral
        self.costo = costo or {}
        self.hechos = {}
        self.desconocidos = set()
        self.disparadas = []
        self.conclusiones = {}
        self.preguntas_hechas = []

    def evaluar_condicion(self, cond):
        """True, False o None. None es el dato faltante."""
        attr, op, valor = cond
        if attr not in self.hechos:
            return None
        return OPS[op](self.hechos[attr], valor)

    def estado_regla(self, regla):
        """FALSA, VERDADERA, PENDIENTE (con sus datos que faltan) o DESCARTADA."""
        faltan = []
        for cond in regla.si:
            if cond[0] in self.desconocidos:
                return "DESCARTADA", []
            r = self.evaluar_condicion(cond)
            if r is False:
                return "FALSA", []
            if r is None and cond[0] not in faltan:
                faltan.append(cond[0])
        if faltan:
            return "PENDIENTE", faltan
        return "VERDADERA", []

    def disparar(self, regla):
        """Escribe la conclusión o la combina con la certeza que ya tenía."""
        nombre, valor = regla.entonces
        previo = self.conclusiones.get(valor)
        if previo is None:
            self.conclusiones[valor] = regla.cf
        else:
            self.conclusiones[valor] = combinar_cf(previo, regla.cf)
        self.disparadas.append(regla.id)

    def revisar_reglas(self):
        """Dispara las que ya se cumplen y devuelve las pendientes con lo que les falta."""
        pendientes = []
        for regla in self.reglas:
            if regla.id in self.disparadas:
                continue
            estado, faltan = self.estado_regla(regla)
            if estado == "VERDADERA":
                self.disparar(regla)
            elif estado == "PENDIENTE":
                pendientes.append((regla, faltan))
        return pendientes

    def puntaje_pregunta(self, attr, pendientes):
        """Suma prioridad × |CF| ÷ datos que faltan, sobre las reglas que lo necesitan."""
        total = 0.0
        for regla, faltan in pendientes:
            if attr in faltan:
                # abs(): R7 empuja en contra de enviar, y también ayuda a decidir.
                total += regla.prioridad * abs(regla.cf) / len(faltan)
        return total / self.costo.get(attr, 1)

    def siguiente_pregunta(self, pendientes):
        """Heurística voraz: el dato con el puntaje más alto en este momento."""
        candidatos = sorted({attr for _, faltan in pendientes for attr in faltan})
        return max(candidatos, key=lambda a: self.puntaje_pregunta(a, pendientes))

    def ya_seguro(self):
        """Parada temprana: alguna conclusión llegó al umbral."""
        return bool(self.conclusiones) and max(self.conclusiones.values()) >= self.umbral

    def guardar(self, attr, valor):
        """Lo que se responde no se vuelve a preguntar. «No sé» también queda anotado."""
        if valor is None:
            self.desconocidos.add(attr)
        else:
            self.hechos[attr] = valor
        self.preguntas_hechas.append(attr)

    def correr(self):
        while True:
            pendientes = self.revisar_reglas()
            if self.ya_seguro():
                break
            if not pendientes:
                break
            attr = self.siguiente_pregunta(pendientes)
            self.guardar(attr, self.preguntar(attr))
        return self.respuesta()

    def respuesta(self):
        """La conclusión con la certeza más alta, o (None, 0.0) si no hay ninguna a favor."""
        if not self.conclusiones:
            return None, 0.0
        valor = max(self.conclusiones, key=self.conclusiones.get)
        if self.conclusiones[valor] <= 0:
            return None, self.conclusiones[valor]
        return valor, self.conclusiones[valor]
