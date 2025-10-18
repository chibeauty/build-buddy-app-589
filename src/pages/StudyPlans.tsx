import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface StudyPlan {
  id: string;
  title: string;
  subject: string;
  goal_type: string;
  progress_percentage: number;
  exam_date: string | null;
  daily_time_minutes: number;
}

export default function StudyPlans() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlans(data || []);
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

  return (
    <MainLayout>
      <div className="container max-w-screen-xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-heading font-bold">My Study Plans</h2>
          <Button onClick={() => navigate("/study-plans/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Target className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">No study plans yet</h3>
                <p className="text-muted-foreground">Create your first study plan to get started</p>
              </div>
              <Button onClick={() => navigate("/study-plans/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/study-plans/${plan.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{plan.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{plan.subject}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{plan.goal_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{plan.progress_percentage}%</span>
                    </div>
                    <Progress value={plan.progress_percentage} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {plan.exam_date 
                          ? `Exam: ${new Date(plan.exam_date).toLocaleDateString()}` 
                          : "No deadline"}
                      </span>
                    </div>
                    <span>{plan.daily_time_minutes} min/day</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
