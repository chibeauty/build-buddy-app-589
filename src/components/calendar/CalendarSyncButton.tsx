import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CalendarSyncButtonProps {
  studyPlanId?: string;
  quizId?: string;
  flashcardDeckId?: string;
}

export function CalendarSyncButton({ studyPlanId, quizId, flashcardDeckId }: CalendarSyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    checkConnection();
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('calendar_sync_settings')
      .select('google_calendar_enabled')
      .eq('user_id', user.id)
      .single();
    
    setIsConnected(data?.google_calendar_enabled || false);
  };

  const handleAuthorize = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'authorize' },
      });

      if (error) throw error;

      if (data?.authUrl) {
        window.open(data.authUrl, '_blank', 'width=600,height=700');
        toast({
          title: "Authorization Required",
          description: "Please complete the authorization in the opened window",
        });
        setTimeout(checkConnection, 3000);
      }
    } catch (error: any) {
      console.error('Error authorizing:', error);
      toast({
        title: "Authorization Failed",
        description: error.message || "Failed to authorize Google Calendar",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSync = async () => {
    if (!isConnected) {
      await handleAuthorize();
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'sync',
          studyPlanId,
          quizId,
          flashcardDeckId,
        },
      });

      if (error) throw error;

      toast({
        title: "Synced Successfully",
        description: "Your study schedule has been added to Google Calendar",
      });
    } catch (error: any) {
      console.error('Error syncing:', error);
      if (error.message?.includes('not connected')) {
        setIsConnected(false);
        toast({
          title: "Connection Required",
          description: "Please connect your Google Calendar first",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sync Failed",
          description: error.message || "Failed to sync to calendar",
          variant: "destructive",
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={syncing}
      className="gap-2"
    >
      <Calendar className="h-4 w-4" />
      {syncing ? "Syncing..." : isConnected ? "Sync to Calendar" : "Connect Calendar"}
    </Button>
  );
}
