const express = require('express');
const router = express.Router();
const { requireAuth, redirectIfAuthenticated } = require('../middleware/auth');
const { getAuthenticatedSupabase } = require('../supabase/supabase');
const { getCountries, getLanguages } = require('../utils/functions');

router.get('/profile', requireAuth, async (req, res) => {
    try {
        if(!req.session.user) { res.redirect('/auth/login')}
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        const {data: profile, error: profileErr} = await supabase
        .from('profiles')
        .select()
        .eq('id', req.session.user.id)
        .single()
        if(profileErr) {
            console.error(profileErr)
            res.status(400).render('pages/user/profile', {title: "Profile", profile: {}})
        }
        res.render('pages/user/profile', {title: "Profile", profile})
    } catch (error) {
        console.error('Error retrieving profile:', error);
        res.status(400).render('pages/user/profile', {title: "Profile", profile: {}})
    }
    
})

router.get('/settings', requireAuth, async (req, res) => {
    try {
        const countries = await getCountries()
        const languages = await getLanguages()
        if(!req.session.user) { res.redirect('/auth/login')}
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        const {data: profile, error: profileErr} = await supabase
        .from('profiles')
        .select()
        .eq('id', req.session.user.id)
        .single()
        if(profileErr) {
            console.error(profileErr)
            res.status(400).render('pages/user/settings', {title: "Profile", profile: {}, countries, languages, error:null})
        }
        res.render('pages/user/settings', {title: "Account Settings", profile, countries, languages, error:null})
    } catch (error) {
        console.error('Error retrieving profile settings:', error);
        res.status(400).render('pages/user/settings', {title: "Profile", profile: {}, countries: {}, languages: {}, error:null})
    }
    
})

router.get('/favorites', requireAuth, async (req, res) => {
    try {
        if(!req.session.user) { res.redirect('/auth/login')}
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        const {data: profile, error: profileErr} = await supabase
        .from('profiles')
        .select()
        .eq('id', req.session.user.id)
        .single()
        if(profileErr) {
            console.error(profileErr)
            res.status(400).render('pages/user/favorites', {title: "Favorites", profile: {}, list: {}, items: {}})
        }
        const {data: list, error: listErr} = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', req.session.user.id)
        .eq('kind', 'favorites')
        .single()
        if(listErr) {
            console.error(listErr)
            res.status(400).render('pages/user/favorites', {title: "Favorites", profile, list: {}, items: {}})
        }
        const {data: items, error: itemsErr} = await supabase
        .from('list_items')
        .select('id, media(id, tmdb_id, type, title, description, poster_path), note')
        .eq('list_id', list.id)
        .order('added_at', { ascending: true })
        if(itemsErr) {
            console.error(itemsErr)
            res.status(400).render('pages/user/favorites', {title: "Favorites", profile, list, items: {}})
        }
        const htmlEntities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&#x27;': "'",
        };
        items.forEach(e => {
            e.media.title = e.media.title.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;/g, match => htmlEntities[match])
            e.media.description = e.media.description.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;/g, match => htmlEntities[match])
        });
        res.render('pages/user/favorites', {title: "Favorties", profile, list, items})
    } catch (error) {
        console.error('Error retrieving user favorites:', error);
        res.status(400).render('pages/user/favorites', {title: "Favorites", profile: {}, list: {}, items: {}})
    }
    
})

router.get('/watchlist', requireAuth, async (req, res) => {
    try {
        if(!req.session.user) { res.redirect('/auth/login')}
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        const {data: profile, error: profileErr} = await supabase
        .from('profiles')
        .select()
        .eq('id', req.session.user.id)
        .single()
        if(profileErr) {
            console.error(profileErr)
            res.status(400).render('pages/user/watchlist', {title: "Watchlist", profile: {}, list: {}, items: {}})
        }
        const {data: list, error: listErr} = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', req.session.user.id)
        .eq('kind', 'watchlist')
        .single()
        if(listErr) {
            console.error(listErr)
            res.status(400).render('pages/user/watchlist', {title: "Watchlist", profile, list: {}, items: {}})
        }
        const {data: items, error: itemsErr} = await supabase
        .from('list_items')
        .select('id, media(id, tmdb_id, type, title, description, poster_path), note')
        .eq('list_id', list.id)
        .order('added_at', { ascending: true })
        if(itemsErr) {
            console.error(itemsErr)
            res.status(400).render('pages/user/watchlist', {title: "Watchlist", profile, list, items: {}})
        }
        const htmlEntities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&#x27;': "'",
        };
        items.forEach(e => {
            e.media.title = e.media.title.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;/g, match => htmlEntities[match])
            e.media.description = e.media.description.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;/g, match => htmlEntities[match])
        });

        const {data: progress, error: progressErr} = await supabase
        .from('user_progress')
        .select('media_id, status')
        .eq('user_id', req.session.user.id)
        if(progressErr) {
            console.error(progressErr)
            res.status(400).render('pages/user/watchlist', {title: "Watchlist", profile, list, items: {}})
        }
    
        // Create a map for efficient lookup of objects in array1 by their 'id'
        const itemsmapped = items.reduce((acc, obj) => {
        acc[obj.media.id] = obj;
        return acc;
        }, {});

        // Iterate through array2 and merge with matching objects from array1
        const mergedArray = progress.map(obj2 => {
        const matchingObj1 = itemsmapped[obj2.media_id];
        if (matchingObj1) {
            // If a match is found, merge the objects using the spread operator
            return { ...matchingObj1, ...obj2 };
        } else {
            // If no match, include the object from array2 as is
            return obj2;
        }
        });
        
        res.render('pages/user/watchlist', {title: "Watchlist", profile, list, items:mergedArray})
    } catch (error) {
        console.error('Error retrieving user favorites:', error);
        res.status(400).render('pages/user/watchlist', {title: "Watchlist", profile: {}, list: {}, items: {}})
    }
    
})

