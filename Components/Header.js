function createHeader() {
  const header = document.createElement("header");
  header.classList.add("header");

  const title = document.createElement("h1");
  title.textContent = "Buscador de películas";
  header.appendChild(title);

  const logo = document.createElement("img");
  logo.src = "./Assets/Logo.jpg";
  logo.alt = "Logo";
  logo.id = "logo";
  header.appendChild(logo);

  document.body.appendChild(header);
}
document.addEventListener("DOMContentLoaded", () => {
  createHeader();
});