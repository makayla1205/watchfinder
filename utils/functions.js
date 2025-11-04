require('dotenv').config()

const axios = require('axios');
const key = process.env.APIKEY;
const root = process.env.APIROOT;
const token = process.env.ACCESS_TOKEN;

const redis = require('./redisClient');
const { normalizeTmdbItem } = require('./normalizeTMDB');

const options = {headers: { Authorization: `Bearer ${token}` }}

//get trending today movies and tv shows
async function getTrending() {
  /*
  const cacheKey = "trending_movies";
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
    */

  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/trending/all/day?language=en-US`, options);
  const data = res.data.results;
  //await redis.set(cacheKey, JSON.stringify(data), { EX: 21600 }); // expire in 6 hours - 3600/hr
  return data;
}

//get now playing in theaters
async function getNowPlaying() {
  /*
  const cacheKey = "now_playing";
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
    */

  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=1`, options);
  const data = res.data.results;
  //await redis.set(cacheKey, JSON.stringify(data), { EX: 21600 }); // expire in 6 hours
  return data;
}

//get popular movies
async function getPopularMovies() {
  const cacheKey = "popular_movies";
  /*
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
  */
  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/movie/popular`, options);
  const data = res.data.results;
  //await redis.set(cacheKey, JSON.stringify(data), { EX: 21600 }); // expire in 6 hours
  return data;
}

//get popular tvshows
async function getPopularSeries() {
  /*
  const cacheKey = "popular_series";
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
*/
 // console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/tv/popular`, options);
  const data = res.data.results;
  //await redis.set(cacheKey, JSON.stringify(data), { EX: 21600 }); // expire in 6 hours
  return data;
}

//get All movies by filter params
async function getAllMovies(params) {
  /*
  const cacheKey = `discover_movies_${params}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }*/

  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&${params.toString()}`, options);
  const data = res.data.results;
  const totalPages = res.data.total_pages;
  const currentPage = res.data.page;
  //await redis.set(cacheKey, JSON.stringify({data, totalPages, currentPage}), { EX: 21600 }); // expire in 6 hours
  return {data, totalPages, currentPage};
}

//get All movies by filter params
async function getAllSeries(params) {
  /*
  const cacheKey = `discover_series_${sort}_${page}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
*/
  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&${params}`, options);
  const data = res.data.results;
  const totalPages = res.data.total_pages;
  const currentPage = res.data.page;
  //await redis.set(cacheKey, JSON.stringify({data, totalPages, currentPage}), { EX: 21600 }); // expire in 6 hours
  return {data, totalPages, currentPage};
}

//get All people by page
async function getAllPeople(page) {
  /*
  const cacheKey = `popular_people_${page}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
*/
  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/person/popular?language=en-US&page=${page}`, options);
  const data = res.data.results;
  const totalPages = res.data.total_pages;
  const currentPage = res.data.page;
  //await redis.set(cacheKey, JSON.stringify({data, totalPages, currentPage}), { EX: 21600 }); // expire in 6 hours
  return {data, totalPages, currentPage};
}

//get search results
async function getSearchResults(searchTerm, page) {
  /*
  const cacheKey = `search_${searchTerm}_${page}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
*/
  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/search/multi?query=${searchTerm}&include_adult=false&language=en-US&page=${page}`, options);
  const data = res.data.results;
  const totalPages = res.data.total_pages;
  const currentPage = res.data.page;
  //await redis.set(cacheKey, JSON.stringify({data, totalPages, currentPage}), { EX: 21600 }); // expire in 6 hours
  return {data, totalPages, currentPage};
}

//get movie by id
async function getMovieByID(id) {
  /*
  const cacheKey = `movie_${id}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
    */

  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/movie/${id}?append_to_response=images,videos,credits,watch%2Fproviders&language=en-US`, options);
  const data = normalizeTmdbItem(res.data, "movie");
  //await redis.set(cacheKey, JSON.stringify(data), { EX: 21600 }); // expire in 6 hours
  return data;
}

//get series by id
async function getSeriesByID(id) {
  /*
  const cacheKey = `tv_${id}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
    */

  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/tv/${id}?append_to_response=videos,credits,watch%2Fproviders&language=en-US`, options);
  const data = normalizeTmdbItem(res.data, "tv");
  //await redis.set(cacheKey, JSON.stringify(data), { EX: 21600 }); // expire in 6 hours
  return data;
}

//get Similar Titles
async function getSimilar(type, id) {
  const res = await axios.get(`https://api.themoviedb.org/3/${type}/${id}/recommendations?language=en-US&page=1`, options);
  return res.data.results;
}

