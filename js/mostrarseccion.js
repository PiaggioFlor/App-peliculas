// Reemplazá la función mostrarSeccion en tu main.js por esta:

window.mostrarSeccion = function (id) {
  // Ocultar todas las secciones
  document.querySelectorAll("section").forEach(sec => {
    sec.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");

  // Nav inferior (mobile)
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  const navBtn = document.getElementById("nav-" + id);
  if (navBtn) navBtn.classList.add("active");

  // Sidebar (desktop)
  document.querySelectorAll(".sidebar-nav-item").forEach(item => item.classList.remove("active"));
  const sideItem = document.getElementById("snav-" + id);
  if (sideItem) sideItem.classList.add("active");

  // Guardar sección anterior para el botón volver
  if (id !== "detalle") seccionAnterior = id;

  // Renders específicos
  if (id === "historial") mostrarHistorial();
  if (id === "favoritos") mostrarFavoritos();
  if (id === "home")      renderHomeSections();
};