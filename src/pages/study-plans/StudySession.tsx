import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, Play, Pause, Square } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface StudySession {
  id: string;
  study_plan_id: string;
  topic: string;
  duration_minutes: number;
  is_completed: boolean;
  notes: string | null;
}

interface StudyPlan {
  id: string;
  title: string;
  subject: string;
}

export default function StudySession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<StudySession | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const fetchSession = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);
      setNotes(sessionData.notes || "");

      const { data: planData, error: planError } = await supabase
        .from("study_plans")
        .select("id, title, subject")
        .eq("id", sessionData.study_plan_id)
        .single();

      if (planError) throw planError;
      setPlan(planData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/study-plans");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !session) return;

      await supabase
        .from("study_sessions")
        .update({
          is_completed: true,
          duration_minutes: Math.ceil(timeElapsed / 60),
          notes: notes,
        })
        .eq("id", sessionId);

      await supabase.rpc('award_xp', { _user_id: user.id, _xp_amount: 10 });

      toast({
        title: "Session Completed!",
        description: `Great work! You earned 10 XP.`,
      });

      navigate(`/study-plans/${session.study_plan_id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate(`/study-plans/${session?.study_plan_id}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!session || !plan) return null;

  const progress = Math.min((timeElapsed / (session.duration_minutes * 60)) * 100, 100);

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto p-4 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-heading font-bold">Study Session</h2>
            <p className="text-muted-foreground">{plan.title}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{session.topic}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl font-mono font-bold">{formatTime(timeElapsed)}</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.floor(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
              <div className="flex justify-center gap-2">
                {!isRunning ? (
                  <Button onClick={() => setIsRunning(true)} size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Start Timer
                  </Button>
                ) : (
                  <Button onClick={() => setIsRunning(false)} variant="secondary" size="lg">
                    <Pause className="mr-2 h-5 w-5" />
                    Pause Timer
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Session Notes</label>
              <Textarea
                placeholder="Add notes about what you learned..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleComplete} className="flex-1" size="lg">
                <CheckCircle className="mr-2 h-5 w-5" />
                Complete Session
              </Button>
              <Button onClick={handleCancel} variant="outline" size="lg">
                <Square className="mr-2 h-5 w-5" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
