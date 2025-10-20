import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  features: string[];
  ai_credits: number;
}

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [aiCredits, setAiCredits] = useState(0);

  useEffect(() => {
    if (user) {
      fetchPlans();
      fetchCurrentSubscription();
      fetchAiCredits();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      const plans = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }));
      setPlans(plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription plans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchAiCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('ai_credits')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setAiCredits(data?.ai_credits || 0);
    } catch (error) {
      console.error('Error fetching AI credits:', error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please log in to subscribe',
        variant: 'destructive',
      });
      return;
    }

    setProcessingPlanId(planId);

    try {
      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: { planId },
      });

      if (error) throw error;

      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize payment',
        variant: 'destructive',
      });
      setProcessingPlanId(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getPlanIcon = (planName: string) => {
    if (planName.includes('Free')) return <Zap className="h-6 w-6" />;
    if (planName.includes('Pro')) return <Crown className="h-6 w-6" />;
    return <Sparkles className="h-6 w-6" />;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[500px]" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Unlock AI-powered learning features and accelerate your educational journey
          </p>
          {currentSubscription && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                Current Plan: {currentSubscription.subscription_plans.name}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => navigate('/subscription/manage')}>
                Manage Subscription
              </Button>
            </div>
          )}
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">
              AI Credits: {aiCredits}
            </span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                currentSubscription?.plan_id === plan.id
                  ? 'border-primary shadow-lg'
                  : ''
              }`}
            >
              {currentSubscription?.plan_id === plan.id && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Current Plan</Badge>
                </div>
              )}
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto text-primary">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-4xl font-bold">
                  {formatPrice(plan.price, plan.currency)}
                  <span className="text-base font-normal text-muted-foreground">
                    /{plan.billing_interval}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Zap className="h-4 w-4 text-primary" />
                    {plan.ai_credits.toLocaleString()} AI Credits
                  </div>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={
                    processingPlanId === plan.id ||
                    currentSubscription?.plan_id === plan.id ||
                    plan.price === 0
                  }
                >
                  {processingPlanId === plan.id
                    ? 'Processing...'
                    : currentSubscription?.plan_id === plan.id
                    ? 'Current Plan'
                    : plan.price === 0
                    ? 'Free Plan'
                    : 'Subscribe Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}