-- Create table for message reactions
CREATE TABLE IF NOT EXISTS group_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE group_message_reactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Group members can view reactions"
ON group_message_reactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_messages gm
    WHERE gm.id = message_id
    AND is_group_member(auth.uid(), gm.group_id)
  )
);

CREATE POLICY "Group members can add reactions"
ON group_message_reactions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM group_messages gm
    WHERE gm.id = message_id
    AND is_group_member(auth.uid(), gm.group_id)
  )
);

CREATE POLICY "Users can remove their own reactions"
ON group_message_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id 
ON group_message_reactions(message_id);

CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id 
ON group_message_reactions(user_id);