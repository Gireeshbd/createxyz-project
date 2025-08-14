-- Disable the automatic trigger and handle profile creation manually
-- This avoids permission issues with auth.users table

-- Drop the trigger that might be causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a function that can be called manually from the application
CREATE OR REPLACE FUNCTION create_user_profile(user_id UUID, full_name TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  -- Create user profile
  INSERT INTO user_profiles (user_id, full_name)
  VALUES (
    user_id, 
    COALESCE(full_name, 'New User')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    updated_at = NOW();
  
  -- Create rating stats entry
  INSERT INTO user_rating_stats (user_id)
  VALUES (user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT) TO authenticated;