-- Create group_messages table for chat functionality
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Only group members can view messages
CREATE POLICY "Group members can view messages"
ON public.group_messages
FOR SELECT
TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

-- Policy: Only group members can send messages
CREATE POLICY "Group members can send messages"
ON public.group_messages
FOR INSERT
TO authenticated
WITH CHECK (public.is_group_member(auth.uid(), group_id));

-- Add trigger for updated_at
CREATE TRIGGER update_group_messages_updated_at
BEFORE UPDATE ON public.group_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for group_messages
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;