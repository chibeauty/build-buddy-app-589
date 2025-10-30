import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zsybxembykxiykgkdlth.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzeWJ4ZW1ieWt4aXlrZ2tkbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTIwNzMsImV4cCI6MjA3NjE4ODA3M30.pJgWDdZwhCWiwVA31DF9uVbFrMAN53Cm0Z_7i5msqA4';

describe('Generate Quiz Edge Function', () => {
  let supabase: any;
  let testUser: any;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create test user or sign in
    const { data, error } = await supabase.auth.signUp({
      email: 'test-quiz@example.com',
      password: 'TestPassword123!'
    });
    
    if (!error) {
      testUser = data.user;
    }
  });

  afterAll(async () => {
    // Clean up test user if needed
    if (testUser) {
      await supabase.auth.signOut();
    }
  });

  it('generates quiz from valid content', async () => {
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        content: 'React is a JavaScript library for building user interfaces. It uses a component-based architecture.',
        subject: 'React',
        difficulty: 'medium',
        questionCount: 3,
        questionTypes: ['multiple_choice']
      }
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.questions).toBeInstanceOf(Array);
    expect(data.questions.length).toBeGreaterThan(0);
    expect(data.questions[0]).toHaveProperty('question');
    expect(data.questions[0]).toHaveProperty('correct_answer');
  }, 30000); // 30 second timeout for AI generation

  it('handles different difficulty levels', async () => {
    const difficulties = ['easy', 'medium', 'hard'];
    
    for (const difficulty of difficulties) {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          content: 'JavaScript is a programming language.',
          subject: 'JavaScript',
          difficulty,
          questionCount: 2,
          questionTypes: ['multiple_choice']
        }
      });

      expect(error).toBeNull();
      expect(data.questions).toBeDefined();
    }
  }, 60000);

  it('returns error for empty content', async () => {
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        content: '',
        subject: 'Test',
        difficulty: 'easy',
        questionCount: 5,
        questionTypes: ['multiple_choice']
      }
    });

    expect(error || data.error).toBeDefined();
  });

  it('respects question count parameter', async () => {
    const questionCount = 5;
    const { data } = await supabase.functions.invoke('generate-quiz', {
      body: {
        content: 'Python is a high-level programming language known for its simplicity and readability.',
        subject: 'Python',
        difficulty: 'easy',
        questionCount,
        questionTypes: ['multiple_choice']
      }
    });

    expect(data.questions.length).toBeLessThanOrEqual(questionCount);
  }, 30000);
});
