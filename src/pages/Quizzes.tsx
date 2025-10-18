import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileQuestion, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Quiz {
  id: string;
  title: string;
  subject: string;
  difficulty_level: string;
  total_questions: number;
}

export default function Quizzes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
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
      <div className="container max-w-screen-xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-heading font-bold">My Quizzes</h2>
          <Button onClick={() => navigate("/quizzes/generate")}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Quiz
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : quizzes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <FileQuestion className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">No quizzes yet</h3>
                <p className="text-muted-foreground">Generate your first quiz to start testing your knowledge</p>
              </div>
              <Button onClick={() => navigate("/quizzes/generate")}>
                <Plus className="mr-2 h-4 w-4" />
                Generate Your First Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/quizzes/${quiz.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <Badge className={getDifficultyColor(quiz.difficulty_level)} variant="secondary">
                      {quiz.difficulty_level}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{quiz.subject}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Questions</span>
                    <span className="font-medium">{quiz.total_questions}</span>
                  </div>
                  <Button className="w-full" variant="outline">
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
