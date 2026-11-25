function final(guia, id) {
  return guia.casos.find((item) => item.id === id).final;
}

function eventos(guia, id, tipo) {
  return final(guia, id).eventos.filter((ev) => ev.tipo === tipo);
}

function regla(guia, id) {
  return guia.reglas.find((r) => r.id === id);
}

const mismaCond = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function preguntaRegistrar(guia) {
  const evs = final(guia, "sofia").eventos;
  return {
    tipo: "una",
    enunciado: "Termina la consulta de Sofía. ¿Qué hay en self.traza.eventos[0]?",
    opciones: [
      { id: "inicio", texto: "El evento INICIO, el número 1." },
      { id: "conclusion", texto: "El evento CONCLUSION, el último que pasó." },
      { id: "pregunta", texto: "La primera PREGUNTA." },
      { id: "vacia", texto: "Nada: la lista se vacía al terminar." },
    ],
    correcta: "inicio",
    revela: `append agrega al final: eventos[0] es INICIO y eventos[-1] es ${evs.at(-1).tipo}, el número ${evs.at(-1).n}. El orden de la lista es el orden en que pasaron las cosas.`,
  };
}

function preguntaAnotarPregunta(guia) {
  const ev = eventos(guia, "ana", "PREGUNTA").find((e) => e.datos.dato === "pago_confirmado");
  const correcta = ev.datos.necesitan.map((n) => n.regla);
  return {
    tipo: "varias",
    enunciado:
      "Ana ya dijo que no pidió cancelar. El motor elige preguntar pago_confirmado. ¿Qué reglas quedan en la lista necesitan de ese evento PREGUNTA?",
    opciones: guia.reglas.map((r) => ({ id: r.id, texto: `${r.id} · ${r.si.map((c) => c.texto).join(" y ")}` })),
    correcta,
    revela: `Quedan ${correcta.join(", ")}: las pendientes que piden el pago. R1 ya murió (no pidió cancelar), R5 y R7 no miran el pago.`,
  };
}

function preguntaCulpable(guia) {
  const ev = eventos(guia, "ana", "REGLA_DESCARTADA").find((e) => e.datos.regla === "R6");
  const r6 = regla(guia, "R6");
  const opciones = r6.si.map((c, i) => ({ id: String(i), texto: c.texto }));
  const correcta = String(r6.si.findIndex((c) => mismaCond(c.cond, ev.datos.condicion)));
  return {
    tipo: "una",
    enunciado:
      "Ana: no pidió cancelar, pagó y está a 2 km. R6 muere. ¿Qué condición queda anotada en su REGLA_DESCARTADA?",
    detalle: [r6.texto],
    opciones,
    correcta,
    revela: `«${opciones[Number(correcta)].texto}»: el pago sí se cumple, la distancia no. Se anota la condición culpable, no la primera de la lista.`,
  };
}

function preguntaPorQue(guia) {
  const caso = guia.casos.find((item) => item.id === "ana");
  const veces = caso.pasos.filter(([attr]) => attr === "pago_confirmado").length;
  return {
    tipo: "una",
    enunciado:
      "Cuando le preguntan por el pago, Ana escribe «por qué» tres veces y después responde «sí». ¿Cuántas veces se llama a self.persona(\"pago_confirmado\")?",
    opciones: ["1", "3", "4", "5"].map((t) => ({ id: t, texto: t === "1" ? "1 vez" : `${t} veces` })),
    correcta: String(veces),
    revela: `${veces}: tres «por qué» y una respuesta. preguntas_hechas lo cuenta una sola vez; la traza guarda los tres WHY_PEDIDO.`,
  };
}

function preguntaWhy(guia) {
  const ev = eventos(guia, "ana", "PREGUNTA").find((e) => e.datos.dato === "pago_confirmado");
  const nec = ev.datos.necesitan;
  const top = nec.reduce((a, b) => (b.aporte > a.aporte ? b : a));
  return {
    tipo: "una",
    enunciado: "Ana pide «por qué» en la pregunta del pago. Esto guardó el evento PREGUNTA. ¿Qué regla nombra el WHY de nivel 1?",
    detalle: nec.map((n) => `${n.regla}: aporte ${n.aporte.toFixed(2)} · le faltan ${n.faltan.join(", ")}`),
    opciones: nec.map((n) => ({ id: n.regla, texto: n.regla })),
    correcta: top.regla,
    revela: `${top.regla}, la de mayor aporte: con el pago ya se resuelve. El WHY no recalcula nada: lee este evento.`,
  };
}

