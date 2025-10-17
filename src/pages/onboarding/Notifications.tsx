import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Bell, Trophy, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Notifications() {
  const [studyReminders, setStudyReminders] = useState(true);
  const [achievementNotifications, setAchievementNotifications] = useState(true);
  const [communityUpdates, setCommunityUpdates] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleComplete = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          study_reminders: studyReminders,
          achievement_notifications: achievementNotifications,
          community_updates: communityUpdates,
          reminder_time: reminderTime,
        })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to save preferences. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    toast({
      title: 'Welcome to ExHub!',
      description: 'Your account is all set up. Let\'s start learning!',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Notification Preferences</CardTitle>
          <CardDescription>
            Stay motivated with timely reminders
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 rounded-full bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="study-reminders" className="text-base font-semibold cursor-pointer">
                    Study Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to maintain your study streak
                  </p>
                </div>
              </div>
              <Switch
                id="study-reminders"
                checked={studyReminders}
                onCheckedChange={setStudyReminders}
              />
            </div>

            {studyReminders && (
              <div className="ml-4 pl-10 space-y-2">
                <Label htmlFor="reminder-time">Preferred reminder time</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-40"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 rounded-full bg-success/10">
                  <Trophy className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="achievements" className="text-base font-semibold cursor-pointer">
                    Achievement Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Celebrate your progress and milestones
                  </p>
                </div>
              </div>
              <Switch
                id="achievements"
                checked={achievementNotifications}
                onCheckedChange={setAchievementNotifications}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 rounded-full bg-accent/10">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="community" className="text-base font-semibold cursor-pointer">
                    Community Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Stay updated on study group activities
                  </p>
                </div>
              </div>
              <Switch
                id="community"
                checked={communityUpdates}
                onCheckedChange={setCommunityUpdates}
              />
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 py-4">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-8 rounded-full bg-primary"></div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button onClick={() => navigate('/onboarding/goals')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleComplete} disabled={loading}>
            {loading ? <LoadingSpinner /> : 'Complete Setup'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
