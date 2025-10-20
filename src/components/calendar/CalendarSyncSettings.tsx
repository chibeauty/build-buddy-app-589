import { useState, useEffect } from "react";
import { Calendar, Bell, Link as LinkIcon, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CalendarSettings {
  sync_enabled: boolean;
  google_calendar_enabled: boolean;
  sync_study_plans: boolean;
  sync_quiz_sessions: boolean;
  sync_flashcard_sessions: boolean;
  reminder_minutes_before: number;
  device_reminders_enabled: boolean;
}

export function CalendarSyncSettings() {
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data as CalendarSettings);
      } else {
        // Create default settings
        const defaultSettings = {
          user_id: user.id,
          sync_enabled: false,
          google_calendar_enabled: false,
          sync_study_plans: true,
          sync_quiz_sessions: true,
          sync_flashcard_sessions: true,
          reminder_minutes_before: 15,
          device_reminders_enabled: true,
        };

        const { error: insertError } = await supabase
          .from('calendar_sync_settings')
          .insert(defaultSettings);

        if (insertError) throw insertError;
        setSettings(defaultSettings as CalendarSettings);
      }
    } catch (error) {
      console.error('Error fetching calendar settings:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleCalendar = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'authorize' },
      });

      if (error) throw error;

      if (data.authUrl) {
        window.open(data.authUrl, '_blank', 'width=600,height=600');
        
        toast({
          title: "Authorization Required",
          description: "Please complete the authorization in the popup window",
        });
      }
    } catch (error) {
      console.error('Error connecting calendar:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Calendar",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      const { error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'disconnect' },
      });

      if (error) throw error;

      await fetchSettings();
      
      toast({
        title: "Disconnected",
        description: "Google Calendar has been disconnected",
      });
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Google Calendar",
        variant: "destructive",
      });
    }
  };

  const updateSetting = async (key: keyof CalendarSettings, value: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('calendar_sync_settings')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      
      toast({
        title: "Settings Updated",
        description: "Calendar sync preferences saved",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive study reminders on this device",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  if (!settings) {
    return <div>Error loading settings</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Sync
          </CardTitle>
          <CardDescription>
            Sync your study schedule to Google Calendar and receive device reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Google Calendar</Label>
                <p className="text-sm text-muted-foreground">
                  Sync study sessions to your Google Calendar
                </p>
              </div>
              {settings.google_calendar_enabled ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnectGoogleCalendar}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={connectGoogleCalendar}
                  disabled={isConnecting}
                  className="gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  Connect Google Calendar
                </Button>
              )}
            </div>

            {settings.google_calendar_enabled && (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sync-enabled">Enable Sync</Label>
                  <Switch
                    id="sync-enabled"
                    checked={settings.sync_enabled}
                    onCheckedChange={(checked) => updateSetting('sync_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sync-study-plans">Sync Study Plans</Label>
                  <Switch
                    id="sync-study-plans"
                    checked={settings.sync_study_plans}
                    onCheckedChange={(checked) => updateSetting('sync_study_plans', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sync-quizzes">Sync Quiz Sessions</Label>
                  <Switch
                    id="sync-quizzes"
                    checked={settings.sync_quiz_sessions}
                    onCheckedChange={(checked) => updateSetting('sync_quiz_sessions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sync-flashcards">Sync Flashcard Sessions</Label>
                  <Switch
                    id="sync-flashcards"
                    checked={settings.sync_flashcard_sessions}
                    onCheckedChange={(checked) => updateSetting('sync_flashcard_sessions', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reminder Time (minutes before)</Label>
                  <Slider
                    value={[settings.reminder_minutes_before]}
                    onValueChange={([value]) => updateSetting('reminder_minutes_before', value)}
                    min={5}
                    max={60}
                    step={5}
                  />
                  <p className="text-sm text-muted-foreground">
                    {settings.reminder_minutes_before} minutes before each session
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Device Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive browser notifications for upcoming sessions
                </p>
              </div>
              <Switch
                checked={settings.device_reminders_enabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    requestNotificationPermission();
                  }
                  updateSetting('device_reminders_enabled', checked);
                }}
              />
            </div>

            {settings.device_reminders_enabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={requestNotificationPermission}
                className="w-full"
              >
                Test Notification
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
