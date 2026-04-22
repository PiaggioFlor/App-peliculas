// =====================
//  main.js
// =====================

import { buscarPeliculas, obtenerDetalle, obtenerPopulares, buscarSeries } from "./api.js";
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
let filtroActivo = "todos";

// =====================
// NAVEGACIÓN
// =====================

window.mostrarSeccion = function (id) {
  document.querySelectorAll("section").forEach(sec =>
    sec.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn =>
    btn.classList.remove("active")
  );
  document.getElementById("nav-" + id)?.classList.add("active");

  document.querySelectorAll(".sidebar-nav-item").forEach(item =>
    item.classList.remove("active")
  );
  document.getElementById("snav-" + id)?.classList.add("active");

  if (id !== "detalle") seccionAnterior = id;

  if (id === "home") renderHome();
  if (id === "historial") mostrarHistorial();
  if (id === "favoritos") mostrarFavoritos();
  if (id === "busqueda") mostrarHistorialEnBusqueda();
};

window.volverAtras = () => mostrarSeccion(seccionAnterior);

// =====================
// TOAST
// =====================

window.mostrarToast = function (msg, tipo = "info") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show toast--" + tipo;
  setTimeout(() => {
    t.classList.remove("show");
  }, 2500);
};

// =====================
// BÚSQUEDA Y FILTROS
// =====================

window.buscar = async function () {
  const texto = document.getElementById("inputBusqueda").value.trim();
  if (!texto) return;

  document.getElementById("labelResultados").textContent = `Resultados para "${texto}"`;

  const spinner = document.getElementById("resultados");
  spinner.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Buscando...</p></div>`;

  let pelis = await buscarPeliculas(texto);

  if (filtroActivo === "peliculas") {
    pelis = pelis.filter(p => p.release_date);
  } else if (filtroActivo === "series") {
    pelis = pelis.filter(p => !p.release_date);
  }

  renderResultados(pelis, texto);
};

window.setFiltro = function (filtro, el) {
  filtroActivo = filtro;
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  el.classList.add("active");

  const texto = document.getElementById("inputBusqueda").value.trim();
  if (texto) buscar();
};

function renderResultados(pelis, query) {
  const cont = document.getElementById("resultados");
  cont.innerHTML = "";

  if (!pelis?.length) {
    cont.innerHTML = emptyStateHTML(
      "🔍",
      `Sin resultados para "${query}"`,
      "Probá con otro título o término de búsqueda."
    );
    return;
  }

  cont.innerHTML = pelis.map(p => crearCardHTML(p)).join("");
}

// =====================
// HOME
// =====================

async function renderHome() {
  renderCarrusel("scrollRecomendados", null, false, true);
  renderCarrusel("scrollFavoritos", obtenerFavoritos(), true);
  renderCarrusel("scrollHistorial", obtenerHistorial());

  const recos = await obtenerPopulares();
  renderCarrusel("scrollRecomendados", recos);
}

function renderCarrusel(id, pelis, esFav = false, loading = false) {
  const cont = document.getElementById(id);
  if (!cont) return;

  if (loading) {
    cont.innerHTML = `<div class="carousel-loading"><div class="spinner"></div></div>`;
    return;
  }

  if (!pelis?.length) {
    cont.innerHTML = `<div class="carousel-empty">Sin contenido aún</div>`;
    return;
  }

  cont.innerHTML = pelis.map(p => crearCardHTML(p, esFav)).join("");
}

// =====================
// DETALLE
// =====================

window.verDetalle = async function (id) {
  const activa = document.querySelector("section.active");
  if (activa && activa.id !== "detalle") seccionAnterior = activa.id;

  mostrarSeccion("detalle");

  const cont = document.getElementById("detalleContenido");
  cont.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>`;

  const peli = await obtenerDetalle(id);
  if (!peli) {
    cont.innerHTML = emptyStateHTML("⚠️", "No se pudo cargar", "Intentá de nuevo más tarde.");
    return;
  }

  peliculaActual = peli;
  guardarHistorial(peli);

  renderDetalle(peli);
};

function renderDetalle(p) {
  const poster = p.poster_path
    ? `https://image.tmdb.org/t/p/w780${p.poster_path}`
    : null;

  const rating = p.vote_average ? p.vote_average.toFixed(1) : "—";
  const year = (p.release_date || "").slice(0, 4);

  const esFav = obtenerFavoritos().some(f => f.id === p.id);

  const heroHTML = poster
    ? `<img src="${poster}" class="detalle-img" alt="${p.title}" loading="lazy">`
    : `<div class="detalle-img-fallback"><span>🎬</span></div>`;

  document.getElementById("detalleContenido").innerHTML = `
    <div class="detalle-container">
      <div class="detalle-hero">
        ${heroHTML}
        <div class="detalle-hero-overlay"></div>
        <div class="detalle-hero-rating">★ ${rating}</div>
      </div>

      <div class="detalle-info">
        <h1 class="detalle-title">${p.title}</h1>

        <div class="detalle-meta">
          ${year ? `<span class="tag">${year}</span>` : ""}
          ${p.runtime ? `<span class="tag">${p.runtime} min</span>` : ""}
          ${p.genre ? p.genre.split(", ").map(g => `<span class="tag">${g}</span>`).join("") : ""}
        </div>

        <p class="detalle-plot">${p.overview || "Sin sinopsis disponible."}</p>

        <div class="detalle-rows">
          ${detalleRow("Director", p.director)}
          ${detalleRow("Actores", p.actors)}
        </div>

        <button
          class="btn-fav ${esFav ? "btn-fav--active" : ""}"
          onclick="toggleFavorito()"
          id="btnFav"
        >
          ${esFav ? "✓ En favoritos" : "❤ Agregar a favoritos"}
        </button>
      </div>
    </div>
  `;
}

