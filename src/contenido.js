export function textoCf(n) {
  const shown = Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  const abs = Math.abs(shown).toFixed(2);
  return shown < 0 ? `-${abs}` : `+${abs}`;
}

export function mismas(a, b) {
  if (a.length !== b.length) return false;
  const izquierda = [...a].sort();
  const derecha = [...b].sort();
  return izquierda.every((valor, i) => valor === derecha[i]);
}

function unicas(opciones) {
  const vistas = new Set();
  const salida = [];
  for (const opcion of opciones) {
    if (vistas.has(opcion.texto)) continue;
    vistas.add(opcion.texto);
    salida.push(opcion);
  }
  return salida;
}

function preguntaCargar() {
  return {
    tipo: "una",
    enunciado:
      "Si un dato llega suelto, sin diccionario de certeza, ¿con qué CF lo anota cargar?",
    opciones: [
      { id: "uno", texto: "+1.00. Lo da por hecho." },
      { id: "cero", texto: "+0.00. Nadie escribió la certeza." },
      { id: "umbral", texto: "+0.20. El umbral de la casa." },
      { id: "prioridad", texto: "La prioridad de la primera regla." },
    ],
    correcta: "uno",
    revela: "El else de cargar anota ese valor con certeza 1.0 y origen «dato».",
  };
}

function preguntaCondicion(info) {
  const dato = info.hechos.find((h) => h.nombre === "llueve" && h.clase === "inicial");
  const premisa = info.reglas
    .flatMap((regla) => regla.si)
    .find((parte) => parte.hecho === "llueve" && parte.valor === "sí");
  const seCumple = premisa.cf !== 0;
  return {
    tipo: "una",
    enunciado: `llueve vale «${dato.valor_texto}» con certeza ${dato.cf_texto}. ¿Qué devuelve cf_condicion(("llueve", "==", "sí"))?`,
    opciones: unicas([
      { id: "bien", texto: premisa.cf_texto },
      { id: "dato", texto: dato.cf_texto },
      { id: "cero", texto: "+0.00" },
      { id: "uno", texto: "+1.00" },
      { id: "umbral", texto: "+0.20" },
      { id: "vuelta", texto: "-1.00" },
    ]).slice(0, 4),
    correcta: "bien",
    revela: seCumple
      ? `La comparación se cumple, así que devuelve la certeza del dato: ${premisa.cf_texto}.`
      : "La comparación no se cumple, así que la premisa vale +0.00. La certeza del dato no se voltea.",
  };
}

function preguntaPremisas(info) {
  const regla = info.reglas.find((item) => item.id === "R3");
  const mayor = regla.si.reduce((mejor, parte) => (parte.cf > mejor.cf ? parte : mejor));
  return {
    tipo: "una",
    enunciado:
      "R3 pide pago confirmado, cerca, sin lluvia y sin cancelación. Estas son las certezas de sus premisas. ¿Qué devuelve cf_premisas?",
    detalle: regla.si.map((parte) => `${parte.texto} → ${parte.cf_texto}`),
    opciones: unicas([
      { id: "bien", texto: regla.cf_si_texto },
      { id: "max", texto: mayor.cf_texto },
      { id: "regla", texto: regla.cf_texto },
      { id: "cero", texto: "+0.00" },
      { id: "uno", texto: "+1.00" },
      { id: "umbral", texto: "+0.20" },
    ]).slice(0, 4),
    correcta: "bien",
    revela: `El SI se queda con el más bajo: ${regla.cf_si_texto}.`,
  };
}

function preguntaAgenda(info) {
  return {
    tipo: "varias",
    enunciado:
      "¿Qué reglas entran a la agenda? Hace falta que el SI pase de +0.20. La comanda ya tiene esa columna.",
    opciones: [
      ...info.reglas.map((regla) => ({
        id: regla.id,
        texto: `${regla.id} · prioridad ${regla.prioridad} · ${regla.entonces.etiqueta}`,
      })),
      { id: "__ninguna", texto: "Ninguna entra" },
    ],
    correcta: info.agenda.length ? info.agenda : ["__ninguna"],
    revela: info.agenda.length
      ? `Entran ${info.agenda.join(", ")}.`
      : "Ningún SI pasa de +0.20. La agenda queda vacía.",
  };
}

