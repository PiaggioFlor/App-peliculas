import { buscarPeliculas, obtenerDetalle } from "./api.js";

let peliculaActual = null;

// Navegación entre secciones
window.mostrarSeccion = function(id) {
  document.querySelectorAll("section").forEach(sec => {
    sec.style.display = "none";
  });

  document.getElementById(id).style.display = "block";
  if (id === "historial") {
    mostrarHistorial(); 
  }

  if (id === "favoritos") {
  mostrarFavoritos();
}
};

// Buscar películas
window.buscar = async function() {
  const texto = document.getElementById("inputBusqueda").value;

  if (!texto) return;

  const peliculas = await buscarPeliculas(texto);

  mostrarResultados(peliculas);
};

// Mostrar resultados
function mostrarResultados(peliculas) {
  const contenedor = document.getElementById("resultados");
  contenedor.innerHTML = "";

  if (!peliculas || peliculas.length === 0) {
    contenedor.innerHTML = "<p>No se encontraron resultados</p>";
    return;
  }

  peliculas.forEach(peli => {
    contenedor.innerHTML += `
      <div class="card" onclick="verDetalle('${peli.imdbID}')">
        <h3>${peli.Title}</h3>
        <img src="${peli.Poster !== "N/A" ? peli.Poster : ""}" width="150">
        <p>${peli.Year}</p>
      </div>
    `;
  });
}

// Ver detalle
window.verDetalle = async function(id) {
  const peli = await obtenerDetalle(id);

  peliculaActual = peli;
  guardarHistorial(peli);  //guarda en historial

  mostrarDetalle(peli);
  mostrarSeccion("detalle");
};

// Mostrar detalle
function mostrarDetalle(peli) {
  const contenedor = document.getElementById("detalleContenido");

  contenedor.innerHTML = `
    <h2>${peli.Title}</h2>
    <img src="${peli.Poster}" width="200">
    <p><strong>Año:</strong> ${peli.Year}</p>
    <p><strong>Género:</strong> ${peli.Genre}</p>
    <p><strong>Duración:</strong> ${peli.Runtime}</p>
    <p><strong>Actores:</strong> ${peli.Actors}</p>
    <p><strong>Director:</strong> ${peli.Director}</p>
    <p><strong>Rating:</strong> ⭐ ${peli.imdbRating}</p>
    <p>${peli.Plot}</p>

    <button onclick="abrirFormulario()">❤️ Agregar a favoritos</button>
    <button onclick="mostrarSeccion('busqueda')">⬅ Volver</button>
  `;
}

//Guardar en historial
function guardarHistorial(peli) {
  let historial = JSON.parse(localStorage.getItem("historial")) || [];

  // evitar duplicados 
  historial = historial.filter(item => item.imdbID !== peli.imdbID);

  historial.unshift({
    Title: peli.Title,
    Poster: peli.Poster,
    imdbID: peli.imdbID
  });

  localStorage.setItem("historial", JSON.stringify(historial));
}

//Mostrar historial
function mostrarHistorial() {
  const contenedor = document.getElementById("listaHistorial");
  let historial = JSON.parse(localStorage.getItem("historial")) || [];

  contenedor.innerHTML = "";

  if (historial.length === 0) {
    contenedor.innerHTML = "<p>No hay historial aún</p>";
    return;
  }

  historial.forEach(peli => {
    contenedor.innerHTML += `
      <div class="card" onclick="verDetalle('${peli.imdbID}')">
        <h3>${peli.Title}</h3>
        <img src="${peli.Poster}" width="120">
      </div>
    `;
  });
}

//abrir y cerrrar formulario
window.abrirFormulario = function() {
  document.getElementById("formFavorito").style.display = "block";
};

window.cerrarFormulario = function() {
  document.getElementById("formFavorito").style.display = "none";
};

//guardar en favs
window.guardarFavorito = function() {
  const prioridad = document.getElementById("prioridad").value;
  const categoria = document.getElementById("categoria").value;
  const nota = document.getElementById("nota").value;

  if (!prioridad || prioridad <= 0) {
    alert("La prioridad es obligatoria");
    return;
  }

  let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

  favoritos.push({
    Title: peliculaActual.Title,
    Poster: peliculaActual.Poster,
    imdbID: peliculaActual.imdbID,
    prioridad: prioridad,
    categoria: categoria,
    nota: nota
  });

  localStorage.setItem("favoritos", JSON.stringify(favoritos));

  cerrarFormulario();
  alert("Agregado a favoritos ❤️");
};

//mostrar favs
function mostrarFavoritos() {
  const contenedor = document.getElementById("listaFavoritos");
  let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

  contenedor.innerHTML = "";

  if (favoritos.length === 0) {
    contenedor.innerHTML = "<p>No hay favoritos</p>";
    return;
  }

  favoritos.forEach(peli => {
    contenedor.innerHTML += `
      <div class="card">
        <h3>${peli.Title}</h3>
        <img src="${peli.Poster}" width="120">
        <p>Prioridad: ${peli.prioridad}</p>
        <p>Categoría: ${peli.categoria}</p>
        <p>${peli.nota || ""}</p>

        <button onclick="eliminarFavorito('${peli.imdbID}')"> Eliminar</button>
      </div>
    `;
  });
}

//funcion eliminar
window.eliminarFavorito = function(id) {
  let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

  favoritos = favoritos.filter(peli => peli.imdbID !== id);

  localStorage.setItem("favoritos", JSON.stringify(favoritos));

  mostrarFavoritos(); // refresca la lista
};