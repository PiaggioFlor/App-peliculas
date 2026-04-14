// =====================
//  storage.js
//  Manejo de localStorage: historial y favoritos
// =====================

// --- HISTORIAL ---

export function guardarHistorial(peli) {
  let historial = JSON.parse(localStorage.getItem("historial")) || [];

  // Evitar duplicados
  historial = historial.filter(item => item.imdbID !== peli.imdbID);

  historial.unshift({
    Title: peli.Title,
    Poster: peli.Poster,
    imdbID: peli.imdbID,
  });

  localStorage.setItem("historial", JSON.stringify(historial));
}

export function obtenerHistorial() {
  return JSON.parse(localStorage.getItem("historial")) || [];
}

// --- FAVORITOS ---

export function obtenerFavoritos() {
  return JSON.parse(localStorage.getItem("favoritos")) || [];
}

export function guardarFavoritoEnStorage(peliculaActual, { prioridad, categoria, nota }) {
  const favoritos = obtenerFavoritos();

  favoritos.push({
    Title: peliculaActual.Title,
    Poster: peliculaActual.Poster,
    imdbID: peliculaActual.imdbID,
    prioridad,
    categoria,
    nota,
  });

  localStorage.setItem("favoritos", JSON.stringify(favoritos));
}

export function eliminarFavoritoDeStorage(id) {
  const favoritos = obtenerFavoritos().filter(peli => peli.imdbID !== id);
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
}