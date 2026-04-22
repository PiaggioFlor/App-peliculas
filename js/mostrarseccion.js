window.mostrarSeccion = function (id) {
  // Ocultar secciones
  document.querySelectorAll("section").forEach(sec => {
    sec.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");

  // Nav mobile
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  const navBtn = document.getElementById("nav-" + id);
  if (navBtn) navBtn.classList.add("active");

  // Sidebar desktop
  document.querySelectorAll(".sidebar-nav-item").forEach(item => {
    item.classList.remove("active");
  });
  const sideItem = document.getElementById("snav-" + id);
  if (sideItem) sideItem.classList.add("active");

  // Guardar sección anterior
  if (id !== "detalle") seccionAnterior = id;

  // Render por sección
  if (id === "historial") mostrarHistorial();
  if (id === "favoritos") mostrarFavoritos();
  if (id === "home") renderHomeSections();
  if (id === "busqueda") mostrarHistorialEnBusqueda(); // 🔥 ESTA FALTABA
};