export function cargarCasos() {
  return fetch("/api/casos").then(async (respuesta) => {
    if (!respuesta.ok) throw new Error("El motor no entregó los pedidos.");
    return respuesta.json();
  });
}

export function inspeccionar(caso, hechos, signal) {
  return fetch("/api/inspeccionar", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caso, hechos }),
  }).then(async (respuesta) => {
    if (!respuesta.ok) throw new Error("El motor no pudo revisar este pedido.");
    return respuesta.json();
  });
}
