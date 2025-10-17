import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Ear, Hand, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

type LearningStyle = 'visual' | 'auditory' | 'kinesthetic';

export default function LearningStyle() {
  const [selected, setSelected] = useState<LearningStyle | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const styles = [
    {
      id: 'visual' as LearningStyle,
      icon: Eye,
      title: 'Visual Learner',
      description: 'I learn best through images, diagrams, and written materials',
      color: 'border-primary bg-primary/5 hover:bg-primary/10',
    },
    {
      id: 'auditory' as LearningStyle,
      icon: Ear,
      title: 'Auditory Learner',
      description: 'I learn best through listening and discussions',
      color: 'border-success bg-success/5 hover:bg-success/10',
    },
    {
      id: 'kinesthetic' as LearningStyle,
      icon: Hand,
      title: 'Kinesthetic Learner',
      description: 'I learn best through hands-on practice and experience',
      color: 'border-accent bg-accent/5 hover:bg-accent/10',
    },
  ];

  const handleContinue = async () => {
    if (!selected) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ learning_style: selected })
        .eq('id', user.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to save learning style. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    navigate('/onboarding/goals');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">What's Your Learning Style?</CardTitle>
          <CardDescription>
            This helps us personalize your learning experience
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {styles.map((style) => {
            const Icon = style.icon;
            const isSelected = selected === style.id;

            return (
              <button
                key={style.id}
                onClick={() => setSelected(style.id)}
                className={`w-full p-6 rounded-lg border-2 transition-all ${
                  isSelected
                    ? `${style.color} border-current`
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-full bg-background">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-lg mb-1">{style.title}</h3>
                    <p className="text-sm text-muted-foreground">{style.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-sm">✓</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          <div className="flex items-center justify-center space-x-2 py-4">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-8 rounded-full bg-primary"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button onClick={() => navigate('/onboarding/welcome')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleContinue} disabled={!selected || loading}>
            {loading ? <LoadingSpinner /> : 'Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
