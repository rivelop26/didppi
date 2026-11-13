export default function Riel({ piezas, indice, encajadas, vista, onMapa, onElegir }) {
  const primeraAbierta = encajadas.findIndex((lista) => !lista);
  const tope = primeraAbierta === -1 ? piezas.length - 1 : primeraAbierta;

  return (
    <nav className="riel" aria-label="Recorrido del motor">
      <button
        type="button"
        className={vista === "mapa" ? "ficha activa" : "ficha"}
        aria-current={vista === "mapa" ? "step" : undefined}
        onClick={onMapa}
      >
        <span className="ficha-num">0</span>
        <span className="ficha-nombre">mapa</span>
      </button>
      {piezas.map((pieza, i) => {
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
            onClick={() => onElegir(i)}
          >
            <span className="ficha-num">{lista ? "✓" : i + 1}</span>
            <span className="ficha-nombre">{pieza.id}</span>
          </button>
        );
      })}
    </nav>
  );
}
