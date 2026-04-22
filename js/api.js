const API_KEY = "22fba254142510f1e789656348eed887"; 
const BASE_URL = "https://api.themoviedb.org/3";

// Helper para mapear TMDb → tu formato actual
function mapearPelicula(item) {
  return {
    id: item.id,              // ← id (no imdbID)
    title: item.title || item.name,
    release_date: item.release_date || item.first_air_date || "",
    poster_path: item.poster_path || null,
    vote_average: item.vote_average,
    overview: item.overview
  };
}

// 🔍 Buscar (equivalente a buscarPeliculas)
export async function buscarPeliculas(texto) {
  try {
    const res = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${texto}&language=es-ES`
    );
    const data = await res.json();

    return data.results
      .filter(item => item.media_type === "movie" || item.media_type === "tv")
      .map(mapearPelicula);

  } catch (error) {
    console.error("Error en búsqueda:", error);
    return [];
  }
}

// 🎬 Obtener detalle
export async function obtenerDetalle(id) {
  try {
    const res = await fetch(
      `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=es-ES`
    );
    let data = await res.json();

    if (data.success === false) {
      const resTV = await fetch(
        `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=es-ES`
      );
      data = await resTV.json();
    }

    // 👉 NUEVO: pedir créditos
    const creditsRes = await fetch(
      `${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`
    );
    const credits = await creditsRes.json();

    const director = credits.crew?.find(p => p.job === "Director")?.name;
    const actores = credits.cast?.slice(0, 3).map(a => a.name).join(", ");

    return {
      id: data.id,
      title: data.title || data.name,
      release_date: data.release_date || data.first_air_date || "",
      poster_path: data.poster_path || null,
      vote_average: data.vote_average,
      overview: data.overview,
      genre: data.genres?.map(g => g.name).join(", ") || "",
      runtime: data.runtime || data.episode_run_time?.[0] || null,

      // 👉 NUEVOS DATOS
      director: director || "No disponible",
      actors: actores || "No disponible"
    };

  } catch (error) {
    console.error("Error en detalle:", error);
    return null;
  }
}

// 
export async function obtenerPopulares() {
  try {
    const res = await fetch(
      `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=es-ES`
    );
    const data = await res.json();
    return data.results.map(item => ({
      id: item.id,
      title: item.title || item.name,
      release_date: item.release_date || item.first_air_date || "",
      poster_path: item.poster_path || null,
      vote_average: item.vote_average,
      overview: item.overview
    }));
  } catch (error) {
    console.error("Error en populares:", error);
    return [];
  }
}

// 📺 Series (extra opcional)
export async function buscarSeries() {
  try {
    const res = await fetch(
      `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=es-ES`
    );
    const data = await res.json();

    return data.results.map(mapearPelicula);

  } catch (error) {
    console.error("Error en series:", error);
    return [];
  }
}