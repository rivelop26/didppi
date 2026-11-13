import { useState } from "react";
import { COMENTARIOS } from "../comentarios";
import { mismas } from "../contenido";

function codigoVisible(pieza, linea, orden) {
  const marcar = (texto, vacio) => `⟦${vacio ? "·" : ""}${texto}⟧`;
  if (pieza.tipoLinea === "orden") {
    let texto = pieza.plantilla;
    pieza.pasos.forEach((paso, i) => {
      const elegido = orden[i];
      const llamada = elegido
        ? pieza.pasos.find((item) => item.id === elegido).llamada
        : "····";
      texto = texto.replace(`{{${i + 1}}}`, marcar(llamada, !elegido));
    });
    return texto;
  }
  const hueco = linea ? linea.codigo : "elige la línea";
  return pieza.plantilla.replace("{{hueco}}", marcar(hueco, !linea));
}

function BloqueCodigo({ texto, comentarios }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="bloque-codigo">
      <div className="barra-codigo">
        <span>Código</span>
        <button
          type="button"
          className="btn-duda"
          aria-expanded={abierto}
          aria-label="Qué hace cada línea"
          onClick={() => setAbierto((valor) => !valor)}
        >
          ?
        </button>
      </div>
      <Codigo texto={texto} />
      {abierto && (
        <ol className="comentarios">
          {comentarios.map((item) => (
            <li key={item.codigo}>
              <code>{item.codigo}</code>
              <p>{item.texto}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Codigo({ texto }) {
  const partes = texto.split("⟦");
  return (
    <pre className="codigo">
      <code>
        {partes.map((parte, i) => {
          if (i === 0) return <span key={i}>{parte}</span>;
          const corte = parte.indexOf("⟧");
          const hueco = parte.slice(0, corte);
          const resto = parte.slice(corte + 1);
          const vacio = hueco.startsWith("·");
          return (
            <span key={i}>
              <mark className={vacio ? "hueco vacio" : "hueco lleno"}>{vacio ? hueco.slice(1) : hueco}</mark>
              {resto}
            </span>
          );
        })}
      </code>
    </pre>
  );
}

export default function Taller({
  pieza,
  numero,
  total,
  info,
  ayuda,
  intentos,
  encajada,
  onAyuda,
  onFallo,
  onExito,
  onSiguiente,
  haySiguiente,
}) {
  const [lineaId, setLineaId] = useState(null);
  const [respuesta, setRespuesta] = useState(null);
  const [varias, setVarias] = useState([]);
  const [orden, setOrden] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const pregunta = !pieza.necesita || info ? pieza.pregunta(info) : null;
  const revelar = ayuda && intentos >= 2;
  const opcionesLinea = (pieza.opcionesLinea || []).filter(
    (opcion) => !(ayuda && opcion.id === pieza.descartarConAyuda),
  );
  const linea = (pieza.opcionesLinea || []).find((opcion) => opcion.id === lineaId);
  const descartada = (pieza.opcionesLinea || []).find(
    (opcion) => opcion.id === pieza.descartarConAyuda,
  );

  function alternarOrden(id) {
    setOrden((previo) => {
      const puesto = previo.indexOf(id);
      if (puesto === -1) return [...previo, id];
      return previo.slice(0, puesto);
    });
    setMensaje("");
  }

  function alternarVaria(id) {
    setVarias((previo) => {
      if (id === "__ninguna") return previo.includes(id) ? [] : ["__ninguna"];
      const sinVacio = previo.filter((item) => item !== "__ninguna");
      return sinVacio.includes(id) ? sinVacio.filter((item) => item !== id) : [...sinVacio, id];
    });
    setMensaje("");
  }

  function encajar() {
    if (!pregunta) return;
    if (pregunta.tipo === "varias" && varias.length === 0) {
      onFallo();
      setMensaje("Marca las reglas que entran, o elige «Ninguna entra».");
      return;
    }
    const esOrden = pieza.tipoLinea === "orden";
    const lineaOk = esOrden
      ? orden.length === pieza.ordenCorrecta.length &&
        orden.every((id, i) => id === pieza.ordenCorrecta[i])
      : lineaId === pieza.lineaCorrecta;
    const respuestaOk =
      pregunta.tipo === "varias" ? mismas(varias, pregunta.correcta) : respuesta === pregunta.correcta;
    if (lineaOk && respuestaOk) {
      setMensaje("");
      onExito();
      return;
    }
    onFallo();
    const nombre = esOrden ? "el orden del ciclo" : "la línea";
    if (!lineaOk && !respuestaOk) {
      setMensaje(`Revisa ${nombre} y también la respuesta de este pedido.`);
    } else if (!lineaOk) {
      setMensaje(`La respuesta del pedido sí. Revisa ${nombre}.`);
    } else {
      setMensaje("La pieza de código sí. La respuesta no cuadra con este pedido.");
    }
  }

  if (encajada) {
    const ordenLista = pieza.ordenCorrecta || [];
    const lineaLista = (pieza.opcionesLinea || []).find((opcion) => opcion.id === pieza.lineaCorrecta);
    return (
      <article className="taller">
        <p className="kicker">
          Pieza {numero} de {total}
        </p>
        <h2>{pieza.metodo}</h2>
        <p className="hace">{pieza.hace}</p>
        <BloqueCodigo
          texto={codigoVisible(pieza, lineaLista, ordenLista)}
          comentarios={COMENTARIOS[pieza.id] || []}
        />
        <p className="exito">Esta pieza ya está en el motor.</p>
        {haySiguiente && (
          <button type="button" className="btn btn-principal" onClick={onSiguiente}>
            Siguiente pieza
          </button>
        )}
      </article>
    );
  }

  return (
    <article className="taller">
      <p className="kicker">
        Pieza {numero} de {total}
      </p>
      <h2>{pieza.titulo}</h2>
      <p className="metodo">{pieza.metodo}</p>
      <p className="hace">{pieza.hace}</p>

      <BloqueCodigo
        texto={codigoVisible(pieza, linea, orden)}
        comentarios={COMENTARIOS[pieza.id] || []}
      />

      {pieza.tipoLinea === "orden" ? (
        <fieldset className="bloque">
          <legend>Arma el ciclo en el orden en que corre</legend>
          <div className="opciones">
            {pieza.pasos.map((paso) => {
              const puesto = orden.indexOf(paso.id);
              return (
                <button
                  key={paso.id}
                  type="button"
                  className={puesto >= 0 ? "opcion elegida" : "opcion"}
                  aria-pressed={puesto >= 0}
                  onClick={() => alternarOrden(paso.id)}
                >
                  <span className="puesto">{puesto >= 0 ? puesto + 1 : "·"}</span>
                  <span>
                    <strong>{paso.metodo}</strong>
                    <small>{paso.texto}</small>
                  </span>
                </button>
              );
            })}
          </div>
          {revelar && (
            <p className="revela">
              El ciclo corre así: agenda(), resolver(candidatas), disparar(regla, ciclo).
            </p>
          )}
        </fieldset>
      ) : (
        <fieldset className="bloque">
          <legend>Elige la línea que falta</legend>
          {ayuda && descartada && (
            <p className="afloje">
              La actividad se aflojó: salió «{descartada.codigo}». El concepto no la deja seguir.
            </p>
          )}
          <div className="opciones">
            {opcionesLinea.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                className={lineaId === opcion.id ? "opcion elegida" : "opcion"}
                aria-pressed={lineaId === opcion.id}
                onClick={() => {
                  setLineaId(opcion.id);
                  setMensaje("");
                }}
              >
                <code>{opcion.codigo}</code>
                {revelar && opcion.id === pieza.lineaCorrecta && <small>Así queda en el motor</small>}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {pregunta && (
        <fieldset className="bloque">
          <legend>{pregunta.enunciado}</legend>
          {pregunta.detalle && (
            <ul className="detalle">
              {pregunta.detalle.map((lineaDetalle) => (
                <li key={lineaDetalle}>{lineaDetalle}</li>
              ))}
            </ul>
          )}
          <div className="opciones">
            {pregunta.opciones.map((opcion) => {
              const marcada =
                pregunta.tipo === "varias" ? varias.includes(opcion.id) : respuesta === opcion.id;
              return (
                <label key={opcion.id} className={marcada ? "opcion elegida" : "opcion"}>
                  <input
                    type={pregunta.tipo === "varias" ? "checkbox" : "radio"}
                    name={pregunta.tipo === "varias" ? undefined : pieza.id}
                    checked={marcada}
                    onChange={() => {
                      if (pregunta.tipo === "varias") alternarVaria(opcion.id);
                      else {
                        setRespuesta(opcion.id);
                        setMensaje("");
                      }
                    }}
                  />
                  <span>{opcion.texto}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {!pregunta && <p className="espera">El motor está revisando este pedido.</p>}

      {mensaje && (
        <p className="fallo" role="status">
          {mensaje}
        </p>
      )}
      {revelar && pregunta && <p className="revela">{pregunta.revela}</p>}
      {ayuda && intentos === 1 && <p className="pista">{pieza.concepto.pista}</p>}

      <div className="acciones">
        <button type="button" className="btn btn-secundario" aria-expanded={ayuda} onClick={onAyuda}>
          {ayuda ? "Ocultar el concepto" : "Consultar el concepto"}
        </button>
        <button type="button" className="btn btn-principal" onClick={encajar} disabled={!pregunta}>
          Encajar esta pieza
        </button>
      </div>

      {ayuda && (
        <section className="nota">
          <h3>Nota de clase</h3>
          {pieza.concepto.parrafos.map((parrafo) => (
            <p key={parrafo}>{parrafo}</p>
          ))}
          <p className="formula">{pieza.concepto.formula}</p>
          <p className="ejemplo">{pieza.concepto.ejemplo}</p>
        </section>
      )}
    </article>
  );
}
