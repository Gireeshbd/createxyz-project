-- Enable Row Level Security on all tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rating_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_earnings ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Jobs are viewable by everyone" ON jobs
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs" ON jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Job applications policies
CREATE POLICY "Applications viewable by job owner and applicant" ON job_applications
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = (SELECT user_id FROM jobs WHERE id = job_id)
  );

CREATE POLICY "Users can create applications" ON job_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" ON job_applications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Job owners can update application status" ON job_applications
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM jobs WHERE id = job_id)
  );

-- User profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- User reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON user_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for completed jobs" ON user_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE id = job_id 
      AND status = 'completed'
      AND (user_id = auth.uid() OR assigned_to = auth.uid())
    )
  );

-- User rating stats policies
CREATE POLICY "Rating stats are viewable by everyone" ON user_rating_stats
  FOR SELECT USING (true);

CREATE POLICY "System can manage rating stats" ON user_rating_stats
  FOR ALL USING (true);

-- Conversations policies
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = employer_id OR auth.uid() = worker_id
  );

CREATE POLICY "Users can create conversations for jobs they're involved in" ON conversations
  FOR INSERT WITH CHECK (
    (auth.uid() = employer_id AND EXISTS (
      SELECT 1 FROM jobs WHERE id = job_id AND user_id = auth.uid()
    )) OR
    (auth.uid() = worker_id AND EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_id = conversations.job_id AND user_id = auth.uid()
    ))
  );

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (employer_id = auth.uid() OR worker_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (employer_id = auth.uid() OR worker_id = auth.uid())
    )
  );

CREATE POLICY "Users can update read status of messages" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (employer_id = auth.uid() OR worker_id = auth.uid())
    )
  );

-- File attachments policies
CREATE POLICY "Users can view attachments they have access to" ON file_attachments
  FOR SELECT USING (
    auth.uid() = user_id OR
    (message_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_id 
      AND (c.employer_id = auth.uid() OR c.worker_id = auth.uid())
    )) OR
    (job_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM jobs WHERE id = job_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can upload their own attachments" ON file_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (
    auth.uid() = payer_id OR auth.uid() = payee_id
  );

CREATE POLICY "System can manage payments" ON payments
  FOR ALL USING (true);

-- User payment methods policies
CREATE POLICY "Users can manage their own payment methods" ON user_payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- User earnings policies
CREATE POLICY "Users can view their own earnings" ON user_earnings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage earnings" ON user_earnings
  FOR ALL USING (true);