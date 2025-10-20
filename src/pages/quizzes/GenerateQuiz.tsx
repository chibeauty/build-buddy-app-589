import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function GenerateQuiz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    difficulty: "medium",
    questionCount: 10,
    contentText: "",
    file: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.contentText.trim()) {
      toast({
        title: "Error",
        description: "Please provide content to generate quiz from",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Call AI to generate questions
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('generate-quiz', {
        body: {
          content: formData.contentText,
          subject: formData.subject,
          difficulty: formData.difficulty,
          questionCount: formData.questionCount,
          questionTypes: ['multiple_choice', 'true_false'],
        }
      });

      if (aiError) throw aiError;

      // Create the quiz record
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          user_id: user.id,
          title: formData.title,
          subject: formData.subject,
          description: formData.description,
          difficulty_level: formData.difficulty,
          total_questions: aiResponse.questions.length,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Format questions for database
      const questionsData = aiResponse.questions.map((q: any) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        question_type: q.question_type,
        correct_answer: q.correct_answer,
        options: q.options,
        explanation: q.explanation,
      }));

      const { error: questionsError } = await supabase.from("quiz_questions").insert(questionsData);

      if (questionsError) throw questionsError;

      toast({
        title: "Success",
        description: `Quiz with ${aiResponse.questions.length} questions generated successfully!`,
      });
      navigate(`/quizzes/${quiz.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-3xl mx-auto p-4 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/quizzes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-3xl font-heading font-bold">Generate Quiz</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Quiz Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Chapter 5 - Algebra Quiz"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this quiz about?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Number of Questions: {formData.questionCount}</Label>
                  <Slider
                    value={[formData.questionCount]}
                    onValueChange={([value]) => setFormData({ ...formData, questionCount: value })}
                    min={5}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content Source</Label>
                <Tabs defaultValue="text">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text">
                      <FileText className="mr-2 h-4 w-4" />
                      Paste Text
                    </TabsTrigger>
                    <TabsTrigger value="upload">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="text" className="space-y-2">
                    <Textarea
                      placeholder="Paste your study material here. AI will generate quiz questions based on this content..."
                      value={formData.contentText}
                      onChange={(e) => setFormData({ ...formData, contentText: e.target.value })}
                      rows={8}
                      className="resize-none"
                    />
                  </TabsContent>
                  <TabsContent value="upload" className="space-y-2">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                        className="max-w-xs mx-auto"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Upload PDF, DOC, or TXT files
                      </p>
                      {formData.file && (
                        <p className="text-sm text-primary mt-2">Selected: {formData.file.name}</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/quizzes")} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {loading ? "Generating..." : "Generate Quiz"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
}
