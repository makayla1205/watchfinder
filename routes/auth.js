const express = require('express');
const router = express.Router();
const { requireAuth, redirectIfAuthenticated } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('pages/auth/login', { 
    title: 'Login',
    error: null 
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.render('pages/auth/login', {
        title: 'Login',
        error: error.message
      });
    }

    // Store user in session
    req.session.user = {
      id: data.user.id,
      email: data.user.email,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at // Unix timestamp
    };

    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.render('pages/auth/login', {
      title: 'Login',
      error: 'An unexpected error occurred'
    });
  }
});

// Signup page
router.get('/signup', redirectIfAuthenticated, (req, res) => {
  res.render('pages/auth/signup', { 
    title: 'Sign Up',
    error: null 
  });
});

// Signup POST
router.post('/signup', async (req, res) => {
  const { email, password, username } = req.body;

  try {
    const { data:user, error:userErr } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

      if (user) { 
        res.render('pages/auth/signup', {
          title: 'Sign Up',
          email, username,
          error: 'Username not Available'
        });
      }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      username
    });

    if (error) {
      return res.render('pages/auth/signup', {
        title: 'Sign Up',
        email, username,
        error: error.message
      });
    }

    // Store user in session
    req.session.user = {
      id: data.user.id,
      email: data.user.email,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token
    };

    res.redirect('/');
  } catch (err) {
    console.error('Signup error:', err);
    res.render('pages/auth/signup', {
      title: 'Sign Up',
      error: 'An unexpected error occurred'
    });
  }
});

// Logout
router.get('/logout', async (req, res) => {
  try {
    // Sign out from Supabase if we have an access token
    if (req.session.user?.accessToken) {
      await supabase.auth.signOut();
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.redirect('/auth/login');
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.redirect('/');
  }
});

// Get current session/user (API endpoint)
router.get('/session', (req, res) => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.user.id,
        email: req.session.user.email
      }
    });
  } else {
    res.json({
      authenticated: false,
      user: null
    });
  }
});

router.post('/refresh', async (req, res) => {
  if (!req.session.user || !req.session.user.refreshToken) {
    return res.status(401).json({
      success: false,
      error: 'No refresh token available'
    });
  }

  try {
    const refreshed = await refreshAccessToken(req.session.user.refreshToken);

    if (!refreshed) {
      // Refresh failed, clear session
      req.session.destroy();
      return res.status(401).json({
        success: false,
        error: 'Token refresh failed. Please log in again.'
      });
    }

    // Update session
    req.session.user = {
      ...req.session.user,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: refreshed.expiresAt
    };

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      expiresAt: refreshed.expiresAt
    });
  } catch (error) {
    console.error('Refresh endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});


module.exports = router;