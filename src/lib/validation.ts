export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const sanitizeInput = (input: string): string => {
  // Remove any HTML tags and dangerous characters
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim();
};

export const validateQuizData = (data: {
  title: string;
  subject: string;
  questionCount: number;
  contentText: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.title.trim()) {
    errors.push("Quiz title is required");
  }
  if (!data.subject.trim()) {
    errors.push("Subject is required");
  }
  if (data.questionCount < 5 || data.questionCount > 50) {
    errors.push("Question count must be between 5 and 50");
  }
  if (!data.contentText.trim() || data.contentText.length < 50) {
    errors.push("Content must be at least 50 characters long");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateStudyPlanData = (data: {
  title: string;
  subject: string;
  dailyTimeMinutes: number;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.title.trim()) {
    errors.push("Plan title is required");
  }
  if (!data.subject.trim()) {
    errors.push("Subject is required");
  }
  if (data.dailyTimeMinutes < 15 || data.dailyTimeMinutes > 240) {
    errors.push("Daily study time must be between 15 and 240 minutes");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
