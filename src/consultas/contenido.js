function caso(guia, id) {
  return guia.casos.find((item) => item.id === id);
}

function unicas(opciones) {
  const vistas = new Set();
  return opciones.filter((opcion) => {
    if (vistas.has(opcion.texto)) return false;
    vistas.add(opcion.texto);
    return true;
  });
}

const num = (n) => Number(n).toFixed(2);

function preguntaEvaluar(guia) {
  const foto = caso(guia, "ana").fotos[1];
  const r3 = foto.reglas.find((regla) => regla.id === "R3");
  const llueve = r3.si.find((cond) => cond.hecho === "llueve");
  const correcta = { falta: "none", verdadera: "true", falsa: "false" }[llueve.estado];
  return {
    tipo: "una",
    enunciado:
      'Ana ya respondió pidio_cancelar = «no». Nadie le ha preguntado por la lluvia. ¿Qué devuelve evaluar_condicion(("llueve", "==", "no"))?',
    opciones: [
      { id: "none", texto: "None. El dato falta." },
      { id: "false", texto: "False. No se cumple." },
      { id: "true", texto: "True. Se cumple." },
      { id: "cero", texto: "0.0, como en cf_condicion." },
    ],
    correcta,
    revela: "llueve no está en self.hechos: evaluar_condicion devuelve None. Ese None es lo que hay que preguntar.",
  };
}

function preguntaEstado(guia) {
  const paso = caso(guia, "hugo").historia[1];
  const falsas = paso.efectos.filter((e) => e.estado === "FALSA").map((e) => e.regla);
  const reglas = caso(guia, "hugo").fotos[0].reglas.filter((regla) => regla.id !== "R1");
  return {
    tipo: "varias",
    enunciado:
      "Hugo respondió: no pidió cancelar, y el pago NO está confirmado. Todavía nadie sabe la distancia. ¿Qué reglas quedan FALSAS en esa revisión?",
    opciones: reglas.map((regla) => ({ id: regla.id, texto: `${regla.id} · ${regla.si.map((c) => c.texto).join(" y ")}` })),
    correcta: falsas,
    revela: `Quedan falsas ${falsas.join(", ")}: todas piden pago = sí. Mueren aunque falte la distancia. Una falsa basta.`,
  };
}

function preguntaDisparar(guia) {
  const final = caso(guia, "ana").fotos.at(-1).conclusiones[0];
  return {
    tipo: "una",
    enunciado:
      "Ana responde que no llueve. R3 (+0.85) y R8 (+0.55) se disparan en la misma revisión, las dos a favor de enviar. ¿Con qué certeza queda enviar en self.conclusiones?",
    opciones: unicas([
      { id: "bien", texto: final.cf_texto },
      { id: "primera", texto: "+0.85" },
      { id: "suma", texto: "+1.40" },
      { id: "ultima", texto: "+0.55" },
    ]),
    correcta: "bien",
    revela: `0.85 + 0.55 × (1 − 0.85) = ${num(final.cf)}. Sube, pero no pasa de 1.`,
  };
}

function preguntaPuntaje(guia) {
  const foto = caso(guia, "ana").fotos[0];
  const fila = foto.puntajes.find((p) => p.attr === "pidio_cancelar");
  const sinDividir = fila.desglose.reduce((suma, d) => {
    const regla = foto.reglas.find((r) => r.id === d.regla);
    return suma + regla.prioridad * Math.abs(regla.cf);
  }, 0);
  return {
    tipo: "una",
    enunciado: "Momento 0: nadie ha respondido nada. Estos son los aportes al dato pidio_cancelar. ¿Cuál es su puntaje?",
    detalle: fila.desglose.map((d) => d.texto),
    opciones: unicas([
      { id: "bien", texto: num(fila.puntaje) },
      { id: "sin", texto: num(sinDividir) },
      { id: "r1", texto: num(fila.desglose[0].aporte) },
      { id: "cuenta", texto: String(fila.desglose.length) },
    ]),
    correcta: "bien",
    revela: `${num(fila.puntaje)}. R1 aporta entero porque solo le falta ese dato; las demás reparten su aporte entre lo que les falta.`,
  };
}

