export function cargarCasos() {
  return fetch("/api/casos").then(async (respuesta) => {
    if (!respuesta.ok) throw new Error("El motor no entregó los pedidos.");
    return respuesta.json();
  });
}

export function cargarGuiaConsultas() {
  return fetch("/api/consultas/guia").then(async (respuesta) => {
    if (!respuesta.ok) throw new Error("El motor no entregó la guía de consultas.");
    return respuesta.json();
  });
}

export function pasoConsulta(respuestas, signal) {
  return fetch("/api/consultas/paso", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ respuestas }),
  }).then(async (respuesta) => {
    if (!respuesta.ok) throw new Error("El motor no pudo seguir la consulta.");
    return respuesta.json();
  });
}

export function cargarGuiaExplicaciones() {
  return fetch("/api/explicaciones/guia").then(async (respuesta) => {
    if (!respuesta.ok) throw new Error("El motor no entregó la guía de explicaciones.");
    return respuesta.json();
  });
}

export function pasoExplicacion(pasos, signal) {
  return fetch("/api/explicaciones/paso", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pasos }),
  }).then(async (respuesta) => {
    if (!respuesta.ok) throw new Error("El motor no pudo seguir la explicación.");
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
