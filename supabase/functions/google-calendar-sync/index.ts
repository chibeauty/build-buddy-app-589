import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, code, studyPlanId, quizId, flashcardDeckId } = await req.json();

    if (action === 'authorize') {
      // Generate Google OAuth URL
      const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-sync`;
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar')}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${user.id}`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'callback' && code) {
      // Exchange authorization code for tokens
      const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-sync`;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        throw new Error(tokens.error_description || 'Failed to get tokens');
      }

      // Store tokens in calendar_sync_settings
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

      await supabase.from('calendar_sync_settings').upsert({
        user_id: user.id,
        sync_enabled: true,
        google_calendar_enabled: true,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: expiryDate.toISOString(),
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sync') {
      // Get calendar settings
      const { data: settings } = await supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!settings || !settings.google_calendar_enabled) {
        throw new Error('Google Calendar not connected');
      }

      // Check if token needs refresh
      const now = new Date();
      const expiry = new Date(settings.google_token_expiry);
      let accessToken = settings.google_access_token;

      if (now >= expiry) {
        // Refresh token
        const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
        const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');

        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            refresh_token: settings.google_refresh_token,
            client_id: clientId!,
            client_secret: clientSecret!,
            grant_type: 'refresh_token',
          }),
        });

        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;

        const newExpiry = new Date();
        newExpiry.setSeconds(newExpiry.getSeconds() + refreshData.expires_in);

        await supabase
          .from('calendar_sync_settings')
          .update({
            google_access_token: accessToken,
            google_token_expiry: newExpiry.toISOString(),
          })
          .eq('user_id', user.id);
      }

      // Sync study plan to calendar
      if (studyPlanId) {
        const { data: plan } = await supabase
          .from('study_plans')
          .select('*, study_sessions(*)')
          .eq('id', studyPlanId)
          .single();

        if (plan) {
          for (const session of plan.study_sessions || []) {
            const startTime = new Date(session.session_date);
            const endTime = new Date(startTime);
            endTime.setMinutes(startTime.getMinutes() + session.duration_minutes);

            const event = {
              summary: `Study: ${plan.title} - ${session.topic}`,
              description: `${plan.subject}\n\n${session.notes || ''}`,
              start: { dateTime: startTime.toISOString(), timeZone: 'UTC' },
              end: { dateTime: endTime.toISOString(), timeZone: 'UTC' },
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: settings.reminder_minutes_before },
                ],
              },
            };

            const calendarResponse = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${settings.calendar_id}/events`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
              }
            );

            const eventData = await calendarResponse.json();

            if (eventData.id) {
              await supabase.from('calendar_events').insert({
                user_id: user.id,
                source_type: 'study_plan',
                source_id: studyPlanId,
                google_event_id: eventData.id,
                event_title: event.summary,
                event_description: event.description,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
              });
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'disconnect') {
      await supabase
        .from('calendar_sync_settings')
        .update({
          sync_enabled: false,
          google_calendar_enabled: false,
          google_access_token: null,
          google_refresh_token: null,
          google_token_expiry: null,
        })
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
