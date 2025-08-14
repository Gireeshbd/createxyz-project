-- Auth.js tables for custom authentication
-- These work alongside Supabase Auth for backward compatibility

CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  "emailVerified" TIMESTAMP WITH TIME ZONE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  provider VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  access_token TEXT,
  expires_at INTEGER,
  refresh_token TEXT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sessionToken" VARCHAR(255) UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_verification_token (
  identifier VARCHAR(255) NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  token VARCHAR(255) NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_accounts_user_id ON auth_accounts("userId");
CREATE INDEX IF NOT EXISTS idx_auth_accounts_provider ON auth_accounts(provider, "providerAccountId");
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions("userId");
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions("sessionToken");

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_auth_users_updated_at BEFORE UPDATE ON auth_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to sync auth_users with user_profiles
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
$$ LANGUAGE plpgsql;

-- Create trigger for auth user sync
CREATE TRIGGER sync_auth_user_trigger
  AFTER INSERT OR UPDATE ON auth_users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_to_profile();