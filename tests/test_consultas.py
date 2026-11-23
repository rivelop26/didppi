import unittest

from motor import inspeccion_consultas as ic
from motor.casos import CASOS_CONSULTA
from motor.consultas import Consulta, FaltaRespuesta, guion
from motor.politicas import politicas


def caso(caso_id):
    return next(c for c in CASOS_CONSULTA if c["id"] == caso_id)


def preguntas(caso_id):
    consulta = Consulta(politicas(), guion(caso(caso_id)["respuestas"]))
    valor, cf = consulta.correr()
    return consulta, valor, cf


class AlgoritmosDeLaConsulta(unittest.TestCase):
    def test_sin_dato_la_condicion_es_none(self):
        consulta = Consulta(politicas(), guion({}))
        self.assertIsNone(consulta.evaluar_condicion(("llueve", "==", "no")))
        consulta.hechos["llueve"] = "sí"
        self.assertFalse(consulta.evaluar_condicion(("llueve", "==", "no")))

    def test_cortocircuito_no_anota_faltantes(self):
        consulta = Consulta(politicas(), guion({}))
        consulta.hechos["pago_confirmado"] = "no"
        r3 = next(r for r in consulta.reglas if r.id == "R3")
        self.assertEqual(consulta.estado_regla(r3), ("FALSA", []))

    def test_pendiente_lista_lo_que_falta_sin_repetir(self):
        consulta = Consulta(politicas(), guion({}))
        r6 = next(r for r in consulta.reglas if r.id == "R6")
        self.assertEqual(
            consulta.estado_regla(r6), ("PENDIENTE", ["pago_confirmado", "distancia_km", "pidio_cancelar"])
        )

    def test_primera_pregunta_es_la_cancelacion(self):
        consulta = Consulta(politicas(), guion({}))
        with self.assertRaises(FaltaRespuesta) as falta:
            consulta.correr()
        self.assertEqual(falta.exception.attr, "pidio_cancelar")

    def test_no_se_repite_una_pregunta(self):
        consulta, _, _ = preguntas("ana")
        self.assertEqual(len(consulta.preguntas_hechas), len(set(consulta.preguntas_hechas)))


class CasosDeConsulta(unittest.TestCase):
    def test_sofia_una_pregunta(self):
        consulta, valor, cf = preguntas("sofia")
        self.assertEqual(consulta.preguntas_hechas, ["pidio_cancelar"])
        self.assertEqual((valor, cf), ("cancelar", 0.95))

    def test_hugo_dos_preguntas(self):
        consulta, valor, cf = preguntas("hugo")
        self.assertEqual(consulta.preguntas_hechas, ["pidio_cancelar", "pago_confirmado"])
        self.assertEqual((valor, cf), ("cancelar", 0.90))

    def test_ana_combina_r3_y_r8(self):
        consulta, valor, cf = preguntas("ana")
        self.assertEqual(consulta.disparadas, ["R3", "R8"])
        self.assertEqual(valor, "enviar")
        self.assertAlmostEqual(cf, 0.9325)

    def test_marco_sigue_por_r7(self):
        consulta, valor, cf = preguntas("marco")
        self.assertEqual(consulta.preguntas_hechas[-1], "llueve")
        self.assertEqual(valor, "enviar")
        self.assertAlmostEqual(cf, 0.2857)

    def test_no_se_descarta(self):
        consulta, valor, cf = preguntas("marco_sin_reporte")
        self.assertEqual(consulta.desconocidos, {"llueve"})
        self.assertEqual((valor, cf), ("enviar", 0.5))

    def test_ana_sin_reporte_queda_sin_conclusion(self):
        info = ic.recorrido(caso("ana_sin_reporte"))
        self.assertEqual(info["fotos"][-1]["fin"]["motivo"], "sin_conclusion")


class Interfaz(unittest.TestCase):
    def test_paso_rechaza_un_dato_que_no_se_pregunta(self):
        with self.assertRaises(ValueError):
            ic.paso({"color_de_ojos": "café"})

    def test_paso_da_la_siguiente_pregunta_y_los_puntajes(self):
        info = ic.paso({"pidio_cancelar": "no"})
        self.assertEqual(info["pregunta"]["attr"], "pago_confirmado")
        self.assertEqual(info["puntajes"][0]["attr"], "pago_confirmado")
        self.assertAlmostEqual(info["puntajes"][0]["puntaje"], 132.83)
        self.assertEqual(info["historia"][0]["efectos"], [{"regla": "R1", "estado": "FALSA"}])

    def test_estructuras_traen_su_tipo_real(self):
        tipos = {item["id"]: item["tipo"] for item in ic.estructuras()["items"]}
        self.assertEqual(tipos["memoria"], "dict")
        self.assertEqual(tipos["condicion"], "tuple")
        self.assertEqual(tipos["desconocidos"], "set")
        self.assertEqual(tipos["regla"], "Regla")


if __name__ == "__main__":
    unittest.main()
