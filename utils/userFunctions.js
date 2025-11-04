const { supabase } = require('../supabase/supabase');
const { getAuthenticatedSupabase } = require('../supabase/supabase');


// Get user profile
async function getProfileByUserId(userId) {
    const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return { error: error.message };
  return(data)
}

//get user lists
async function getListsByUserId(userId) {
    const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('user_id', userId)

  if (error) return { error: error.message };
  return(data)
}

// Create a list
async function createList (userId, name, description, visibility) {
    const { data, error } = await supabase
    .from('lists')
    .insert({
      user_id: userId,
      kind: 'custom',
      name: name,
      description: description,
      is_default: false,
      visibility: visibility
    })
  if (error) return { error: error.message };
  return(data)
}

// Update a list
async function updateList (listId, name, description, visibility) {
    const { data, error } = await supabase
    .from('lists')
    .update({
      name: name,
      description: description,
      visibility: visibility
    })
    .eq('id', listId)

  if (error) return { error: error.message };
  return(data)
}

// Delete a list
async function deleteList (listId, userId) {
    const { data, error } = await supabase
    .from('lists')
    .delete()
    .eq('id', listId)
    .eq('user_id', userId)

  if (error) return { error: error.message };
  return(data)
}

// Get list & items in list
async function getListAndItems (listId, userId) {
  const { data: list, error: listErr } = await supabase
  .from('lists')
  .select('id, name, description, visibility, created_at')
  .eq('id', listId)
  .eq('user_id', userId)
  .maybeSingle()
  if (listErr) return ({ error: listErr.message });
  if (!list) return ({ error: 'List not found' });

  const { data: items, error: itemsErr } = await supabase
    .from('list_items')
    .select('id, list_id, media_tmdb_id, position, note, created_at, media:media_tmdb_id ( tmdb_id, title, poster_path, backdrop_path )')
    .eq('list_id', listId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true }); // secondary order

  if (itemsErr) return res.status(400).json({ error: itemsErr.message });

  if (error) return { error: error.message };
  return({list, items})
}

//add items to list 
async function addItemToList(listId, tmdb) {
  const { error: mediaErr } = await supabase
    .from('media')
    .upsert({
      tmdb_id: tmdb.tmdb_id,
      type: tmdb.type,            // 'movie' | 'tv'
      title: tmdb.title,
      poster_path: tmdb.poster_path ?? null,
    }, { onConflict: 'tmdb_id,type' });

  if (mediaErr) return mediaErr;
  console.log("done")

  // 2) Upsert list item with unique (list_id, media_tmdb_id)
  //    ignoreDuplicates makes this idempotent. If it already exists, we fetch it.
  let { data: item, error: uErr } = await supabase
    .from('list_items')
    .upsert({
      list_id: listId,
      media_id: tmdb.tmdb_id,
      position: tmdb.position ?? null, // we’ll backfill below if null
      note: tmdb.note ?? null
    }, { onConflict: 'list_id,media_id', ignoreDuplicates: true })
    .select()
    .maybeSingle();

  if (uErr) return uErr;

  console.log(item)

  // If upsert ignored due to duplicate, item will be null -> fetch existing row
  if (!item) {
    const { data: existing, error: fetchErr } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', listId)
      .eq('media_id', tmdb.tmdb_id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    item = existing;
  }

  // Optional: if position was null and this is a brand-new row, assign a tail position
  if (item && item.position == null) {
    const { data: maxPosRows } = await supabase
      .from('list_items')
      .select('position')
      .eq('list_id', listId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPos = ((maxPosRows?.[0]?.position ?? 0) + 1);
    const { data: updated } = await supabase
      .from('list_items')
      .update({ position: nextPos })
      .eq('id', item.id)
      .select()
      .single();
    item = updated ?? item;
  }

  return item;
}


//remove items from list


module.exports = { 
    getProfileByUserId,
    getListsByUserId,
    createList,
    updateList,
    deleteList,
    getListAndItems,
    addItemToList,
};