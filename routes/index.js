const express = require('express');
const router = express.Router();
const myFunctions = require('../utils/functions');

/**
 * Home Page
 * Displays Recent Releases
 */

router.get('/', async (req, res) => {
    try {
        const responses = await Promise.all([
            myFunctions.getTrending(),
            myFunctions.getNowPlaying(),
            myFunctions.getPopularMovies(),
            myFunctions.getPopularSeries(),        
        ]);
        const trending = responses[0];
        const inTheaters = responses[1];
        const popularMovies = responses[2];
        const popularTv = responses[3];
        res.render('index', { title: 'WatchFinder', trending, inTheaters, popularMovies, popularTv})
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});

/**
 * Movies Page
 * Displays all movies with filter function
 */
router.get('/movies', async (req, res) => {
    let page = req.query.page || 1
    const sort = req.query.sort || "popularity.desc"
    const genreList = Array.isArray(req.query.genres) ? req.query.genres : (req.query.genres ? String(req.query.genres).split(",") : []);
    const from = req.query.date_from?.trim();
    const to   = req.query.date_to?.trim();
    const params = new URLSearchParams({
        page: page,
        sort_by: sort,
    });
    if(from) params.set("primary_release_date.gte", from);
    if(from) params.set("primary_release_date.lte", to);
    if (genreList.length) params.set("with_genres", genreList.join(","));
    
    try {
        const results = await myFunctions.getAllMovies(params);
        const genres = await myFunctions.getAllGenres("movie");
        const data = await results.data;
        let totalPages = await results.totalPages;
        if ( totalPages > 500) {totalPages = 500};
        const currentPage = await results.currentPage;
        res.render('movies', { title: 'Movies', data, totalPages, currentPage, currentSort:sort, genres, selectedFrom: from, selectedTo: to, selectedGenres: genreList, query: req.query})
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});

/**
 * Tv Shows Page
 * Displays all tv shows with filter function
 */
router.get('/tvseries', async (req, res) => {
    let page = req.query.page || 1
    const sort = req.query.sort || "popularity.desc"
    const genreList = Array.isArray(req.query.genres) ? req.query.genres : (req.query.genres ? String(req.query.genres).split(",") : []);
    const from = req.query.date_from?.trim();
    const to   = req.query.date_to?.trim();
    const params = new URLSearchParams({
        page: page,
        sort_by: sort,
    });
    if(from) params.set("first_air_date.gte", from);
    if(from) params.set("first_air_date.lte", to);
    if (genreList.length) params.set("with_genres", genreList.join(","));

    try {
        const results = await myFunctions.getAllSeries(params);
        const genres = await myFunctions.getAllGenres("tv");
        const data = await results.data;
        let totalPages = await results.totalPages;
        if ( totalPages > 500) {totalPages = 500};
        const currentPage = await results.currentPage;
        res.render('series', { title: 'Tv Series', data, totalPages, currentPage, currentSort: sort, genres, selectedFrom: from, selectedTo: to, selectedGenres: genreList, query: req.query})
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});

/**
 * People Page
 * Displays All People by popularity
 */
router.get('/people', async (req, res) => {
    let page = req.query.page || 1
    try {
        const results = await myFunctions.getAllPeople(page);
        const data = await results.data;
        let totalPages = await results.totalPages;
        if ( totalPages > 500) {totalPages = 500};
        const currentPage = await results.currentPage;
        res.render('people', { title: 'People', data, totalPages, currentPage})
    } catch (error) {
        console.error('Error fetching data:', error);
    }
})

/**
 * Search Results
 * Displays Search Results
 */

router.get('/search', async (req, res) => {
    let searchTerm = req.query.searchTerm
    let page = req.query.page || 1
    try {
        const results = await myFunctions.getSearchResults(searchTerm, page);
        const data = await results.data;
        const totalPages = await results.totalPages;
        const currentPage = await results.currentPage;
        res.render('search', { title: `Search Results For "${searchTerm}"`, searchTerm, data, totalPages, currentPage})
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});


/**
 * Movie Title Page
 * Displays all movie information
 */

router.get('/movie/:id', async (req, res) => {
    let id = req.params.id;
    try {
        const results = await myFunctions.getMovieByID(id)
        const data = results
        const title = data.title
        const type = "movie"
        const similar = await myFunctions.getSimilar(type, id)
        res.render('title', { title , id, data, type, similar})
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});

/**
 * Tv Title Page
 * Displays all series information
 */

router.get('/tv/:id', async (req, res) => {
    let id = req.params.id;
    try {
        const type = "tv"
        const results = await myFunctions.getSeriesByID(id)
        const data = results
        const similar = await myFunctions.getSimilar(type, id)
        const title = data.title
        const today = new Date();
        // Filter out future seasons
        const pastSeasons = data.seasons.filter(
            s => s.air_date && new Date(s.air_date) <= today
        );
        // The latest by air date is the current one
        const currentSeason = pastSeasons.sort(
            (a, b) => new Date(b.air_date) - new Date(a.air_date)
        )[0];
        res.render('title', {title, id, data, type, currentSeason, similar})
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});

/**
 * Series Seasons Page
 * Displays all seasons belonging to a series
 */
router.get('/tv/:id/seasons', async(req, res) => {
    let id = req.params.id;
    try {
        const data = await myFunctions.getAllSeasons(id)
        const seasons = data.seasons;
        res.render('seasons', { title:`${data.name}` , id, seasons});
    } catch (error) {
        console.error('Error fetching data:', error);
    }
})

/**
 * Individual Seasons Page
 * Displays individual season & episodes belonging to a series
 */
router.get('/tv/:tvid/seasons/:snum', async(req, res) => {
    let tvid = req.params.tvid;
    let snum = req.params.snum;
    try {
        const series = await myFunctions.getSeriesByID(tvid)
        const data = await myFunctions.getEpisodesForSeason(tvid, snum)
        res.render('season', {data, tvid, snum, title: `${series.title}`});
    } catch (error) {
        console.error('Error fetching data:', error);
    }
})

/**
 * Person
 * Displays person details
 */
router.get('/person/:id', async(req, res) => {
    let id = req.params.id;
    try {
        const data = await myFunctions.getPersonByID(id)
        const credits = data.combined_credits.cast
        const crew = data.combined_credits.crew
        res.render('person', { title:data.name , id, data, credits, crew});
    } catch (error) {
        console.error('Error fetching data:', error);
    }
})

/**
 * Collection Page
 * Displays collection details
 */
router.get('/collection/:id', async(req, res) => {
    let id = req.params.id;
    try {
        const data = await myFunctions.getCollectionByID(id)
        res.render('collection', { title:data.name , id, data});
    } catch (error) {
        console.error('Error fetching data:', error);
    }
})


module.exports = router;