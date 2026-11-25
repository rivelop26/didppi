import { useEffect, useState } from "react";
import { cargarGuiaExplicaciones, pasoExplicacion } from "../api";
import { frontera } from "../contenido";
import { COMENTARIOS_EXPLICACIONES } from "../explicaciones/comentarios";
import {
  ESTRUCTURAS_EXPLICACIONES,
  PIEZAS_EXPLICACIONES,
  TIPOS_EXPLICACIONES,
} from "../explicaciones/contenido";
import CodigoExplicaciones from "./CodigoExplicaciones";
import Estructuras from "./Estructuras";
import Libreta from "./Libreta";
import SimuladorExplicaciones from "./SimuladorExplicaciones";
import Taller from "./Taller";
import { Traza } from "./Traza";

const VACIAS = () => PIEZAS_EXPLICACIONES.map(() => false);
const CEROS = () => PIEZAS_EXPLICACIONES.map(() => 0);

const CAMPOS = [
  ["eventos", "self.traza.eventos", "list"],
  ["origen", "self.origen", "dict"],
  ["anotadas", "self.anotadas", "dict"],
  ["resultado", "self.resultado", "tuple"],
];

function Nav({ vista, indice, encajadas, tope, onVista, onPieza }) {
  const ficha = (id, num, nombre) => (
    <button
      key={id}
      type="button"
      className={vista === id ? "ficha activa" : "ficha"}
      aria-current={vista === id ? "step" : undefined}
      onClick={() => onVista(id)}
    >
      <span className="ficha-num">{num}</span>
      <span className="ficha-nombre">{nombre}</span>
    </button>
  );
  return (
    <nav className="riel" aria-label="Recorrido del subsistema de explicaciones">
      {ficha("simulador", "0", "consulta")}
      {ficha("estructuras", "{ }", "estructuras")}
      {PIEZAS_EXPLICACIONES.map((pieza, i) => {
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
            <span className="ficha-num">{lista ? "✓" : pieza.letra}</span>
            <span className="ficha-nombre">{pieza.id}</span>
          </button>
        );
      })}
      {ficha("codigo", "</>", "código")}
    </nav>
  );
}

export default function Explicaciones() {
  const [guia, setGuia] = useState(null);
  const [error, setError] = useState("");
  const [vista, setVista] = useState("simulador");
  const [indice, setIndice] = useState(0);
  const [encajadas, setEncajadas] = useState(VACIAS);
  const [ayuda, setAyuda] = useState(VACIAS);
  const [intentos, setIntentos] = useState(CEROS);
  const [elegidas, setElegidas] = useState({});
  const [quien, setQuien] = useState("ana");
  const [pasos, setPasos] = useState([]);
  const [fotos, setFotos] = useState({ foto: null, anterior: null });
  const { foto, anterior } = fotos;

  useEffect(() => {
    let vivo = true;
    cargarGuiaExplicaciones()
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
    pasoExplicacion(pasos, control.signal)
      .then((resultado) => {
        setFotos((previas) => ({ foto: resultado, anterior: previas.foto }));
        setError("");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError("El motor no pudo seguir la consulta.");
      });
    return () => control.abort();
  }, [pasos]);

  const tope = frontera(encajadas);
  const pieza = PIEZAS_EXPLICACIONES[indice];

  function irAPieza(i) {
    if (i <= tope) {
      setVista("pieza");
      setIndice(i);
    }
  }

  function cambiarQuien(id) {
    setQuien(id);
    setPasos([]);
    setFotos({ foto: null, anterior: null });
  }

  function deshacer() {
    setPasos((previos) => previos.slice(0, -1));
  }

  function libreta() {
    if (!guia) return <Libreta titulo="Cargando" error={error} campos={CAMPOS} />;
    if (vista === "simulador") {
      const caso = guia.casos.find((item) => item.id === quien);
      return (
        <Libreta
          titulo={caso ? `La traza de ${caso.nombre}` : "Tu traza"}
          foto={foto}
          anterior={anterior}
          error={error}
          campos={CAMPOS}
        >
          <p className="dialogo-nota">Lo que cambió con el último paso queda resaltado.</p>
        </Libreta>
      );
    }
    const id = vista === "estructuras" ? guia.estructuras.caso.id : vista === "codigo" ? "ana" : pieza.caso;
    const caso = guia.casos.find((item) => item.id === id);
    return (
      <Libreta titulo={`${caso.nombre}, al final`} relato={caso.relato} error={error} esperando={false}>
        <Traza eventos={caso.final.eventos} desde={caso.final.eventos.length} titulo="Su traza" compacta />
        {caso.final.fin && (
          <section className="how-chico">
            <h3>Su HOW</h3>
            <pre className="codigo">{caso.final.fin.how_arbol}</pre>
          </section>
        )}
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
          <SimuladorExplicaciones
            guia={guia}
            foto={foto}
            anterior={anterior}
            pasos={pasos}
            quien={quien}
            onQuien={cambiarQuien}
            onPaso={(attr, valor) => setPasos((previos) => [...previos, [attr, valor]])}
            onDeshacer={deshacer}
            onReiniciar={() => cambiarQuien(quien)}
          />
        ) : vista === "estructuras" ? (
          <Estructuras
            guia={guia}
            elegidas={elegidas}
            onElegir={(id, tipo) => setElegidas((previas) => ({ ...previas, [id]: tipo }))}
            onSeguir={() => irAPieza(0)}
            textos={ESTRUCTURAS_EXPLICACIONES}
            tipos={TIPOS_EXPLICACIONES}
            parte="de la traza y las explicaciones"
          />
        ) : vista === "codigo" ? (
          <CodigoExplicaciones codigo={guia.codigo} />
        ) : (
          <Taller
            key={indice}
            pieza={pieza}
            numero={indice + 1}
            total={PIEZAS_EXPLICACIONES.length}
            info={guia}
            comentarios={COMENTARIOS_EXPLICACIONES[pieza.id]}
            ayuda={ayuda[indice]}
            intentos={intentos[indice]}
            encajada={encajadas[indice]}
            haySiguiente={indice < PIEZAS_EXPLICACIONES.length - 1}
            onAyuda={() => setAyuda((previo) => previo.map((valor, i) => (i === indice ? !valor : valor)))}
            onFallo={() => setIntentos((previo) => previo.map((valor, i) => (i === indice ? valor + 1 : valor)))}
            onExito={() => setEncajadas((previo) => previo.map((valor, i) => (i === indice ? true : valor)))}
            onSiguiente={() => setIndice((actual) => Math.min(actual + 1, PIEZAS_EXPLICACIONES.length - 1))}
          />
        )}
        {libreta()}
      </main>

      {tope === PIEZAS_EXPLICACIONES.length && (
        <p className="cierre">
          El subsistema de explicaciones está armado. Vuelve a la consulta, pide «por qué» tres veces y al final
          el HOW: cada frase sale de la traza que acabas de construir.
        </p>
      )}
    </>
  );
}
