import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll } from 'vitest';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zsybxembykxiykgkdlth.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzeWJ4ZW1ieWt4aXlrZ2tkbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTIwNzMsImV4cCI6MjA3NjE4ODA3M30.pJgWDdZwhCWiwVA31DF9uVbFrMAN53Cm0Z_7i5msqA4';

describe('User Profiles Database Operations', () => {
  let supabase: any;
  let testUser: any;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data } = await supabase.auth.signInWithPassword({
      email: 'test-profile@example.com',
      password: 'TestPassword123!'
    });
    
    testUser = data?.user;
  });

  it('retrieves user profile', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser?.id)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.id).toBe(testUser?.id);
  });

  it('updates profile information', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        full_name: 'Updated Test User',
        bio: 'Integration test bio'
      })
      .eq('id', testUser?.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.full_name).toBe('Updated Test User');
    expect(data.bio).toBe('Integration test bio');
  });

  it('tracks XP points correctly', async () => {
    const { data: initialProfile } = await supabase
      .from('profiles')
      .select('xp_points')
      .eq('id', testUser?.id)
      .single();

    const initialXP = initialProfile?.xp_points || 0;

    // Award XP using the database function
    await supabase.rpc('award_xp', {
      _user_id: testUser?.id,
      _xp_amount: 50
    });

    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('xp_points')
      .eq('id', testUser?.id)
      .single();

    expect(updatedProfile?.xp_points).toBe(initialXP + 50);
  });

  it('maintains study streak data', async () => {
    await supabase.rpc('update_study_streak', {
      _user_id: testUser?.id
    });

    const { data } = await supabase
      .from('profiles')
      .select('study_streak, last_study_date')
      .eq('id', testUser?.id)
      .single();

    expect(data.study_streak).toBeGreaterThanOrEqual(1);
    expect(data.last_study_date).toBeDefined();
  });

  it('tracks AI credits balance', async () => {
    const { data } = await supabase
      .from('profiles')
      .select('ai_credits')
      .eq('id', testUser?.id)
      .single();

    expect(typeof data?.ai_credits).toBe('number');
    expect(data?.ai_credits).toBeGreaterThanOrEqual(0);
  });
});
