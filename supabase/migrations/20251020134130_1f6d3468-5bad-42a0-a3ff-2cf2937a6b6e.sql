-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_quiz_attempt_completed ON quiz_attempts;
DROP TRIGGER IF EXISTS on_study_plan_created ON study_plans;
DROP TRIGGER IF EXISTS on_flashcard_deck_created ON flashcard_decks;
DROP TRIGGER IF EXISTS on_content_shared ON shared_content;
DROP TRIGGER IF EXISTS on_achievement_unlocked ON user_achievements;

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
  SELECT xp_points INTO _current_xp FROM profiles WHERE id = _user_id;
  _new_xp := COALESCE(_current_xp, 0) + _xp_amount;
  
  UPDATE profiles SET xp_points = _new_xp WHERE id = _user_id;
  
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT _user_id, a.id FROM achievements a
  WHERE a.requirement_type = 'xp_points' AND _new_xp >= a.requirement_value
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = _user_id AND ua.achievement_id = a.id);
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
  SELECT study_streak, last_study_date::DATE INTO _current_streak, _last_study_date
  FROM profiles WHERE id = _user_id;
  
  IF _last_study_date IS NULL OR _last_study_date < CURRENT_DATE - INTERVAL '1 day' THEN
    _new_streak := 1;
  ELSIF _last_study_date = CURRENT_DATE - INTERVAL '1 day' THEN
    _new_streak := COALESCE(_current_streak, 0) + 1;
  ELSE
    _new_streak := COALESCE(_current_streak, 1);
  END IF;
  
  UPDATE profiles SET study_streak = _new_streak, last_study_date = CURRENT_TIMESTAMP WHERE id = _user_id;
  
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT _user_id, a.id FROM achievements a
  WHERE a.requirement_type = 'study_streak' AND _new_streak >= a.requirement_value
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = _user_id AND ua.achievement_id = a.id);
    
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
  SELECT COUNT(*) INTO _quiz_count FROM quiz_attempts WHERE user_id = _user_id;
  
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT _user_id, a.id FROM achievements a
  WHERE a.requirement_type = 'quiz_attempts' AND _quiz_count >= a.requirement_value
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = _user_id AND ua.achievement_id = a.id);
  
  IF _score = 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT _user_id, a.id FROM achievements a
    WHERE a.requirement_type = 'perfect_score'
      AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = _user_id AND ua.achievement_id = a.id);
  END IF;
END;
$$;

-- Trigger functions
CREATE OR REPLACE FUNCTION public.handle_quiz_completion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM award_xp(NEW.user_id, GREATEST(10, NEW.score_percentage / 5));
  PERFORM update_study_streak(NEW.user_id);
  PERFORM check_quiz_achievements(NEW.user_id, NEW.score_percentage);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_study_plan_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO _plan_count FROM study_plans WHERE user_id = NEW.user_id;
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT NEW.user_id, a.id FROM achievements a
  WHERE a.requirement_type = 'study_plans' AND _plan_count >= a.requirement_value
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = NEW.user_id AND ua.achievement_id = a.id);
  PERFORM award_xp(NEW.user_id, 15);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_flashcard_deck_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM award_xp(NEW.user_id, 10);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_content_shared()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _shared_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO _shared_count FROM shared_content WHERE user_id = NEW.user_id;
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT NEW.user_id, a.id FROM achievements a
  WHERE a.requirement_type = 'shared_content' AND _shared_count >= a.requirement_value
    AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = NEW.user_id AND ua.achievement_id = a.id);
  PERFORM award_xp(NEW.user_id, 20);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_achievement_unlocked()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _xp_reward INTEGER;
BEGIN
  SELECT xp_reward INTO _xp_reward FROM achievements WHERE id = NEW.achievement_id;
  PERFORM award_xp(NEW.user_id, _xp_reward);
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_quiz_attempt_completed
  AFTER INSERT ON quiz_attempts FOR EACH ROW EXECUTE FUNCTION handle_quiz_completion();

CREATE TRIGGER on_study_plan_created
  AFTER INSERT ON study_plans FOR EACH ROW EXECUTE FUNCTION handle_study_plan_created();

CREATE TRIGGER on_flashcard_deck_created
  AFTER INSERT ON flashcard_decks FOR EACH ROW EXECUTE FUNCTION handle_flashcard_deck_created();

CREATE TRIGGER on_content_shared
  AFTER INSERT ON shared_content FOR EACH ROW EXECUTE FUNCTION handle_content_shared();

CREATE TRIGGER on_achievement_unlocked
  AFTER INSERT ON user_achievements FOR EACH ROW EXECUTE FUNCTION handle_achievement_unlocked();