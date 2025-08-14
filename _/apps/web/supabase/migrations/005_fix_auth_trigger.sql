-- Fix the auth trigger to work with Supabase Auth
-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create new function that works with Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile when a new user signs up via Supabase Auth
  INSERT INTO user_profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create rating stats entry
  INSERT INTO user_rating_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on Supabase's auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Also update the sync function for our custom auth_users table (if needed)
DROP TRIGGER IF EXISTS sync_auth_user_trigger ON auth_users;
DROP FUNCTION IF EXISTS sync_auth_user_to_profile();

-- Create function to sync custom auth_users to profiles (for backward compatibility)
CREATE OR REPLACE FUNCTION sync_auth_user_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new auth_user is created, create corresponding user_profile
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_profiles (user_id, full_name)
    VALUES (NEW.id, NEW.name)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO user_rating_stats (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
  END IF;
  
  -- When auth_user is updated, update user_profile
  IF TG_OP = 'UPDATE' THEN
    UPDATE user_profiles 
    SET full_name = NEW.name, updated_at = NOW()
    WHERE user_id = NEW.id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for custom auth_users table
CREATE TRIGGER sync_auth_user_trigger
  AFTER INSERT OR UPDATE ON auth_users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_to_profile();