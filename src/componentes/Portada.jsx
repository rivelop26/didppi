export default function Portada({ onEntrar }) {
  return (
    <main className="portada">
      <div className="logo-marco">
        <img src="/didppi.png" alt="" />
      </div>
      <h1 className="sr-only">Didppi</h1>
      <p className="lead">
        Una herramienta para ver cómo se construye un motor de inferencia. El caso es un
        pedido a domicilio.
      </p>

      <section>
        <h2>Qué es esto</h2>
        <p>
          Didppi recorre, en orden, los métodos con los que un sistema experto mira un caso
          y escribe una decisión. Primero se ve el mapa completo. Después cada método se arma
          como una pieza, con su código en Python.
        </p>
      </section>

      <section>
        <h2>El sistema experto</h2>
        <p>
          Un restaurante recibe pedidos por una aplicación. Antes de empezar a preparar, revisa
          cuatro datos: si el pago está confirmado, qué tan lejos está el cliente, si está
          lloviendo y si el cliente pidió cancelar. Cada dato trae una certeza.
        </p>
        <p>
          Las políticas de la casa ya están escritas. Con ellas el motor decide si el pedido se
          prepara y sale, si se prepara y se espera un claro, si se cancela antes de empezar o
          si no se inicia porque queda fuera de zona.
        </p>
      </section>

      <section>
        <h2>Qué vamos a aprender</h2>
        <ol className="aprender">
          <li>En qué orden se llama a cada método, línea por línea, sin abrir todavía su interior.</li>
          <li>Qué hace cada línea de cargar, cf_condicion, cf_premisas, agenda, resolver, disparar y adelante.</li>
          <li>Cómo una certeza baja, dos reglas que concluyen lo mismo, o una que empuja en contra, cambian el pedido.</li>
        </ol>
      </section>

      <section>
        <h2>Cómo se recorre</h2>
        <p>
          El pedido vive en la comanda, al lado del código. Ahí se cambia el caso completo o un
          solo hecho: el valor y su certeza. El botón ? explica el método línea por línea. Si la
          cuenta no sale, Consultar el concepto afloja la pieza.
        </p>
      </section>

      <button type="button" className="btn btn-principal" onClick={onEntrar}>
        Entrar al recorrido
      </button>
    </main>
  );
}
