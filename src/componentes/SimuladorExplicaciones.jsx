import { useState } from "react";
import { ArbolHow, Dialogo, Traza } from "./Traza";

const BOTON_PORQUE = ["¿Por qué me preguntas esto?", "¿Y esa regla para qué sirve?", "¿Y más arriba?"];

function siguienteDelCaso(caso, pasos) {
  if (!caso || pasos.length >= caso.pasos.length) return null;
  const igual = pasos.every(([a, v], i) => a === caso.pasos[i][0] && String(v) === String(caso.pasos[i][1]));
  return igual ? caso.pasos[pasos.length] : null;
}

function Pregunta({ pregunta, sugerido, nombre, onPaso }) {
  return (
    <section className="pregunta-viva" aria-live="polite">
      <p className="kicker">
        Pregunta {pregunta.numero}
        {pregunta.nivel > 0 && ` · ya pidió ${pregunta.nivel} WHY`}
      </p>
      <h3>{pregunta.texto}</h3>
      <p className="metodo-chico">
        preguntar_usuario(<code>"{pregunta.attr}"</code>)
      </p>
      <div className="respuestas">
        {pregunta.opciones.map((opcion) => (
          <button
            key={String(opcion.valor)}
            type="button"
            className={sugerido && String(sugerido[1]) === String(opcion.valor) ? "opcion sugerida" : "opcion"}
            onClick={() => onPaso(pregunta.attr, opcion.valor)}
          >
            {opcion.texto}
          </button>
        ))}
        <button
          type="button"
          className={sugerido && sugerido[1] === null ? "opcion no-se sugerida" : "opcion no-se"}
          onClick={() => onPaso(pregunta.attr, null)}
        >
          No sé
        </button>
      </div>
      <button
        type="button"
        className={sugerido && sugerido[1] === "por qué" ? "btn btn-why sugerida" : "btn btn-why"}
        onClick={() => onPaso(pregunta.attr, "por qué")}
      >
        {BOTON_PORQUE[Math.min(pregunta.nivel, BOTON_PORQUE.length - 1)]}
      </button>
      {sugerido && (
        <button type="button" className="btn btn-principal" onClick={() => onPaso(sugerido[0], sugerido[1])}>
          Que responda {nombre}
        </button>
      )}
    </section>
  );
}

function Fin({ fin, umbral }) {
  const [how, setHow] = useState(false);
  const [porQueNo, setPorQueNo] = useState(false);
  const motivo =
    fin.motivo === "umbral"
      ? `Parada temprana: llegó a ${fin.cf_texto} y pasa el umbral de ${umbral.toFixed(2)}.`
      : "Paró porque no quedaban reglas pendientes por probar.";
  return (
    <section className={`fin ${fin.valor ? "fin-umbral" : "fin-sin_conclusion"}`} aria-live="polite">
      <p className="kicker">Fin de la consulta</p>
      <h3>{fin.etiqueta || "Sin conclusión"}</h3>
      <p>{motivo}</p>
      <div className="acciones">
        <button type="button" className="btn btn-how" aria-expanded={how} onClick={() => setHow((v) => !v)}>
          {how ? "Ocultar el HOW" : "¿Cómo llegaste a esa conclusión?"}
        </button>
        <button
          type="button"
          className="btn btn-secundario"
          aria-expanded={porQueNo}
          onClick={() => setPorQueNo((v) => !v)}
        >
          {porQueNo ? "Ocultar el WHY NOT" : "¿Y por qué no las otras reglas?"}
        </button>
      </div>
      {how && (
        <div className="how">
          <p className="how-frase">{fin.how}</p>
          <ArbolHow arbol={fin.arbol} />
          <pre className="codigo">{`>>> print(consulta.how_arbol())\n${fin.how_arbol}`}</pre>
        </div>
      )}
      {porQueNo && (
        <ul className="por-que-no">
          {fin.descartadas.map((d) => (
            <li key={d.regla}>{d.texto}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function SimuladorExplicaciones({
  guia,
  foto,
  anterior,
  pasos,
  quien,
  onQuien,
  onPaso,
  onDeshacer,
  onReiniciar,
}) {
  const caso = guia.casos.find((item) => item.id === quien);
  const desde = anterior ? anterior.eventos.length : 0;
  const sugerido = siguienteDelCaso(caso, pasos);

  return (
    <article className="taller simulador">
      <p className="kicker">Momento 0 · la consulta que se explica</p>
      <h2>Pregunta «por qué» y pide el HOW</h2>
      <p className="hace">
        Es la misma consulta del restaurante. Ahora cada paso queda anotado en la traza. En cualquier pregunta
        puedes pedir «por qué» hasta tres veces; al final, pide cómo llegó a la conclusión.
      </p>

      <fieldset className="bloque">
        <legend>¿Quién responde?</legend>
        <div className="chips quien">
          <button type="button" className={quien === "yo" ? "chip activo" : "chip"} onClick={() => onQuien("yo")}>
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

      {!foto && <p className="espera">El motor está abriendo la traza.</p>}
      {foto && <Dialogo lineas={foto.dialogo} desde={desde} />}
      {foto && foto.pregunta && (
        <Pregunta
          key={`${foto.eventos.length}`}
          pregunta={foto.pregunta}
          sugerido={sugerido}
          nombre={caso && caso.nombre}
          onPaso={onPaso}
        />
      )}
      {foto && foto.fin && <Fin key={pasos.length} fin={foto.fin} umbral={foto.umbral} />}

      {foto && <Traza eventos={foto.eventos} desde={desde} />}

      <div className="acciones">
        <button type="button" className="btn btn-secundario" onClick={onDeshacer} disabled={!pasos.length}>
          Deshacer el último paso
        </button>
        <button type="button" className="btn btn-secundario" onClick={onReiniciar} disabled={!pasos.length}>
          Empezar de nuevo
        </button>
      </div>
    </article>
  );
}
