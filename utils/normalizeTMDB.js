const IMG_BASE = "https://image.tmdb.org/t/p/";

function normalizeTmdbItem(item, type) {
  return {
    id: item.id ?? null,
    type: type,
    title: item.title || item.name || "Untitled",
    overview: item.overview || "No description available.",
    tagline: item.tagline || null,
    status: item.status || "Unknown Status",
    release_date: item.release_date || item.first_air_date || null,
    poster: item.poster_path
      ? `${IMG_BASE}w500${item.poster_path}`
      : "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/football%2Csoccer%2Csport%2Cevent-design-template-31189bebe42fe7f743327895731b60ae_screen.jpg?ts=1698356519", // fallback asset
    backdrop: item.backdrop_path
      ? `${IMG_BASE}original${item.backdrop_path}`
      : null,
    genres: item.genres
      ? item.genres.map((g) => ({id: g.id, name: g.name}))
      : item.genre_ids || [],
    runtime: item.runtime || item.episode_run_time?.[0] || null,
    popularity: item.popularity ?? 0,
    trailer: item.videos.results.find(x => x.type == "Trailer") || null,
    watch_providers: item['watch/providers'].results["US"],
    cast: item.credits.cast ? item.credits.cast.map((c) => ({id: c.id, name: c.name, profile_path: c.profile_path, character: c.character})) : [],
    collection: item.belongs_to_collection || null,
    seasons: item.seasons || null,
    number_of_seasons: item.number_of_seasons || null,
    next_episode_to_air: item.next_episode_to_air || null,
  };
}

module.exports = { normalizeTmdbItem };