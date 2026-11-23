import { useState } from "react";

const ESTADOS = {
  PENDIENTE: { texto: "pendiente", clase: "pendiente" },
  FALSA: { texto: "falsa", clase: "falsa" },
  VERDADERA: { texto: "verdadera", clase: "verdadera" },
  DISPARADA: { texto: "disparada", clase: "disparada" },
  DESCARTADA: { texto: "descartada", clase: "descartada" },
};

const MARCAS = { verdadera: "✓", falsa: "✗", falta: "?", no_se: "no sé" };

function mismoValor(a, b) {
  if (a === null || b === null || a === undefined || b === undefined) return a === b;
  return String(a) === String(b);
}

function Fin({ fin, umbral }) {
  const textos = {
    umbral: `Parada temprana: «${fin.etiqueta}» llegó a ${fin.cf_texto} y pasa el umbral de ${umbral}. No hace falta preguntar más.`,
    sin_pendientes: `No quedan reglas por probar. La mejor respuesta es «${fin.etiqueta}» con ${fin.cf_texto}, por debajo del umbral de ${umbral}.`,
    sin_conclusion: "Ninguna regla se pudo disparar. El motor no concluye: le faltó lo que el cliente no supo.",
  };
  return (
    <section className={`fin fin-${fin.motivo}`} aria-live="polite">
      <p className="kicker">Fin de la consulta</p>
      <h3>{fin.etiqueta || "Sin conclusión"}</h3>
      <p>{textos[fin.motivo]}</p>
      <p className="fin-cuenta">
        {fin.preguntas === 1 ? "1 pregunta" : `${fin.preguntas} preguntas`} de 4 posibles.
      </p>
    </section>
  );
}

