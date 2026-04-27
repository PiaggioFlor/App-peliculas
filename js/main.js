// js/main.js

import {
  buscarPeliculas,
  obtenerDetalle,
  getPeliculas2024Top,
  getSeriesTop,
  getPopularesHoy,
  getTopRated,
  descubrirPeliculas,
} from "./api.js";

import { crearCardHTML } from "../Components/Card.js";

import {
  guardarHistorial,
  obtenerHistorial,
  obtenerFavoritos,
  guardarFavoritoEnStorage,
  eliminarFavoritoDeStorage,
} from "./storage.js";

// =====================
// ESTADO GLOBAL
// =====================

let peliculaActual  = null;
let seccionAnterior = "home";
let filtroActivo    = "todos";
let filtroTipo      = "todos";
let filtroRating    = "";
let filtroAnio      = "";
let filtroOrden     = "";
let paginaActual    = 1;
let totalPaginas    = 1;
let ultimaBusqueda  = "";

// =====================
// NAVEGACIÓN
// =====================

window.mostrarSeccion = function (id) {
  document.querySelectorAll("section").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById("nav-" + id)?.classList.add("active");

  document.querySelectorAll(".sidebar-nav-item").forEach((i) => i.classList.remove("active"));
  document.getElementById("snav-" + id)?.classList.add("active");

  if (id !== "detalle") seccionAnterior = id;

  if (id === "home")      renderHome();
  if (id === "historial") mostrarHistorial();
  if (id === "favoritos") mostrarFavoritos();
  if (id === "busqueda")  mostrarHistorialEnBusqueda();
  if (id === "contacto")  iniciarMapa();
};

window.volverAtras = () => mostrarSeccion(seccionAnterior);

// =====================
// TOAST
// =====================

window.mostrarToast = function (msg, tipo = "info") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show toast--" + tipo;
  setTimeout(() => t.classList.remove("show"), 2500);
};

// =====================
// BÚSQUEDA
// =====================

window.buscar = async function (page = 1) {
  const texto = document.getElementById("inputBusqueda").value.trim();
  if (!texto) return;

  ultimaBusqueda = texto;
  paginaActual   = page;

  document.getElementById("labelResultados").textContent = `Resultados para "${texto}"`;

  const cont = document.getElementById("resultados");
  cont.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Buscando...</p></div>`;

  const tipoAPI = filtroTipo === "series" ? "tv" : "movie";

  const data = await descubrirPeliculas({
    query:  texto,
    page,
    tipo:   tipoAPI,
    rating: filtroRating,
    anio:   filtroAnio,
    orden:  filtroOrden,
  });

  totalPaginas = data.totalPaginas;
  renderResultados(data.resultados, texto);
  renderPaginacion();
};

window.setFiltro = function (filtro, el) {
  filtroActivo = filtro;
  filtroTipo   = filtro;
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
  const texto = document.getElementById("inputBusqueda").value.trim();
  if (texto) buscar();
};

window.setRating = function (val, el) {
  filtroRating = val;
  document.querySelectorAll(".chip-rating").forEach((c) => {
    if (c.closest(".rating-chips") === el.closest(".rating-chips"))
      c.classList.remove("active");
  });
  el.classList.add("active");
  if (ultimaBusqueda) buscar(1);
};

window.setOrden = function (val, el) {
  filtroOrden = val;
  document.querySelectorAll(".chip-rating").forEach((c) => {
    if (c.closest(".rating-chips") === el.closest(".rating-chips"))
      c.classList.remove("active");
  });
  el.classList.add("active");
  if (ultimaBusqueda) buscar(1);
};

window.aplicarFiltroAnio = function (val) {
  filtroAnio = String(val).trim();
  if (filtroAnio.length === 4 && ultimaBusqueda) buscar(1);
  if (filtroAnio === "") buscar(1);
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

  cont.innerHTML = pelis.map((p) => crearCardHTML(p)).join("");
}

// =====================
// CARRUSEL
// =====================

function renderCarrusel(containerId, items, esFav = false, loading = false) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  if (loading) {
    cont.innerHTML = `<div class="carousel-loading"><div class="spinner"></div></div>`;
    return;
  }

  if (!items || !items.length) {
    cont.innerHTML = `<div class="carousel-empty">Sin contenido</div>`;
    return;
  }

  cont.innerHTML = items.map((p) => crearCardHTML(p, esFav)).join("");
}

// =====================
// HOME
// =====================

async function renderHome() {
  renderCarrusel("scroll2024",       null, false, true);
  renderCarrusel("scrollSeriesTop",  null, false, true);
  renderCarrusel("scrollPopularHoy", null, false, true);
  renderCarrusel("scrollTopRated",   null, false, true);

  renderCarrusel("scrollFavoritos", obtenerFavoritos(), true);
  renderCarrusel("scrollHistorial", obtenerHistorial());

  const [pelis2024, seriesTop, popularesHoy, topRated] = await Promise.all([
    getPeliculas2024Top(),
    getSeriesTop(),
    getPopularesHoy(),
    getTopRated(),
  ]);

  renderCarrusel("scroll2024",       pelis2024);
  renderCarrusel("scrollSeriesTop",  seriesTop);
  renderCarrusel("scrollPopularHoy", popularesHoy);
  renderCarrusel("scrollTopRated",   topRated);
}

// =====================
// DETALLE
// =====================

window.verDetalle = async function (id, tipo = "movie") {
  const activa = document.querySelector("section.active");
  if (activa && activa.id !== "detalle") seccionAnterior = activa.id;

  mostrarSeccion("detalle");

  const cont = document.getElementById("detalleContenido");
  cont.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>`;

  const peli = await obtenerDetalle(id, tipo);
  if (!peli) {
    cont.innerHTML = emptyStateHTML("⚠️", "No se pudo cargar", "Intentá de nuevo más tarde.");
    return;
  }

  peliculaActual = peli;
  guardarHistorial(peli);
  renderDetalle(peli);
};

