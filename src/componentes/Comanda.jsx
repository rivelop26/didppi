const CAMPOS = [
  { nombre: "pago_confirmado", tipo: "sino", etiqueta: "Pago confirmado" },
  { nombre: "distancia_km", tipo: "km", etiqueta: "Distancia", min: 0, max: 14, step: 0.5 },
  { nombre: "llueve", tipo: "sino", etiqueta: "Está lloviendo" },
  { nombre: "pidio_cancelar", tipo: "sino", etiqueta: "Pidió cancelar" },
];

function valorLegible(nombre, valor) {
  if (nombre === "distancia_km") return `${valor} km`;
  return valor;
}

export default function Comanda({
  casos,
  casoId,
  meta,
  modificado,
  hechos,
  info,
  nivel,
  error,
  onPreset,
  onHechos,
  onPoliticas,
}) {
  function cambiar(nombre, parte) {
    onHechos({
      ...hechos,
      [nombre]: { ...hechos[nombre], ...parte },
    });
  }

  const iniciales = (info?.hechos || []).filter((hecho) => hecho.clase === "inicial");
  const primerCiclo = info?.ciclos?.[0];

  return (
    <aside className="comanda">
      <div className="guia-caso">
        <strong>El pedido se cambia aquí.</strong>
        <p>
          El mapa y las preguntas usan estos datos. Elige un caso completo, o cambia un hecho:
          su valor y su certeza.
        </p>
      </div>
      <p className="kicker">Comanda</p>
      <h2>{meta ? meta.nombre : "Pedido"}</h2>
      <p className="relato">{meta?.relato}</p>
      {modificado && <p className="modificado">Este caso ya no es el original: hay un hecho distinto.</p>}

      <h3 className="guia-titulo">Elegir un caso</h3>
      <div className="chips" role="group" aria-label="Elegir un caso">
        {casos.map((caso) => (
          <button
            key={caso.id}
            type="button"
            className={caso.id === casoId && !modificado ? "chip activo" : "chip"}
            onClick={() => onPreset(caso)}
          >
            {caso.nombre}
            <small>{caso.titulo}</small>
          </button>
        ))}
      </div>

      {hechos && (
        <div className="controles">
          <h3 className="guia-titulo">Cambiar un hecho</h3>
          {CAMPOS.map((campo) => {
            const hecho = hechos[campo.nombre];
            return (
              <fieldset key={campo.nombre}>
                <legend>{campo.etiqueta}</legend>
                {campo.tipo === "sino" ? (
                  <div className="segmento">
                    {["sí", "no"].map((opcion) => (
                      <button
                        key={opcion}
                        type="button"
                        aria-pressed={hecho.valor === opcion}
                        onClick={() => cambiar(campo.nombre, { valor: opcion })}
                      >
                        {opcion}
                      </button>
                    ))}
                  </div>
                ) : (
                  <label className="rango">
                    <input
                      type="range"
                      min={campo.min}
                      max={campo.max}
                      step={campo.step}
                      value={hecho.valor}
                      onChange={(evento) =>
                        cambiar(campo.nombre, { valor: Number(evento.target.value) })
                      }
                    />
                    <span>{valorLegible(campo.nombre, hecho.valor)}</span>
                  </label>
                )}
                <label className="rango certeza">
                  <span>Certeza {Number(hecho.cf).toFixed(2)}</span>
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.05}
                    value={hecho.cf}
                    aria-label={`Certeza de ${campo.etiqueta}`}
                    onChange={(evento) =>
                      cambiar(campo.nombre, { cf: Number(evento.target.value) })
                    }
                  />
                </label>
              </fieldset>
            );
          })}
        </div>
      )}

      {error && <p className="alerta">{error}</p>}

      <button type="button" className="btn btn-texto" onClick={onPoliticas} disabled={!info}>
        Ver las políticas del local
      </button>

      {nivel >= 1 && iniciales.length > 0 && (
        <section>
          <h3>Base de hechos</h3>
          <table>
            <thead>
              <tr>
                <th>Hecho</th>
                <th>Valor</th>
                <th>CF</th>
              </tr>
            </thead>
            <tbody>
              {iniciales.map((hecho) => (
                <tr key={hecho.nombre}>
                  <td>{hecho.nombre}</td>
                  <td>{valorLegible(hecho.nombre, hecho.valor_texto)}</td>
                  <td>{hecho.cf_texto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {nivel >= 2 && info && (
        <section>
          <h3>cf_condicion</h3>
          <p>
            llueve == sí devuelve{" "}
            {
              info.reglas
                .flatMap((regla) => regla.si)
                .find((parte) => parte.hecho === "llueve" && parte.valor === "sí").cf_texto
            }
          </p>
        </section>
      )}

      {nivel >= 3 && info && (
        <section>
          <h3>CF del SI</h3>
          <ul className="lista-reglas">
            {info.reglas.map((regla) => (
              <li key={regla.id} className={nivel >= 4 && regla.entra ? "entra" : ""}>
                <span>
                  {regla.id}
                  {nivel >= 5 && info.primera === regla.id ? " · primera" : ""}
                </span>
                <span>{regla.cf_si_texto}</span>
                {nivel >= 4 && <small>{regla.entra ? "entra" : "no entra"}</small>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {nivel >= 6 && primerCiclo && (
        <section>
          <h3>Primer disparo</h3>
          <p>
            {primerCiclo.regla} escribe {primerCiclo.etiqueta}. {primerCiclo.aporte_texto}.
          </p>
        </section>
      )}

      {nivel >= 7 && info && (
        <section className="cierre-comanda">
          <h3>Recorrido</h3>
          {info.ciclos.length === 0 && <p>La agenda empezó vacía. No hubo disparos.</p>}
          <ol>
            {info.ciclos.map((ciclo) => (
              <li key={ciclo.ciclo}>
                <strong>
                  Ciclo {ciclo.ciclo}: {ciclo.regla}
                </strong>
                <span> podían {(ciclo.candidatas || []).join(", ")}</span>
                <p>{ciclo.aporte_texto}</p>
                <p>{ciclo.antes === null ? ciclo.formula : `combina ${ciclo.formula}`}</p>
              </li>
            ))}
          </ol>
          {info.recomendacion ? (
            <p className="recomendacion">
              {info.recomendacion.etiqueta}
              <strong>{info.recomendacion.cf_texto}</strong>
              <small>{info.recomendacion.origen}</small>
            </p>
          ) : (
            <p className="recomendacion vacia">Sin recomendación</p>
          )}
        </section>
      )}
    </aside>
  );
}
