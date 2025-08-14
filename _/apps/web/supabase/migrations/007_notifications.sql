-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
  'job_application',
  'application_accepted',
  'application_rejected',
  'job_completed',
  'new_message',
  'new_review',
  'payment_received',
  'payment_released'
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  job_application_notifications BOOLEAN DEFAULT TRUE,
  message_notifications BOOLEAN DEFAULT TRUE,
  review_notifications BOOLEAN DEFAULT TRUE,
  payment_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for notification preferences
CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Triggers
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title VARCHAR(255),
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$ LANGUAGE plpgsql;

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to create default notification preferences
CREATE TRIGGER create_notification_preferences_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Function to send job application notification
CREATE OR REPLACE FUNCTION notify_job_application()
RETURNS TRIGGER AS $
BEGIN
  -- Notify job owner about new application
  PERFORM create_notification(
    (SELECT user_id FROM jobs WHERE id = NEW.job_id),
    'job_application',
    'New Job Application',
    'Someone applied to your job: ' || (SELECT title FROM jobs WHERE id = NEW.job_id),
    jsonb_build_object(
      'job_id', NEW.job_id,
      'application_id', NEW.id,
      'applicant_id', NEW.user_id
    )
  );
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger for job application notifications
CREATE TRIGGER job_application_notification_trigger
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_job_application();

-- Function to send application status change notification
CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER AS $
BEGIN
  -- Only notify if status actually changed
  IF OLD.status != NEW.status THEN
    -- Notify applicant about status change
    PERFORM create_notification(
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'application_accepted'
        WHEN NEW.status = 'rejected' THEN 'application_rejected'
        ELSE 'job_application'
      END,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Application Accepted!'
        WHEN NEW.status = 'rejected' THEN 'Application Update'
        ELSE 'Application Status Changed'
      END,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Congratulations! Your application has been accepted for: ' || (SELECT title FROM jobs WHERE id = NEW.job_id)
        WHEN NEW.status = 'rejected' THEN 'Your application status has been updated for: ' || (SELECT title FROM jobs WHERE id = NEW.job_id)
        ELSE 'Your application status has changed to: ' || NEW.status
      END,
      jsonb_build_object(
        'job_id', NEW.job_id,
        'application_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger for application status change notifications
CREATE TRIGGER application_status_notification_trigger
  AFTER UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_status_change();

-- Function to send new message notification
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $
BEGIN
  -- Notify the other person in the conversation
  PERFORM create_notification(
    CASE 
      WHEN c.employer_id = NEW.sender_id THEN c.worker_id
      ELSE c.employer_id
    END,
    'new_message',
    'New Message',
    'You have a new message about: ' || j.title,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'sender_id', NEW.sender_id,
      'job_id', c.job_id
    )
  )
  FROM conversations c
  JOIN jobs j ON c.job_id = j.id
  WHERE c.id = NEW.conversation_id;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger for new message notifications
CREATE TRIGGER new_message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Function to send new review notification
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $
BEGIN
  -- Notify the person being reviewed
  PERFORM create_notification(
    NEW.reviewee_id,
    'new_review',
    'New Review Received',
    'You received a new ' || NEW.review_type || ' review (' || NEW.rating || ' stars)',
    jsonb_build_object(
      'review_id', NEW.id,
      'job_id', NEW.job_id,
      'reviewer_id', NEW.reviewer_id,
      'rating', NEW.rating,
      'review_type', NEW.review_type
    )
  );
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger for new review notifications
CREATE TRIGGER new_review_notification_trigger
  AFTER INSERT ON user_reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_review();