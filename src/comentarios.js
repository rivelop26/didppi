export const COMENTARIOS = {
  cargar: [
    {
      codigo: "def cargar(self, hechos, caso=\"\")",
      texto: "Abre el método. Recibe los datos del pedido y el nombre del caso.",
    },
    {
      codigo: "self.bf = BaseHechos(caso)",
      texto: "Crea la tabla de este pedido. Si había otro caso, esa tabla se borra.",
    },
    {
      codigo: "self.disparadas = []",
      texto: "Todavía ninguna regla ha corrido.",
    },
    {
      codigo: "self.pasos = []",
      texto: "El relato del recorrido empieza vacío.",
    },
    {
      codigo: "for nombre, info in hechos.items()",
      texto: "Recorre cada dato que llegó: pago, distancia, lluvia, cancelación.",
    },
    {
      codigo: "if isinstance(info, dict)",
      texto: "El dato puede venir armado, con valor y certeza por separado.",
    },
    {
      codigo: "la línea que falta",
      texto: "Aquí el dato entra a la tabla. Tiene que quedar como hecho inicial, con la certeza que trae.",
    },
    {
      codigo: "anotar_inicial(nombre, info, 1.0, \"dato\")",
      texto: "Si el dato llega suelto, sin diccionario, se da por hecho: certeza +1.00.",
    },
    {
      codigo: "return self",
      texto: "El motor queda listo. El siguiente método ya puede mirar la tabla.",
    },
  ],
  cf_condicion: [
    {
      codigo: "def cf_condicion(self, cond)",
      texto: "Recibe una sola premisa: un nombre, un operador y el valor esperado.",
    },
    {
      codigo: "nombre, op, esperado = cond",
      texto: "Desarma la premisa en esas tres partes. Ejemplo: llueve, ==, sí.",
    },
    {
      codigo: "hecho = self.bf.inicial(nombre)",
      texto: "Busca ese dato en los hechos iniciales. No mira lo que ya infirió una regla.",
    },
    {
      codigo: "if hecho is None: return 0.0",
      texto: "Si el dato no está, la premisa no empuja. Devuelve 0.0.",
    },
    {
      codigo: "if not OPS[op](hecho.valor, esperado)",
      texto: "Compara el valor del dato con lo que la regla pide. Si no se cumple, también devuelve 0.0.",
    },
    {
      codigo: "except TypeError",
      texto: "Si la comparación no se puede hacer, no truena: la premisa vale 0.0.",
    },
    {
      codigo: "la línea que falta",
      texto: "La comparación ya se cumplió. Aquí el método responde con la certeza de esa premisa.",
    },
  ],
  cf_premisas: [
    {
      codigo: "def cf_premisas(self, regla)",
      texto: "Mira el SI completo de una regla, no una premisa suelta.",
    },
    {
      codigo: "if not regla.si: return 1.0",
      texto: "Si la regla no pide nada, no hay premisa floja. El SI queda en +1.00.",
    },
    {
      codigo: "la línea que falta",
      texto: "El SI es una y. Esta línea junta la certeza de todas las premisas en un solo número.",
    },
  ],
  agenda: [
    {
      codigo: "candidatas = []",
      texto: "La agenda empieza vacía. Aquí van a caer las reglas que sí pueden disparar.",
    },
    {
      codigo: "for regla in self.bc",
      texto: "Recorre las políticas de la casa. La base de conocimiento no cambia con el pedido.",
    },
    {
      codigo: "if regla.id in self.disparadas: continue",
      texto: "Si esa regla ya disparó, no vuelve a levantar la mano.",
    },
    {
      codigo: "la línea que falta",
      texto: "Esta condición decide si la regla entra. Usa el CF del SI y el umbral de la casa, que es 0.20.",
    },
    {
      codigo: "candidatas.append(regla)",
      texto: "Si pasó la puerta, la regla queda en la agenda.",
    },
    {
      codigo: "return candidatas",
      texto: "Devuelve la lista. Puede venir vacía: entonces el ciclo se detiene.",
    },
  ],
  resolver: [
    {
      codigo: "if not candidatas: return None",
      texto: "Sin agenda no hay a quién atender. Nadie pasa a disparar.",
    },
    {
      codigo: "sorted(enumerate(candidatas), ...)",
      texto: "Ordena las reglas que levantaron la mano. enumerate guarda el lugar en que estaban escritas.",
    },
    {
      codigo: "la línea que falta",
      texto: "La llave dice el desempate: primero la prioridad, luego cuántas condiciones tiene, y al final el orden de escritura.",
    },
    {
      codigo: "return ordenadas[0][1]",
      texto: "Se queda con una sola. El mesero no atiende todas las mesas a la vez.",
    },
  ],
  disparar: [
    {
      codigo: "cf_si = self.cf_premisas(regla)",
      texto: "Vuelve a medir el SI. Es el número más bajo de las premisas.",
    },
    {
      codigo: "la línea que falta",
      texto: "Calcula el aporte y lo deja en la variable aporte. Lo usa la línea de abajo, cuando escribe o combina.",
    },
    {
      codigo: "nombre, valor = regla.entonces",
      texto: "Lee la conclusión: qué hecho va a escribir y con qué valor.",
    },
    {
      codigo: "anotar_inferido(...)",
      texto: "Si esa conclusión no estaba, la escribe. Si ya estaba, junta las dos certezas.",
    },
    {
      codigo: "self.disparadas.append(regla.id)",
      texto: "Marca la regla. En la próxima agenda ya no vuelve a salir.",
    },
  ],
  adelante: [
    {
      codigo: "for ciclo in range(...)",
      texto: "El ciclo se repite. Cada vuelta es un disparo.",
    },
    {
      codigo: "candidatas = self.agenda()",
      texto: "Primero mira quién puede. Sin esta lista, no hay nada que elegir.",
    },
    {
      codigo: "if not candidatas: break",
      texto: "Si nadie levanta la mano, el recorrido se detiene.",
    },
    {
      codigo: "regla = self.resolver(candidatas)",
      texto: "De las que pueden, elige una: prioridad, luego más condiciones, luego orden.",
    },
    {
      codigo: "self.disparar(regla, ciclo)",
      texto: "Esa regla calcula su aporte y lo escribe o lo combina. La tabla cambia.",
    },
    {
      codigo: "return self.bf.recomendacion()",
      texto: "Al salir, devuelve la conclusión con la certeza más alta, si pasa de +0.20.",
    },
  ],
};
