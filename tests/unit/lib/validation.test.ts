import { validateEmail, validatePassword, validateQuizInput } from '@/lib/validation';
import { describe, it, expect } from 'vitest';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('accepts valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('admin@subdomain.example.com')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('accepts strong passwords', () => {
      expect(validatePassword('SecurePass123!')).toBe(true);
      expect(validatePassword('MyP@ssw0rd')).toBe(true);
      expect(validatePassword('C0mpl3x!Pass')).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
      expect(validatePassword('onlylowercase')).toBe(false);
      expect(validatePassword('ONLYUPPERCASE')).toBe(false);
      expect(validatePassword('NoNumbers!')).toBe(false);
    });

    it('requires minimum length', () => {
      expect(validatePassword('Short1!')).toBe(false);
      expect(validatePassword('LongEnough123!')).toBe(true);
    });
  });

  describe('validateQuizInput', () => {
    it('accepts valid quiz input', () => {
      const validInput = {
        content: 'This is test content for the quiz',
        subject: 'Mathematics',
        difficulty: 'medium',
        questionCount: 5
      };
      expect(validateQuizInput(validInput)).toBe(true);
    });

    it('rejects empty content', () => {
      const invalidInput = {
        content: '',
        subject: 'Mathematics',
        difficulty: 'medium',
        questionCount: 5
      };
      expect(validateQuizInput(invalidInput)).toBe(false);
    });

    it('rejects invalid question count', () => {
      const invalidInput = {
        content: 'Test content',
        subject: 'Mathematics',
        difficulty: 'medium',
        questionCount: 0
      };
      expect(validateQuizInput(invalidInput)).toBe(false);
    });

    it('enforces maximum question count', () => {
      const invalidInput = {
        content: 'Test content',
        subject: 'Mathematics',
        difficulty: 'medium',
        questionCount: 100
      };
      expect(validateQuizInput(invalidInput)).toBe(false);
    });
  });
});
