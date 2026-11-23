import { useEffect, useState } from "react";
import { cargarGuiaConsultas, pasoConsulta } from "../api";
import { COMENTARIOS_CONSULTAS } from "../consultas/comentarios";
import { PIEZAS_CONSULTAS } from "../consultas/contenido";
import { frontera } from "../contenido";
import Estructuras from "./Estructuras";
import Libreta from "./Libreta";
import Simulador from "./Simulador";
import Taller from "./Taller";

const VACIAS = () => PIEZAS_CONSULTAS.map(() => false);
const CEROS = () => PIEZAS_CONSULTAS.map(() => 0);

function Nav({ vista, indice, encajadas, tope, onVista, onPieza }) {
  const fichas = [
    { id: "simulador", num: "0", nombre: "consulta" },
    { id: "estructuras", num: "{ }", nombre: "estructuras" },
  ];
  return (
    <nav className="riel" aria-label="Recorrido del subsistema de consultas">
      {fichas.map((ficha) => (
        <button
          key={ficha.id}
          type="button"
          className={vista === ficha.id ? "ficha activa" : "ficha"}
          aria-current={vista === ficha.id ? "step" : undefined}
          onClick={() => onVista(ficha.id)}
        >
          <span className="ficha-num">{ficha.num}</span>
          <span className="ficha-nombre">{ficha.nombre}</span>
        </button>
      ))}
      {PIEZAS_CONSULTAS.map((pieza, i) => {
        const lista = encajadas[i];
        const activa = vista === "pieza" && i === indice;
        const cerrada = i > tope;
        const clase = ["ficha", lista ? "lista" : "", activa ? "activa" : "", cerrada ? "cerrada" : ""]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={pieza.id}
            type="button"
            className={clase}
            aria-current={activa ? "step" : undefined}
            disabled={cerrada}
            onClick={() => onPieza(i)}
          >
            <span className="ficha-num">{lista ? "✓" : i + 1}</span>
            <span className="ficha-nombre">{pieza.id}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function Consultas() {
  const [guia, setGuia] = useState(null);
  const [error, setError] = useState("");
  const [vista, setVista] = useState("simulador");
  const [indice, setIndice] = useState(0);
  const [encajadas, setEncajadas] = useState(VACIAS);
  const [ayuda, setAyuda] = useState(VACIAS);
  const [intentos, setIntentos] = useState(CEROS);
  const [elegidas, setElegidas] = useState({});
  const [quien, setQuien] = useState("yo");
  const [respuestas, setRespuestas] = useState([]);
  const [fotos, setFotos] = useState({ foto: null, anterior: null });
  const { foto, anterior } = fotos;

  useEffect(() => {
    let vivo = true;
    cargarGuiaConsultas()
      .then((datos) => {
        if (vivo) setGuia(datos);
      })
      .catch(() => {
        if (vivo) setError("No encuentro el motor Python. En local, déjalo corriendo en el puerto 8000.");
      });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    const control = new AbortController();
    pasoConsulta(Object.fromEntries(respuestas), control.signal)
      .then((resultado) => {
        setFotos((previas) => ({ foto: resultado, anterior: previas.foto }));
        setError("");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError("El motor no pudo seguir la consulta.");
      });
    return () => control.abort();
  }, [respuestas]);

  const tope = frontera(encajadas);
  const pieza = PIEZAS_CONSULTAS[indice];

  function irAPieza(i) {
    if (i <= tope) {
      setVista("pieza");
      setIndice(i);
    }
  }

  function cambiarQuien(id) {
    setQuien(id);
    setRespuestas([]);
  }

  function libreta() {
    if (!guia) return <Libreta titulo="Cargando" error={error} />;
    if (vista === "simulador") {
      const caso = guia.casos.find((item) => item.id === quien);
      return (
        <Libreta
          titulo={caso ? `Consulta de ${caso.nombre}` : "Tu consulta"}
          foto={foto}
          anterior={anterior}
          error={error}
        >
          <p className="dialogo-nota">Lo que cambió con la última respuesta queda resaltado.</p>
        </Libreta>
      );
    }
    const id = vista === "estructuras" ? guia.estructuras.caso.id : pieza.caso;
    const caso = guia.casos.find((item) => item.id === id);
    return (
      <Libreta
        titulo={`${caso.nombre}, al final`}
        relato={caso.relato}
        foto={caso.fotos.at(-1)}
        error={error}
      >
        <section className="historia">
          <h3>Las preguntas de {caso.nombre}</h3>
          <ol>
            {caso.historia.map((p) => (
              <li key={p.numero}>
                <code>{p.attr}</code> → <strong>{p.respuesta_texto}</strong>
              </li>
            ))}
          </ol>
        </section>
      </Libreta>
    );
  }

  return (
    <>
      <Nav
        vista={vista}
        indice={indice}
        encajadas={encajadas}
        tope={tope}
        onVista={setVista}
        onPieza={irAPieza}
      />

      <main className="mesa">
        {!guia ? (
          <article className="taller">
            <p className={error ? "fallo" : "espera"}>{error || "El motor está preparando los casos."}</p>
          </article>
        ) : vista === "simulador" ? (
          <Simulador
            guia={guia}
            foto={foto}
            respuestas={respuestas}
            quien={quien}
            onQuien={cambiarQuien}
            onResponder={(attr, valor) => setRespuestas((previas) => [...previas, [attr, valor]])}
            onDeshacer={() => setRespuestas((previas) => previas.slice(0, -1))}
            onReiniciar={() => setRespuestas([])}
          />
        ) : vista === "estructuras" ? (
          <Estructuras
            guia={guia}
            elegidas={elegidas}
            onElegir={(id, tipo) => setElegidas((previas) => ({ ...previas, [id]: tipo }))}
            onSeguir={() => irAPieza(0)}
          />
        ) : (
          <Taller
            key={indice}
            pieza={pieza}
            numero={indice + 1}
            total={PIEZAS_CONSULTAS.length}
            info={guia}
            comentarios={COMENTARIOS_CONSULTAS[pieza.id]}
            ayuda={ayuda[indice]}
            intentos={intentos[indice]}
            encajada={encajadas[indice]}
            haySiguiente={indice < PIEZAS_CONSULTAS.length - 1}
            onAyuda={() => setAyuda((previo) => previo.map((valor, i) => (i === indice ? !valor : valor)))}
            onFallo={() => setIntentos((previo) => previo.map((valor, i) => (i === indice ? valor + 1 : valor)))}
            onExito={() => setEncajadas((previo) => previo.map((valor, i) => (i === indice ? true : valor)))}
            onSiguiente={() => setIndice((actual) => Math.min(actual + 1, PIEZAS_CONSULTAS.length - 1))}
          />
        )}
        {libreta()}
      </main>

      {tope === PIEZAS_CONSULTAS.length && (
        <p className="cierre">
          El subsistema está armado. Vuelve a la consulta en vivo y prueba con «No sé»: las piezas que
          encajaste son las que deciden qué se pregunta.
        </p>
      )}
    </>
  );
}
