-- Function to update user rating statistics
CREATE OR REPLACE FUNCTION update_user_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update rating stats for the reviewee
  INSERT INTO user_rating_stats (user_id, worker_rating, worker_review_count, employer_rating, employer_review_count)
  VALUES (NEW.reviewee_id, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Calculate and update worker rating
  IF NEW.review_type = 'worker' THEN
    UPDATE user_rating_stats 
    SET 
      worker_rating = (
        SELECT ROUND(AVG(rating::DECIMAL), 2) 
        FROM user_reviews 
        WHERE reviewee_id = NEW.reviewee_id AND review_type = 'worker'
      ),
      worker_review_count = (
        SELECT COUNT(*) 
        FROM user_reviews 
        WHERE reviewee_id = NEW.reviewee_id AND review_type = 'worker'
      ),
      last_updated = NOW()
    WHERE user_id = NEW.reviewee_id;
  END IF;

  -- Calculate and update employer rating
  IF NEW.review_type = 'employer' THEN
    UPDATE user_rating_stats 
    SET 
      employer_rating = (
        SELECT ROUND(AVG(rating::DECIMAL), 2) 
        FROM user_reviews 
        WHERE reviewee_id = NEW.reviewee_id AND review_type = 'employer'
      ),
      employer_review_count = (
        SELECT COUNT(*) 
        FROM user_reviews 
        WHERE reviewee_id = NEW.reviewee_id AND review_type = 'employer'
      ),
      last_updated = NOW()
    WHERE user_id = NEW.reviewee_id;
  END IF;

  -- Also update the user_profiles table for backward compatibility
  UPDATE user_profiles 
  SET 
    worker_rating = COALESCE((
      SELECT worker_rating FROM user_rating_stats WHERE user_id = NEW.reviewee_id
    ), 0),
    worker_review_count = COALESCE((
      SELECT worker_review_count FROM user_rating_stats WHERE user_id = NEW.reviewee_id
    ), 0),
    employer_rating = COALESCE((
      SELECT employer_rating FROM user_rating_stats WHERE user_id = NEW.reviewee_id
    ), 0),
    employer_review_count = COALESCE((
      SELECT employer_review_count FROM user_rating_stats WHERE user_id = NEW.reviewee_id
    ), 0),
    updated_at = NOW()
  WHERE user_id = NEW.reviewee_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
CREATE TRIGGER update_rating_stats_trigger
  AFTER INSERT ON user_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_stats();

-- Function to update job completion counts
CREATE OR REPLACE FUNCTION update_job_completion_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update when job status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update job poster's stats
    UPDATE user_profiles 
    SET 
      total_jobs_posted = total_jobs_posted + 1,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;

    -- Update assigned worker's stats
    IF NEW.assigned_to IS NOT NULL THEN
      UPDATE user_profiles 
      SET 
        total_jobs_completed = total_jobs_completed + 1,
        updated_at = NOW()
      WHERE user_id = NEW.assigned_to;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job completion stats
CREATE TRIGGER update_job_completion_trigger
  AFTER UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_completion_stats();

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  INSERT INTO user_rating_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update conversation timestamp when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversation updates
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();