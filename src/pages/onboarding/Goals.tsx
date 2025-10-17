import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Goals() {
  const [goalType, setGoalType] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [timeCommitment, setTimeCommitment] = useState([30]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const goalTypes = [
    { id: 'exam', label: 'Prepare for Exam', icon: '📝' },
    { id: 'skill', label: 'Learn New Skill', icon: '🎯' },
    { id: 'certification', label: 'Get Certified', icon: '🏆' },
    { id: 'general', label: 'General Learning', icon: '📚' },
  ];

  const handleContinue = async () => {
    if (!goalType) {
      toast({
        title: 'Please select a goal type',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('user_goals')
        .insert({
          user_id: user.id,
          goal_type: goalType,
          goal_description: goalDescription,
          time_commitment: timeCommitment[0],
        });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to save goals. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    navigate('/onboarding/notifications');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Set Your Learning Goals</CardTitle>
          <CardDescription>
            Tell us what you want to achieve
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>What's your primary goal?</Label>
            <div className="grid grid-cols-2 gap-3">
              {goalTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setGoalType(type.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    goalType === type.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Tell us more about your goal (optional)</Label>
            <Textarea
              id="description"
              placeholder="e.g., I want to prepare for my final exams in Mathematics..."
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {goalDescription.length}/500 characters
            </p>
          </div>

          <div className="space-y-4">
            <Label>How much time can you dedicate per day?</Label>
            <div className="space-y-2">
              <Slider
                value={timeCommitment}
                onValueChange={setTimeCommitment}
                min={5}
                max={240}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>5 min</span>
                <span className="font-semibold text-foreground">
                  {timeCommitment[0]} minutes
                </span>
                <span>4 hours</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 py-4">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-8 rounded-full bg-primary"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button onClick={() => navigate('/onboarding/learning-style')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleContinue} disabled={loading}>
            {loading ? <LoadingSpinner /> : 'Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
