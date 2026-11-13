"""Base de hechos: el estado de ESTE pedido.

Mañana entra otro pedido y esta tabla se vuelve a crear.
Los hechos iniciales los anota ``cargar``. Los inferidos los escribe ``disparar``.
"""

from motor.certeza import combinar_cf, fmt_cf, fmt_valor, texto_combinacion


class Hecho:
    def __init__(self, nombre, valor, cf=1.0, origen="", clase="inicial"):
        self.nombre = nombre
        self.valor = valor
        self.cf = round(float(cf), 4)
        self.origen = origen
        self.clase = clase

    def fila(self):
        return {
            "clase": self.clase,
            "nombre": self.nombre,
            "valor": self.valor,
            "valor_texto": fmt_valor(self.valor),
            "cf": self.cf,
            "cf_texto": fmt_cf(self.cf),
            "origen": self.origen,
        }


class BaseHechos:
    def __init__(self, caso=""):
        self.caso = caso
        self.hechos = []

    def anotar_inicial(self, nombre, valor, cf=1.0, origen="dato"):
        self.hechos = [
            h for h in self.hechos if not (h.nombre == nombre and h.clase == "inicial")
        ]
        self.hechos.append(Hecho(nombre, valor, cf, origen, "inicial"))

    def inicial(self, nombre):
        for hecho in self.hechos:
            if hecho.nombre == nombre and hecho.clase == "inicial":
                return hecho
        return None

    def buscar_inferido(self, nombre, valor):
        for hecho in self.hechos:
            if hecho.nombre == nombre and hecho.valor == valor and hecho.clase == "inferido":
                return hecho
        return None

    def anotar_inferido(self, nombre, valor, aporte, regla_id):
        """Escribe la conclusión o la combina con la fila que ya estaba."""
        previo = self.buscar_inferido(nombre, valor)
        if previo is None:
            self.hechos.append(Hecho(nombre, valor, aporte, regla_id, "inferido"))
            return {
                "antes": None,
                "aporte": aporte,
                "despues": round(float(aporte), 4),
                "formula": f"{aporte:.2f} queda en la fila",
                "origen": regla_id,
            }
        antes = previo.cf
        nuevo = combinar_cf(antes, aporte)
        previo.cf = nuevo
        previo.origen = f"{previo.origen} y {regla_id}"
        return {
            "antes": antes,
            "aporte": aporte,
            "despues": nuevo,
            "formula": texto_combinacion(antes, aporte),
            "origen": previo.origen,
        }

    def inferidos(self, nombre="decision"):
        return [h for h in self.hechos if h.clase == "inferido" and h.nombre == nombre]

    def recomendacion(self, nombre="decision"):
        from motor.certeza import UMBRAL

        filas = self.inferidos(nombre)
        if not filas:
            return None
        mejor = max(filas, key=lambda h: h.cf)
        if mejor.cf <= UMBRAL:
            return None
        return mejor

    def filas(self):
        return [h.fila() for h in self.hechos]
