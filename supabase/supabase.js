import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Public client (for browser-like usage, limited by RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: admin client for server-side operations that bypass RLS
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export function getAuthenticatedSupabase(accessToken) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  );
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken) {
  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      console.error('Token refresh error:', error);
      return null;
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: data.user
    };
  } catch (error) {
    console.error('Token refresh exception:', error);
    return null;
  }
}

// Check if token needs refresh (within 5 minutes of expiry)
export function shouldRefreshToken(expiresAt) {
  if (!expiresAt) return true;
  
  const expiryTime = new Date(expiresAt * 1000); // Convert Unix timestamp
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;
  
  return (expiryTime - now) < fiveMinutes;
}