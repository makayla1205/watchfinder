const express = require('express');
const router = express.Router();
const myFunctions = require('../utils/functions');
const axios = require('axios');
const token = process.env.ACCESS_TOKEN;
const { requireAuth, redirectIfAuthenticated } = require('../middleware/auth');
const { addItemToList } = require('../utils/userFunctions');
const { getAuthenticatedSupabase } = require('../supabase/supabase');

//add title to list
router.post('/list/add', requireAuth, async (req, res) => {
    if (!req.session.user) { res.status(401).json({message: "Unauthorized"})}
    try {
        const list_id = req.body.list_id
        const tmdb = req.body.tmdb
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        
        const {data: list, error: listErr} = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', req.session.user.id)
        .eq('id', req.body.list_id)
        .single()
        if(listErr) {
            console.error(listErr)
            res.status(400).json({
            success: false,
            error: listErr
        });
        }
        
        let { data: media, error: mediaErr } = await supabase
        .from('media')
        .upsert({
            tmdb_id: tmdb.tmdb_id,
            type: tmdb.type,           
            title: tmdb.title,
            description: tmdb.description,
            poster_path: tmdb.poster_path ?? null,
        }, { onConflict: 'tmdb_id,type' })
        .select()
        .single()
    
        if (mediaErr) {
        console.error('Supabase error:', mediaErr);
            res.status(400).json({
            success: false,
            error: mediaErr
        });
        }
       
        if (!media) {
            const { data: existing, error: fetchErr } = await supabase
              .from('media')
              .select('*')
              .eq('tmdb_id', tmdb.tmdb_id)
              .eq('type', tmdb.type)
              .maybeSingle();
            if (fetchErr) throw fetchErr;
            media = existing;
        }

        if(media && list.kind === "watchlist") {
            let { data: progress, error: progressErr } = await supabase
            .from('user_progress')
            .upsert({
                user_id: req.session.user.id,
                media_id: media.id,           
                status: "planned",
            }, { onConflict: 'user_id,media_id' })
            if (progressErr) {
            console.error('Supabase error:', progressErr);
                res.status(400).json({
                success: false,
                error: progressErr
            });
            }
        }
        

        const { data: item, error: itemErr } = await supabase
        .from('list_items')
        .upsert({
            list_id: list_id,
            media_id: media.id,
            position: tmdb.position ?? null, // we’ll backfill below if null
            note: tmdb.note ?? null
        }, { onConflict: 'list_id,media_id', ignoreDuplicates: true })
    
        if (itemErr) {
        console.error('Supabase error:', itemErr);
            res.status(400).json({
            success: false,
            error: itemErr
        });
        };
       
        res.json({
            success: true,
            message: `${media.title} added to ${list.name}`,
            item: item
        });

    } catch (error) {
        console.error('Error adding item to list:', error);
        res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
});

//remove title from list when given list_item id
router.post('/list/remove', requireAuth, async (req, res) => {
    if (!req.session.user) { res.status(401).json({message: "Unauthorized"})}
    try {
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        
        //delete the item and get list the item belongs to
         let { data: item, error: itemErr } = await supabase
        .from('list_items')
        .delete()
        .eq("id", req.body.itemid )
        .select()
        .maybeSingle()

        //if list is watchlist delete user progress
        let { data: list, error: listErr } = await supabase
        .from('lists')
        .select()
        .eq("id", item.list_id )
        .maybeSingle()
        
        if(list.kind === 'watchlist') {
            let { data: progress, error: progressErr } = await supabase
            .from('user_progress')
            .delete()
            .eq("user_id", req.session.user.id)
            .eq('media_id', item.media_id)
            .maybeSingle()
        }

        //get media title
        let { data: title, error: titleErr } = await supabase
        .from('media')
        .select()
        .eq("id", item.media_id )
        .maybeSingle()

        //delete media if in no other list
        let { data: media, error: mediaErr } = await supabase
        .from('list_items')
        .select()
        .eq("media_id", item.media_id )
        
        if (!media.length >= 1) {
            let { error: err } = await supabase
            .from('media')
            .delete()
            .eq("id", item.media_id )
        }

        return res.json({
            success: true,
            message: `${title.title} removed from ${list.name}`,
            item: item
        });

    } catch (error) {
        console.error('Error removing item from list:', error);
        res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
})

//remove title from list when given media and list id
router.post('/list/remove/media', requireAuth, async (req, res) => {
    if (!req.session.user) { res.status(401).json({message: "Unauthorized"})}
    try {
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)

        //get the media
        let { data, error } = await supabase
        .from('media')
        .select()
        .eq("tmdb_id", req.body.tmdb.tmdb_id )
        .select()
        .maybeSingle()

        //get the list item   
        //delete the item and get list the item belongs to
        let { data: item, error: itemErr } = await supabase
        .from('list_items')
        .delete()
        .eq("list_id", req.body.list_id )
        .eq("media_id", data.id )
        .select()
        .maybeSingle()

        //if list is watchlist delete user progress
        let { data: list, error: listErr } = await supabase
        .from('lists')
        .select()
        .eq("id", item.list_id )
        .maybeSingle()
        
        if(list.kind === 'watchlist') {
            let { data: progress, error: progressErr } = await supabase
            .from('user_progress')
            .delete()
            .eq("user_id", req.session.user.id)
            .eq('media_id', item.media_id)
            .maybeSingle()
        }

        //get media title
        let { data: title, error: titleErr } = await supabase
        .from('media')
        .select()
        .eq("id", item.media_id )
        .maybeSingle()

        //delete media if in no other list
        let { data: media, error: mediaErr } = await supabase
        .from('list_items')
        .select()
        .eq("media_id", item.media_id )
        
        if (!media.length >= 1) {
            let { error: err } = await supabase
            .from('media')
            .delete()
            .eq("id", item.media_id )
        }

        return res.json({
            success: true,
            message: `${title.title} removed from ${list.name}`,
            item: item
        });

    } catch (error) {
        console.error('Error removing item from list:', error);
        res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
})

//create new list
router.post('/list/new', requireAuth, async (req, res) => {
    if (!req.session.user) { res.status(401).json({message: "Unauthorized"})}
    try {
        const name = req.body.name
        const description = req.body.description
        const visibility = req.body.visibility
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        let { data: list, error: listErr } = await supabase
        .from('lists')
        .insert({
            user_id: req.session.user.id,
            kind: 'custom',
            name: name,
            is_default: false,
            visibility: visibility,
            description: description
        })
        .select()
        .single()

        if (listErr) {
        console.error('Supabase error:', listErr);
        return res.status(400).json({
            success: false,
            error: listErr
        });
        }
       
        res.redirect(`/user/lists/${list.id}`)
    } catch (error) {
        console.error('Error creating list:', error);
        res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
});

//delete list
router.post('/list/delete', requireAuth, async (req, res) => {
    if (!req.session.user) { res.status(401).json({message: "Unauthorized"})}
    //console.log(req.body)
    try {
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        //delete item and get media
        let { data: media, error: mediaErr } = await supabase
        .from('list_items')
        .delete()
        .eq("list_id", req.body.listid )
        .select("media_id")

        if (mediaErr) {
        console.error('Supabase error:', mediaErr);
        return res.status(400).json({
            success: false,
            error: mediaErr
        });
        }
        for(var i=0; i < media.length; i++ ) {
            //delete media if in no other list
            let { data: item, error: itemErr } = await supabase
            .from('list_items')
            .select()
            .eq("media_id", media[i].media_id)
            
            if (itemErr) {
            console.error('Supabase error:', itemErr);
            return res.status(400).json({
                success: false,
                error: itemErr
            });
            }
            
            if (!item.length >= 1) {
                let { error: err } = await supabase
                .from('media')
                .delete()
                .eq("id", media[i].media_id )

                if (err) {
                console.error('Supabase error:', err);
                return res.status(400).json({
                    success: false,
                    error: err
                });
                }
            }
        };
        let { data: list, error: listErr } = await supabase
        .from('lists')
        .delete()
        .eq("id", req.body.listid )

        if (listErr) {
        console.error('Supabase error:', listErr);
        return res.status(400).json({
            success: false,
            error: listErr
        });
        }
        res.json({
            success: true,
            message: 'List deleted',
        });

    } catch (error) {
        console.error('Error deleting list:', error);
        res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
})

//update list - name & description
router.post('/list/update', requireAuth, async (req, res) => {
    if (!req.session.user) { res.status(401).json({message: "Unauthorized"})}
    try {
        const id = req.body.id
        const name = req.body.name
        const description = req.body.description
        const visibility = req.body.visibility
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        let { data: list, error: listErr } = await supabase
        .from('lists')
        .update({
            name: name,
            visibility: visibility,
            description: description
        })
        .eq("id", id)
        .select()
    
        if (listErr) {
        console.error('Supabase error:', listErr);
        return res.status(400).json({
            success: false,
            error: listErr
        });
        }
       
        res.redirect(`/user/lists/${id}`)
    } catch (error) {
        console.error('Error creating list:', error);
        res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
});

//update watchlist item status
router.post('/list/update/progress', requireAuth, async (req, res) => {
    if (!req.session.user) { res.status(401).json({message: "Unauthorized"})}
    try {
        console.log(req.body)
        const id = req.body.id
        const status = req.body.status
        
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        let { data: item, error: itemErr } = await supabase
        .from('user_progress')
        .update({
            status: status
        })
        .eq("media_id", id)
        .eq("user_id", req.session.user.id)
        .select()
    
        if (itemErr) {
        console.error('Supabase error:', itemErr);
        return res.status(400).json({
            success: false,
            error: itemErr
        });
        }
       
        res.json({
            success: true,
            message: 'Item Updated',
            //item: item
        });

    } catch (error) {
        console.error('Error creating list:', error);
        res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
});

//update profile 
router.post('/profile/update', requireAuth, async (req, res) => {
    if (!req.session.user) { res.status(401).json({message: "Unauthorized"})}
    const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
    try {
        const username = req.body.username
        const language = req.body.language
        const region = req.body.region

        const { data:user, error:userErr } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .neq('id', req.session.user.id)
        .maybeSingle();
        
        if (user) { 
            console.error('Username Not available');
            res.json({
                success: false,
                error: 'Username Not Available',
            });
            return
        }
    
        let { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .update({
            username: username,
            language: language,
            country: region
        })
        .eq("id", req.session.user.id)
        .select()
    
        if (profileErr) {
            console.error('Supabase error:', profileErr);
            res.json({
                success: false,
                error: profileErr,
            });
            return
        }

        res.json({
            success: true,
            message: 'Profile Updated',
        });

    } catch (error) {
        console.error('Error Updating Profile:', error);
        res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
});

//reset password

//reset email

//delete account


//check if title is in any user list
router.post('/lists/media', requireAuth, async (req, res) => {
    try {
        const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
        //get media id
        const { data: media, error: mediaErr } = await supabase
        .from('media')
        .select('id')
        .eq('tmdb_id', req.body.tmdbid )
        .maybeSingle()

        if (media) {
             //get all user lists that have that media
            const { data, error } = await supabase
            .from('lists') // The table you want to retrieve rows from
            .select('*, list_items!inner(*)') // Select all columns from your_main_table and inner join with related_table
            .eq('list_items.media_id', media.id)// Filter on a column in the related_table
            .eq('user_id', req.session.user.id)

            if(data){
                console.log(data)
                res.json({
                success: true,
                found: true,
                data: data
                });
                return
            }
        }

        res.json({
            success: true,
            found: false,
            data: null
        });
    } catch (error) {
        console.error('Error getting media:', error);
        res.status(500).json({
        success: false,
        found: false,
        error: 'Internal server error'
        });
    }
})

//get all of a users lists
router.get('/lists', requireAuth, async (req, res) => {
    const supabase = getAuthenticatedSupabase(req.session.user.accessToken)
    try {
        const {data: lists, error: listErr} = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', req.session.user.id)
        
        res.json({
        success: true,
        lists: lists
        });

    } catch (error) {
        console.error('Error adding item to list:', error);
        res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
})

//get streaming sources for title
router.get('/sources', async (req, res) => {
    const id = req.query.id;
    const type = req.query.type;
    try {
        //console.log(res.data)
        //res.json(await myFunctions.getStreamingSource(id, type));
        res.json([{}])
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//get search results for query
router.get('/search', async (req, res) => {
    let searchTerm = String(req.query.searchTerm || "").trim();
    if (!searchTerm) return res.json([]);
    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=30");
    const result = await axios.get(`https://api.themoviedb.org/3/search/multi?query=${searchTerm}&include_adult=false&language=en-US&page=1`, {
                headers: {
                Authorization: `Bearer ${token}`
                }
            });
    const data = result.data.results;
    res.json(myFunctions.thin(data))
})


module.exports = router;