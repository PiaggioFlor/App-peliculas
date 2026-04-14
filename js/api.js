const API_KEY = "27f338a2";
const URL = "https://www.omdbapi.com/";

// Buscar películas por nombre
export async function buscarPeliculas(nombre) {
  try {
    const res = await fetch(`${URL}?apikey=${API_KEY}&s=${nombre}`);
    const data = await res.json();

    if (data.Response === "False") {
      throw new Error(data.Error);
    }

    return data.Search;
  } catch (error) {
    console.error("Error en búsqueda:", error);
    return [];
  }
}

// Obtener detalle por ID
export async function obtenerDetalle(id) {
  try {
    const res = await fetch(`${URL}?apikey=${API_KEY}&i=${id}`);
    const data = await res.json();

    return data;
  } catch (error) {
    console.error("Error en detalle:", error);
  }
}

export async function buscarTodasLasPeliculas(){
  const busqueda='avenger'; //letra para traer todas las películas
  try{
    const res = await fetch(`${URL}?apikey=${API_KEY}&s=${busqueda}`);
     const data = await res.json();

    if (data.Response === "False") {
      throw new Error(data.Error);
    }

    return data.Search;
  }catch (error) {
    console.error("Error en búsqueda:", error);
    return [];
  }
}