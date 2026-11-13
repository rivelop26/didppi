import { useEffect, useState } from "react";
import { PLANO, cuadernos } from "../escritorio";

function arrancaSolo() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function MomentoCero({ info, onSeguir }) {
  const frames = cuadernos(info);
  const [indice, setIndice] = useState(0);
  const [playing, setPlaying] = useState(arrancaSolo);
  const firma = frames.map((frame) => frame.filas.join("~")).join("|");

  useEffect(() => {
    setIndice(0);
    setPlaying(arrancaSolo());
  }, [firma]);

  useEffect(() => {
    if (!playing || frames.length === 0 || indice >= frames.length - 1) return undefined;
    const reloj = setTimeout(() => setIndice((actual) => actual + 1), 2200);
    return () => clearTimeout(reloj);
  }, [playing, indice, frames.length]);

  const frame = frames[indice];

  return (
    <article className="taller momento">
      <p className="kicker">Momento 0</p>
      <h2>El mapa del motor</h2>
      <p className="hace">
        Primero se llama a un método, después al siguiente. Esta prueba de escritorio no abre
        el interior de cada uno: solo muestra qué deja escrito en este pedido.
      </p>

      <ol className="flujo" aria-label="Orden de llamadas">
        {frames.map((item, i) => (
          <li key={`${item.metodo}-${i}`} className={i === indice ? "ahora" : i < indice ? "hecho" : ""}>
            <span>{i + 1}</span>
            {item.metodo}
          </li>
        ))}
      </ol>

      <div className="escritorio">
        <pre className="codigo plano">
          {PLANO.map((linea, i) => (
            <div key={linea} className={frame && frame.linea === i ? "linea activa" : "linea"}>
              {linea || " "}
            </div>
          ))}
        </pre>
        <div className="cuaderno" aria-live="polite">
          {frame ? (
            <>
              <p className="kicker">Línea en curso</p>
              <h3>{frame.metodo}</h3>
              <p>{frame.dice}</p>
              {frame.filas.length > 0 && (
                <ul>
                  {frame.filas.map((fila) => (
                    <li key={fila}>{fila}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="espera">El motor está armando la prueba de este pedido.</p>
          )}
        </div>
      </div>

      <div className="acciones">
        <button
          type="button"
          className="btn btn-secundario"
          onClick={() => {
            if (indice >= frames.length - 1) {
              setIndice(0);
              setPlaying(true);
              return;
            }
            setPlaying((valor) => !valor);
          }}
        >
          {playing && indice < frames.length - 1 ? "Pausar" : indice >= frames.length - 1 ? "Otra vez" : "Seguir"}
        </button>
        <button
          type="button"
          className="btn btn-secundario"
          onClick={() => {
            setPlaying(false);
            setIndice((actual) => Math.max(0, actual - 1));
          }}
          disabled={indice === 0}
        >
          Línea anterior
        </button>
        <button
          type="button"
          className="btn btn-secundario"
          onClick={() => {
            setPlaying(false);
            setIndice((actual) => Math.min(frames.length - 1, actual + 1));
          }}
          disabled={!frames.length || indice >= frames.length - 1}
        >
          Siguiente línea
        </button>
        <button type="button" className="btn btn-principal" onClick={onSeguir}>
          Armar la primera pieza
        </button>
      </div>
    </article>
  );
}
