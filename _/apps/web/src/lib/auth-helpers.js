import { supabaseAdmin } from './supabase-server.js';

// Helper function to get user from request headers (for API routes)
export async function getUser(request) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      return { user: null, error: error.message };
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
}

// Alternative helper that mimics the old auth() function
export async function auth(request) {
  const { user, error } = await getUser(request);
  
  if (error || !user) {
    return null;
  }

  // Return in the same format as the old auth system
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email
    }
  };
}

export default auth;