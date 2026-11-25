const CAMPOS = [
  ["hechos", "self.hechos", "dict"],
  ["desconocidos", "self.desconocidos", "set"],
  ["preguntas_hechas", "self.preguntas_hechas", "list"],
  ["disparadas", "self.disparadas", "list"],
  ["conclusiones", "self.conclusiones", "dict"],
];

export default function Libreta({
  titulo,
  relato,
  foto,
  anterior,
  error,
  children,
  campos = CAMPOS,
  esperando = !foto,
}) {
  return (
    <aside className="comanda libreta" aria-label="Estado en Python">
      <p className="kicker">La consulta en Python</p>
      <h2>{titulo}</h2>
      {relato && <p className="relato">{relato}</p>}
      {error && <p className="fallo">{error}</p>}
      {esperando && !error && <p className="espera">El motor está preparando la consulta.</p>}
      {foto && (
        <dl className="libreta-campos">
          {campos.map(([clave, nombre, tipo]) => {
            const valor = foto.python[clave];
            const cambio = anterior && anterior.python[clave] !== valor;
            return (
              <div key={clave} className={cambio ? "campo cambio" : "campo"}>
                <dt>
                  <code>{nombre}</code>
                  <span className="tipo">{tipo}</span>
                </dt>
                <dd>
                  <pre key={valor}>{valor}</pre>
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      {children}
    </aside>
  );
}
