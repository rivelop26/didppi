import { useEffect, useRef } from "react";

export default function Politicas({ info, nivel, abierto, onCerrar }) {
  const dialogo = useRef(null);

  useEffect(() => {
    const nodo = dialogo.current;
    if (!nodo) return;
    if (abierto && !nodo.open) nodo.showModal();
    if (!abierto && nodo.open) nodo.close();
  }, [abierto]);

  return (
    <dialog
      ref={dialogo}
      className="dialogo"
      onClose={onCerrar}
      onClick={(evento) => {
        if (evento.target === dialogo.current) onCerrar();
      }}
    >
      <article className="dialogo-cuerpo">
        <header className="dialogo-cabeza">
          <div>
            <p className="kicker">Base de conocimiento</p>
            <h2>Políticas del local</h2>
          </div>
          <button type="button" className="btn btn-texto" onClick={onCerrar}>
            Cerrar
          </button>
        </header>
        <p className="dialogo-nota">
          Estas reglas no cambian con el pedido. El orden en que están escritas es el
          tercer desempate de resolver.
        </p>
        <ol className="politicas">
          {(info?.reglas || []).map((regla) => (
            <li key={regla.id}>
              <div className="politica-cabeza">
                <strong>{regla.id}</strong>
                <span>prioridad {regla.prioridad}</span>
                <span>CF {regla.cf_texto}</span>
                <span>
                  {regla.especificidad} {regla.especificidad === 1 ? "condición" : "condiciones"}
                </span>
                {nivel >= 3 && <span>SI {regla.cf_si_texto}</span>}
              </div>
              <p className="si">{regla.si.map((parte) => parte.texto).join("  y  ")}</p>
              <p className="entonces">Entonces: {regla.entonces.etiqueta}</p>
              <p className="porque">{regla.porque}</p>
            </li>
          ))}
        </ol>
      </article>
    </dialog>
  );
}
