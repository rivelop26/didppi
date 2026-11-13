"""Escala de certeza y la fórmula que junta dos empujones de la misma conclusión.

La sesión 6 usa tres casos:

1. Los dos a favor:     CF = CF1 + CF2 × (1 − CF1)
2. Los dos en contra:   CF = CF1 + CF2 × (1 + CF1)
3. Uno a favor y otro
   en contra:           CF = (CF1 + CF2) / (1 − min(|CF1|, |CF2|))
"""

UMBRAL = 0.20


def combinar_cf(cf1, cf2):
    """Junta dos certezas de la misma conclusión. El resultado sigue entre −1 y +1."""
    if cf1 >= 0 and cf2 >= 0:
        nuevo = cf1 + cf2 * (1 - cf1)
    elif cf1 < 0 and cf2 < 0:
        nuevo = cf1 + cf2 * (1 + cf1)
    else:
        denom = 1 - min(abs(cf1), abs(cf2))
        nuevo = 0.0 if denom == 0 else (cf1 + cf2) / denom
    return round(nuevo, 4)


def texto_combinacion(antes, aporte):
    despues = combinar_cf(antes, aporte)
    if antes >= 0 and aporte >= 0:
        cuerpo = f"{antes:.2f} + {aporte:.2f} × (1 − {antes:.2f})"
    elif antes < 0 and aporte < 0:
        cuerpo = f"{antes:.2f} + ({aporte:.2f}) × (1 + ({antes:.2f}))"
    else:
        menor = min(abs(antes), abs(aporte))
        cuerpo = f"({antes:.2f} + ({aporte:.2f})) / (1 − {menor:.2f})"
    return f"{cuerpo} = {despues:.2f}"


def fmt_cf(cf):
    return f"{cf:+.2f}"


def fmt_valor(valor):
    if isinstance(valor, bool):
        return "sí" if valor else "no"
    if isinstance(valor, float) and valor == int(valor):
        return str(int(valor))
    return str(valor)