function preguntaResolver() {
  return {
    tipo: "una",
    enunciado: "En un ensayo levantan la mano estas tres. ¿Cuál dispara primero?",
    detalle: [
      "RA · prioridad 60 · 4 condiciones",
      "RB · prioridad 90 · 1 condición",
      "RC · prioridad 60 · 2 condiciones",
    ],
    opciones: [
      { id: "RB", texto: "RB. La prioridad 90 manda." },
      { id: "RA", texto: "RA. Tiene más condiciones." },
      { id: "RC", texto: "RC. Está entre las dos y desempata." },
      { id: "todas", texto: "Las tres a la vez. La agenda no elige." },
    ],
    correcta: "RB",
    revela:
      "Manda la prioridad: RB tiene 90. Si no estuviera, RA le gana a RC. Las dos tienen 60 y RA es más específica.",
  };
}

function preguntaDisparar(info) {
  if (!info.ciclos.length) {
    return {
      tipo: "una",
      enunciado: "En este pedido la agenda está vacía. ¿Qué hace disparar?",
      opciones: [
        { id: "bien", texto: "No se llama. adelante se detiene antes." },
        { id: "fuerza", texto: "Dispara igual la regla de mayor prioridad." },
        { id: "cero", texto: "Escribe la decisión con certeza 0." },
        { id: "combina", texto: "Combina con la fila del pedido anterior." },
      ],
      correcta: "bien",
      revela: "Sin candidatas no hay ciclo. disparar no corre.",
    };
  }
  const ciclo = info.ciclos[0];
  return {
    tipo: "una",
    enunciado: `El primer ciclo dispara ${ciclo.regla}. La regla trae ${ciclo.cf_regla_texto} y el SI está en ${ciclo.cf_si_texto}. ¿Cuál es el aporte?`,
    opciones: unicas([
      { id: "bien", texto: ciclo.aporte_cf_texto },
      { id: "suma", texto: textoCf(ciclo.cf_regla + ciclo.cf_si) },
      { id: "regla", texto: ciclo.cf_regla_texto },
      { id: "si", texto: ciclo.cf_si_texto },
      { id: "umbral", texto: textoCf(ciclo.cf_regla * 0.2) },
    ]).slice(0, 4),
    correcta: "bien",
    revela: `El aporte es ${ciclo.aporte_texto}.`,
  };
}

function preguntaAdelante(info) {
  const recomendacion = info.recomendacion;
  return {
    tipo: "una",
    enunciado: "Cuando la agenda se vacía, ¿qué recomienda el motor para este pedido?",
    opciones: [
      { id: "enviar", texto: "Preparar y enviar" },
      { id: "esperar_lluvia", texto: "Preparar y esperar un claro" },
      { id: "cancelar", texto: "Cancelar antes de empezar" },
      { id: "fuera_de_zona", texto: "No iniciar: fuera de zona" },
      { id: "ninguna", texto: "Sin recomendación" },
    ],
    correcta: recomendacion ? recomendacion.valor : "ninguna",
    revela: recomendacion
      ? `Queda ${recomendacion.etiqueta}, ${recomendacion.cf_texto}, por ${recomendacion.origen}. Gana la certeza más alta que pasa de +0.20.`
      : "Ninguna fila pasa de +0.20. El motor no recomienda.",
  };
}

