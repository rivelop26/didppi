"""Demostración en terminal: python -m motor ana"""

import sys

from motor.casos import PRESETS, preset_por_id
from motor.motor import Motor
from motor.politicas import politicas


def main():
    pedido_id = sys.argv[1] if len(sys.argv) > 1 else "ana"
    if pedido_id == "todos":
        ids = [preset["id"] for preset in PRESETS]
    else:
        ids = [pedido_id]

    for pedido_id in ids:
        preset = preset_por_id(pedido_id)
        if preset is None:
            nombres = ", ".join(preset["id"] for preset in PRESETS)
            print(f"No existe '{pedido_id}'. Pedidos: {nombres}")
            sys.exit(1)
        print()
        print(preset["nombre"], "·", preset["titulo"])
        print(preset["relato"])
        Motor(politicas(), "Despacho").cargar(preset["hechos"], preset["nombre"]).adelante(
            verbose=True
        )


if __name__ == "__main__":
    main()
