"""Los siete métodos del motor.

El ciclo cabe en una frase: reconocer, elegir una, escribir, y volver a mirar.
La prioridad dice el turno. La certeza dice el empujón. No se sustituyen.
"""

from motor.certeza import UMBRAL, fmt_cf
from motor.hechos import BaseHechos
from motor.reglas import OPS


class Motor:
    def __init__(self, reglas, nombre="Didppi"):
        self.nombre = nombre
        self.bc = list(reglas)
        self.bf = BaseHechos()
        self.disparadas = []
        self.pasos = []

    def cargar(self, hechos, caso=""):
        """Anota los datos iniciales de este pedido, cada uno con su certeza."""
        self.bf = BaseHechos(caso)
        self.disparadas = []
        self.pasos = []
        for nombre, info in hechos.items():
            if isinstance(info, dict):
                self.bf.anotar_inicial(
                    nombre,
                    info["valor"],
                    info.get("cf", 1.0),
                    info.get("origen", "dato"),
                )
            else:
                self.bf.anotar_inicial(nombre, info, 1.0, "dato")
        return self

    def cf_condicion(self, cond):
        """Devuelve la certeza de una premisa, o 0.0 si no está o no se cumple."""
        nombre, op, esperado = cond
        hecho = self.bf.inicial(nombre)
        if hecho is None:
            return 0.0
        try:
            if not OPS[op](hecho.valor, esperado):
                return 0.0
        except TypeError:
            return 0.0
        return hecho.cf

    def cf_premisas(self, regla):
        """Devuelve la certeza más baja del SI."""
        if not regla.si:
            return 1.0
        return min(self.cf_condicion(c) for c in regla.si)

    def agenda(self):
        """Lista las reglas no disparadas cuyo SI pasa de 0.20."""
        candidatas = []
        for regla in self.bc:
            if regla.id in self.disparadas:
                continue
            if self.cf_premisas(regla) > UMBRAL:
                candidatas.append(regla)
        return candidatas

    def resolver(self, candidatas):
        """Elige una: prioridad, luego más condiciones, luego orden."""
        if not candidatas:
            return None
        ordenadas = sorted(
            enumerate(candidatas),
            key=lambda t: (-t[1].prioridad, -t[1].especificidad, t[0]),
        )
        return ordenadas[0][1]

    def disparar(self, regla, ciclo):
        """Aporte = CF de la regla × CF del SI. Lo escribe o lo combina."""
        cf_si = self.cf_premisas(regla)
        aporte = round(regla.cf * cf_si, 4)
        nombre, valor = regla.entonces
        relato = self.bf.anotar_inferido(nombre, valor, aporte, regla.id)
        self.disparadas.append(regla.id)
        paso = {
            "ciclo": ciclo,
            "regla": regla.id,
            "porque": regla.porque,
            "prioridad": regla.prioridad,
            "cf_si": cf_si,
            "cf_regla": regla.cf,
            "aporte": aporte,
            "aporte_texto": f"{regla.cf:.2f} × {cf_si:.2f} = {aporte:.2f}",
            "hecho": nombre,
            "valor": valor,
            "antes": relato["antes"],
            "despues": relato["despues"],
            "despues_texto": fmt_cf(relato["despues"]),
            "formula": relato["formula"],
            "origen": relato["origen"],
        }
        self.pasos.append(paso)
        return paso

    def adelante(self, max_ciclos=20, verbose=False):
        """Repite agenda, resolver y disparar hasta vaciar la agenda."""
        if verbose:
            print(f"--- {self.nombre}: {self.bf.caso or 'pedido'} ---")
        for ciclo in range(1, max_ciclos + 1):
            candidatas = self.agenda()
            if not candidatas:
                if verbose:
                    print(f"Ciclo {ciclo}: la agenda quedó vacía.")
                break
            regla = self.resolver(candidatas)
            paso = self.disparar(regla, ciclo)
            paso["candidatas"] = [c.id for c in candidatas]
            if verbose:
                ids = ", ".join(paso["candidatas"])
                print(f"Ciclo {paso['ciclo']}: pueden {ids}  →  sigue {paso['regla']}")
                print(f"         aporte  {paso['aporte_texto']}")
                if paso["antes"] is None:
                    print(f"         escribe {paso['valor']}  {paso['despues_texto']}")
                else:
                    print(f"         combina {paso['formula']}")
        recomendacion = self.bf.recomendacion()
        if verbose:
            if recomendacion:
                print(
                    f"\nRecomendación: {recomendacion.valor}  "
                    f"{fmt_cf(recomendacion.cf)}  ({recomendacion.origen})"
                )
            else:
                print("\nSin recomendación.")
        return recomendacion
