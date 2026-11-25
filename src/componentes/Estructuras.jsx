import { ESTRUCTURAS, TIPOS } from "../consultas/contenido";

export default function Estructuras({
  guia,
  elegidas,
  onElegir,
  onSeguir,
  textos = ESTRUCTURAS,
  tipos = TIPOS,
  parte = "del subsistema",
}) {
  const { items, caso } = guia.estructuras;
  const listas = items.filter((item) => elegidas[item.id] === item.tipo).length;

  return (
    <article className="taller estructuras">
      <p className="kicker">Las estructuras de Python</p>
      <h2>¿Qué estructura guarda cada cosa?</h2>
      <p className="hace">
        Así quedó la consulta de {caso.nombre} al final. Para cada parte {parte}, elige la
        estructura que usa el código. Al acertar aparece su valor real y por qué se eligió.
      </p>
      <p className="progreso">
        {listas} de {items.length}
      </p>

      <ol className="estructuras-lista">
        {items.map((item) => {
          const texto = textos[item.id];
          const elegida = elegidas[item.id];
          const bien = elegida === item.tipo;
          const clase = ["estructura", bien ? "bien" : "", elegida && !bien ? "mal" : ""]
            .filter(Boolean)
            .join(" ");
          return (
            <li key={item.id} className={clase}>
              <div className="estructura-cabeza">
                <code>{item.nombre}</code>
                <span>{texto.que}</span>
              </div>
              <div className="segmento tipos" role="group" aria-label={`Estructura de ${item.nombre}`}>
                {tipos.map((tipo) => (
                  <button
                    key={tipo.id}
                    type="button"
                    aria-pressed={elegida === tipo.id}
                    disabled={bien}
                    onClick={() => onElegir(item.id, tipo.id)}
                  >
                    {tipo.texto}
                  </button>
                ))}
              </div>
              {elegida && !bien && <p className="fallo">No es {elegida}. Piensa cómo se usa en el código.</p>}
              {bien && (
                <div className="estructura-valor">
                  <pre className="codigo">{`${item.nombre}  # ${item.tipo}\n${item.valor}`}</pre>
                  <p>{texto.porque}</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {listas === items.length && (
        <>
          <p className="exito">
            Las {items.length} estructuras están en su lugar. Ahora se arman los métodos que las usan.
          </p>
          <button type="button" className="btn btn-principal" onClick={onSeguir}>
            Ir a la primera pieza
          </button>
        </>
      )}
    </article>
  );
}
