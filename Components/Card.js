export function crearCardHTML(peli, esFavorito = false) {
    console.log("hay un favorito", esFavorito);
    const poster = peli.Poster !== "N/A" ? peli.Poster : 'https://via.placeholder.com/150x220?text=Sin+Poster';
    
    // Usamos un template string para la estructura base
    let html = `
        <div class="card" onclick="verDetalle('${peli.imdbID}')">
            <img src="${poster}" alt="${peli.Title}">
            <div class="card-info">
                <h3>${peli.Title}</h3>
                <p>${peli.Year || ''}</p>
    `;

    // Si es para la sección de favoritos, agregamos info adicional y el botón eliminar
    if (esFavorito) {
        html += `
            <div class="favorito-detalles">
                <span class="tag">${peli.categoria}</span>
                <p>Prioridad: ${peli.prioridad}/5</p>
                ${peli.nota ? `<p class="nota">"${peli.nota}"</p>` : ''}
            </div>
            <button class="btn-eliminar" onclick="event.stopPropagation(); eliminarFavorito('${peli.imdbID}')">
                Eliminar
            </button>
        `;
    }

    html += `
            </div>
        </div>
    `;
    
    return html;
}