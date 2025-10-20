import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CalendarSyncButtonProps {
  studyPlanId?: string;
  quizId?: string;
  flashcardDeckId?: string;
}

export function CalendarSyncButton({ studyPlanId, quizId, flashcardDeckId }: CalendarSyncButtonProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
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
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync to calendar",
        variant: "destructive",
      });
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
      {syncing ? "Syncing..." : "Sync to Calendar"}
    </Button>
  );
}
