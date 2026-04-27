const API_KEY = "22fba254142510f1e789656348eed887"; 
const BASE_URL = "https://api.themoviedb.org/3";

// Helper para mapear TMDb → tu formato actual
function mapearPelicula(item) {
  console.log("Mapeando item:", item);
  return {
    id: item.id,              // ← id (no imdbID)
    media_type: item.media_type || (item.title ? "movie" : "tv"),
    title: item.title || item.name,
    release_date: item.release_date || item.first_air_date || "",
    poster_path: item.poster_path || null,
    vote_average: item.vote_average,
    overview: item.overview
  };
}

// 🔍 Buscar (equivalente a buscarPeliculas)
export async function buscarPeliculas(texto, page = 1) {
  try {
    const res = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${texto}&language=es-ES&page=${page}`
    );
    const data = await res.json();

    return {
      resultados: data.results
        .filter(item => item.media_type === "movie" || item.media_type === "tv")
        .map(mapearPelicula),
      totalPaginas: data.total_pages
    };

  } catch (error) {
    console.error("Error en búsqueda:", error);
    return { resultados: [], totalPaginas: 1 };
  }
}

// 🎬 Obtener detalle
export async function obtenerDetalle(id, tipo = "movie") {
  console.log(`Obteniendo detalle para ID ${id} (tipo: ${tipo})`);
  const endpoint = tipo === "tv" ? "tv" : "movie"; // Asegura que el endpoint sea correcto

  try {
    const res = await fetch(
      `${BASE_URL}/${endpoint}/${id}?api_key=${API_KEY}&language=es-ES`
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
      media_type: data.media_type || (data.title ? "movie" : "tv"),
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

// 🔎 Buscar con filtros reales desde TMDb
export async function descubrirPeliculas({
  query = "",
  page = 1,
  tipo = "movie",
  rating = "",
  anio = "",
  orden = "",
}) {
  try {
    let resultados = [];
    let totalPaginas = 1;

    if (query) {
      // Con texto: traemos varias páginas para tener suficientes resultados
      // antes de filtrar localmente
      const pagesToFetch = [1, 2, 3];
      const responses = await Promise.all(
        pagesToFetch.map(p =>
          fetch(`${BASE_URL}/search/${tipo}?api_key=${API_KEY}&query=${query}&language=es-ES&page=${p}`)
            .then(r => r.json())
        )
      );

      resultados = responses.flatMap(data => data.results || []).map(mapearPelicula);
      totalPaginas = responses[0].total_pages || 1;

    } else {
      // Sin texto: usamos discover con filtros nativos
      let url = `${BASE_URL}/discover/${tipo}?api_key=${API_KEY}&language=es-ES&page=${page}`;
      if (rating) url += `&vote_average.gte=${rating}`;
      if (anio) {
        resultados = resultados.filter(p =>
          (p.release_date || "").slice(0, 4) === String(anio).trim()
        );
      }
      if (orden === "rating") url += `&sort_by=vote_average.desc`;
      else if (orden === "fecha") url += `&sort_by=primary_release_date.desc`;
      else url += `&sort_by=popularity.desc`;

      const res  = await fetch(url);
      const data = await res.json();
      resultados   = (data.results || []).map(mapearPelicula);
      totalPaginas = data.total_pages || 1;
    }

    // ── Filtros locales (aplican siempre que haya query) ──────────────
    if (rating) {
      resultados = resultados.filter(p => p.vote_average >= parseFloat(rating));
    }

    if (anio) {
      resultados = resultados.filter(p =>
        (p.release_date || "").startsWith(anio)
      );
    }

    if (orden === "rating") {
      resultados.sort((a, b) => b.vote_average - a.vote_average);
    } else if (orden === "fecha") {
      resultados.sort((a, b) =>
        (b.release_date || "").localeCompare(a.release_date || "")
      );
    }
    // ─────────────────────────────────────────────────────────────────

    // Paginación manual sobre los resultados filtrados
    const porPagina = 20;
    const inicio    = (page - 1) * porPagina;
    const paginados = resultados.slice(inicio, inicio + porPagina);
    const totalCalc = Math.ceil(resultados.length / porPagina) || totalPaginas;

    return {
      resultados:   paginados,
      totalPaginas: totalCalc,
    };

  } catch (error) {
    console.error("Error en discover:", error);
    return { resultados: [], totalPaginas: 1 };
  }
}

// 🎬 Películas 2024 con +7 estrellas
export async function getPeliculas2024Top() {
  try {
    const res = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&vote_average.gte=7&sort_by=vote_average.desc`
    );
    const data = await res.json();
    return data.results.map(mapearPelicula);
  } catch (e) {
    console.error(e);
    return [];
  }
}

// 📺 Series mejor puntuadas
export async function getSeriesTop() {
  try {
    const res = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-ES&sort_by=vote_average.desc&vote_count.gte=100`
    );
    const data = await res.json();
    return data.results.map(mapearPelicula);
  } catch (e) {
    console.error(e);
    return [];
  }
}

// 🔥 Lo más popular
export async function getPopularesHoy() {
  try {
    const res = await fetch(
      `${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=es-ES`
    );
    const data = await res.json();
    return data.results.map(mapearPelicula);
  } catch (e) {
    console.error(e);
    return [];
  }
}

// ⭐ Top rated global
export async function getTopRated() {
  try {
    const res = await fetch(
      `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=es-ES`
    );
    const data = await res.json();
    return data.results.map(mapearPelicula);
  } catch (e) {
    console.error(e);
    return [];
  }
}