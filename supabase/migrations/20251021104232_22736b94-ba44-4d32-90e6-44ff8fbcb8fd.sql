-- Add reply_to column to group_messages table
ALTER TABLE group_messages
ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES group_messages(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_group_messages_reply_to 
ON group_messages(reply_to);

-- Add index for fetching messages with their replies
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created 
ON group_messages(group_id, created_at);