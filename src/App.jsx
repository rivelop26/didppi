import { useEffect, useState } from "react";
import { cargarCasos, inspeccionar } from "./api";
import { PIEZAS, frontera } from "./contenido";
import Comanda from "./componentes/Comanda";
import MomentoCero from "./componentes/MomentoCero";
import Politicas from "./componentes/Politicas";
import Portada from "./componentes/Portada";
import Riel from "./componentes/Riel";
import Taller from "./componentes/Taller";

const VACIAS = () => PIEZAS.map(() => false);
const CEROS = () => PIEZAS.map(() => 0);

export default function App() {
  const [casos, setCasos] = useState([]);
  const [casoId, setCasoId] = useState("ana");
  const [meta, setMeta] = useState(null);
  const [modificado, setModificado] = useState(false);
  const [hechos, setHechos] = useState(null);
  const [info, setInfo] = useState(null);
  const [infoClave, setInfoClave] = useState("");
  const [error, setError] = useState("");
  const [indice, setIndice] = useState(0);
  const [encajadas, setEncajadas] = useState(VACIAS);
  const [ayuda, setAyuda] = useState(VACIAS);
  const [intentos, setIntentos] = useState(CEROS);
  const [politicasAbiertas, setPoliticasAbiertas] = useState(false);
  const [portada, setPortada] = useState(true);
  const [vista, setVista] = useState("mapa");

  useEffect(() => {
    let vivo = true;
    cargarCasos()
      .then((lista) => {
        if (!vivo) return;
        const inicial = lista.find((caso) => caso.id === "ana") || lista[0];
        setCasos(lista);
        aplicarPreset(inicial, true);
      })
      .catch(() => {
        if (vivo) {
          setError("No encuentro el motor Python. En local, déjalo corriendo en el puerto 8000.");
        }
      });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (!hechos || !meta) return undefined;
    const control = new AbortController();
    const espera = setTimeout(() => {
      const clave = JSON.stringify(hechos);
      inspeccionar(meta.nombre, hechos, control.signal)
        .then((resultado) => {
          setInfo(resultado);
          setInfoClave(clave);
          setError("");
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setError("El motor no pudo revisar este pedido.");
        });
    }, 180);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [hechos, meta]);

  function aplicarPreset(caso, inicial = false) {
    setCasoId(caso.id);
    setMeta({ nombre: caso.nombre, titulo: caso.titulo, relato: caso.relato });
    setHechos(structuredClone(caso.hechos));
    setModificado(false);
    if (!inicial) setIntentos(CEROS());
  }

  function cambiarHechos(siguientes) {
    setHechos(siguientes);
    setModificado(true);
    setIntentos(CEROS());
  }

  function reiniciar() {
    setIndice(0);
    setEncajadas(VACIAS());
    setAyuda(VACIAS());
    setIntentos(CEROS());
    setVista("mapa");
    setPortada(true);
  }

  const pieza = PIEZAS[indice];
  const tope = frontera(encajadas);
  const completo = tope === PIEZAS.length;
  const infoVigente = info && hechos && infoClave === JSON.stringify(hechos) ? info : null;

  return (
    <div className="pagina">
      <header className="cabeza">
        <div className="marca-bloque">
          <button type="button" className="marca" aria-label="Didppi, volver al inicio" onClick={() => setPortada(true)}>
            <img src="/didppi.png" alt="Didppi" />
          </button>
          <div>
            <p className="kicker">Sistemas expertos · IUSH</p>
            <p className="subtitulo">El motor de un pedido a domicilio.</p>
          </div>
        </div>
        {completo && !portada && (
          <button type="button" className="btn btn-secundario" onClick={reiniciar}>
            Empezar otro recorrido
          </button>
        )}
      </header>

      {portada ? (
        <Portada
          onEntrar={() => {
            setPortada(false);
            setVista("mapa");
          }}
        />
      ) : (
        <>
      {completo && (
        <p className="cierre">
          El motor está armado. Cambia el pedido en la comanda: el mapa y las piezas vuelven a
          recorrer el caso.
        </p>
      )}

      <Riel
        piezas={PIEZAS}
        indice={indice}
        encajadas={encajadas}
        vista={vista}
        onMapa={() => setVista("mapa")}
        onElegir={(i) => {
          if (i <= tope) {
            setVista("pieza");
            setIndice(i);
          }
        }}
      />

      <main className="mesa">
        {vista === "mapa" ? (
          <MomentoCero
            info={infoVigente}
            onSeguir={() => {
              setVista("pieza");
              setIndice(0);
            }}
          />
        ) : (
        <Taller
          key={`${indice}-${JSON.stringify(hechos)}`}
          pieza={pieza}
          numero={indice + 1}
          total={PIEZAS.length}
          info={infoVigente}
          ayuda={ayuda[indice]}
          intentos={intentos[indice]}
          encajada={encajadas[indice]}
          haySiguiente={indice < PIEZAS.length - 1}
          onAyuda={() =>
            setAyuda((previo) => previo.map((valor, i) => (i === indice ? !valor : valor)))
          }
          onFallo={() =>
            setIntentos((previo) => previo.map((valor, i) => (i === indice ? valor + 1 : valor)))
          }
          onExito={() =>
            setEncajadas((previo) => previo.map((valor, i) => (i === indice ? true : valor)))
          }
          onSiguiente={() => setIndice((actual) => Math.min(actual + 1, PIEZAS.length - 1))}
        />
        )}
        <Comanda
          casos={casos}
          casoId={casoId}
          meta={meta}
          modificado={modificado}
          hechos={hechos}
          info={infoVigente}
          nivel={tope}
          error={error}
          onPreset={aplicarPreset}
          onHechos={cambiarHechos}
          onPoliticas={() => setPoliticasAbiertas(true)}
        />
      </main>

      <Politicas
        info={infoVigente}
        nivel={tope}
        abierto={politicasAbiertas}
        onCerrar={() => setPoliticasAbiertas(false)}
      />
        </>
      )}
    </div>
  );
}