function detalleRow(label, valor) {
  if (!valor || valor === "No disponible") return "";
  return `
    <div class="detalle-row">
      <span class="detalle-row-label">${label}</span>
      <span class="detalle-row-valor">${valor}</span>
    </div>
  `;
}

// =====================
// HISTORIAL
// =====================

function mostrarHistorial() {
  const h = obtenerHistorial();
  const cont = document.getElementById("listaHistorial");

  if (!h.length) {
    cont.innerHTML = emptyStateHTML("🕐", "Sin historial", "Las películas que veas aparecerán acá.");
    return;
  }

  cont.innerHTML = h.map(p => crearCardHTML(p)).join("");
}

function mostrarHistorialEnBusqueda() {
  const inputVacio = document.getElementById("inputBusqueda").value.trim() === "";
  if (!inputVacio) return;

  const h = obtenerHistorial();
  document.getElementById("labelResultados").textContent = "Visto recientemente";

  const cont = document.getElementById("resultados");

  if (!h.length) {
    cont.innerHTML = emptyStateHTML("🎬", "Nada por acá", "Buscá una película o serie para empezar.");
    return;
  }

  cont.innerHTML = h.map(p => crearCardHTML(p)).join("");
}

// =====================
// FAVORITOS
// =====================

window.toggleFavorito = function () {
  if (!peliculaActual) return;
  const esFav = obtenerFavoritos().some(f => f.id === peliculaActual.id);

  if (esFav) {
    eliminarFavoritoDeStorage(peliculaActual.id);
    mostrarToast("Eliminado de favoritos", "error");
    actualizarBtnFav(false);
  } else {
    abrirFormulario();
  }
};

function actualizarBtnFav(esFav) {
  const btn = document.getElementById("btnFav");
  if (!btn) return;
  btn.className = "btn-fav " + (esFav ? "btn-fav--active" : "");
  btn.textContent = esFav ? "✓ En favoritos" : "❤ Agregar a favoritos";
}

window.abrirFormulario = () =>
  document.getElementById("formFavorito").classList.add("open");

window.cerrarFormulario = () =>
  document.getElementById("formFavorito").classList.remove("open");

window.guardarFavorito = function () {
  const prioridad = document.getElementById("prioridad").value;
  const categoria = document.getElementById("categoria").value;
  const nota = document.getElementById("nota").value;

  if (!prioridad) {
    mostrarToast("Ingresá una prioridad", "error");
    return;
  }

  const existe = obtenerFavoritos().find(f => f.id === peliculaActual.id);
  if (existe) {
    mostrarToast("Ya está en favoritos", "info");
    cerrarFormulario();
    return;
  }

  guardarFavoritoEnStorage(peliculaActual, { prioridad, categoria, nota });
  cerrarFormulario();
  mostrarToast("Guardado en favoritos ❤", "success");
  actualizarBtnFav(true);

  // Limpiar campos
  document.getElementById("prioridad").value = "";
  document.getElementById("categoria").value = "";
  document.getElementById("nota").value = "";
};

function mostrarFavoritos() {
  const f = obtenerFavoritos();
  const cont = document.getElementById("listaFavoritos");

  if (!f.length) {
    cont.innerHTML = emptyStateHTML(
      "❤",
      "Sin favoritos aún",
      "Buscá una película y guardala con el botón ❤.",
      "Ir a buscar",
      "mostrarSeccion('busqueda')"
    );
    return;
  }

  cont.innerHTML = f.map(p => crearCardHTML(p, true)).join("");
}

window.eliminarFavorito = function (id) {
  eliminarFavoritoDeStorage(id);
  mostrarToast("Eliminado de favoritos", "error");
  mostrarFavoritos();
  if (peliculaActual?.id === id) actualizarBtnFav(false);
};

// =====================
// HELPERS
// =====================

function emptyStateHTML(icon, titulo, subtitulo, btnLabel = null, btnAction = null) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <h4 class="empty-title">${titulo}</h4>
      <p class="empty-text">${subtitulo}</p>
      ${btnLabel ? `<button class="empty-btn" onclick="${btnAction}">${btnLabel}</button>` : ""}
    </div>
  `;
}

// =====================
// INIT
// =====================

window.onload = () => mostrarSeccion("home");