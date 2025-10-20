-- Function to award XP and check for level-up achievements
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id UUID,
  _xp_amount INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_xp INTEGER;
  _new_xp INTEGER;
BEGIN
  -- Get current XP
  SELECT xp_points INTO _current_xp
  FROM profiles
  WHERE id = _user_id;
  
  -- Calculate new XP
  _new_xp := COALESCE(_current_xp, 0) + _xp_amount;
  
  -- Update profile with new XP
  UPDATE profiles
  SET xp_points = _new_xp
  WHERE id = _user_id;
  
  -- Check for XP-based achievements
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT _user_id, a.id
  FROM achievements a
  WHERE a.requirement_type = 'xp_points'
    AND _new_xp >= a.requirement_value
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = _user_id AND ua.achievement_id = a.id
    );
END;
$$;

-- Function to update study streak
CREATE OR REPLACE FUNCTION public.update_study_streak(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _last_study_date DATE;
  _current_streak INTEGER;
  _new_streak INTEGER;
BEGIN
  -- Get current streak and last study date
  SELECT study_streak, last_study_date::DATE INTO _current_streak, _last_study_date
  FROM profiles
  WHERE id = _user_id;
  
  -- Calculate new streak
  IF _last_study_date IS NULL OR _last_study_date < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Streak broken or first time studying
    _new_streak := 1;
  ELSIF _last_study_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Continuing streak
    _new_streak := COALESCE(_current_streak, 0) + 1;
  ELSE
    -- Already studied today
    _new_streak := COALESCE(_current_streak, 1);
  END IF;
  
  -- Update profile
  UPDATE profiles
  SET study_streak = _new_streak,
      last_study_date = CURRENT_TIMESTAMP
  WHERE id = _user_id;
  
  -- Check for streak achievements
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT _user_id, a.id
  FROM achievements a
  WHERE a.requirement_type = 'study_streak'
    AND _new_streak >= a.requirement_value
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = _user_id AND ua.achievement_id = a.id
    );
    
  -- Award XP for maintaining streak
  PERFORM award_xp(_user_id, 5);
END;
$$;

-- Function to check quiz achievements
CREATE OR REPLACE FUNCTION public.check_quiz_achievements(_user_id UUID, _score INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _quiz_count INTEGER;
BEGIN
  -- Count total quiz attempts
  SELECT COUNT(*) INTO _quiz_count
  FROM quiz_attempts
  WHERE user_id = _user_id;
  
  -- Check for quiz count achievements
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT _user_id, a.id
  FROM achievements a
  WHERE a.requirement_type = 'quiz_attempts'
    AND _quiz_count >= a.requirement_value
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = _user_id AND ua.achievement_id = a.id
    );
  
  -- Check for perfect score achievement
  IF _score = 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT _user_id, a.id
    FROM achievements a
    WHERE a.requirement_type = 'perfect_score'
      AND NOT EXISTS (
        SELECT 1 FROM user_achievements ua
        WHERE ua.user_id = _user_id AND ua.achievement_id = a.id
      );
  END IF;
END;
$$;

-- Trigger to award XP and update streak when quiz is completed
CREATE OR REPLACE FUNCTION public.handle_quiz_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award XP based on score
  PERFORM award_xp(NEW.user_id, GREATEST(10, NEW.score_percentage / 5));
  
  -- Update study streak
  PERFORM update_study_streak(NEW.user_id);
  
  -- Check for quiz achievements
  PERFORM check_quiz_achievements(NEW.user_id, NEW.score_percentage);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_quiz_attempt_completed
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION handle_quiz_completion();

-- Trigger to check achievements when study plan is created
CREATE OR REPLACE FUNCTION public.handle_study_plan_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan_count INTEGER;
BEGIN
  -- Count total study plans
  SELECT COUNT(*) INTO _plan_count
  FROM study_plans
  WHERE user_id = NEW.user_id;
  
  -- Check for study plan achievements
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT NEW.user_id, a.id
  FROM achievements a
  WHERE a.requirement_type = 'study_plans'
    AND _plan_count >= a.requirement_value
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = NEW.user_id AND ua.achievement_id = a.id
    );
  
  -- Award XP
  PERFORM award_xp(NEW.user_id, 15);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_study_plan_created
  AFTER INSERT ON study_plans
  FOR EACH ROW
  EXECUTE FUNCTION handle_study_plan_created();

-- Trigger to award XP when flashcard deck is created
CREATE OR REPLACE FUNCTION public.handle_flashcard_deck_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM award_xp(NEW.user_id, 10);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_flashcard_deck_created
  AFTER INSERT ON flashcard_decks
  FOR EACH ROW
  EXECUTE FUNCTION handle_flashcard_deck_created();

-- Trigger to check achievements when content is shared
CREATE OR REPLACE FUNCTION public.handle_content_shared()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _shared_count INTEGER;
BEGIN
  -- Count total shared content
  SELECT COUNT(*) INTO _shared_count
  FROM shared_content
  WHERE user_id = NEW.user_id;
  
  -- Check for sharing achievements
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT NEW.user_id, a.id
  FROM achievements a
  WHERE a.requirement_type = 'shared_content'
    AND _shared_count >= a.requirement_value
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = NEW.user_id AND ua.achievement_id = a.id
    );
  
  -- Award XP
  PERFORM award_xp(NEW.user_id, 20);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_content_shared
  AFTER INSERT ON shared_content
  FOR EACH ROW
  EXECUTE FUNCTION handle_content_shared();

-- Trigger to award achievement XP when unlocked
CREATE OR REPLACE FUNCTION public.handle_achievement_unlocked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _xp_reward INTEGER;
BEGIN
  -- Get XP reward for the achievement
  SELECT xp_reward INTO _xp_reward
  FROM achievements
  WHERE id = NEW.achievement_id;
  
  -- Award the XP
  PERFORM award_xp(NEW.user_id, _xp_reward);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_achievement_unlocked
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION handle_achievement_unlocked();