export const testUsers = {
  standard: {
    email: 'standard.user@test.com',
    password: 'TestPass123!',
    full_name: 'Standard User',
    role: 'user',
    subscription_tier: 'free',
    ai_credits: 100,
    xp_points: 50
  },
  premium: {
    email: 'premium.user@test.com',
    password: 'PremiumPass123!',
    full_name: 'Premium User',
    role: 'user',
    subscription_tier: 'premium',
    ai_credits: 1000,
    xp_points: 500
  },
  admin: {
    email: 'admin@test.com',
    password: 'AdminPass123!',
    full_name: 'Admin User',
    role: 'admin',
    subscription_tier: 'premium',
    ai_credits: 10000,
    xp_points: 1000
  },
  new: {
    email: 'new.user@test.com',
    password: 'NewPass123!',
    full_name: 'New User',
    role: 'user',
    subscription_tier: 'free',
    ai_credits: 50,
    xp_points: 0
  }
};

export const userProfiles = {
  beginner: {
    learning_style: 'visual',
    preferred_difficulty: 'easy',
    daily_goal_minutes: 30,
    study_streak: 0,
    bio: 'Just starting my learning journey'
  },
  intermediate: {
    learning_style: 'mixed',
    preferred_difficulty: 'medium',
    daily_goal_minutes: 60,
    study_streak: 15,
    bio: 'Learning web development'
  },
  advanced: {
    learning_style: 'reading',
    preferred_difficulty: 'hard',
    daily_goal_minutes: 120,
    study_streak: 30,
    bio: 'Experienced developer expanding skills'
  }
};
