"""Una regla es una política que no cambia con el pedido."""

OPS = {
    "==": lambda a, b: a == b,
    "!=": lambda a, b: a != b,
    ">": lambda a, b: a > b,
    ">=": lambda a, b: a >= b,
    "<": lambda a, b: a < b,
    "<=": lambda a, b: a <= b,
}


class Regla:
    def __init__(self, id, si, entonces, prioridad=10, cf=1.0, porque=""):
        self.id = id
        self.si = [tuple(c) for c in si]
        self.entonces = tuple(entonces)
        self.prioridad = prioridad
        self.cf = float(cf)
        self.porque = porque

    @property
    def especificidad(self):
        return len(self.si)


class Constructor:
    """Cinco pasos para escribir una política: id, SI, ENTONCES, prioridad, CF."""

    def __init__(self, id):
        self._id = id
        self._si = []
        self._entonces = None
        self._prioridad = 10
        self._cf = 1.0
        self._porque = ""

    def si(self, hecho, op, valor):
        if op not in OPS:
            raise ValueError(f"Operador desconocido: {op}")
        self._si.append((hecho, op, valor))
        return self

    def entonces(self, hecho, valor):
        self._entonces = (hecho, valor)
        return self

    def prioridad(self, n):
        self._prioridad = int(n)
        return self

    def cf(self, n):
        self._cf = float(n)
        return self

    def porque(self, texto):
        self._porque = texto
        return self

    def construir(self):
        if not self._si or self._entonces is None:
            raise ValueError(f"{self._id}: faltan el SI o el ENTONCES")
        return Regla(
            self._id,
            self._si,
            self._entonces,
            self._prioridad,
            self._cf,
            self._porque,
        )
