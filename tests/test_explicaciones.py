import unittest

from motor import inspeccion_explicaciones as ie
from motor.casos import CASOS_CONSULTA, CASOS_EXPLICACION
from motor.consultas import Consulta, FaltaRespuesta, guion
from motor.explicaciones import ConsultaExplicable, Traza, cond_texto, guion_con_porque
from motor.politicas import politicas


def caso(caso_id):
    return next(c for c in CASOS_EXPLICACION if c["id"] == caso_id)


def explicada(caso_id):
    dichos = []
    consulta = ConsultaExplicable(
        politicas(), guion_con_porque(ie.pasos_del_caso(caso(caso_id))), salida=dichos.append
    )
    consulta.correr()
    return consulta, dichos


def tipos(consulta):
    return [e.tipo for e in consulta.traza.eventos]


class LaTraza(unittest.TestCase):
    def test_registrar_numera_en_orden_y_solo_agrega(self):
        traza = Traza()
        traza.registrar("INICIO", meta="decision")
        ev = traza.registrar("PREGUNTA", dato="llueve")
        self.assertEqual(ev.n, 2)
        self.assertEqual([e.tipo for e in traza.eventos], ["INICIO", "PREGUNTA"])
        self.assertEqual(traza.de_tipo("PREGUNTA"), [ev])

    def test_rechaza_un_tipo_que_no_existe(self):
        with self.assertRaises(ValueError):
            Traza().registrar("OPINION")

    def test_plantilla_de_condicion(self):
        self.assertEqual(cond_texto(("distancia_km", ">", 8)), "distancia_km es mayor que 8")
        self.assertEqual(cond_texto(("llueve", "==", "no")), "llueve es no")


class AnotarNoCambiaLaDecision(unittest.TestCase):
    def test_misma_decision_y_mismas_preguntas_que_la_consulta(self):
        for c in CASOS_CONSULTA:
            with self.subTest(caso=c["id"]):
                normal = Consulta(politicas(), guion(c["respuestas"]))
                esperado = normal.correr()
                explicable = ConsultaExplicable(politicas(), guion(c["respuestas"]), salida=lambda _t: None)
                self.assertEqual(explicable.correr(), esperado)
                self.assertEqual(explicable.preguntas_hechas, normal.preguntas_hechas)
                self.assertEqual(explicable.disparadas, normal.disparadas)


class WhyYHow(unittest.TestCase):
    def test_ana_pide_por_que_tres_veces(self):
        consulta, dichos = explicada("ana")
        niveles = [e.datos["nivel"] for e in consulta.traza.de_tipo("WHY_PEDIDO")]
        self.assertEqual(niveles, [1, 2, 3])
        self.assertIn("la regla R2 lo necesita", dichos[0])
        self.assertIn("meta 'decision'", dichos[1])
        self.assertTrue(dichos[2].startswith("No hay un nivel más arriba"))
        self.assertEqual(consulta.preguntas_hechas.count("pago_confirmado"), 1)

    def test_la_traza_de_sofia(self):
        consulta, _ = explicada("sofia")
        self.assertEqual(
            tipos(consulta),
            ["INICIO", "PREGUNTA", "WHY_PEDIDO", "RESPUESTA", "REGLA_DISPARADA"]
            + ["REGLA_DESCARTADA"] * 3
            + ["PARADA", "CONCLUSION"],
        )

    def test_how_de_ana_junta_r3_y_r8_con_su_origen(self):
        consulta, _ = explicada("ana")
        self.assertEqual([r.id for r in consulta.apoyan("enviar")], ["R3", "R8"])
        arbol = consulta.how_arbol()
        self.assertTrue(arbol.startswith("decision = enviar (CF 0.93)"))
        self.assertIn("pago_confirmado = sí <- pregunta 2", arbol)

    def test_how_de_marco_lleva_la_regla_en_contra(self):
        consulta, _ = explicada("marco")
        self.assertEqual([r.id for r in consulta.apoyan("enviar")], ["R6", "R7"])
        self.assertIn("en contra", consulta.how())
        self.assertEqual(consulta.how_arbol().count("distancia_km = 6"), 2)

    def test_por_que_no(self):
        consulta, _ = explicada("hugo")
        self.assertEqual(
            consulta.por_que_no("R3"),
            "La regla R3 no se usó: «pago_confirmado es sí» es falsa, porque pago_confirmado = no.",
        )
        sin_reporte, _ = explicada("ana_sin_reporte")
        self.assertIn("«no sé»", sin_reporte.por_que_no("R3"))
        self.assertTrue(sin_reporte.how().startswith("No llegué a una conclusión"))

    def test_guion_exige_el_orden_del_motor(self):
        consulta = ConsultaExplicable(politicas(), guion_con_porque([("llueve", "no")]), salida=lambda _t: None)
        with self.assertRaises(ValueError):
            consulta.correr()

    def test_sin_pasos_queda_esperando_la_primera(self):
        consulta = ConsultaExplicable(politicas(), guion_con_porque([]), salida=lambda _t: None)
        with self.assertRaises(FaltaRespuesta):
            consulta.correr()
        self.assertEqual(tipos(consulta), ["INICIO", "PREGUNTA"])


class Interfaz(unittest.TestCase):
    def test_paso_con_por_que_explica_y_repite_la_pregunta(self):
        info = ie.paso([["pidio_cancelar", "por qué"]])
        self.assertEqual(info["pregunta"]["attr"], "pidio_cancelar")
        self.assertEqual(info["pregunta"]["nivel"], 1)
        self.assertEqual([d["quien"] for d in info["dialogo"]], ["sistema", "persona", "why"])

    def test_paso_rechaza_un_dato_que_no_se_pregunta(self):
        with self.assertRaises(ValueError):
            ie.paso([["color_de_ojos", "café"]])

    def test_estructuras_traen_su_tipo_real(self):
        t = {item["id"]: item["tipo"] for item in ie.estructuras()["items"]}
        self.assertEqual(t["evento"], "Evento")
        self.assertEqual(t["traza"], "Traza")
        self.assertEqual(t["condicion"], "tuple")
        self.assertEqual(t["arbol"], "str")

    def test_el_codigo_trae_todas_las_secciones(self):
        secciones = ie.codigo()["secciones"]
        self.assertEqual([s["letra"] for s in secciones], ["A", "G", "·", "B", "C", "D", "E", "F"])
        self.assertIn("OPS_TXT = {", secciones[1]["codigo"])
        self.assertIn("def why(self, attr, nivel=1):", secciones[6]["codigo"])


if __name__ == "__main__":
    unittest.main()
