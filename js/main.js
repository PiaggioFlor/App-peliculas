// =====================
//  main.js
//  Lógica de UI y navegación
// =====================

import { buscarPeliculas, obtenerDetalle, buscarTodasLasPeliculas } from "./api.js";
import { crearCardHTML } from "../Components/Card.js";
import {
  guardarHistorial,
  obtenerHistorial,
  obtenerFavoritos,
  guardarFavoritoEnStorage,
  eliminarFavoritoDeStorage,
} from "./storage.js";

let peliculaActual = null;
let seccionAnterior = "home";

// =====================
//  NAVEGACIÓN
// =====================

window.mostrarSeccion = function (id) {
  // Ocultar todas las secciones
  document.querySelectorAll("section").forEach(sec => {
    sec.classList.remove("active");
  });

  // Mostrar la sección pedida
  document.getElementById(id).classList.add("active");

  // Actualizar nav inferior
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  const navBtn = document.getElementById("nav-" + id);
  if (navBtn) navBtn.classList.add("active");

  // Guardar sección anterior (para el botón volver del detalle)
  if (id !== "detalle") seccionAnterior = id;

  // Renders específicos por sección
  if (id === "historial") mostrarHistorial();
  if (id === "favoritos") mostrarFavoritos();
  if (id === "home")      renderHomeSections();
  if (id === "busqueda")  mostrarHistorialEnBusqueda();
};

window.volverAtras = function () {
  mostrarSeccion(seccionAnterior);
};

// =====================
//  TOAST (reemplaza alert)
// =====================

window.mostrarToast = function (mensaje) {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
};

// =====================
//  BÚSQUEDA
// =====================

window.buscar = async function() {
  const texto = document.getElementById("inputBusqueda").value;

  if (!texto) return;

  const peliculas = await buscarPeliculas(texto);

  // 👇 CAMBIAR TEXTO
  const label = document.getElementById("labelResultados");
  label.textContent = "Resultados de búsqueda";

  mostrarResultados(peliculas);
};

// =====================
//  RENDER: RESULTADOS DE BÚSQUEDA
// =====================

function mostrarResultados(peliculas, query = "") {
  const contenedor = document.getElementById("resultados");
  contenedor.innerHTML = "";

  if (!peliculas || peliculas.length === 0) {
    contenedor.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎬</div>
        <div class="empty-text">Sin resultados para "${query}"</div>
      </div>`;
    return;
  }

  contenedor.innerHTML = peliculas.map(peli => crearCardHTML(peli)).join("");
}

// =====================
//  RENDER: CARRUSELES DEL HOME
// =====================

async function renderHomeSections() {
  // Recomendados — carga desde la API
  const recos = await buscarTodasLasPeliculas();
  renderCarrusel("scrollRecomendados", recos);

  // Favoritos e historial desde localStorage
  renderCarrusel("scrollFavoritos",  obtenerFavoritos(), true);
  renderCarrusel("scrollHistorial",  obtenerHistorial());
}

function renderCarrusel(contenedorId, peliculas, esFav = false) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!peliculas || peliculas.length === 0) {
    contenedor.innerHTML = `<div style="padding:8px 0;color:var(--muted);font-size:13px">Sin elementos aún</div>`;
    return;
  }

  contenedor.innerHTML = peliculas.map(peli => crearCardHTML(peli, esFav)).join("");
}

// =====================
//  DETALLE
// =====================

window.verDetalle = async function (id) {
  // Guardamos desde qué sección venimos
  const activa = document.querySelector("section.active");
  if (activa && activa.id !== "detalle") seccionAnterior = activa.id;

  mostrarSeccion("detalle");

  // Mostrar loader mientras carga
  document.getElementById("detalleContenido").innerHTML = `
    <div class="empty-state">
      <div class="empty-text">Cargando...</div>
    </div>`;

  const peli = await obtenerDetalle(id);
  if (!peli) {
    document.getElementById("detalleContenido").innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-text">No se pudo cargar la película</div>
      </div>`;
    return;
  }

  peliculaActual = peli;
  guardarHistorial(peli);
  mostrarDetalle(peli);
};

