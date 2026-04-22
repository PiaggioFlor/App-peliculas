export function crearCardHTML(p, esFav = false) {
  const poster = p.poster_path
    ? `https://image.tmdb.org/t/p/w500${p.poster_path}`
    : null;

  const rating = p.vote_average ? p.vote_average.toFixed(1) : null;
  const year = (p.release_date || "").slice(0, 4);

  const posterHTML = poster
    ? `<img src="${poster}" alt="${p.title}" loading="lazy">`
    : `<div class="card-poster-fallback">
        <span class="card-fallback-icon">🎬</span>
        <span class="card-fallback-title">${p.title}</span>
       </div>`;

  if (esFav) {
    return `
      <div class="card card--fav" onclick="verDetalle(${p.id})">
        <div class="card-img-wrap">
          ${posterHTML}
          <div class="card-img-overlay"></div>
          <div class="card-badges">
            ${p.categoria ? `<span class="badge badge--cat">${p.categoria}</span>` : ""}
            ${p.prioridad ? `<span class="badge badge--prio">${p.prioridad}</span>` : ""}
          </div>
          ${rating ? `<div class="card-rating-chip">★ ${rating}</div>` : ""}
        </div>
        <div class="card-info">
          <p class="card-title">${p.title}</p>
          <p class="card-year">${year || "—"}</p>
          ${p.nota ? `<p class="card-nota">"${p.nota}"</p>` : ""}
          <button class="btn-eliminar" onclick="event.stopPropagation(); eliminarFavorito(${p.id})">
            Quitar de favoritos
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="card" onclick="verDetalle(${p.id})">
      <div class="card-img-wrap">
        ${posterHTML}
        <div class="card-img-overlay"></div>
        ${rating ? `<div class="card-rating-chip">★ ${rating}</div>` : ""}
        <div class="card-overlay-info">
          <p class="card-title">${p.title}</p>
          <p class="card-year">${year || "—"}</p>
        </div>
      </div>
    </div>
  `;
}