//get all seasons belonging to a series by id
async function getAllSeasons(id) {
  /*
  const cacheKey = `tv_${id}_seasons`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
*/
  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/tv/${id}?append_to_response=videos,credits&language=en-US`, options);
  const data = res.data;
  //await redis.set(cacheKey, JSON.stringify(data), { EX: 21600 }); // expire in 6 hours
  return data;
}

//get all seasons belonging to a series by id
async function getEpisodesForSeason(series_id, season_num) {
  /*
  const cacheKey = `tv_${series_id}_seasons_${season_num}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
*/
  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/tv/${series_id}/season/${season_num}?language=en-US`, options);
  const data = res.data;
  //await redis.set(cacheKey, JSON.stringify(data), { EX: 21600 }); // expire in 6 hours
  return data;
}

//get person by id
async function getPersonByID(id) {
  /*
  const cacheKey = `person_${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
*/
  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/person/${id}?append_to_response=combined_credits&language=en-US`, options);
  const data = res.data;
  //await redis.set(cacheKey, JSON.stringify(data), { EX: 21600 }); // expire in 6 hours
  return data;
}

//get collection by id
async function getCollectionByID(id) {
  /*
  const cacheKey = `collection_${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
*/
  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/collection/${id}?language=en-US`, options);
  const data = res.data;
  //await redis.set(cacheKey, JSON.stringify(data), { EX: 21600 }); // expire in 6 hours
  return data;
}

//get All movies in Genre
async function getAllMoviesInGenre(params) {
  /*
  const cacheKey = `discover_movies_genre_${genre}_${sort}_${page}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
    */

  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&${params.toString()}`, options);
  const data = res.data.results;
  const totalPages = res.data.total_pages;
  const currentPage = res.data.page;
  //await redis.set(cacheKey, JSON.stringify({data, totalPages, currentPage}), { EX: 21600 }); // expire in 6 hours
  return {data, totalPages, currentPage};
}

//get All series in Genre
async function getAllSeriesInGenre(sort, page, genre) {
  /*
  const cacheKey = `discover_series__genre_${genre}_${sort}_${page}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("using cache");
    return JSON.parse(cached);
  }
    */

  //console.log("fetching from TMDB");
  const res = await axios.get(`https://api.themoviedb.org/3/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page=${page}&sort_by=${sort}&with_genres=${genre}`, options);
  const data = res.data.results;
  const totalPages = res.data.total_pages;
  const currentPage = res.data.page;
  //await redis.set(cacheKey, JSON.stringify({data, totalPages, currentPage}), { EX: 21600 }); // expire in 6 hours
  return {data, totalPages, currentPage};
}

//get all genres by media type
async function getAllGenres(type){
  const res = await axios.get(`https://api.themoviedb.org/3/genre/${type}/list?language=en`, options);
  const data = res.data.genres;
  return(data)
}

//get languages
async function getLanguages(){
  const res = await axios.get('https://api.themoviedb.org/3/configuration/languages', options)
  return res.data
}

//get countries
async function getCountries(){
  const res = await axios.get('https://api.themoviedb.org/3/configuration/countries?language=en-US', options)
  return res.data
}

//filter search results
function thin(results = []) {
  return results
    .filter(r =>
  (["movie", "tv", "person"].includes(r.media_type)) &&
  (r.title || r.name)
  )
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 10)
    .map(r => {
      const isPerson = r.media_type === "person";
      return {
        id: r.id,
        media_type: r.media_type,
        title: r.title || r.name,
        year: isPerson ? null : (r.release_date || r.first_air_date || "").slice(0, 4) || null,
        poster: r.poster_path
          ? `https://image.tmdb.org/t/p/w92${r.poster_path}`
          : isPerson && r.profile_path
          ? `https://image.tmdb.org/t/p/w92${r.profile_path}`
          : null,
      };
    });
}

//get updated CSV file containing corresponding TMDB & Watchmode IDs
function getData(id, type){
  if (!global.CSV_DATA || !Array.isArray(global.CSV_DATA)) {
    //throw new Error("CSV_DATA not loaded or invalid");
    return []
  }

  return global.CSV_DATA.filter(
    (item) => item["TMDB ID"] === id && item["TMDB Type"] === type
  );
  /*
  return new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream("/Users/makaylaboyer/Documents/2025 Projects/Watchfinder/public/datasets/title_id_map.csv")
    .pipe(parse({
        columns: true, // Treat first row as headers and return objects
        skip_empty_lines: true
    }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      //console.log(results)
      const foundRecord = results.find(record => record["TMDB ID"] === id && record["TMDB Type"] === type)
      resolve(foundRecord)
    })
    .on('error', (err) => {
        console.error('Error reading CSV:', err.message);
    });
  })
    */
}

