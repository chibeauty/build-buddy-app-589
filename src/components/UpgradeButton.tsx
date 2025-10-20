import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function UpgradeButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch AI credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('ai_credits')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setAiCredits(profile.ai_credits);
      }

      // Check if user has active subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      setHasSubscription(!!subscription);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Don't show on subscription-related pages
  const hideOnPages = ['/subscription', '/billing', '/subscription/manage', '/referrals'];
  if (hideOnPages.includes(location.pathname)) {
    return null;
  }

  // Don't show if user has premium subscription
  if (hasSubscription) {
    return null;
  }

  // Show if credits are low or null (not fetched yet)
  const showButton = aiCredits === null || aiCredits < 100;

  if (!showButton) {
    return null;
  }

  return (
    <Button
      onClick={() => navigate('/subscription')}
      className="fixed bottom-20 right-4 z-50 shadow-lg hover:shadow-xl transition-all md:bottom-4"
      size="lg"
    >
      <Zap className="h-5 w-5 mr-2" />
      Upgrade to Pro
    </Button>
  );
}