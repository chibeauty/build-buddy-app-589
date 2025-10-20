-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create study_groups table
CREATE TABLE public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create shared_content table
CREATE TABLE public.shared_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create content_likes table
CREATE TABLE public.content_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.shared_content(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Achievements are viewable by everyone"
  ON public.achievements FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for study_groups
CREATE POLICY "Public groups are viewable by everyone"
  ON public.study_groups FOR SELECT
  USING (is_public = true OR created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = study_groups.id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create study groups"
  ON public.study_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
  ON public.study_groups FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
  ON public.study_groups FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for group_members
CREATE POLICY "Group members are viewable by group members"
  ON public.group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.study_groups sg
    WHERE sg.id = group_members.group_id AND sg.is_public = true
  ));

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for shared_content
CREATE POLICY "Shared content is viewable by everyone"
  ON public.shared_content FOR SELECT
  USING (true);

CREATE POLICY "Users can share their own content"
  ON public.shared_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their shared content"
  ON public.shared_content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their shared content"
  ON public.shared_content FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for content_likes
CREATE POLICY "Likes are viewable by everyone"
  ON public.content_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like content"
  ON public.content_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike content"
  ON public.content_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for study_groups updated_at
CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES
  ('First Steps', 'Complete your first study session', 'Footprints', 'Getting Started', 'study_sessions', 1, 10),
  ('Quiz Master', 'Complete 10 quizzes', 'Brain', 'Quizzes', 'quiz_attempts', 10, 50),
  ('Perfect Score', 'Score 100% on a quiz', 'Trophy', 'Quizzes', 'perfect_score', 1, 100),
  ('Week Warrior', 'Maintain a 7-day study streak', 'Flame', 'Consistency', 'study_streak', 7, 75),
  ('Flashcard Pro', 'Create 50 flashcards', 'BookOpen', 'Flashcards', 'flashcards_created', 50, 50),
  ('Study Planner', 'Create 5 study plans', 'Calendar', 'Planning', 'study_plans', 5, 30),
  ('Community Helper', 'Share 10 pieces of content', 'Users', 'Community', 'shared_content', 10, 40),
  ('Knowledge Seeker', 'Earn 1000 XP', 'Award', 'Progress', 'xp_points', 1000, 100);