import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, Info, Gift, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Notifications() {
  // Mock notifications data - in production, this would come from the database
  const notifications = [
    {
      id: '1',
      type: 'achievement',
      title: 'New Achievement Unlocked!',
      message: 'You earned the "Week Warrior" badge for maintaining a 7-day study streak',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
      icon: Gift,
    },
    {
      id: '2',
      type: 'study_reminder',
      title: 'Study Reminder',
      message: 'Time to review your flashcards for Mathematics',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: false,
      icon: Bell,
    },
    {
      id: '3',
      type: 'referral',
      title: 'Referral Reward',
      message: 'Your friend joined using your referral link! You earned 100 AI credits',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      read: true,
      icon: TrendingUp,
    },
    {
      id: '4',
      type: 'info',
      title: 'Weekly Progress Report',
      message: 'Your study progress this week: 5 quizzes completed, 120 flashcards reviewed',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: true,
      icon: Info,
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleMarkAllRead = () => {
    // In production, this would update the database
    console.log('Marking all as read');
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <CardTitle className="text-center mb-2">No notifications yet</CardTitle>
                <CardDescription className="text-center">
                  We'll notify you about important updates and achievements
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <Card 
                  key={notification.id} 
                  className={`transition-all hover:shadow-md ${!notification.read ? 'bg-accent/5 border-accent/20' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        notification.type === 'achievement' ? 'bg-accent/20' :
                        notification.type === 'study_reminder' ? 'bg-primary/20' :
                        notification.type === 'referral' ? 'bg-success/20' :
                        'bg-muted'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          notification.type === 'achievement' ? 'text-accent' :
                          notification.type === 'study_reminder' ? 'text-primary' :
                          notification.type === 'referral' ? 'text-success' :
                          'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{notification.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Badge variant="default" className="h-2 w-2 rounded-full p-0" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                        <CardDescription>{notification.message}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
}
