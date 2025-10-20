import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Award, BookOpen, Flame, Calendar, Settings, TrendingUp } from "lucide-react";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  xp_points: number;
  study_streak: number;
  learning_style: string | null;
}

interface Stats {
  totalQuizzes: number;
  totalFlashcards: number;
  totalStudyPlans: number;
  achievementsUnlocked: number;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalQuizzes: 0,
    totalFlashcards: 0,
    totalStudyPlans: 0,
    achievementsUnlocked: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const [profileRes, quizzesRes, flashcardsRes, plansRes, achievementsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).single(),
        supabase.from("quiz_attempts").select("id", { count: "exact" }).eq("user_id", user!.id),
        supabase.from("flashcard_decks").select("id", { count: "exact" }).eq("user_id", user!.id),
        supabase.from("study_plans").select("id", { count: "exact" }).eq("user_id", user!.id),
        supabase.from("user_achievements").select("id", { count: "exact" }).eq("user_id", user!.id),
      ]);

      if (profileRes.error) throw profileRes.error;

      setProfile(profileRes.data);
      setStats({
        totalQuizzes: quizzesRes.count || 0,
        totalFlashcards: flashcardsRes.count || 0,
        totalStudyPlans: plansRes.count || 0,
        achievementsUnlocked: achievementsRes.count || 0,
      });
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
        <div className="container py-8">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </MainLayout>
    );
  }

  const level = Math.floor((profile?.xp_points || 0) / 100);
  const xpInCurrentLevel = (profile?.xp_points || 0) % 100;

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{profile?.full_name || "Learner"}</h1>
                  <Badge variant="secondary">Level {level}</Badge>
                </div>
                <p className="text-muted-foreground">{user?.email}</p>
                {profile?.learning_style && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Learning Style:</span>{" "}
                    <span className="capitalize">{profile.learning_style}</span>
                  </p>
                )}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Level Progress</span>
                    <span className="font-medium">{xpInCurrentLevel} / 100 XP</span>
                  </div>
                  <Progress value={xpInCurrentLevel} />
                </div>
              </div>
              <Button onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <Flame className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.study_streak || 0} days</div>
              <p className="text-xs text-muted-foreground mt-1">
                {profile?.study_streak ? "Keep going!" : "Start studying today!"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total XP</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.xp_points || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Experience points earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
              <p className="text-xs text-muted-foreground mt-1">Quiz attempts completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Plans</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudyPlans}</div>
              <p className="text-xs text-muted-foreground mt-1">Active learning paths</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>
                  {stats.achievementsUnlocked} achievements unlocked
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate("/profile/achievements")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {[...Array(Math.min(6, stats.achievementsUnlocked))].map((_, i) => (
                <div
                  key={i}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
                >
                  <Award className="h-8 w-8 text-primary" />
                </div>
              ))}
              {stats.achievementsUnlocked === 0 && (
                <p className="text-muted-foreground">No achievements yet. Keep learning!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