function preguntaSiguiente(guia) {
  const foto = caso(guia, "ana").fotos[1];
  const alfabetica = [...foto.puntajes.map((p) => p.attr)].sort()[0];
  return {
    tipo: "una",
    enunciado: "Ana ya dijo que no pidió cancelar. Estos son los puntajes ahora. ¿Qué le pregunta el motor?",
    detalle: foto.puntajes.map((p) => `${p.attr} → ${num(p.puntaje)}`),
    opciones: foto.puntajes.map((p) => ({ id: p.attr, texto: guia.preguntables[p.attr].pregunta })),
    correcta: foto.pregunta.attr,
    revela: `Gana ${foto.pregunta.attr}. En orden alfabético, la estrategia ingenua habría preguntado ${alfabetica}.`,
  };
}

function preguntaGuardar(guia) {
  const fin = caso(guia, "ana_sin_reporte").fotos.at(-1).fin;
  const correcta = fin.motivo === "sin_conclusion" ? "sin" : "otra";
  return {
    tipo: "una",
    enunciado:
      "Ana respondió: no canceló, pagó, está a 2 km. Cuando le preguntan si llueve, dice «no sé». ¿Qué entrega el motor?",
    opciones: [
      { id: "sin", texto: "Sin conclusión: R3, R4 y R8 necesitaban la lluvia y se descartan." },
      { id: "enviar", texto: "Enviar con +0.85, como si no lloviera." },
      { id: "esperar", texto: "Esperar un claro con +0.70, por si acaso." },
      { id: "otra", texto: "Vuelve a preguntar si llueve." },
    ],
    correcta,
    revela: "«No sé» queda en self.desconocidos. No se repite la pregunta, y las reglas que la necesitaban quedan descartadas.",
  };
}

function preguntaCorrer(guia) {
  const n = caso(guia, "sofia").historia.length;
  return {
    tipo: "una",
    enunciado: "Sofía sí pidió cancelar. ¿Cuántas preguntas le hace el motor en total?",
    opciones: ["1", "2", "3", "4"].map((t) => ({ id: t, texto: t === "1" ? "1 pregunta" : `${t} preguntas` })),
    correcta: String(n),
    revela: "Una. R1 se dispara con +0.95, que pasa el umbral de 0.85, y ya_seguro() corta el ciclo.",
  };
}

