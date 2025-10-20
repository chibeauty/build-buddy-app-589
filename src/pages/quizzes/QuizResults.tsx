import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Home, RotateCcw, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface QuizAttempt {
  score_percentage: number;
  time_taken_seconds: number | null;
  answers: any;
  completed_at: string;
}

interface Question {
  id: string;
  question_text: string;
  correct_answer: string;
  explanation: string | null;
  options: any;
}

export default function QuizResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const score = searchParams.get("score");
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchLatestAttempt();
      fetchQuestions();
    }
  }, [id, user]);

  const fetchLatestAttempt = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", id)
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setAttempt(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", id)
        .order("created_at");

      if (error) throw error;
      setQuestions(data || []);
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

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: "A", color: "text-success" };
    if (score >= 80) return { grade: "B", color: "text-success" };
    if (score >= 70) return { grade: "C", color: "text-warning" };
    if (score >= 60) return { grade: "D", color: "text-warning" };
    return { grade: "F", color: "text-destructive" };
  };

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  const scoreValue = attempt?.score_percentage || Number(score) || 0;
  const { grade, color } = getGrade(scoreValue);
  const correctCount = attempt?.answers?.filter((a: any) => a.is_correct).length || 0;
  const totalQuestions = questions.length;

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">Quiz Complete!</h1>
        <p className="text-muted-foreground">Here's how you performed</p>
      </div>

      <Card className="mb-8">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
            <span className={`text-6xl font-bold ${color}`}>{grade}</span>
          </div>
          <CardTitle className="text-3xl">{scoreValue}%</CardTitle>
          <CardDescription>
            You answered {correctCount} out of {totalQuestions} questions correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={scoreValue} className="mb-4" />
          {attempt && (
            <div className="flex justify-center gap-8 text-sm text-muted-foreground">
              <div>
                Time Taken: {Math.floor((attempt.time_taken_seconds || 0) / 60)}m{" "}
                {(attempt.time_taken_seconds || 0) % 60}s
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
          <CardDescription>Review your answers and explanations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question, index) => {
            const answer = attempt?.answers?.find((a: any) => a.question_id === question.id);
            const isCorrect = answer?.is_correct;

            return (
              <div key={question.id} className="border-b pb-6 last:border-0">
                <div className="mb-2 flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="mt-1 h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="mt-1 h-5 w-5 text-destructive" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">
                      {index + 1}. {question.question_text}
                    </p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Your answer:</span>{" "}
                        <span className={isCorrect ? "text-success" : "text-destructive"}>
                          {answer?.selected_answer}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p>
                          <span className="text-muted-foreground">Correct answer:</span>{" "}
                          <span className="text-success">{question.correct_answer}</span>
                        </p>
                      )}
                      {question.explanation && (
                        <p className="mt-2 rounded-lg bg-muted p-3">
                          <span className="font-medium">Explanation:</span> {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-center gap-4">
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <Home className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <Button variant="outline" onClick={() => navigate(`/quizzes/${id}`)}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Retake Quiz
        </Button>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share Results
        </Button>
      </div>
    </div>
  );
}
