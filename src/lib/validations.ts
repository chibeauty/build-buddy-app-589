import { z } from 'zod';

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be less than 72 characters'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
});

export const learningStyleSchema = z.object({
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic']),
});

export const goalsSchema = z.object({
  goalType: z.string().min(1, 'Please select a goal type'),
  goalDescription: z.string().trim().max(500, 'Description must be less than 500 characters').optional(),
  timeCommitment: z.number().min(5, 'Minimum 5 minutes').max(480, 'Maximum 8 hours'),
  targetDate: z.date().optional(),
});

export const notificationsSchema = z.object({
  studyReminders: z.boolean(),
  achievementNotifications: z.boolean(),
  communityUpdates: z.boolean(),
  reminderTime: z.string().optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type LearningStyleInput = z.infer<typeof learningStyleSchema>;
export type GoalsInput = z.infer<typeof goalsSchema>;
export type NotificationsInput = z.infer<typeof notificationsSchema>;