export const PIEZAS_CONSULTAS = [
  {
    id: "evaluar_condicion",
    metodo: "evaluar_condicion(cond)",
    titulo: "¿Se cumple o falta?",
    hace: "Devuelve True, False o None. None es el dato faltante.",
    necesita: true,
    caso: "ana",
    plantilla: `def evaluar_condicion(self, cond):
    attr, op, valor = cond
    if attr not in self.hechos:
        {{hueco}}
    return OPS[op](self.hechos[attr], valor)`,
    opcionesLinea: [
      { id: "none", codigo: "return None" },
      { id: "false", codigo: "return False" },
      { id: "cero", codigo: "return 0.0" },
      { id: "preguntar", codigo: "return self.preguntar(attr)" },
    ],
    lineaCorrecta: "none",
    descartarConAyuda: "cero",
    concepto: {
      formula: "Lógica de tres valores: True · False · None",
      ejemplo:
        "En el motor del pedido, cf_condicion devolvía 0.0 si el dato no estaba: lo trataba como «no se cumple». Aquí no. Si nadie ha preguntado la lluvia, la condición no es falsa: es desconocida.",
      pista: "Hay tres salidas posibles. La tercera quiere decir «todavía no sé».",
      parrafos: [
        "Un dato es faltante cuando una regla lo necesita y todavía no está en la memoria de trabajo.",
        "Este método no pregunta: solo avisa que falta. Quién pregunta y cuándo lo decide el ciclo.",
      ],
    },
    pregunta: preguntaEvaluar,
  },
  {
    id: "estado_regla",
    metodo: "estado_regla(regla)",
    titulo: "Viva, muerta o en espera",
    hace: "Clasifica la regla. Con una condición falsa corta: el resto ya no importa.",
    necesita: true,
    caso: "hugo",
    plantilla: `def estado_regla(self, regla):
    faltan = []
    for cond in regla.si:
        if cond[0] in self.desconocidos:
            return "DESCARTADA", []
        r = self.evaluar_condicion(cond)
        if r is False:
            {{hueco}}
        if r is None and cond[0] not in faltan:
            faltan.append(cond[0])
    if faltan:
        return "PENDIENTE", faltan
    return "VERDADERA", []`,
    opcionesLinea: [
      { id: "corto", codigo: 'return "FALSA", []' },
      { id: "seguir", codigo: "continue" },
      { id: "anotar", codigo: "faltan.append(cond[0])" },
      { id: "pendiente", codigo: 'return "PENDIENTE", faltan' },
    ],
    lineaCorrecta: "corto",
    descartarConAyuda: "anotar",
    concepto: {
      formula: "Una falsa basta: la regla muere y sus otras preguntas sobran.",
      ejemplo:
        "R3 pide pago, cerca, sin lluvia y sin cancelación. Si el pago es «no», R3 muere. No hace falta preguntar la distancia por R3.",
      pista: "Apenas una condición es falsa, la regla ya tiene estado. Se sale del método.",
      parrafos: [
        "FALSA: alguna condición no se cumple. VERDADERA: todas se cumplen. PENDIENTE: ninguna es falsa, pero faltan datos.",
        "DESCARTADA es el cuarto caso: el cliente dijo «no sé» a un dato que la regla necesita.",
        "La lista faltan, sin repetidos, es lo que el subsistema puede preguntar por esta regla.",
      ],
    },
    pregunta: preguntaEstado,
  },
  {
    id: "disparar",
    metodo: "disparar(regla)",
    titulo: "Sumar certeza sin pasarse",
    hace: "Escribe la conclusión, o la combina con la que ya estaba.",
    necesita: true,
    caso: "ana",
    plantilla: `def disparar(self, regla):
    nombre, valor = regla.entonces
    previo = self.conclusiones.get(valor)
    if previo is None:
        self.conclusiones[valor] = regla.cf
    else:
        {{hueco}}
    self.disparadas.append(regla.id)`,
    opcionesLinea: [
      { id: "combinar", codigo: "self.conclusiones[valor] = combinar_cf(previo, regla.cf)" },
      { id: "suma", codigo: "self.conclusiones[valor] = previo + regla.cf" },
      { id: "max", codigo: "self.conclusiones[valor] = max(previo, regla.cf)" },
      { id: "pisa", codigo: "self.conclusiones[valor] = regla.cf" },
    ],
    lineaCorrecta: "combinar",
    descartarConAyuda: "suma",
    concepto: {
      formula: "Dos a favor: CF = a + b × (1 − a)",
      ejemplo: "0.9 y 0.7 dan 0.9 + 0.7 × 0.1 = 0.97. Sumar daría 1.6, fuera de la escala.",
      pista: "Es la misma fórmula de la sesión de certeza. Ya está escrita en combinar_cf.",
      parrafos: [
        "self.conclusiones es un dict: valor → certeza. Si otra regla concluye lo mismo, se combina en la misma llave.",
        "Aquí cada respuesta del cliente entra con certeza 1.0, así que el aporte es el CF de la regla.",
      ],
    },
    pregunta: preguntaDisparar,
  },
  {
    id: "puntaje_pregunta",
    metodo: "puntaje_pregunta(attr, pendientes)",
    titulo: "Cuánto vale una pregunta",
    hace: "Suma prioridad × |CF| ÷ datos que faltan, sobre cada regla pendiente que necesita el dato.",
    necesita: true,
    caso: "ana",
    plantilla: `def puntaje_pregunta(self, attr, pendientes):
    total = 0.0
    for regla, faltan in pendientes:
        if attr in faltan:
            {{hueco}}
    return total / self.costo.get(attr, 1)`,
    opcionesLinea: [
      { id: "bien", codigo: "total += regla.prioridad * abs(regla.cf) / len(faltan)" },
      { id: "sin", codigo: "total += regla.prioridad * abs(regla.cf)" },
      { id: "prioridad", codigo: "total += regla.prioridad" },
      { id: "cuenta", codigo: "total += 1" },
    ],
    lineaCorrecta: "bien",
    descartarConAyuda: "cuenta",
    concepto: {
      formula: "aporte = prioridad × |CF| ÷ datos que le faltan a la regla",
      ejemplo:
        "A R1 solo le falta pidio_cancelar: aporta 100 × 0.95 ÷ 1 = 95. A R3 le faltan cuatro datos: reparte 70 × 0.85 ÷ 4 = 14.88.",
      pista: "Una regla a la que le falta un solo dato vale más: preguntarlo la resuelve ya.",
      parrafos: [
        "prioridad × certeza: una regla importante y segura vale más.",
        "÷ datos que faltan: si le faltan varios, su aporte se reparte entre ellos.",
        "abs(): R7 empuja en contra de enviar (−0.30), y también ayuda a decidir. El costo divide al final; si no se dice, vale 1.",
      ],
    },
    pregunta: preguntaPuntaje,
  },
  {
    id: "siguiente_pregunta",
    metodo: "siguiente_pregunta(pendientes)",
    titulo: "La mejor pregunta de ahora",
    hace: "Junta los datos que faltan en todas las pendientes y elige el de mayor puntaje.",
    necesita: true,
    caso: "ana",
    plantilla: `def siguiente_pregunta(self, pendientes):
    candidatos = sorted({attr for _, faltan in pendientes for attr in faltan})
    {{hueco}}`,
    opcionesLinea: [
      { id: "voraz", codigo: "return max(candidatos, key=lambda a: self.puntaje_pregunta(a, pendientes))" },
      { id: "ingenua", codigo: "return sorted(candidatos)[0]" },
      { id: "min", codigo: "return min(candidatos, key=lambda a: self.puntaje_pregunta(a, pendientes))" },
      { id: "primera", codigo: "return pendientes[0][0].id" },
    ],
    lineaCorrecta: "voraz",
    descartarConAyuda: "primera",
    concepto: {
      formula: "Heurística voraz: max(candidatos, key=puntaje)",
      ejemplo:
        "sorted(candidatos)[0] es la estrategia ingenua: pregunta en orden alfabético. Con el mismo motor, hace más preguntas y a veces pregunta de último lo que decide.",
      pista: "Se quiere el dato que más ayuda a decidir. Es el puntaje más alto, no el más bajo.",
      parrafos: [
        "El set {…} junta los datos sin repetirlos: la distancia aparece en seis reglas y se pregunta una vez.",
        "Voraz quiere decir que elige lo mejor de este momento, sin mirar el futuro. No es óptima, pero es rápida y muy buena.",
      ],
    },
    pregunta: preguntaSiguiente,
  },
  {
    id: "guardar",
    metodo: "guardar(attr, valor)",
    titulo: "Lo dicho no se repite",
    hace: "Anota la respuesta en la memoria. Si es «no sé», la anota aparte.",
    necesita: true,
    caso: "ana_sin_reporte",
    plantilla: `def guardar(self, attr, valor):
    if valor is None:
        {{hueco}}
    else:
        self.hechos[attr] = valor
    self.preguntas_hechas.append(attr)`,
    opcionesLinea: [
      { id: "set", codigo: "self.desconocidos.add(attr)" },
      { id: "none", codigo: "self.hechos[attr] = None" },
      { id: "pass", codigo: "pass" },
      { id: "repetir", codigo: "self.preguntar(attr)" },
    ],
    lineaCorrecta: "set",
    descartarConAyuda: "repetir",
    concepto: {
      formula: "«No sé» ≠ «aún no pregunté»",
      ejemplo:
        "Si se olvida el «no sé», el dato sigue faltando y el motor lo vuelve a preguntar. Si se guarda None en hechos, las comparaciones fallan.",
      pista: "Hay una estructura para los datos que el cliente no sabe. Es un set.",
      parrafos: [
        "Cuando el cliente no sabe, el dato queda en self.desconocidos y las reglas que lo necesitan se descartan.",
        "preguntas_hechas guarda el orden: es la base del subsistema de explicación («¿por qué me preguntas esto?»).",
      ],
    },
    pregunta: preguntaGuardar,
  },
  {
    id: "correr",
    metodo: "correr()",
    titulo: "El ciclo de la consulta",
    hace: "Revisa, para si ya está seguro o si no queda nada, elige la mejor pregunta y guarda la respuesta.",
    necesita: true,
    caso: "sofia",
    tipoLinea: "orden",
    ordenCorrecta: ["revisar_reglas", "ya_seguro", "siguiente_pregunta", "guardar"],
    pasos: [
      { id: "guardar", llamada: "guardar", metodo: "guardar(attr, valor)", texto: "anotar la respuesta o el «no sé»" },
      {
        id: "siguiente_pregunta",
        llamada: "siguiente_pregunta",
        metodo: "siguiente_pregunta(pendientes)",
        texto: "elegir el dato con más puntaje",
      },
      {
        id: "revisar_reglas",
        llamada: "revisar_reglas",
        metodo: "revisar_reglas()",
        texto: "disparar las que se cumplen y listar las pendientes",
      },
      { id: "ya_seguro", llamada: "ya_seguro", metodo: "ya_seguro()", texto: "¿alguna conclusión llegó al umbral?" },
    ],
    revelaOrden:
      "El ciclo corre así: revisar_reglas(), ya_seguro(), siguiente_pregunta(pendientes), guardar(attr, respuesta).",
    plantilla: `def correr(self):
    while True:
        pendientes = self.{{1}}()
        if self.{{2}}():
            break
        if not pendientes:
            break
        attr = self.{{3}}(pendientes)
        self.{{4}}(attr, self.preguntar(attr))
    return self.respuesta()`,
    concepto: {
      formula: "revisar → ¿seguro? → ¿quedan pendientes? → preguntar → guardar → revisar…",
      ejemplo:
        "Primero se revisa con lo que ya se sabe y solo después se pregunta. Si se preguntara antes de revisar, el motor haría preguntas que ya no hacen falta.",
      pista: "Antes de preguntar hay que saber qué falta. Y antes de elegir, hay que saber si ya se puede parar.",
      parrafos: [
        "Hay dos salidas: parada temprana (ya_seguro) y sin pendientes (no queda nada por probar: entrega su mejor respuesta).",
        "self.preguntar es intercambiable: input() en consola, un widget de Colab, esta página o un guion para pruebas.",
      ],
    },
    pregunta: preguntaCorrer,
  },
];