function Pregunta({ foto, caso, onResponder }) {
  const [porque, setPorque] = useState(false);
  const { pregunta, puntajes } = foto;
  const esperada = caso ? caso.respuestas[pregunta.attr] : undefined;
  const haySugerencia = caso && esperada !== undefined;

  return (
    <section className="pregunta-viva" aria-live="polite">
      <p className="kicker">Pregunta {pregunta.numero}</p>
      <h3>{pregunta.texto}</h3>
      <p className="metodo-chico">
        preguntar(<code>"{pregunta.attr}"</code>)
      </p>
      <div className="respuestas">
        {pregunta.opciones.map((opcion) => (
          <button
            key={String(opcion.valor)}
            type="button"
            className={haySugerencia && mismoValor(esperada, opcion.valor) ? "opcion sugerida" : "opcion"}
            onClick={() => onResponder(pregunta.attr, opcion.valor)}
          >
            {opcion.texto}
          </button>
        ))}
        <button
          type="button"
          className={haySugerencia && esperada === null ? "opcion no-se sugerida" : "opcion no-se"}
          onClick={() => onResponder(pregunta.attr, null)}
        >
          No sé
        </button>
      </div>
      {haySugerencia && (
        <button
          type="button"
          className="btn btn-principal"
          onClick={() => onResponder(pregunta.attr, esperada)}
        >
          Que responda {caso.nombre}
        </button>
      )}
      <button
        type="button"
        className="btn-texto porque-btn"
        aria-expanded={porque}
        onClick={() => setPorque((valor) => !valor)}
      >
        {porque ? "Ocultar los puntajes" : "¿Por qué esta pregunta?"}
      </button>
      {porque && (
        <ol className="puntajes">
          {puntajes.map((fila, i) => (
            <li key={fila.attr} className={i === 0 ? "gana" : ""}>
              <div className="puntaje-cabeza">
                <code>{fila.attr}</code>
                <strong>{fila.puntaje.toFixed(2)}</strong>
              </div>
              <div className="barra">
                <span style={{ width: `${(fila.puntaje / puntajes[0].puntaje) * 100}%` }} />
              </div>
              <ul>
                {fila.desglose.map((d) => (
                  <li key={d.regla}>{d.texto}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Tablero({ reglas }) {
  return (
    <section className="tablero" aria-label="Estado de las reglas">
      <h3>Las reglas, ordenadas por prioridad</h3>
      <ol>
        {reglas.map((regla) => {
          const estado = ESTADOS[regla.estado];
          return (
            <li key={regla.id} className={`regla-fila ${estado.clase}`}>
              <div className="regla-id">
                <strong>{regla.id}</strong>
                <small>
                  p {regla.prioridad} · {regla.cf_texto}
                </small>
              </div>
              <div className="regla-cuerpo">
                <div className="conds">
                  {regla.si.map((cond) => (
                    <span key={cond.texto} className={`cond ${cond.estado}`}>
                      <b>{MARCAS[cond.estado]}</b> {cond.texto}
                    </span>
                  ))}
                </div>
                <p className="regla-entonces">→ {regla.entonces.etiqueta}</p>
              </div>
              <span key={regla.estado} className={`estado ${estado.clase}`}>
                {estado.texto}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function Simulador({
  guia,
  foto,
  respuestas,
  quien,
  onQuien,
  onResponder,
  onDeshacer,
  onReiniciar,
}) {
  const caso = guia.casos.find((item) => item.id === quien);

  return (
    <article className="taller simulador">
      <p className="kicker">Momento 0 · la consulta en vivo</p>
      <h2>Responde como el cliente</h2>
      <p className="hace">
        El pedido llega sin datos. El motor revisa las reglas, elige la pregunta que más ayuda y para
        apenas está seguro. Puedes responder «No sé».
      </p>

      <fieldset className="bloque">
        <legend>¿Quién responde?</legend>
        <div className="chips quien">
          <button
            type="button"
            className={quien === "yo" ? "chip activo" : "chip"}
            onClick={() => onQuien("yo")}
          >
            Respondo yo
            <small>Elige cada respuesta</small>
          </button>
          {guia.casos.map((item) => (
            <button
              key={item.id}
              type="button"
              className={quien === item.id ? "chip activo" : "chip"}
              onClick={() => onQuien(item.id)}
            >
              {item.nombre}
              <small>{item.titulo}</small>
            </button>
          ))}
        </div>
        {caso && <p className="guia-caso">{caso.relato}</p>}
      </fieldset>

      {!foto && <p className="espera">El motor está revisando las reglas.</p>}
      {foto && foto.pregunta && (
        <Pregunta
          key={`${foto.pregunta.numero}-${foto.pregunta.attr}`}
          foto={foto}
          caso={caso}
          onResponder={onResponder}
        />
      )}
      {foto && foto.fin && <Fin fin={foto.fin} umbral={foto.umbral_texto} />}

      {foto && foto.conclusiones.length > 0 && (
        <section className="conclusiones">
          <h3>Conclusiones acumuladas</h3>
          {foto.conclusiones.map((c) => (
            <div key={c.valor} className="conclusion">
              <span>{c.etiqueta}</span>
              <div className="barra-cf">
                <span
                  className={c.cf < 0 ? "negativa" : ""}
                  style={{ width: `${Math.min(Math.abs(c.cf), 1) * 100}%` }}
                />
                <i style={{ left: `${foto.umbral * 100}%` }} title="umbral" />
              </div>
              <strong>{c.cf_texto}</strong>
            </div>
          ))}
        </section>
      )}

      {foto && <Tablero reglas={foto.reglas} />}

      {foto && foto.historia.length > 0 && (
        <section className="historia">
          <h3>Lo que se preguntó</h3>
          <ol>
            {foto.historia.map((p) => (
              <li key={p.numero}>
                <code>{p.attr}</code> → <strong>{p.respuesta_texto}</strong>
                <small> · puntaje {p.puntaje.toFixed(2)}</small>
                {p.efectos.length > 0 && (
                  <span className="efectos">
                    {p.efectos.map((e) => (
                      <span key={e.regla} className={`estado ${ESTADOS[e.estado].clase}`}>
                        {e.regla} {ESTADOS[e.estado].texto}
                      </span>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="acciones">
        <button type="button" className="btn btn-secundario" onClick={onDeshacer} disabled={!respuestas.length}>
          Deshacer la última respuesta
        </button>
        <button type="button" className="btn btn-secundario" onClick={onReiniciar} disabled={!respuestas.length}>
          Empezar de nuevo
        </button>
      </div>
    </article>
  );
}
