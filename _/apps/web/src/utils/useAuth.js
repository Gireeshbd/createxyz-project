import { useCallback } from 'react';
import { useAuth as useSupabaseAuth } from '../contexts/AuthContext';

function useAuth() {
  const { 
    signIn, 
    signUp, 
    signInWithProvider, 
    signOut: supabaseSignOut,
    loading 
  } = useSupabaseAuth();

  const callbackUrl = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('callbackUrl')
    : null;

  const signInWithCredentials = useCallback(async (options) => {
    const { email, password, redirect = true } = options;
    const result = await signIn(email, password);
    
    if (result.data && !result.error && redirect) {
      const redirectUrl = callbackUrl || options.callbackUrl || '/';
      window.location.href = redirectUrl;
    }
    
    return result;
  }, [signIn, callbackUrl]);

  const signUpWithCredentials = useCallback(async (options) => {
    const { email, password, name, redirect = true } = options;
    const result = await signUp(email, password, {
      metadata: { full_name: name }
    });
    
    if (result.data && !result.error && redirect) {
      const redirectUrl = callbackUrl || options.callbackUrl || '/';
      window.location.href = redirectUrl;
    }
    
    return result;
  }, [signUp, callbackUrl]);

  const signInWithGoogle = useCallback(async (options = {}) => {
    const redirectTo = callbackUrl || options.callbackUrl || `${window.location.origin}/auth/callback`;
    return await signInWithProvider('google', { redirectTo });
  }, [signInWithProvider, callbackUrl]);

  const signInWithFacebook = useCallback(async (options = {}) => {
    const redirectTo = callbackUrl || options.callbackUrl || `${window.location.origin}/auth/callback`;
    return await signInWithProvider('facebook', { redirectTo });
  }, [signInWithProvider, callbackUrl]);

  const signInWithTwitter = useCallback(async (options = {}) => {
    const redirectTo = callbackUrl || options.callbackUrl || `${window.location.origin}/auth/callback`;
    return await signInWithProvider('twitter', { redirectTo });
  }, [signInWithProvider, callbackUrl]);

  const signOut = useCallback(async () => {
    const result = await supabaseSignOut();
    if (!result.error) {
      window.location.href = '/';
    }
    return result;
  }, [supabaseSignOut]);

  return {
    signInWithCredentials,
    signUpWithCredentials,
    signInWithGoogle,
    signInWithFacebook,
    signInWithTwitter,
    signOut,
    loading
  };
}

export default useAuth;