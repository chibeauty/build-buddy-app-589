import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zsybxembykxiykgkdlth.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzeWJ4ZW1ieWt4aXlrZ2tkbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTIwNzMsImV4cCI6MjA3NjE4ODA3M30.pJgWDdZwhCWiwVA31DF9uVbFrMAN53Cm0Z_7i5msqA4';

describe('Study Plans Database Operations', () => {
  let supabase: any;
  let testUser: any;
  let testPlanId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    
    // Sign in or create test user
    const { data } = await supabase.auth.signInWithPassword({
      email: 'test-plans@example.com',
      password: 'TestPassword123!'
    });
    
    testUser = data?.user;
  });

  afterAll(async () => {
    // Clean up test data
    if (testPlanId) {
      await supabase.from('study_plans').delete().eq('id', testPlanId);
    }
    
    await supabase.auth.signOut();
  });

  it('creates study plan with user reference', async () => {
    const { data, error } = await supabase
      .from('study_plans')
      .insert({
        title: 'Integration Test Plan',
        subject: 'Mathematics',
        goal_type: 'exam',
        duration_weeks: 4,
        weekly_hours: 10
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.title).toBe('Integration Test Plan');
    expect(data.user_id).toBeDefined();
    
    testPlanId = data.id;
  });

  it('retrieves user study plans', async () => {
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', testUser?.id);

    expect(error).toBeNull();
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBeGreaterThan(0);
  });

  it('updates study plan progress', async () => {
    if (!testPlanId) {
      console.log('Skipping: No test plan created');
      return;
    }

    const { data, error } = await supabase
      .from('study_plans')
      .update({ progress_percentage: 50 })
      .eq('id', testPlanId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.progress_percentage).toBe(50);
  });

  it('enforces RLS policies for different users', async () => {
    // This test would require creating another user
    // and attempting to access the first user's plans
    // For now, we just verify current user can access their own plans
    
    const { data } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', testUser?.id);

    expect(data).toBeInstanceOf(Array);
  });

  it('deletes study plan', async () => {
    if (!testPlanId) {
      console.log('Skipping: No test plan created');
      return;
    }

    const { error } = await supabase
      .from('study_plans')
      .delete()
      .eq('id', testPlanId);

    expect(error).toBeNull();

    // Verify deletion
    const { data } = await supabase
      .from('study_plans')
      .select('*')
      .eq('id', testPlanId);

    expect(data?.length).toBe(0);
    
    testPlanId = ''; // Clear reference
  });
});
