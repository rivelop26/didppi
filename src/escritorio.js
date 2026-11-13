export const PLANO = [
  "def atender(self, hechos, caso):",
  "    self.cargar(hechos, caso)",
  "    for ciclo in range(1, max_ciclos + 1):",
  "        candidatas = self.agenda()",
  "        if not candidatas:",
  "            break",
  "        regla = self.resolver(candidatas)",
  "        self.disparar(regla, ciclo)",
  "    return self.bf.recomendacion()",
];

export function cuadernos(info) {
  if (!info) return [];
  const iniciales = info.hechos.filter((hecho) => hecho.clase === "inicial");
  const frames = [
    {
      linea: 1,
      metodo: "cargar(hechos, caso)",
      dice: `Entran ${iniciales.length} datos de ${info.caso || "este pedido"}. Cada uno queda anotado con su certeza. Todavía no hay decisión.`,
      filas: iniciales.map((hecho) => `${hecho.nombre} = ${hecho.valor_texto}   ${hecho.cf_texto}`),
    },
  ];

  if (!info.ciclos.length) {
    frames.push(
      {
        linea: 3,
        metodo: "agenda()",
        dice: "Primera mirada. Ningún SI pasa de +0.20, así que nadie levanta la mano.",
        filas: ["agenda = []"],
      },
      {
        linea: 5,
        metodo: "break",
        dice: "La agenda llegó vacía. El ciclo no llama a resolver ni a disparar.",
        filas: ["el for se detiene"],
      },
      {
        linea: 8,
        metodo: "recomendacion()",
        dice: "No quedó ninguna fila por encima de +0.20.",
        filas: ["Sin recomendación"],
      },
    );
    return frames;
  }

  info.ciclos.forEach((ciclo) => {
    const quienes = (ciclo.candidatas || []).join(", ");
    frames.push(
      {
        linea: 3,
        metodo: "agenda()",
        dice: `Ciclo ${ciclo.ciclo}. Estas reglas sí pueden disparar.`,
        filas: [`agenda = [${quienes}]`],
      },
      {
        linea: 6,
        metodo: "resolver(candidatas)",
        dice: `De ${quienes}, el turno es de ${ciclo.regla}. Las demás esperan.`,
        filas: [`sigue ${ciclo.regla}`],
      },
      {
        linea: 7,
        metodo: "disparar(regla, ciclo)",
        dice:
          ciclo.antes === null
            ? `${ciclo.regla} escribe «${ciclo.etiqueta}». Esa conclusión no estaba en la tabla.`
            : `${ciclo.regla} encuentra «${ciclo.etiqueta}» ya escrita y combina las dos certezas.`,
        filas: [
          ciclo.aporte_texto,
          ciclo.antes === null ? ciclo.formula : `combina ${ciclo.formula}`,
        ],
      },
    );
  });

  frames.push(
    {
      linea: 3,
      metodo: "agenda()",
      dice: "Otra mirada. Las que ya dispararon no vuelven, y nadie más pasa de +0.20.",
      filas: ["agenda = []"],
    },
    {
      linea: 5,
      metodo: "break",
      dice: "El for se detiene. El recorrido de las reglas terminó.",
      filas: ["no hay más ciclos"],
    },
  );

  const recomendacion = info.recomendacion;
  frames.push({
    linea: 8,
    metodo: "recomendacion()",
    dice: recomendacion
      ? "De lo que quedó escrito, se queda la certeza más alta que pasa de +0.20."
      : "Ninguna certeza pasa de +0.20.",
    filas: recomendacion
      ? [`${recomendacion.etiqueta}   ${recomendacion.cf_texto}`, recomendacion.origen]
      : ["Sin recomendación"],
  });
  return frames;
}
