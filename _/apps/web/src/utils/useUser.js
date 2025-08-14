import * as React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase-auth';

const useUser = () => {
  const { user, session, loading } = useAuth();
  const [userProfile, setUserProfile] = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(false);

  const fetchUserProfile = React.useCallback(async (userId) => {
    if (!userId) return null;
    
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refetchUser = React.useCallback(async () => {
    if (user?.id) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    } else {
      setUserProfile(null);
    }
  }, [user?.id, fetchUserProfile]);

  React.useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  // Combine Supabase auth user with profile data
  const combinedUser = React.useMemo(() => {
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      name: userProfile?.full_name || user.user_metadata?.full_name || user.email,
      image: userProfile?.profile_image || user.user_metadata?.avatar_url,
      emailVerified: user.email_confirmed_at,
      // Add profile data
      ...userProfile
    };
  }, [user, userProfile]);

  return { 
    user: combinedUser, 
    data: combinedUser, 
    loading: loading || profileLoading, 
    refetch: refetchUser,
    session
  };
};

export { useUser };

export default useUser;