//get streaming option
async function getStreamingSource(id, type){
  let record = getData(id, type)
  
  //console.log("Record:",record[0])
  const result = [];
  try{
    const cacheKey = `streaming_${type}_${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log("using cache");
      return JSON.parse(cached);
    }

    console.log("fetching from TMDB");
    const res = await axios.get(`${root}/title/${record[0]['Watchmode ID']}/sources/?apiKey=${key}`);
    const data = res.data.filter(r => (r.region === "US"))
    await redis.set(cacheKey, JSON.stringify({data}), { EX: 86400 }); // expire in 6 hours
    return data;

    //const data = await axios.get(`${root}/title/${record[0]['Watchmode ID']}/sources/?apiKey=${key}`);
    //console.log("Data:",data.data)
    //return data.data;
  }
  catch(e) {
    return e;
  }
}


/*
//get streaming services
async function getAllStreamingServices(){
    const result = [];
    try{
      const data = await axios.get(`${root}sources/?apiKey=${key}`);
      for (i in data) {
        result.push(data[i]);
      };
      return result;
    }
    catch(e) {
      return e;
    }
}

//get regions
async function getAllRegions(){
    const result = [];
    try{
      const data = await axios.get(`${root}regions/?apiKey=${key}`);
      return data.data;
    }
    catch(e) {
      return e;
    }
}

//get networks
async function getAllNetworks(){
    const result = [];
    try{
      const data = await axios.get(`${root}networks/?apiKey=${key}`);
      return data.data;
    }
    catch(e) {
      return e;
    }
}
  
//get genres
async function getAllGenres(){
    const result = [];
    try{
      const data = await axios.get(`${root}genres/?apiKey=${key}`);
      return data.data;
    }
    catch(e) {
      return e;
    }
}

//get all movies
async function getAllMovies(){
  try{
    const data = await axios.get(`${root}list-titles/?apiKey=${key}&types=movie&sort_by=title_asc`);
    console.log(data);
    return data.data.titles;
  }
  catch(e) {
    return e;
  }
}

//get all series
async function getAllSeries(){
  try{
    const data = await axios.get(`${root}list-titles/?apiKey=${key}&types=tv_series&sort_by=title_asc`);
    console.log(data);
    return data.data.titles;
  }
  catch(e) {
    return e;
  }
}

//search
async function searchAll(searchTerm){
    try{
      const data = await axios.get(`${root}autocomplete-search/?apiKey=${key}&search_value=${searchTerm}&search_type=1`);
      return data.data.results;
    }
    catch(e) {
      return e;
    }
}

//recent releases
async function getRecentReleases(){
    try{
      const data = await axios.get(`${root}releases/?apiKey=${key}`);
      return data.data.releases;
    }
    catch(e) {
      return e;
    }
}

//title details
async function getTitleDetails(title){
    const result = [];
    try{
      const data = await axios.get(`${root}title/${title}/details/?apiKey=${key}`);
      //console.log(data.data)
      return data.data;
    }
    catch(e) {
      return e;
    }
}

//title sources
async function getTitleSources(title){
    const result = [];
    try{
      const data = await axios.get(`${root}title/${title}/sources/?apiKey=${key}`);
      return data.data;
    }
    catch(e) {
      return e;
    }
}

//title seasons
async function getTitleSeasons(title){
    const result = [];
    try{
      const data = await axios.get(`${root}title/${title}/seasons/?apiKey=${key}`);
      return data.data;
    }
    catch(e) {
      return e;
    }
}

//title episodes
async function getTitleEpisodes(title){
    const result = [];
    try{
      const data = await axios.get(`${root}title/${title}/episodes/?apiKey=${key}`);
      return data.data;
    }
    catch(e) {
      return e;
    }
}

//title cast & crew
async function getTitleCast(title){
    const result = [];
    try{
      const data = await axios.get(`${root}title/${title}/cast-crew/?apiKey=${key}`);
      return data.data;
    }
    catch(e) {
      return e;
    }
}
    */

module.exports = {
  getStreamingSource,
  thin,
  getTrending,
  getNowPlaying,
  getPopularMovies,
  getPopularSeries,
  getAllMovies,
  getAllSeries,
  getAllPeople,
  getSearchResults,
  getMovieByID,
  getSeriesByID,
  getAllSeasons,
  getEpisodesForSeason,
  getPersonByID,
  getCollectionByID,
  getAllMoviesInGenre,
  getAllSeriesInGenre,
  getAllGenres,
  getLanguages,
  getCountries,
  getSimilar,
}