function mostrarDetalle(peli) {
  const poster = peli.Poster && peli.Poster !== "N/A"
    ? peli.Poster
    : "https://via.placeholder.com/390x280/1a2236/457b9d?text=Sin+imagen";

  document.getElementById("detalleContenido").innerHTML = `
    <div class="detalle-hero">
      <img src="${poster}" alt="${peli.Title}">
      <div class="detalle-hero-overlay"></div>
    </div>

    <div class="detalle-body">
      <div class="detalle-title">${peli.Title}</div>

      <div class="detalle-meta">
        <span class="tag">${peli.Year ?? "—"}</span>
        <span class="tag">${peli.Runtime ?? "—"}</span>
        <span class="tag">${peli.Rated ?? "—"}</span>
        <span class="rating">⭐ ${peli.imdbRating ?? "—"}</span>
      </div>

      <p class="detalle-plot">${peli.Plot ?? "Sin sinopsis disponible."}</p>

      <div class="detalle-row">
        <span>Director</span>
        <span>${peli.Director ?? "—"}</span>
      </div>
      <div class="detalle-row">
        <span>Actores</span>
        <span>${peli.Actors ?? "—"}</span>
      </div>
      <div class="detalle-row">
        <span>Género</span>
        <span>${peli.Genre ?? "—"}</span>
      </div>

      <button class="btn-fav" onclick="abrirFormulario()">❤️ Agregar a favoritos</button>
    </div>
  `;
}

function mostrarHistorialEnBusqueda() {
  const historial = obtenerHistorial();
  const contenedor = document.getElementById("resultados");

  const inputVacio = document.getElementById("inputBusqueda").value.trim() === "";
  if (!inputVacio) return;

  contenedor.innerHTML = "";

  if (!historial.length) {
    contenedor.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🕐</div>
        <div class="empty-text">Buscá una película para empezar</div>
      </div>`;
    return;
  }

  historial.forEach(peli => {
    contenedor.insertAdjacentHTML("beforeend", crearCardHTML(peli));
  });
}

// =====================
//  HISTORIAL
// =====================

function mostrarHistorial() {
  const contenedor = document.getElementById("listaHistorial");
  const historial = obtenerHistorial();

  if (!historial.length) {
    contenedor.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🕐</div>
        <div class="empty-text">Aún no viste ninguna película</div>
      </div>`;
    return;
  }

  contenedor.innerHTML = historial.map(peli => crearCardHTML(peli)).join("");
}

// =====================
//  FAVORITOS
// =====================

window.abrirFormulario = function () {
  document.getElementById("formFavorito").classList.add("open");
};

window.cerrarFormulario = function () {
  document.getElementById("formFavorito").classList.remove("open");
};

window.guardarFavorito = function () {
  const prioridad = document.getElementById("prioridad").value;
  const categoria = document.getElementById("categoria").value;
  const nota     = document.getElementById("nota").value;

  if (!prioridad || prioridad <= 0) {
    mostrarToast("⚠️ La prioridad es obligatoria");
    return;
  }

  // Evitar duplicados
  const yaGuardado = obtenerFavoritos().find(f => f.imdbID === peliculaActual.imdbID);
  if (yaGuardado) {
    mostrarToast("Ya está en favoritos");
    cerrarFormulario();
    return;
  }

  guardarFavoritoEnStorage(peliculaActual, { prioridad, categoria, nota });
  cerrarFormulario();
  mostrarToast("¡Agregado a favoritos ❤️!");
};

function mostrarFavoritos() {
  const contenedor = document.getElementById("listaFavoritos");
  const favoritos  = obtenerFavoritos();

  if (!favoritos.length) {
    contenedor.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❤️</div>
        <div class="empty-text">No tenés favoritos aún</div>
      </div>`;
    return;
  }

  contenedor.innerHTML = favoritos.map(peli => crearCardHTML(peli, true)).join("");
}

window.eliminarFavorito = function (id) {
  eliminarFavoritoDeStorage(id);
  mostrarFavoritos();
  mostrarToast("Eliminado de favoritos");
};

// =====================
//  INIT
// =====================

window.onload = function () {
  mostrarSeccion("home");
};