router.get('/lists', requireAuth, async (req, res) => {
    try {
        if(!req.session.user) { res.redirect('/auth/login')}
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        const {data: profile, error: profileErr} = await supabase
        .from('profiles')
        .select()
        .eq('id', req.session.user.id)
        .single()
        if(profileErr) {
            console.error(profileErr)
            res.status(400).render('pages/user/lists', {title: "Lists", profile: {}, list: {}})
        }
        const {data: list, error: listErr} = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', req.session.user.id)
        .eq('kind', 'custom')
        if(listErr) {
            console.error(listErr)
            res.status(400).render('pages/user/lists', {title: "Lists", profile, list: {}})
        }
        res.render('pages/user/lists', {title: "Lists", profile, list})
    } catch (error) {
        console.error('Error retrieving user lists:', error);
        res.status(400).render('pages/user/lists', {title: "Lists", profile: {}, list: {}})
    }
    
})

router.get('/lists/new', requireAuth, async (req, res) => {
    try {
        res.render('pages/user/newlist', {title: "New List"})
    } catch (error) {
        console.error('Error retrieving user lists:', error);
        res.status(400).render('pages/user/newlist', {title: "New List"})
    }
    
})


router.get('/lists/:id', requireAuth, async (req, res) => {
    let id = req.params.id;
    try {
        if(!req.session.user) { res.redirect('/auth/login')}
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        const {data: profile, error: profileErr} = await supabase
        .from('profiles')
        .select()
        .eq('id', req.session.user.id)
        .single()
        if(profileErr) {
            console.error(profileErr)
            res.status(400).render('pages/user/list', {title: "List", profile: {}, list: {}, items: {}})
        }
        const {data: list, error: listErr} = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', req.session.user.id)
        .eq('id', id)
        .single()
        if(listErr) {
            console.error(listErr)
            res.status(400).render('pages/user/list', {title: "List", profile, list: {}, items: {}})
        }
        const {data: items, error: itemsErr} = await supabase
        .from('list_items')
        .select('id, media(id, tmdb_id, type, title, description, poster_path), note')
        .eq('list_id', list.id)
        .order('added_at', { ascending: true })
        if(itemsErr) {
            console.error(itemsErr)
            res.status(400).render('pages/user/list', {title: list.name, profile, list, items: {}})
        }
        
        const htmlEntities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&#x27;': "'",
        };
        items.forEach(e => {
            e.media.title = e.media.title.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;/g, match => htmlEntities[match])
            e.media.description = e.media.description.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;/g, match => htmlEntities[match])
        });
        res.render('pages/user/list', {title: list.name, profile, list, items})
    } catch (error) {
        console.error('Error retrieving user favorites:', error);
        res.status(400).render('pages/user/list', {title: "Lists", profile: {}, list: {}, items: {}})
    }
    
})

//update list
router.get('/lists/:id/edit', requireAuth, async (req, res) => {
    let id = req.params.id;
    try {
        if(!req.session.user) { res.redirect('/auth/login')}
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        const {data: list, error: listErr} = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', req.session.user.id)
        .eq('id', id)
        .single()
        if(listErr) {
            console.error(listErr)
            res.status(400).render('pages/pages/user/updatelist', {title: "Edit List", list:{}})
        }
        res.render('pages/user/updatelist', {title: "Edit List", list})
    } catch (error) {
        console.error('Error retrieving user lists:', error);
        res.status(400).render('pages/user/newlist', {title: "Edit List", list: {}})
    }
    
})

module.exports = router;