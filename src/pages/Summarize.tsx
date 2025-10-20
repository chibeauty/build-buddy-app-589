import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, FileText, Sparkles, BookOpen, HelpCircle, Save, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SummaryResult {
  summary: string;
  definitions: Array<{ term: string; definition: string }>;
  keyPoints: string[];
  quizQuestions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
  }>;
}

export default function Summarize() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  const fetchCredits = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('ai_credits')
      .eq('id', user.id)
      .single();
    if (data) setCredits(data.ai_credits);
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 20MB)
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 20MB',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!file || !user) return;

    // Check if user has enough credits
    if (credits !== null && credits < 5) {
      toast({
        title: 'Insufficient credits',
        description: 'You need at least 5 AI credits to summarize content',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      toast({
        title: 'Processing document',
        description: 'Reading and analyzing your file...',
      });

      let content = '';
      
      // Read file content as text
      content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (!result || result.trim().length < 50) {
            reject(new Error('File appears to be empty or too short'));
            return;
          }
          resolve(result);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      // Call edge function with content
      const { data, error } = await supabase.functions.invoke('summarize-content', {
        body: {
          content: content,
          includeDefinitions: true,
          includeQuiz: true,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to process document');
      }

      if (!data || !data.summary) {
        throw new Error('Invalid response from AI service');
      }

      setResult(data);
      await fetchCredits();
      
      toast({
        title: 'Summary generated!',
        description: 'Your document has been processed successfully',
      });
    } catch (error: any) {
      console.error('Error processing document:', error);
      toast({
        title: 'Processing failed',
        description: error.message || 'Failed to process document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!result || !user) return;

    try {
      // Create quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          title: `Quiz from ${file?.name || 'Document'}`,
          subject: 'General',
          difficulty_level: 'medium',
          total_questions: result.quizQuestions.length,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions
      const questions = result.quizQuestions.map((q) => ({
        quiz_id: quiz.id,
        question_text: q.question,
        question_type: 'multiple_choice',
        options: q.options,
        correct_answer: q.correctAnswer,
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questions);

      if (questionsError) throw questionsError;

      toast({
        title: 'Quiz saved!',
        description: 'Your quiz has been saved to your library',
      });

      navigate('/quizzes');
    } catch (error: any) {
      console.error('Error saving quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to save quiz',
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Smart Note Summarizer</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload your class notes, PDFs, or textbooks and get AI-powered summaries, 
            key definitions, and instant quizzes
          </p>
          {credits !== null && (
            <Badge variant="secondary" className="text-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              {credits} AI Credits Available
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
            <CardDescription>
              Upload your study materials (PDF, TXT, or image files)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".txt,.md,.doc,.docx"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground">
                  TXT, MD, DOC, or DOCX (max 20MB)
                </p>
              </label>
            </div>

            {credits !== null && credits < 5 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You don't have enough AI credits. You need at least 5 credits to summarize content.
                </AlertDescription>
              </Alert>
            )}

            {file && (
              <Alert>
                <AlertDescription className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <Button
                    onClick={handleProcess}
                    disabled={isProcessing || (credits !== null && credits < 5)}
                    size="sm"
                  >
                    {isProcessing ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Summarize (5 credits)
                      </>
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {isProcessing && (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        )}

        {result && !isProcessing && (
          <Card>
            <CardHeader>
              <CardTitle>Summary Results</CardTitle>
              <CardDescription>AI-generated insights from your document</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="keypoints">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Key Points
                  </TabsTrigger>
                  <TabsTrigger value="definitions">
                    <FileText className="h-4 w-4 mr-2" />
                    Definitions
                  </TabsTrigger>
                  <TabsTrigger value="quiz">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Quiz ({result.quizQuestions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4 mt-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm leading-relaxed">{result.summary}</p>
                  </div>
                </TabsContent>

                <TabsContent value="keypoints" className="space-y-3 mt-4">
                  {result.keyPoints.map((point, index) => (
                    <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </div>
                      <p className="text-sm">{point}</p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="definitions" className="space-y-3 mt-4">
                  {result.definitions.map((def, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-card">
                      <h4 className="font-semibold text-sm mb-2 text-primary">{def.term}</h4>
                      <p className="text-sm text-muted-foreground">{def.definition}</p>
                    </div>
                  ))}
                  {result.definitions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No definitions found in this document
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="quiz" className="space-y-4 mt-4">
                  <div className="flex justify-end mb-4">
                    <Button onClick={handleSaveQuiz} variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save Quiz
                    </Button>
                  </div>
                  {result.quizQuestions.map((q, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-card space-y-3">
                      <h4 className="font-medium text-sm">
                        {index + 1}. {q.question}
                      </h4>
                      <div className="space-y-2">
                        {q.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`p-3 rounded text-sm ${
                              option === q.correctAnswer
                                ? 'bg-green-500/10 border border-green-500/20'
                                : 'bg-muted/50'
                            }`}
                          >
                            {option}
                            {option === q.correctAnswer && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Correct
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
