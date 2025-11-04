const { refreshAccessToken, shouldRefreshToken } = require('../supabase/supabase');

const requireAuth = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  // Check if token needs refresh
  if (shouldRefreshToken(req.session.user.expiresAt)) {
    console.log('Token needs refresh, refreshing...');
    
    const refreshToken = req.session.user.refreshToken;
    
    if (!refreshToken) {
      console.error('No refresh token available');
      return res.redirect('/auth/login');
    }

    // Refresh the token
    const refreshed = await refreshAccessToken(refreshToken);
    
    if (!refreshed) {
      console.error('Token refresh failed');
      req.session.destroy();
      return res.redirect('/auth/login');
    }

    // Update session with new tokens
    req.session.user = {
      ...req.session.user,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: refreshed.expiresAt
    };

    console.log('Token refreshed successfully');
  }

  next();
};

const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
};

module.exports = {
  requireAuth,
  redirectIfAuthenticated
};