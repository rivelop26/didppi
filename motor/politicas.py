"""Políticas del restaurante.

Edita este archivo para cambiar cómo se decide un pedido.
El orden en que aparecen las reglas es el tercer desempate de ``resolver``:
si empatan prioridad y número de condiciones, gana la que está escrita primero.

Decisiones que puede escribir el motor:
- cancelar         no se empieza a preparar
- enviar           se prepara y sale
- esperar_lluvia   se prepara y el domiciliario espera un claro
- fuera_de_zona    no se inicia: el cliente está fuera de cobertura
"""

from motor.reglas import Constructor


def politicas():
    return [
        (
            Constructor("R1")
            .si("pidio_cancelar", "==", "sí")
            .entonces("decision", "cancelar")
            .prioridad(100)
            .cf(0.95)
            .porque("Si el cliente pidió cancelar, no se empieza a preparar.")
            .construir()
        ),
        (
            Constructor("R2")
            .si("pago_confirmado", "==", "no")
            .entonces("decision", "cancelar")
            .prioridad(90)
            .cf(0.90)
            .porque("Sin pago confirmado no se cocina.")
            .construir()
        ),
        (
            Constructor("R3")
            .si("pago_confirmado", "==", "sí")
            .si("distancia_km", "<=", 4)
            .si("llueve", "==", "no")
            .si("pidio_cancelar", "==", "no")
            .entonces("decision", "enviar")
            .prioridad(70)
            .cf(0.85)
            .porque("Pago listo, cerca y sin lluvia: se prepara y sale.")
            .construir()
        ),
        (
            Constructor("R4")
            .si("pago_confirmado", "==", "sí")
            .si("distancia_km", "<=", 4)
            .si("llueve", "==", "sí")
            .si("pidio_cancelar", "==", "no")
            .entonces("decision", "esperar_lluvia")
            .prioridad(60)
            .cf(0.70)
            .porque("Se prepara, y el domiciliario espera un claro.")
            .construir()
        ),
        (
            Constructor("R5")
            .si("distancia_km", ">", 8)
            .entonces("decision", "fuera_de_zona")
            .prioridad(80)
            .cf(0.80)
            .porque("Fuera de cobertura no se inicia el pedido.")
            .construir()
        ),
        (
            Constructor("R6")
            .si("pago_confirmado", "==", "sí")
            .si("distancia_km", ">", 4)
            .si("distancia_km", "<=", 8)
            .si("pidio_cancelar", "==", "no")
            .entonces("decision", "enviar")
            .prioridad(50)
            .cf(0.50)
            .porque("Zona media y con pago: se envía con menos certeza.")
            .construir()
        ),
        (
            Constructor("R7")
            .si("llueve", "==", "sí")
            .si("distancia_km", ">", 4)
            .entonces("decision", "enviar")
            .prioridad(40)
            .cf(-0.30)
            .porque("Lluvia pasado el anillo cercano empuja en contra de enviar.")
            .construir()
        ),
        (
            Constructor("R8")
            .si("pago_confirmado", "==", "sí")
            .si("distancia_km", "<=", 2)
            .si("llueve", "==", "no")
            .entonces("decision", "enviar")
            .prioridad(30)
            .cf(0.55)
            .porque("El domiciliario confirma el anillo de 2 km sin lluvia. Es un segundo apoyo, con otras condiciones.")
            .construir()
        ),
    ]
