-- Add mentions column to group_messages table
ALTER TABLE group_messages
ADD COLUMN IF NOT EXISTS mentions uuid[] DEFAULT '{}';

-- Add index for better query performance on mentions
CREATE INDEX IF NOT EXISTS idx_group_messages_mentions 
ON group_messages USING GIN(mentions);

-- Create function to notify mentioned users
CREATE OR REPLACE FUNCTION notify_mentioned_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentioned_user_id uuid;
  sender_name text;
  group_name text;
BEGIN
  -- Get sender's name
  SELECT full_name INTO sender_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Get group name
  SELECT name INTO group_name
  FROM study_groups
  WHERE id = NEW.group_id;
  
  -- Create notification for each mentioned user
  IF NEW.mentions IS NOT NULL THEN
    FOREACH mentioned_user_id IN ARRAY NEW.mentions
    LOOP
      -- Don't notify if user mentions themselves
      IF mentioned_user_id != NEW.user_id THEN
        PERFORM create_notification(
          mentioned_user_id,
          'mention',
          COALESCE(sender_name, 'Someone') || ' mentioned you',
          'You were mentioned in ' || COALESCE(group_name, 'a group'),
          '/community/groups/' || NEW.group_id
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for mentions
DROP TRIGGER IF EXISTS on_message_mention ON group_messages;
CREATE TRIGGER on_message_mention
  AFTER INSERT ON group_messages
  FOR EACH ROW
  WHEN (NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0)
  EXECUTE FUNCTION notify_mentioned_users();