function preguntaHow(guia) {
  const arbol = final(guia, "marco").fin.arbol;
  const correcta = arbol.reglas.map((r) => r.id);
  return {
    tipo: "varias",
    enunciado: "Marco: a 6 km, pagó y llueve. El motor concluye enviar. ¿Qué reglas aparecen en su árbol HOW?",
    opciones: guia.reglas.map((r) => ({ id: r.id, texto: `${r.id} · → ${r.valor}` })),
    correcta,
    revela: `${correcta.join(" y ")}: las disparadas que escribieron «enviar». R7 empuja en contra y también cuenta. R3 y R8 concluyen enviar, pero no se cumplieron.`,
  };
}

function preguntaPlantilla(guia) {
  const r5 = regla(guia, "R5").si[0];
  return {
    tipo: "una",
    enunciado: 'R5 dice ("distancia_km", ">", 8). ¿Qué frase arma cond_texto?',
    opciones: [
      { id: "bien", texto: `«${r5.texto}»` },
      { id: "op", texto: "«distancia_km > 8»" },
      { id: "mayorigual", texto: "«distancia_km es mayor o igual a 8»" },
      { id: "solo", texto: "«es mayor que»" },
    ],
    correcta: "bien",
    revela: `«${r5.texto}». Con otro OPS_TXT, el mismo motor habla como un restaurante, un banco o un médico.`,
  };
}

