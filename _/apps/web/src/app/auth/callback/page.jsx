import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase-auth';

export default function AuthCallback() {

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          window.location.href = '/account/signin?error=callback_error';
          return;
        }

        if (data.session) {
          // Get the redirect URL from the URL params or default to home
          const redirectTo = typeof window !== 'undefined' 
            ? new URLSearchParams(window.location.search).get('redirect_to') || '/'
            : '/';
          
          console.log('Auth callback successful, redirecting to:', redirectTo);
          window.location.href = redirectTo;
        } else {
          // No session found, redirect to sign in
          window.location.href = '/account/signin';
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        window.location.href = '/account/signin?error=unexpected_error';
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}