import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Brain, Users, Trophy } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center animate-in zoom-in duration-500">
              <span className="text-4xl font-bold text-primary-foreground">E</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to ExHub!</CardTitle>
          <CardDescription className="text-lg">
            Your AI-powered companion for personalized learning
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-primary/5">
              <div className="p-2 rounded-full bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI-Powered Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized study plans and smart quizzes
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg bg-success/5">
              <div className="p-2 rounded-full bg-success/10">
                <BookOpen className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Smart Flashcards</h3>
                <p className="text-sm text-muted-foreground">
                  Spaced repetition for optimal retention
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg bg-accent/5">
              <div className="p-2 rounded-full bg-accent/10">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Community Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Join study groups and learn together
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg bg-warning/5">
              <div className="p-2 rounded-full bg-warning/10">
                <Trophy className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Gamified Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Earn achievements and track your streaks
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 py-4">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-8 rounded-full bg-muted"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={() => navigate('/onboarding/learning-style')} className="w-full" size="lg">
            Let's Get Started
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="w-full">
            Skip Onboarding
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
