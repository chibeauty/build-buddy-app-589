import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileQuestion, Calendar, CreditCard, Flame, Trophy, TrendingUp, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  full_name: string | null;
  xp_points: number;
  study_streak: number;
  ai_credits: number;
}

interface StudyPlan {
  id: string;
  title: string;
  subject: string;
  progress_percentage: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activePlans, setActivePlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, plansRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).single(),
        supabase
          .from("study_plans")
          .select("id, title, subject, progress_percentage")
          .eq("user_id", user!.id)
          .eq("is_active", true)
          .limit(3),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (plansRes.error) throw plansRes.error;

      setProfile(profileRes.data);
      setActivePlans(plansRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container max-w-screen-xl mx-auto p-4">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-screen-xl mx-auto p-4 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <h2 className="text-3xl font-heading font-bold">
            Welcome back, {profile?.full_name || "Learner"}! 👋
          </h2>
          <p className="text-muted-foreground">Ready to continue your learning journey?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <Flame className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.study_streak || 0} days</div>
              <p className="text-xs text-muted-foreground">
                {profile?.study_streak ? "Keep it going!" : "Start your streak today!"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total XP</CardTitle>
              <Trophy className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.xp_points || 0}</div>
              <p className="text-xs text-muted-foreground">
                Level {Math.floor((profile?.xp_points || 0) / 100)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePlans.length}</div>
              <p className="text-xs text-muted-foreground">
                {activePlans.length > 0 ? "In progress" : "Create your first plan"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 cursor-pointer" onClick={() => navigate('/subscription')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Credits</CardTitle>
              <Zap className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.ai_credits || 0}</div>
              <p className="text-xs text-muted-foreground">
                Click to upgrade
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate("/quizzes/generate")}
              className="h-24 flex flex-col gap-2"
            >
              <FileQuestion className="h-6 w-6" />
              <span>Generate Quiz</span>
            </Button>
            <Button
              onClick={() => navigate("/study-plans/create")}
              className="h-24 flex flex-col gap-2"
            >
              <Calendar className="h-6 w-6" />
              <span>Create Study Plan</span>
            </Button>
            <Button
              onClick={() => navigate("/flashcards/create")}
              className="h-24 flex flex-col gap-2"
            >
              <CreditCard className="h-6 w-6" />
              <span>Make Flashcards</span>
            </Button>
          </CardContent>
        </Card>

        {profile && profile.ai_credits < 100 && (
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Upgrade Your Plan
              </CardTitle>
              <CardDescription>Get more AI credits and unlock premium features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current AI Credits</p>
                  <p className="text-2xl font-bold">{profile.ai_credits}</p>
                </div>
                <Button onClick={() => navigate('/subscription')}>
                  View Plans
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Upgrade to Pro for unlimited AI-generated quizzes, advanced flashcards, and priority support
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Active Study Plans</CardTitle>
            <CardDescription>Your current learning objectives</CardDescription>
          </CardHeader>
          <CardContent>
            {activePlans.length > 0 ? (
              <div className="space-y-4">
                {activePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/study-plans/${plan.id}`)}
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{plan.title}</h3>
                        <span className="text-sm text-muted-foreground">{plan.subject}</span>
                      </div>
                      <Progress value={plan.progress_percentage} className="mb-1" />
                      <p className="text-sm text-muted-foreground">{plan.progress_percentage}% complete</p>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/study-plans")}
                >
                  View All Plans
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground mb-4">No active study plans yet</p>
                <Button onClick={() => navigate("/study-plans/create")}>
                  Create Your First Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
