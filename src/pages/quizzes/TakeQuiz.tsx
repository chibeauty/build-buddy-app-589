import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Flag, Timer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  correct_answer: string;
  options: any;
  explanation: string | null;
}

interface Answer {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
}

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (id) {
      fetchQuestions();
    }
  }, [id]);

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

  const handleAnswerSelect = (answer: string) => {
    setAnswers({
      ...answers,
      [questions[currentQuestionIndex].id]: answer,
    });
  };

  const toggleFlag = () => {
    const questionId = questions[currentQuestionIndex].id;
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    setFlaggedQuestions(newFlagged);
  };

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitQuiz = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const processedAnswers: Answer[] = questions.map((q) => ({
        question_id: q.id,
        selected_answer: answers[q.id] || "",
        is_correct: answers[q.id] === q.correct_answer,
      }));

      const correctCount = processedAnswers.filter((a) => a.is_correct).length;
      const scorePercentage = Math.round((correctCount / questions.length) * 100);
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      const { error } = await supabase.from("quiz_attempts").insert([{
        quiz_id: id!,
        user_id: user!.id,
        score_percentage: scorePercentage,
        time_taken_seconds: timeTaken,
        answers: processedAnswers as any,
      }]);

      if (error) throw error;

      navigate(`/quizzes/${id}/results?score=${scorePercentage}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Loading quiz...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">No questions found for this quiz.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  // Handle options as either array or object
  const questionOptions = (() => {
    if (!currentQuestion.options) return [];
    if (Array.isArray(currentQuestion.options)) return currentQuestion.options;
    if (typeof currentQuestion.options === 'object') {
      return Object.values(currentQuestion.options);
    }
    return [];
  })();

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span>{Math.floor((Date.now() - startTime) / 60000)}m</span>
          </div>
        </div>
        <Progress value={progress} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{currentQuestion.question_text}</CardTitle>
              <CardDescription className="mt-2">
                {currentQuestion.question_type === "multiple_choice" ? "Select one answer" : "True or False"}
              </CardDescription>
            </div>
            <Button
              variant={flaggedQuestions.has(currentQuestion.id) ? "default" : "outline"}
              size="icon"
              onClick={toggleFlag}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {questionOptions.length > 0 ? (
              questionOptions.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-accent">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No options available for this question.</p>
            )}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button onClick={submitQuiz} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        ) : (
          <Button onClick={goToNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
