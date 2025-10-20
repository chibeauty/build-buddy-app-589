import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Award,
  Brain,
  Trophy,
  Flame,
  BookOpen,
  Calendar,
  Users,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_value: number;
  xp_reward: number;
  unlocked: boolean;
  progress?: number;
}

const iconMap: Record<string, any> = {
  Footprints: Award,
  Brain: Brain,
  Trophy: Trophy,
  Flame: Flame,
  BookOpen: BookOpen,
  Calendar: Calendar,
  Users: Users,
  Award: Award,
};

export default function Achievements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    try {
      const [achievementsRes, userAchievementsRes, profileRes, statsRes] = await Promise.all([
        supabase.from("achievements").select("*"),
        supabase.from("user_achievements").select("achievement_id").eq("user_id", user!.id),
        supabase.from("profiles").select("study_streak, xp_points").eq("id", user!.id).single(),
        Promise.all([
          supabase.from("quiz_attempts").select("id", { count: "exact" }).eq("user_id", user!.id),
          supabase.from("flashcards").select("id", { count: "exact" }),
          supabase.from("study_plans").select("id", { count: "exact" }).eq("user_id", user!.id),
          supabase.from("shared_content").select("id", { count: "exact" }).eq("user_id", user!.id),
        ]),
      ]);

      if (achievementsRes.error) throw achievementsRes.error;

      const unlockedIds = new Set(userAchievementsRes.data?.map((ua) => ua.achievement_id));
      const [quizzes, flashcards, plans, shared] = statsRes;

      const progressMap: Record<string, number> = {
        quiz_attempts: quizzes.count || 0,
        flashcards_created: flashcards.count || 0,
        study_plans: plans.count || 0,
        shared_content: shared.count || 0,
        study_streak: profileRes.data?.study_streak || 0,
        xp_points: profileRes.data?.xp_points || 0,
      };

      const enrichedAchievements = achievementsRes.data.map((achievement) => ({
        ...achievement,
        unlocked: unlockedIds.has(achievement.id),
        progress: progressMap[achievement.requirement_type] || 0,
      }));

      setAchievements(enrichedAchievements);
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
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </MainLayout>
    );
  }

  const categories = [...new Set(achievements.map((a) => a.category))];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <MainLayout>
      <div className="container max-w-6xl py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Achievements</h1>
          <p className="text-muted-foreground">
            {unlockedCount} of {achievements.length} achievements unlocked
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(unlockedCount / achievements.length) * 100} />
          </CardContent>
        </Card>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => {
                const Icon = iconMap[achievement.icon] || Award;
                const progressPercent = Math.min(
                  100,
                  (achievement.progress! / achievement.requirement_value) * 100
                );

                return (
                  <Card key={achievement.id} className={achievement.unlocked ? "border-primary" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full ${
                            achievement.unlocked ? "bg-primary/10" : "bg-muted"
                          }`}
                        >
                          {achievement.unlocked ? (
                            <Icon className="h-6 w-6 text-primary" />
                          ) : (
                            <Lock className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        {achievement.unlocked && (
                          <Badge variant="default">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Unlocked
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="mt-4">{achievement.name}</CardTitle>
                      <CardDescription>{achievement.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!achievement.unlocked && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                              {achievement.progress} / {achievement.requirement_value}
                            </span>
                          </div>
                          <Progress value={progressPercent} />
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-warning" />
                        <span className="text-muted-foreground">+{achievement.xp_reward} XP</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-4 mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {achievements
                  .filter((a) => a.category === category)
                  .map((achievement) => {
                    const Icon = iconMap[achievement.icon] || Award;
                    const progressPercent = Math.min(
                      100,
                      (achievement.progress! / achievement.requirement_value) * 100
                    );

                    return (
                      <Card
                        key={achievement.id}
                        className={achievement.unlocked ? "border-primary" : ""}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                achievement.unlocked ? "bg-primary/10" : "bg-muted"
                              }`}
                            >
                              {achievement.unlocked ? (
                                <Icon className="h-6 w-6 text-primary" />
                              ) : (
                                <Lock className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            {achievement.unlocked && (
                              <Badge variant="default">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Unlocked
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="mt-4">{achievement.name}</CardTitle>
                          <CardDescription>{achievement.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {!achievement.unlocked && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">
                                  {achievement.progress} / {achievement.requirement_value}
                                </span>
                              </div>
                              <Progress value={progressPercent} />
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <Award className="h-4 w-4 text-warning" />
                            <span className="text-muted-foreground">
                              +{achievement.xp_reward} XP
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
