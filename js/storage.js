// js/storage.js

export function obtenerHistorial() {
  return JSON.parse(localStorage.getItem("historial") || "[]");
}

export function obtenerFavoritos() {
  return JSON.parse(localStorage.getItem("favoritos") || "[]");
}

export function guardarHistorial(peli) {
  let h = obtenerHistorial();
  h = h.filter(p => p.id !== peli.id);
  h.unshift(peli);
  h = h.slice(0, 20);
  localStorage.setItem("historial", JSON.stringify(h));
}

export function guardarFavoritoEnStorage(peli, extras) {
  const favs = obtenerFavoritos().filter(p => p.id !== peli.id);
  favs.push({ ...peli, ...extras });
  localStorage.setItem("favoritos", JSON.stringify(favs));
}

export function eliminarFavoritoDeStorage(id) {
  const favs = obtenerFavoritos().filter(p => p.id !== id);
  localStorage.setItem("favoritos", JSON.stringify(favs));
}