export const TIPOS = [
  { id: "dict", texto: "dict" },
  { id: "list", texto: "list" },
  { id: "tuple", texto: "tuple" },
  { id: "set", texto: "set" },
  { id: "Regla", texto: "Regla (una clase)" },
];

export const ESTRUCTURAS = {
  memoria: {
    que: "La memoria de trabajo: los hechos de este pedido",
    porque: 'Se busca por nombre: self.hechos["llueve"]. «attr not in self.hechos» dice en un paso si el dato falta.',
  },
  condicion: {
    que: "Una condición de una regla",
    porque: "Tres piezas fijas: atributo, operador y valor. Se desempaca en una línea: attr, op, valor = cond. No cambia, por eso es tupla.",
  },
  regla: {
    que: "Una regla",
    porque: "Agrupa id, SI, ENTONCES, prioridad y CF. Una clase le pone nombre a cada parte: regla.prioridad, regla.cf.",
  },
  base: {
    que: "La base de conocimiento",
    porque: "Una lista de reglas, ordenada por prioridad: sorted(reglas, key=lambda r: -r.prioridad). El orden es el turno.",
  },
  operadores: {
    que: "Los operadores de comparación",
    porque: 'Un dict de funciones: OPS[">="](6, 4) devuelve True. La condición guarda el operador como texto y se evalúa al final.',
  },
  desconocidos: {
    que: "Los datos que el cliente no sabe",
    porque: 'Solo importa si un dato está o no, sin orden y sin repetir: un set. "llueve" in self.desconocidos.',
  },
  disparadas: {
    que: "Las reglas que ya se dispararon",
    porque: "Una lista, en el orden en que se dispararon. Sirve para no dispararlas dos veces y para explicar.",
  },
  conclusiones: {
    que: "Las conclusiones acumuladas",
    porque: "Valor → certeza. Si otra regla concluye lo mismo, se combina en la misma llave.",
  },
  preguntas: {
    que: "El historial de preguntas",
    porque: "Una lista: importa el orden. Es la base del subsistema de explicación.",
  },
  costo: {
    que: "El costo de preguntar cada dato",
    porque: "Dato → costo. Vacío quiere decir que todo cuesta 1: self.costo.get(attr, 1).",
  },
};
