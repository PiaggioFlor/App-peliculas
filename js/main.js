// =====================
//  main.js
//  Lógica de UI y navegación
// =====================

import { buscarPeliculas, obtenerDetalle, buscarTodasLasPeliculas } from "./api.js";
import {
  guardarHistorial,
  obtenerHistorial,
  obtenerFavoritos,
  guardarFavoritoEnStorage,
  eliminarFavoritoDeStorage,
} from "./storage.js";

let peliculaActual = null;

// =====================
//  NAVEGACIÓN
// =====================

window.mostrarSeccion = function (id) {
  document.querySelectorAll("section").forEach(sec => {
    sec.style.display = "none";
  });

  document.getElementById(id).style.display = "block";

  if (id === "historial") mostrarHistorial();
  if (id === "favoritos") mostrarFavoritos();
};

// =====================
//  BÚSQUEDA
// =====================

window.buscar = async function () {
  const texto = document.getElementById("inputBusqueda").value;
  if (!texto) return;

  const peliculas = await buscarPeliculas(texto);
  mostrarResultados(peliculas);
};

window.cargarTodasLasPeliculas = async function () {
  const peliculas = await buscarTodasLasPeliculas();
  mostrarResultadosEnHome(peliculas);
};

// =====================
//  RENDER: RESULTADOS
// =====================

function mostrarResultadosEnHome(peliculas) {
  const contenedor = document.getElementById("home");
  contenedor.innerHTML = "";

  if (!peliculas || peliculas.length === 0) {
    contenedor.innerHTML = "<p>No se encontraron resultados</p>";
    return;
  }

  peliculas.forEach(peli => {
    contenedor.innerHTML += crearCardHTML(peli);
  });
}

function mostrarResultados(peliculas) {
  const contenedor = document.getElementById("resultados");
  contenedor.innerHTML = "";

  if (!peliculas || peliculas.length === 0) {
    contenedor.innerHTML = "<p>No se encontraron resultados</p>";
    return;
  }

  peliculas.forEach(peli => {
    contenedor.innerHTML += crearCardHTML(peli);
  });
}

// Reutilizable para home y resultados
function crearCardHTML(peli) {
  return `
    <div class="card" onclick="verDetalle('${peli.imdbID}')">
      <h3>${peli.Title}</h3>
      <img src="${peli.Poster !== "N/A" ? peli.Poster : ""}" width="150">
      <p>${peli.Year}</p>
    </div>
  `;
}

// =====================
//  DETALLE
// =====================

window.verDetalle = async function (id) {
  const peli = await obtenerDetalle(id);

  peliculaActual = peli;
  guardarHistorial(peli);

  mostrarDetalle(peli);
  mostrarSeccion("detalle");
};

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

// =====================
//  HISTORIAL
// =====================

function mostrarHistorial() {
  const contenedor = document.getElementById("listaHistorial");
  const historial = obtenerHistorial();

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

// =====================
//  FAVORITOS
// =====================

window.abrirFormulario = function () {
  document.getElementById("formFavorito").style.display = "block";
};

window.cerrarFormulario = function () {
  document.getElementById("formFavorito").style.display = "none";
};

window.guardarFavorito = function () {
  const prioridad = document.getElementById("prioridad").value;
  const categoria = document.getElementById("categoria").value;
  const nota = document.getElementById("nota").value;

  if (!prioridad || prioridad <= 0) {
    alert("La prioridad es obligatoria");
    return;
  }

  guardarFavoritoEnStorage(peliculaActual, { prioridad, categoria, nota });

  cerrarFormulario();
  alert("Agregado a favoritos ❤️");
};

function mostrarFavoritos() {
  const contenedor = document.getElementById("listaFavoritos");
  const favoritos = obtenerFavoritos();

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
        <button onclick="eliminarFavorito('${peli.imdbID}')">Eliminar</button>
      </div>
    `;
  });
}

window.eliminarFavorito = function (id) {
  eliminarFavoritoDeStorage(id);
  mostrarFavoritos();
};

// =====================
//  INIT
// =====================

window.onload = function () {
  cargarTodasLasPeliculas();
};