import unittest

from motor.casos import preset_por_id
from motor.inspeccion import inspeccionar
from motor.motor import Motor
from motor.politicas import politicas


def correr(caso_id):
    preset = preset_por_id(caso_id)
    return inspeccionar(preset["hechos"], preset["nombre"])


class CasosDelRestaurante(unittest.TestCase):
    def test_ana_combina_dos_apoyos(self):
        info = correr("ana")
        self.assertEqual([c["regla"] for c in info["ciclos"]], ["R3", "R8"])
        self.assertEqual(info["recomendacion"]["valor"], "enviar")
        self.assertAlmostEqual(info["recomendacion"]["cf"], 0.9325)
        self.assertEqual(info["ciclos"][1]["formula"], "0.85 + 0.55 × (1 − 0.85) = 0.93")

    def test_luis_se_queda_con_el_minimo(self):
        info = correr("luis")
        r4 = next(r for r in info["reglas"] if r["id"] == "R4")
        self.assertAlmostEqual(r4["cf_si"], 0.60)
        self.assertEqual(info["recomendacion"]["valor"], "esperar_lluvia")
        self.assertAlmostEqual(info["recomendacion"]["cf"], 0.42)
        self.assertEqual(info["ciclos"][0]["aporte_texto"], "0.70 × 0.60 = 0.42")

    def test_sofia_cancela_con_la_certeza_del_mensaje(self):
        info = correr("sofia")
        self.assertEqual(info["primera"], "R1")
        self.assertAlmostEqual(info["recomendacion"]["cf"], 0.76)
        self.assertEqual(info["ciclos"][0]["aporte_texto"], "0.95 × 0.80 = 0.76")
        self.assertEqual(info["recomendacion"]["valor"], "cancelar")

    def test_marco_junta_un_si_y_un_no(self):
        info = correr("marco")
        self.assertEqual([c["regla"] for c in info["ciclos"]], ["R6", "R7"])
        self.assertEqual(info["ciclos"][1]["formula"], "(0.50 + (-0.30)) / (1 − 0.30) = 0.29")
        self.assertAlmostEqual(info["recomendacion"]["cf"], 0.2857)
        self.assertEqual(info["recomendacion"]["valor"], "enviar")

    def test_hugo_se_queda_con_la_certeza_mas_alta(self):
        info = correr("hugo")
        self.assertEqual([c["valor"] for c in info["ciclos"]], ["cancelar", "fuera_de_zona"])
        self.assertEqual(info["recomendacion"]["valor"], "cancelar")
        self.assertAlmostEqual(info["recomendacion"]["cf"], 0.90)

    def test_nube_no_pasa_el_umbral(self):
        info = correr("nube")
        self.assertEqual(info["agenda"], [])
        self.assertIsNone(info["primera"])
        self.assertIsNone(info["recomendacion"])
        r3 = next(r for r in info["reglas"] if r["id"] == "R3")
        self.assertAlmostEqual(r3["cf_si"], 0.15)
        self.assertFalse(r3["entra"])

    def test_umbral_justo_no_entra(self):
        preset = preset_por_id("nube")
        hechos = {k: dict(v) for k, v in preset["hechos"].items()}
        hechos["pago_confirmado"]["cf"] = 0.20
        info = inspeccionar(hechos, "Justo")
        r3 = next(r for r in info["reglas"] if r["id"] == "R3")
        self.assertAlmostEqual(r3["cf_si"], 0.20)
        self.assertNotIn("R3", info["agenda"])

    def test_llueve_no_devuelve_cero_aunque_el_dato_traiga_certeza(self):
        info = correr("ana")
        lluvia = next(p for p in info["reglas"] if p["id"] == "R4")
        premisa = next(p for p in lluvia["si"] if p["hecho"] == "llueve")
        self.assertEqual(premisa["cf"], 0.0)

    def test_resolver_prioriza_y_luego_cuenta_condiciones(self):
        from motor.reglas import Constructor

        reglas = [
            Constructor("RA").si("llueve", "==", "sí").entonces("decision", "enviar").prioridad(60).construir(),
            Constructor("RB")
            .si("llueve", "==", "sí")
            .si("pago_confirmado", "==", "sí")
            .si("distancia_km", "<=", 4)
            .si("pidio_cancelar", "==", "no")
            .entonces("decision", "enviar")
            .prioridad(60)
            .construir(),
            Constructor("RC").si("pago_confirmado", "==", "sí").entonces("decision", "cancelar").prioridad(90).construir(),
        ]
        motor = Motor(reglas).cargar(
            {
                "llueve": {"valor": "sí", "cf": 1},
                "pago_confirmado": {"valor": "sí", "cf": 1},
                "distancia_km": {"valor": 2, "cf": 1},
                "pidio_cancelar": {"valor": "no", "cf": 1},
            }
        )
        self.assertEqual(motor.resolver(motor.agenda()).id, "RC")
        motor.disparar(motor.resolver(motor.agenda()), 1)
        self.assertEqual(motor.resolver(motor.agenda()).id, "RB")

    def test_el_codigo_de_clase_sigue_en_el_archivo(self):
        from pathlib import Path

        src = Path("motor/motor.py").read_text(encoding="utf-8")
        for linea in [
            'info.get("cf", 1.0)',
            "return hecho.cf",
            "return min(self.cf_condicion(c) for c in regla.si)",
            "if self.cf_premisas(regla) > UMBRAL:",
            "(-t[1].prioridad, -t[1].especificidad, t[0])",
            "aporte = round(regla.cf * cf_si, 4)",
            "candidatas = self.agenda()",
            "regla = self.resolver(candidatas)",
            "self.disparar(regla, ciclo)",
        ]:
            self.assertIn(linea, src, linea)


    def test_r3_y_r8_no_son_la_misma_regla(self):
        from motor.politicas import politicas

        reglas = {regla.id: regla for regla in politicas()}
        self.assertNotEqual(reglas["R3"].si, reglas["R8"].si)
        self.assertIn(("distancia_km", "<=", 2), reglas["R8"].si)
        self.assertIn(("pidio_cancelar", "==", "no"), reglas["R3"].si)
        self.assertNotIn(("pidio_cancelar", "==", "no"), reglas["R8"].si)
        self.assertEqual(reglas["R3"].especificidad, 4)
        self.assertEqual(reglas["R8"].especificidad, 3)


if __name__ == "__main__":
    unittest.main()
