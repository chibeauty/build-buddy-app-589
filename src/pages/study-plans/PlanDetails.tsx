import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, Target, Play } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CalendarSyncButton } from "@/components/calendar/CalendarSyncButton";

interface StudyPlan {
  id: string;
  title: string;
  subject: string;
  description: string;
  goal_type: string;
  target_skill_level: string;
  daily_time_minutes: number;
  progress_percentage: number;
  exam_date: string | null;
  created_at: string;
}

interface StudySession {
  id: string;
  study_plan_id: string;
  session_date: string;
  topic: string;
  duration_minutes: number;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
}

export default function PlanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPlan();
    }
  }, [id]);

  const fetchPlan = async () => {
    try {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error("Study plan not found");
      }
      setPlan(data);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("study_plan_id", id)
        .order("session_date", { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);
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

  const handleStartSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from("study_sessions")
        .insert({
          study_plan_id: id,
          session_date: new Date().toISOString().split('T')[0],
          topic: plan?.subject || "Study Session",
          duration_minutes: plan?.daily_time_minutes || 30,
          is_completed: false,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      await supabase.rpc('update_study_streak', { _user_id: user.id });

      navigate(`/study-plans/session/${sessionData.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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

  if (!plan) return null;

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto p-4 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/study-plans")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-heading font-bold">{plan.title}</h2>
            <p className="text-muted-foreground">{plan.subject}</p>
          </div>
          <div className="flex items-center gap-2">
            <CalendarSyncButton studyPlanId={id} />
            <Badge variant="secondary">{plan.goal_type}</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-medium">{plan.progress_percentage}%</span>
              </div>
              <Progress value={plan.progress_percentage} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Time</p>
                  <p className="font-medium">{plan.daily_time_minutes} min</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Level</p>
                  <p className="font-medium capitalize">{plan.target_skill_level}</p>
                </div>
              </div>

              {plan.exam_date && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Exam Date</p>
                    <p className="font-medium">
                      {new Date(plan.exam_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {plan.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{plan.description}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Study Sessions</CardTitle>
              <Button onClick={handleStartSession} size="sm">
                <Play className="mr-2 h-4 w-4" />
                Start New Session
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No study sessions yet</p>
                <Button onClick={handleStartSession}>
                  <Play className="mr-2 h-4 w-4" />
                  Start First Session
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{session.topic}</h4>
                        {session.is_completed && (
                          <Badge variant="secondary" className="gap-1">
                            <Play className="h-3 w-3" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(session.session_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.duration_minutes} min
                        </span>
                      </div>
                      {session.notes && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {session.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
