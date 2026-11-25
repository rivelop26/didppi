import { useState } from "react";

export const NOMBRES_EVENTO = {
  INICIO: "inicio",
  PREGUNTA: "pregunta",
  WHY_PEDIDO: "why pedido",
  RESPUESTA: "respuesta",
  REGLA_DESCARTADA: "regla descartada",
  REGLA_DISPARADA: "regla disparada",
  PARADA: "parada",
  CONCLUSION: "conclusión",
};

export function Traza({ eventos, desde = 0, resaltar = [], titulo = "La traza", compacta = false }) {
  const [python, setPython] = useState(false);
  return (
    <section className={compacta ? "traza compacta" : "traza"} aria-label={titulo}>
      <div className="traza-cabeza">
        <h3>
          {titulo} <small>{eventos.length} eventos</small>
        </h3>
        <button type="button" className="btn-texto" aria-pressed={python} onClick={() => setPython((v) => !v)}>
          {python ? "Ver en frases" : "Ver en Python"}
        </button>
      </div>
      <ol>
        {eventos.map((ev) => {
          const clase = [
            "evento",
            `ev-${ev.tipo.toLowerCase()}`,
            ev.n > desde ? "nuevo" : "",
            resaltar.includes(ev.n) ? "resaltado" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <li key={ev.n} className={clase} style={{ animationDelay: `${Math.max(0, ev.n - desde - 1) * 0.08}s` }}>
              <span className="ev-n">{ev.n}</span>
              <span className="ev-tipo">{ev.tipo}</span>
              {python ? <code className="ev-texto">{ev.python}</code> : <span className="ev-texto">{ev.resumen}</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function ArbolHow({ arbol }) {
  if (!arbol) return null;
  return (
    <div className="arbol" role="tree" aria-label="Árbol HOW">
      <div className="nodo raiz" role="treeitem">
        <strong>
          {arbol.meta} = {arbol.valor}
        </strong>{" "}
        <small>CF {arbol.cf_texto}</small>
      </div>
      <ul role="group">
        {arbol.reglas.map((r, i) => (
          <li key={r.id} style={{ animationDelay: `${0.15 + i * 0.25}s` }}>
            <div className={r.cf < 0 ? "nodo regla contra" : "nodo regla"} role="treeitem">
              <strong>{r.id}</strong> <small>CF {r.cf_texto}</small>
              <span>{r.si}</span>
            </div>
            <ul role="group">
              {r.datos.map((d, j) => (
                <li key={d.attr} style={{ animationDelay: `${0.3 + i * 0.25 + j * 0.1}s` }}>
                  <div className="nodo dato" role="treeitem">
                    <strong>
                      {d.attr} = {d.valor_texto}
                    </strong>
                    <small> ← pregunta {d.pregunta}</small>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Dialogo({ lineas, desde = 0 }) {
  if (!lineas.length) return null;
  return (
    <ol className="chat" aria-label="La conversación">
      {lineas.map((l, i) => (
        <li key={`${l.evento}-${l.quien}-${i}`} className={`burbuja ${l.quien} ${l.evento > desde ? "nuevo" : ""}`}>
          <span className="quien">
            {l.quien === "sistema" ? "Sistema" : l.quien === "persona" ? "Persona" : `WHY ${l.nivel}`}
          </span>
          {l.texto}
        </li>
      ))}
    </ol>
  );
}
