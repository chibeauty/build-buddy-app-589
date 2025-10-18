import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Share2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Quiz {
  id: string;
  title: string;
  subject: string;
  description: string;
  difficulty_level: string;
  total_questions: number;
  created_at: string;
}

export default function QuizDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchQuiz();
    }
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setQuiz(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/quizzes");
    } finally {
      setLoading(false);
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

  if (!quiz) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-500";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500";
      case "hard":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-secondary";
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto p-4 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/quizzes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-heading font-bold">{quiz.title}</h2>
            <p className="text-muted-foreground">{quiz.subject}</p>
          </div>
          <Badge className={getDifficultyColor(quiz.difficulty_level)} variant="secondary">
            {quiz.difficulty_level}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quiz.description && (
              <p className="text-muted-foreground">{quiz.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{quiz.total_questions}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-accent">0</p>
                <p className="text-sm text-muted-foreground">Attempts</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-secondary">-</p>
                <p className="text-sm text-muted-foreground">Best Score</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button className="flex-1" size="lg">
                <Play className="mr-2 h-5 w-5" />
                Start Quiz
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Previous Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">No attempts yet. Start the quiz to see your results here!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