export const PIEZAS_EXPLICACIONES = [
  {
    id: "registrar",
    letra: "A",
    metodo: "Traza.registrar(tipo, **datos)",
    titulo: "Una bitácora de solo agregar",
    hace: "Crea el evento con el número siguiente y lo pone al final de la lista.",
    necesita: true,
    caso: "sofia",
    plantilla: `class Traza:
    def __init__(self):
        self.eventos = []

    def registrar(self, tipo, **datos):
        ev = Evento(len(self.eventos) + 1, tipo, **datos)
        {{hueco}}
        return ev

    def de_tipo(self, tipo):
        return [e for e in self.eventos if e.tipo == tipo]`,
    opcionesLinea: [
      { id: "append", codigo: "self.eventos.append(ev)" },
      { id: "insert", codigo: "self.eventos.insert(0, ev)" },
      { id: "pisa", codigo: "self.eventos = [ev]" },
      { id: "indice", codigo: "self.eventos[ev.n] = ev" },
    ],
    lineaCorrecta: "append",
    descartarConAyuda: "pisa",
    concepto: {
      formula: "Patrón bitácora: append, nunca insert ni del",
      ejemplo:
        "Como el ticket del supermercado: cada producto se imprime debajo del anterior. Nadie borra una línea para escribir otra encima.",
      pista: "El evento nuevo va después de todos los que ya pasaron.",
      parrafos: [
        "Un evento es algo que pasó: tiene número, tipo y sus detalles en un dict (**datos).",
        "Hay ocho tipos: INICIO, PREGUNTA, WHY_PEDIDO, RESPUESTA, REGLA_DESCARTADA, REGLA_DISPARADA, PARADA y CONCLUSION.",
        "de_tipo es lo único que usan WHY y HOW para leer: filtran la lista por tipo.",
      ],
    },
    pregunta: preguntaRegistrar,
  },
  {
    id: "siguiente_pregunta",
    letra: "B",
    metodo: "siguiente_pregunta(pendientes)",
    titulo: "Anotar por qué se pregunta",
    hace: "Elige igual que la Consulta y guarda en la traza los puntajes y las reglas que necesitan el dato.",
    necesita: true,
    caso: "ana",
    plantilla: `def siguiente_pregunta(self, pendientes):
    {{hueco}}
    candidatos = sorted({a for _, faltan in pendientes for a in faltan})
    puntajes = {a: round(self.puntaje_pregunta(a, pendientes), 2) for a in candidatos}
    necesitan = [
        dict(regla=r.id, faltan=list(f), aporte=round(r.prioridad * abs(r.cf) / len(f), 2))
        for r, f in pendientes
        if attr in f
    ]
    self.traza.registrar(
        "PREGUNTA",
        dato=attr,
        numero=len(self.preguntas_hechas) + 1,
        puntajes=puntajes,
        necesitan=necesitan,
    )
    return attr`,
    opcionesLinea: [
      { id: "super", codigo: "attr = super().siguiente_pregunta(pendientes)" },
      { id: "primera", codigo: "attr = pendientes[0][1][0]" },
      { id: "fija", codigo: 'attr = "pidio_cancelar"' },
      { id: "persona", codigo: "attr = self.persona(pendientes)" },
    ],
    lineaCorrecta: "super",
    descartarConAyuda: "fija",
    concepto: {
      formula: "Principio 3: anotar no cambia las decisiones",
      ejemplo:
        "La ConsultaExplicable hereda de Consulta. super() elige con la misma heurística voraz; lo único nuevo es el registrar.",
      pista: "La decisión ya está escrita en la clase padre. Solo hay que pedírsela.",
      parrafos: [
        "necesitan es la lista de reglas pendientes que piden este dato, con su aporte. Ahí vive el WHY.",
        "Se guarda en el momento de preguntar. Después nadie tiene que recalcular nada.",
      ],
    },
    pregunta: preguntaAnotarPregunta,
  },
  {
    id: "culpable",
    letra: "C",
    metodo: "_culpable(regla)",
    titulo: "Por qué murió una regla",
    hace: "Busca la condición que mató la regla, en el mismo orden en que la revisa estado_regla.",
    necesita: true,
    caso: "ana",
    plantilla: `def _culpable(self, regla):
    for c in regla.si:
        if c[0] in self.desconocidos:
            return c, "no_se"
        if self.evaluar_condicion(c) is False:
            {{hueco}}
    return None, None

def revisar_reglas(self):
    pendientes = super().revisar_reglas()
    for r in self.reglas:
        if r.id in self.anotadas:
            continue
        est, _ = self.estado_regla(r)
        if est in ("FALSA", "DESCARTADA"):
            c, motivo = self._culpable(r)
            self.anotadas[r.id] = est
            self.traza.registrar("REGLA_DESCARTADA", regla=r.id, condicion=c,
                                 motivo=motivo, valor=self.hechos.get(c[0]))
    return pendientes`,
    opcionesLinea: [
      { id: "bien", codigo: 'return c, "falsa"' },
      { id: "primera", codigo: 'return regla.si[0], "falsa"' },
      { id: "sigue", codigo: "continue" },
      { id: "nada", codigo: 'return None, "falsa"' },
    ],
    lineaCorrecta: "bien",
    descartarConAyuda: "sigue",
    concepto: {
      formula: "WHY NOT: la condición culpable y su valor real",
      ejemplo:
        "No basta con «R6 murió». La traza dice: «distancia_km es mayor que 4» es falsa, porque distancia_km = 2.",
      pista: "Se quiere la condición que se está revisando en esta vuelta, la que dio False.",
      parrafos: [
        "self.anotadas es un dict id → estado. Evita anotar dos veces la misma regla en las revisiones siguientes.",
        "Si el dato está en desconocidos, el motivo es «no_se»: la regla no se pudo probar.",
      ],
    },
    pregunta: preguntaCulpable,
  },
  {
    id: "preguntar_usuario",
    letra: "D",
    metodo: "preguntar_usuario(attr)",
    titulo: "Dejar que la persona pida «por qué»",
    hace: "Si la respuesta es «por qué», sube un nivel, lo anota, explica y vuelve a hacer la misma pregunta.",
    necesita: true,
    caso: "ana",
    plantilla: `def preguntar_usuario(self, attr):
    nivel = 0
    while True:
        valor = self.persona(attr)
        if isinstance(valor, str) and valor.strip().lower() in PEDIR_PORQUE:
            nivel += 1
            self.traza.registrar("WHY_PEDIDO", dato=attr, nivel=nivel)
            self.salida(self.why(attr, nivel))
            {{hueco}}
        return valor`,
    opcionesLinea: [
      { id: "continue", codigo: "continue" },
      { id: "return", codigo: "return valor" },
      { id: "break", codigo: "break" },
      { id: "reinicia", codigo: "nivel = 0" },
    ],
    lineaCorrecta: "continue",
    descartarConAyuda: "reinicia",
    concepto: {
      formula: "explica → vuelve al while → pregunta lo mismo",
      ejemplo:
        "Con return valor, el motor guardaría «por qué» como si fuera la respuesta. Con break, saldría del while y devolvería None: un «no sé» que nadie dijo.",
      pista: "Después de explicar, la pregunta sigue sin respuesta.",
      parrafos: [
        "nivel cuenta cuántas veces seguidas pidió «por qué»: es el escalón de la escalera WHY.",
        "self.persona y self.salida son intercambiables: input() y print() en consola, un widget en Colab o esta página.",
      ],
    },
    pregunta: preguntaPorQue,
  },
  {
    id: "why",
    letra: "E",
    metodo: "why(attr, nivel)",
    titulo: "WHY: leer la traza",
    hace: "Busca el último PREGUNTA de ese dato, toma la regla de mayor aporte y rellena la plantilla del nivel.",
    necesita: true,
    caso: "ana",
    plantilla: `def why(self, attr, nivel=1):
    ev = [e for e in self.traza.de_tipo("PREGUNTA") if e.datos["dato"] == attr][-1]
    nec = ev.datos["necesitan"]
    {{hueco}}
    r = self._regla(top["regla"])
    if nivel == 1:
        return f"Te pregunto por '{attr}' porque la regla {r.id} lo necesita: {regla_texto(r)}."
    if nivel == 2:
        return f"La regla {r.id} me sirve para averiguar la meta '{self.meta}'."
    return f"No hay un nivel más arriba: '{self.meta}' es la meta de esta consulta."`,
    opcionesLinea: [
      { id: "max", codigo: 'top = max(nec, key=lambda x: x["aporte"])' },
      { id: "min", codigo: 'top = min(nec, key=lambda x: x["aporte"])' },
      { id: "primera", codigo: "top = nec[0]" },
      { id: "ultima", codigo: "top = nec[-1]" },
    ],
    lineaCorrecta: "max",
    descartarConAyuda: "ultima",
    concepto: {
      formula: "Principio 2: explicar es leer la traza, no recalcular",
      ejemplo:
        "Nivel 1: la regla y sus condiciones. Nivel 2: la meta a la que sirve. Nivel 3: el tope, no hay más arriba.",
      pista: "La razón principal es la regla que más empujó a hacer esa pregunta.",
      parrafos: [
        "El [-1] toma el PREGUNTA más reciente de ese dato. En este motor cada dato se pregunta una vez.",
        "Si las reglas se encadenaran (una necesita la conclusión de otra), el WHY usaría una pila de metas, como MYCIN.",
      ],
    },
    pregunta: preguntaWhy,
  },
  {
    id: "how",
    letra: "F",
    metodo: "apoyan(valor) · how_arbol()",
    titulo: "HOW: caminar hacia atrás",
    hace: "Conclusión → reglas disparadas que la escribieron → datos → pregunta de donde vino cada dato.",
    necesita: true,
    caso: "marco",
    plantilla: `def apoyan(self, valor):
    disparadas = [self._regla(i) for i in self.disparadas]
    {{hueco}}

def how_arbol(self):
    valor, cf = self.resultado
    lineas = [f"{self.meta} = {valor} (CF {cf:.2f})"]
    for r in self.apoyan(valor):
        lineas.append(f"+-- {r.id} (CF {r.cf:g}): {si_texto(r)}")
        for attr in datos_de(r):
            lineas.append(f"    +-- {attr} = {fmt_valor(self.hechos[attr])}"
                          f" <- pregunta {self.origen[attr]}")
    return "\\n".join(lineas)`,
    opcionesLinea: [
      { id: "bien", codigo: "return [r for r in disparadas if r.entonces[1] == valor]" },
      { id: "todas", codigo: "return disparadas" },
      { id: "base", codigo: "return [r for r in self.reglas if r.entonces[1] == valor]" },
      { id: "una", codigo: "return disparadas[:1]" },
    ],
    lineaCorrecta: "bien",
    descartarConAyuda: "una",
    concepto: {
      formula: "Árbol de prueba: conclusión ← reglas ← datos ← pregunta",
      ejemplo:
        "self.origen es un dict dato → número de pregunta. Se llena en guardar. Por eso el HOW puede decir «me lo dijiste en la pregunta 2».",
      pista: "Solo cuentan las reglas que se dispararon y que escribieron esta conclusión.",
      parrafos: [
        "WHY mira hacia adelante (para qué pregunto). HOW mira hacia atrás (de dónde salió esto).",
        "how() hace lo mismo que how_arbol(), pero con frases completas.",
      ],
    },
    pregunta: preguntaHow,
  },
  {
    id: "cond_texto",
    letra: "G",
    metodo: "cond_texto(c)",
    titulo: "De condición a frase",
    hace: "Convierte la tupla (dato, operador, valor) en una frase con la plantilla OPS_TXT.",
    necesita: true,
    caso: "hugo",
    plantilla: `OPS_TXT = {
    "==": "es",
    "!=": "no es",
    ">=": "es mayor o igual a",
    "<=": "es menor o igual a",
    ">": "es mayor que",
    "<": "es menor que",
}

def cond_texto(c):
    attr, op, val = c
    {{hueco}}`,
    opcionesLinea: [
      { id: "bien", codigo: 'return f"{attr} {OPS_TXT[op]} {fmt_valor(val)}"' },
      { id: "crudo", codigo: 'return f"{attr} {op} {val}"' },
      { id: "solo", codigo: "return OPS_TXT[op]" },
      { id: "str", codigo: "return str(c)" },
    ],
    lineaCorrecta: "bien",
    descartarConAyuda: "str",
    concepto: {
      formula: "Generación de texto por plantillas: siempre clara, siempre igual",
      ejemplo: '("distancia_km", "<=", 4) → «distancia_km es menor o igual a 4».',
      pista: "La frase lleva las tres partes de la tupla. El operador se traduce.",
      parrafos: [
        "fmt_valor deja 2.0 como 2 y True como «sí»: la persona no tiene que leer Python.",
        "Este es el corazón del trabajo independiente: el generador de justificaciones en lenguaje natural para su proyecto.",
      ],
    },
    pregunta: preguntaPlantilla,
  },
];