export const PIEZAS = [
  {
    id: "cargar",
    metodo: "cargar(hechos, caso)",
    titulo: "Anotar el pedido",
    hace: "Anota los datos iniciales, cada uno con su certeza.",
    necesita: false,
    plantilla: `def cargar(self, hechos, caso=""):
    self.bf = BaseHechos(caso)
    self.disparadas = []
    self.pasos = []
    for nombre, info in hechos.items():
        if isinstance(info, dict):
            {{hueco}}
        else:
            self.bf.anotar_inicial(nombre, info, 1.0, "dato")
    return self`,
    opcionesLinea: [
      {
        id: "inicial",
        codigo:
          'self.bf.anotar_inicial(nombre, info["valor"], info.get("cf", 1.0), info.get("origen", "dato"))',
      },
      {
        id: "inferido",
        codigo:
          'self.bf.anotar_inferido(nombre, info["valor"], info.get("cf", 1.0), "R0")',
      },
      {
        id: "cero",
        codigo: 'self.bf.anotar_inicial(nombre, info["valor"], 0.0, "dato")',
      },
      {
        id: "cambio",
        codigo:
          'self.bf.anotar_inicial(nombre, info.get("cf", 1.0), info["valor"], "dato")',
      },
    ],
    lineaCorrecta: "inicial",
    descartarConAyuda: "inferido",
    concepto: {
      formula: "No hay fórmula. Es la entrada del caso.",
      ejemplo:
        "Otro viernes: plata = 8000, sin CF. Queda una fila de clase inicial, con CF +1.00. Mañana esa fila no existe.",
      pista: "La fila nace como inicial. La certeza se lee del dato, y si no viene, es +1.00.",
      parrafos: [
        "La base de hechos es de este pedido. cargar la crea de cero: el caso anterior se borra y cada dato entra como hecho inicial.",
        "La certeza no la inventa el motor. Viaja con el dato. Si el dato llega suelto, sin diccionario, lo da por hecho.",
        "Lo inferido lo escribe después una regla. cargar no concluye. Anota.",
      ],
    },
    pregunta: preguntaCargar,
  },
  {
    id: "cf_condicion",
    metodo: "cf_condicion(condicion)",
    titulo: "Una premisa",
    hace: "Devuelve la certeza de una premisa, o 0.0.",
    necesita: true,
    plantilla: `def cf_condicion(self, cond):
    nombre, op, esperado = cond
    hecho = self.bf.inicial(nombre)
    if hecho is None:
        return 0.0
    try:
        if not OPS[op](hecho.valor, esperado):
            return 0.0
    except TypeError:
        return 0.0
    {{hueco}}`,
    opcionesLinea: [
      { id: "cf", codigo: "return hecho.cf" },
      { id: "uno", codigo: "return 1.0" },
      { id: "cero", codigo: "return 0.0" },
      { id: "valor", codigo: "return hecho.valor" },
    ],
    lineaCorrecta: "cf",
    descartarConAyuda: "valor",
    concepto: {
      formula: "Si la comparación se cumple, devuelve el CF del dato. Si no, 0.0.",
      ejemplo:
        "El dato dice llueve = no, con CF +0.80. La premisa llueve == sí vale 0.0. Ese +0.80 no se convierte en −0.80.",
      pista: "Primero la comparación. La certeza del dato solo sale si la comparación se cumple.",
      parrafos: [
        "Una premisa es una comparación: llueve == sí, distancia_km <= 4.",
        "El método busca el hecho inicial. Si no está, devuelve 0.0. Si la comparación falla, devuelve 0.0. No voltea el número.",
        "Si la comparación se cumple, la premisa hereda la certeza con la que llegó el dato.",
      ],
    },
    pregunta: preguntaCondicion,
  },
  {
    id: "cf_premisas",
    metodo: "cf_premisas(regla)",
    titulo: "El SI completo",
    hace: "Devuelve la certeza más baja del SI.",
    necesita: true,
    plantilla: `def cf_premisas(self, regla):
    if not regla.si:
        return 1.0
    {{hueco}}`,
    opcionesLinea: [
      {
        id: "min",
        codigo: "return min(self.cf_condicion(c) for c in regla.si)",
      },
      {
        id: "max",
        codigo: "return max(self.cf_condicion(c) for c in regla.si)",
      },
      {
        id: "promedio",
        codigo: "return sum(self.cf_condicion(c) for c in regla.si) / len(regla.si)",
      },
      {
        id: "primera",
        codigo: "return self.cf_condicion(regla.si[0])",
      },
    ],
    lineaCorrecta: "min",
    descartarConAyuda: "promedio",
    concepto: {
      formula: "CF del SI = el mínimo de las premisas.",
      ejemplo:
        "Tres premisas, en +1.00, +0.40 y +1.00. El mínimo es +0.40. El promedio daría +0.80, y no es la cuenta de esta casa.",
      pista: "Una premisa floja deja flojo todo el SI. Se elige la más baja.",
      parrafos: [
        "El SI es una y. No alcanza con que una premisa esté fuerte.",
        "Si el SI no pide nada, el método devuelve 1.0. En las políticas del local todas piden algo.",
      ],
    },
    pregunta: preguntaPremisas,
  },
  {
    id: "agenda",
    metodo: "agenda()",
    titulo: "Quién levanta la mano",
    hace: "Lista las reglas no disparadas cuyo SI pasa de 0.20.",
    necesita: true,
    plantilla: `def agenda(self):
    candidatas = []
    for regla in self.bc:
        if regla.id in self.disparadas:
            continue
        {{hueco}}
            candidatas.append(regla)
    return candidatas`,
    opcionesLinea: [
      { id: "mayor", codigo: "if self.cf_premisas(regla) > UMBRAL:" },
      { id: "igual", codigo: "if self.cf_premisas(regla) >= UMBRAL:" },
      { id: "menor", codigo: "if self.cf_premisas(regla) < UMBRAL:" },
      { id: "prioridad", codigo: "if regla.prioridad >= 70:" },
    ],
    lineaCorrecta: "mayor",
    descartarConAyuda: "prioridad",
    concepto: {
      formula: "Entra si el CF del SI > 0.20.",
      ejemplo:
        "Un SI en +0.20 se queda sentado. Un SI en +0.21 levanta la mano. La prioridad no abre esta puerta: solo ordena el turno, más adelante.",
      pista: "Justo 0.20 no pasa. Tiene que ser mayor.",
      parrafos: [
        "La agenda es el conjunto de conflicto: las reglas que sí pueden disparar ahora.",
        "Una regla queda fuera si ya disparó, o si su SI no pasa el umbral. En esta casa el umbral es 0.20.",
      ],
    },
    pregunta: preguntaAgenda,
  },
  {
    id: "resolver",
    metodo: "resolver(candidatas)",
    titulo: "A quién se atiende",
    hace: "Elige una: prioridad, luego más condiciones, luego orden.",
    necesita: false,
    plantilla: `def resolver(self, candidatas):
    if not candidatas:
        return None
    ordenadas = sorted(
        enumerate(candidatas),
        key=lambda t: {{hueco}},
    )
    return ordenadas[0][1]`,
    opcionesLinea: [
      {
        id: "casa",
        codigo: "(-t[1].prioridad, -t[1].especificidad, t[0])",
      },
      {
        id: "alreves",
        codigo: "(t[1].prioridad, t[1].especificidad, t[0])",
      },
      {
        id: "especifica",
        codigo: "(-t[1].especificidad, -t[1].prioridad, t[0])",
      },
      { id: "orden", codigo: "(t[0],)" },
    ],
    lineaCorrecta: "casa",
    descartarConAyuda: "orden",
    concepto: {
      formula: "(−prioridad, −especificidad, orden de escritura)",
      ejemplo:
        "RA tiene prioridad 60 y 4 condiciones. RB tiene 90 y 1. RC tiene 60 y 2. Gana RB. Sin RB, gana RA: empata la prioridad con RC y tiene más condiciones.",
      pista: "El signo menos pone primero al número grande. La prioridad va antes que la cantidad de condiciones.",
      parrafos: [
        "Un mesero no atiende todas las mesas en el mismo segundo. resolver elige una sola regla.",
        "Primero la prioridad que escribió el experto. Si empatan, la más específica: más condiciones. Si siguen empatando, la que está escrita primero en las políticas.",
        "Si la agenda llega vacía, devuelve None. Nadie pasa a disparar.",
      ],
    },
    pregunta: preguntaResolver,
  },
  {
    id: "disparar",
    metodo: "disparar(regla, ciclo)",
    titulo: "El empujón",
    hace: "Aporte = CF de la regla × CF del SI. Lo escribe o lo combina.",
    necesita: true,
    plantilla: `def disparar(self, regla, ciclo):
    cf_si = self.cf_premisas(regla)
    {{hueco}}
    nombre, valor = regla.entonces
    self.bf.anotar_inferido(nombre, valor, aporte, regla.id)
    self.disparadas.append(regla.id)`,
    opcionesLinea: [
      { id: "producto", codigo: "aporte = round(regla.cf * cf_si, 4)" },
      { id: "suma", codigo: "aporte = round(regla.cf + cf_si, 4)" },
      { id: "solo", codigo: "aporte = round(regla.cf, 4)" },
      { id: "premisa", codigo: "aporte = round(cf_si, 4)" },
    ],
    lineaCorrecta: "producto",
    descartarConAyuda: "premisa",
    concepto: {
      formula: "aporte = CF de la regla × CF del SI",
      ejemplo:
        "En la sesión 6, quedarse ya tenía +0.80 y llega otro apoyo de +0.50. La cuenta es 0.80 + 0.50 × (1 − 0.80) = 0.90. Sumar 0.80 + 0.50 se sale de la escala.",
      pista: "Se multiplican los dos CF. La prioridad no entra en el aporte.",
      parrafos: [
        "El aporte es el empujón de esta regla hacia su conclusión. La prioridad ya hizo su trabajo: eligió el turno.",
        "Si esa conclusión no estaba en la base de hechos, el aporte queda escrito en la fila. Si ya estaba, se combina y el resultado sigue entre −1 y +1.",
        "Dos a favor: CF1 + CF2 × (1 − CF1). Uno a favor y otro en contra: (CF1 + CF2) / (1 − el menor de los valores absolutos).",
      ],
    },
    pregunta: preguntaDisparar,
  },
  {
    id: "adelante",
    metodo: "adelante()",
    titulo: "El ciclo",
    hace: "Repite agenda, resolver y disparar hasta vaciar la agenda.",
    necesita: true,
    tipoLinea: "orden",
    ordenCorrecta: ["agenda", "resolver", "disparar"],
    pasos: [
      { id: "agenda", llamada: "agenda", metodo: "agenda()", texto: "reconocer quién puede" },
      {
        id: "resolver",
        llamada: "resolver",
        metodo: "resolver(candidatas)",
        texto: "elegir una",
      },
      {
        id: "disparar",
        llamada: "disparar",
        metodo: "disparar(regla, ciclo)",
        texto: "escribir el aporte",
      },
    ],
    plantilla: `def adelante(self, max_ciclos=20):
    for ciclo in range(1, max_ciclos + 1):
        candidatas = self.{{1}}()
        if not candidatas:
            break
        regla = self.{{2}}(candidatas)
        self.{{3}}(regla, ciclo)
    return self.bf.recomendacion()`,
    concepto: {
      formula: "agenda → resolver → disparar, hasta que la agenda quede vacía.",
      ejemplo:
        "Dos reglas escriben quedarse, primero +0.80 y luego +0.50. La recomendación no es «la primera» ni la suma. Es el CF combinado: +0.90.",
      pista: "El ciclo sigue hasta que nadie levanta la mano. Al final manda la certeza más alta que pasa de +0.20.",
      parrafos: [
        "adelante no elige una vez y se va. En cada vuelta reconoce, elige una regla y escribe. La base de hechos cambia, y vuelve a mirar.",
        "Para cuando agenda devuelve vacío. La recomendación es la conclusión con el CF más alto, si ese número pasa de 0.20.",
        "La prioridad ordenó el turno. No sustituye a la certeza del resultado. En la comanda el CF se muestra con dos decimales.",
      ],
    },
    pregunta: preguntaAdelante,
  },
];

export function frontera(encajadas) {
  const indice = encajadas.findIndex((lista) => !lista);
  return indice === -1 ? encajadas.length : indice;
}
