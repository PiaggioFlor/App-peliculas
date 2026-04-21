// =====================
//  Card.js
//  Genera el HTML de cada card de película
// =====================

export function crearCardHTML(peli, esFavorito = false) {
  const poster = peli.Poster && peli.Poster !== "N/A"
    ? peli.Poster
    : "https://via.placeholder.com/140x200/1a2236/457b9d?text=Sin+imagen";

  if (esFavorito) {
    // ── Card favorito: imagen + info con botón siempre al fondo ──
    return `
      <div class="card card--fav" onclick="verDetalle('${peli.imdbID}')">
        <img src="${poster}" alt="${peli.Title}" loading="lazy">
        <div class="card-info">

          <div class="card-info-top">
            <div class="card-title">${peli.Title}</div>
            <div class="card-year">${peli.Year ?? ""}</div>
            <hr class="card-divider">
            <div class="card-meta">
              ${peli.categoria ? `<span class="badge-cat">${peli.categoria}</span>` : ""}
              ${peli.prioridad ? `<span class="badge-prio">★ ${peli.prioridad}/10</span>` : ""}
            </div>
            ${peli.nota ? `<div class="card-nota">"${peli.nota}"</div>` : ""}
          </div>

          <button
            class="btn-eliminar"
            onclick="event.stopPropagation(); eliminarFavorito('${peli.imdbID}')"
          >
            🗑 Eliminar
          </button>

        </div>
      </div>
    `;
  }

  // ── Card común ──
  return `
  <div class="card" onclick="verDetalle('${peli.imdbID}')">
    <img src="${poster}" alt="${peli.Title}" loading="lazy">
    <div class="card-info">
      <div class="card-title">${peli.Title}</div>
      <div class="card-year">${peli.Year ?? ""}</div>
    </div>
  </div>
`;
}