function renderDetalle(p) {
  const poster  = p.poster_path ? `https://image.tmdb.org/t/p/w780${p.poster_path}` : null;
  const rating  = p.vote_average ? p.vote_average.toFixed(1) : "—";
  const year    = (p.release_date || "").slice(0, 4);
  const esFav   = obtenerFavoritos().some((f) => f.id === p.id);

  const heroHTML = poster
    ? `<img src="${poster}" class="detalle-img" alt="${p.title}" loading="lazy">`
    : `<div class="detalle-img-fallback"><span>🎬</span></div>`;

  document.getElementById("detalleContenido").innerHTML = `
    <div class="detalle-grid">

      <!-- IZQUIERDA -->
      <div class="detalle-left">
        ${heroHTML}

        <div class="detalle-header">
          <h1 class="detalle-title">${p.title}</h1>

          <button
            class="btn-fav ${esFav ? "btn-fav--active" : ""}"
            onclick="toggleFavorito()"
            id="btnFav"
          >
            ${esFav ? "✓ En favoritos" : "❤ Agregar a favoritos"}
          </button>
        </div>

        <div class="detalle-meta">
          ${year ? `<span class="tag">${year}</span>` : ""}
          ${p.runtime ? `<span class="tag">${p.runtime} min</span>` : ""}
          ${
            p.genre
              ? p.genre
                  .split(", ")
                  .map((g) => `<span class="tag">${g}</span>`)
                  .join("")
              : ""
          }
        </div>

        <div class="detalle-rating">★ ${rating}</div>
      </div>

      <!-- DERECHA -->
      <div class="detalle-right">
        <p class="detalle-plot">${p.overview || "Sin sinopsis disponible."}</p>

        <div class="detalle-rows">
          ${detalleRow("Director", p.director)}
          ${detalleRow("Actores", p.actors)}
        </div>

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
  const h    = obtenerHistorial();
  const cont = document.getElementById("listaHistorial");

  if (!h.length) {
    cont.innerHTML = emptyStateHTML("🕐", "Sin historial", "Las películas que veas aparecerán acá.");
    return;
  }
  cont.innerHTML = h.map((p) => crearCardHTML(p)).join("");
}

function mostrarHistorialEnBusqueda() {
  const inputVacio = document.getElementById("inputBusqueda").value.trim() === "";
  if (!inputVacio) return;

  const h    = obtenerHistorial();
  const cont = document.getElementById("resultados");
  document.getElementById("labelResultados").textContent = "Visto recientemente";

  if (!h.length) {
    cont.innerHTML = emptyStateHTML("🎬", "Nada por acá", "Buscá una película o serie para empezar.");
    return;
  }
  cont.innerHTML = h.map((p) => crearCardHTML(p)).join("");
}

// =====================
// FAVORITOS
// =====================

window.toggleFavorito = function () {
  if (!peliculaActual) return;
  const esFav = obtenerFavoritos().some((f) => f.id === peliculaActual.id);

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
  btn.innerHTML = esFav
    ? `<i class="fa-solid fa-check"></i> En favoritos`
    : `<i class="fa-solid fa-heart"></i> Agregar a favoritos`;
}

window.abrirFormulario  = () => document.getElementById("formFavorito").classList.add("open");
window.cerrarFormulario = () => document.getElementById("formFavorito").classList.remove("open");

window.guardarFavorito = function () {
  const prioridad = document.getElementById("prioridad").value;
  const categoria = document.getElementById("categoria").value;
  const nota      = document.getElementById("nota").value;

  if (!prioridad) { mostrarToast("Ingresá una prioridad", "error"); return; }

  if (obtenerFavoritos().find((f) => f.id === peliculaActual.id)) {
    mostrarToast("Ya está en favoritos", "info");
    cerrarFormulario();
    return;
  }

  guardarFavoritoEnStorage(peliculaActual, { prioridad, categoria, nota });
  cerrarFormulario();
  mostrarToast("Guardado en favoritos ❤", "success");
  actualizarBtnFav(true);

  document.getElementById("prioridad").value = "";
  document.getElementById("categoria").value = "";
  document.getElementById("nota").value      = "";
};

function mostrarFavoritos() {
  const f    = obtenerFavoritos();
  const cont = document.getElementById("listaFavoritos");

  if (!f.length) {
    cont.innerHTML = emptyStateHTML(
      "❤", "Sin favoritos aún",
      "Buscá una película y guardala con el botón ❤.",
      "Ir a buscar", "mostrarSeccion('busqueda')"
    );
    return;
  }
  cont.innerHTML = f.map((p) => crearCardHTML(p, true)).join("");
}

window.eliminarFavorito = function (id) {
  eliminarFavoritoDeStorage(id);
  mostrarToast("Eliminado de favoritos", "error");

  const sec = document.querySelector("section.active")?.id;
  if (sec === "favoritos") mostrarFavoritos();
  else if (sec === "home") renderHome();
  else if (sec === "detalle") actualizarBtnFav(false);
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

function renderPaginacion() {
  const cont = document.getElementById("paginacion");
  cont.innerHTML = "";
  if (totalPaginas <= 1) return;

  cont.innerHTML = `
    <button ${paginaActual === 1 ? "disabled" : ""} onclick="buscar(${paginaActual - 1})">←</button>
    <span>${paginaActual} / ${totalPaginas}</span>
    <button ${paginaActual === totalPaginas ? "disabled" : ""} onclick="buscar(${paginaActual + 1})">→</button>
  `;
}

// =====================
// MAPA
// =====================

let mapa = null;

function iniciarMapa() {
  if (mapa) return;
  mapa = new maplibregl.Map({
    container: "map",
    style: "https://tiles.openfreemap.org/styles/liberty",
    center: [-58.267530959465, -34.774617363703435],
    zoom: 15,
  });
  new maplibregl.Marker({ color: "red" })
    .setLngLat([-58.267530959465, -34.774617363703435])
    .addTo(mapa);
}

// =====================
// EMAIL
// =====================

window.enviarEmail = function () {
  const nombre  = document.getElementById("nombre").value;
  const email   = document.getElementById("email").value;
  const mensaje = document.getElementById("mensaje").value;

  if (!nombre || !email || !mensaje) {
    mostrarToast("Completá todos los campos", "error");
    return;
  }

  emailjs
    .send("service_lk3as03", "template_whuywlb", {
      from_name:  nombre,
      from_email: email,
      message:    mensaje,
    })
    .then(() => {
      mostrarToast("Mensaje enviado ✓", "success");
      document.getElementById("nombre").value  = "";
      document.getElementById("email").value   = "";
      document.getElementById("mensaje").value = "";
    })
    .catch((err) => {
      console.error(err);
      mostrarToast("Error al enviar", "error");
    });
};

// =====================
// INIT
// =====================

window.onload = () => mostrarSeccion("home");