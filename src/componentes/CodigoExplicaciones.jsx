import { useState } from "react";

export default function CodigoExplicaciones({ codigo }) {
  const [completo, setCompleto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    navigator.clipboard.writeText(codigo.completo).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <article className="taller codigo-completo">
      <p className="kicker">Repaso · el código en Python</p>
      <h2>El subsistema completo</h2>
      <p className="hace">
        Este es el archivo <code>{codigo.archivo}</code> que corre el motor de esta página. Está ordenado por
        algoritmo, de la A a la G. ConsultaExplicable hereda de la Consulta de la sesión pasada: decide igual y,
        además, anota.
      </p>

      <nav className="chips indice-codigo" aria-label="Algoritmos">
        {codigo.secciones.map((s, i) => (
          <a key={s.titulo} className="chip" href={`#algoritmo-${i}`}>
            <span className="letra">{s.letra}</span> {s.titulo}
          </a>
        ))}
      </nav>

      {codigo.secciones.map((s, i) => (
        <section key={s.titulo} id={`algoritmo-${i}`} className="seccion-codigo">
          <h3>
            <span className="letra">{s.letra}</span> {s.titulo}
          </h3>
          <p>{s.texto}</p>
          <pre className="codigo">
            <code>{s.codigo}</code>
          </pre>
        </section>
      ))}

      <div className="acciones">
        <button type="button" className="btn btn-secundario" aria-expanded={completo} onClick={() => setCompleto((v) => !v)}>
          {completo ? "Ocultar el archivo completo" : "Ver el archivo completo"}
        </button>
        <button type="button" className="btn btn-principal" onClick={copiar}>
          {copiado ? "Copiado" : "Copiar el archivo"}
        </button>
      </div>
      {completo && (
        <pre className="codigo">
          <code>{codigo.completo}</code>
        </pre>
      )}
      <p className="nota-chica">
        Para correrlo en Colab también se necesitan consultas.py, reglas.py, certeza.py y politicas.py, del
        recorrido de consultas.
      </p>
    </article>
  );
}