export const TIPOS_EXPLICACIONES = [
  { id: "dict", texto: "dict" },
  { id: "list", texto: "list" },
  { id: "tuple", texto: "tuple" },
  { id: "str", texto: "str" },
  { id: "Evento", texto: "Evento (clase)" },
  { id: "Traza", texto: "Traza (clase)" },
];

export const ESTRUCTURAS_EXPLICACIONES = {
  evento: {
    que: "Un evento de la traza",
    porque: "Una clase pequeña con tres partes con nombre: ev.n, ev.tipo y ev.datos.",
  },
  traza: {
    que: "La traza completa",
    porque: "Una clase que envuelve la lista y solo deja dos cosas: registrar al final y leer por tipo.",
  },
  eventos: {
    que: "Los eventos, en orden",
    porque: "Una lista: importa el orden y solo se agrega al final con append.",
  },
  datos: {
    que: "Los detalles de un evento",
    porque: "Nombre → valor. Cada tipo de evento guarda detalles distintos sin cambiar la clase: **datos.",
  },
  necesitan: {
    que: "Las reglas que piden el dato preguntado",
    porque: "Una lista de dicts, uno por regla: regla, faltan y aporte. El WHY toma el de mayor aporte.",
  },
  condicion: {
    que: "La condición culpable de un descarte",
    porque: "La misma tupla de la regla: (dato, operador, valor). No cambia; se desempaca en una línea.",
  },
  origen: {
    que: "De qué pregunta vino cada dato",
    porque: 'Dato → número de pregunta: self.origen["pago_confirmado"] da 2. Sin esto, el HOW no podría decir de dónde salió cada dato.',
  },
  anotadas: {
    que: "El estado ya anotado de cada regla",
    porque: "Id → estado. Evita registrar dos veces que una regla murió o se disparó.",
  },
  resultado: {
    que: "La conclusión y su certeza",
    porque: "Dos valores fijos que viajan juntos: (valor, cf). Se desempaca: valor, cf = self.resultado.",
  },
  ops_txt: {
    que: "Las palabras de cada operador",
    porque: 'Operador → frase: OPS_TXT[">"] da «es mayor que». Cambiar la plantilla cambia cómo habla el sistema.',
  },
  arbol: {
    que: "El árbol HOW",
    porque: "Se arma al vuelo, línea por línea, y se une con \\n. Es un texto listo para mostrar.",
  },
};
