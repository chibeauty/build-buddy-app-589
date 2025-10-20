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
import { Check, Zap, Crown, Sparkles, Gift, FileText, BookOpen, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPlans();
      fetchCurrentSubscription();
      fetchAiCredits();
      const storedReferralCode = localStorage.getItem('referral_code');
      setReferralCode(storedReferralCode);
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
      // Get referral code from localStorage if available
      const referralCode = localStorage.getItem('referral_code');
      
      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: { 
          planId,
          referralCode: referralCode || undefined,
        },
      });

      if (error) throw error;

      // Clear referral code after successful payment initialization
      if (referralCode) {
        localStorage.removeItem('referral_code');
      }

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

        {referralCode && (
          <Alert className="bg-primary/10 border-primary max-w-2xl mx-auto">
            <Gift className="h-4 w-4 text-primary" />
            <AlertDescription>
              You have a referral bonus! Subscribe to any plan and get <strong>100 bonus AI credits</strong> instantly.
            </AlertDescription>
          </Alert>
        )}

        <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Smart Note Summarizer</CardTitle>
            </div>
            <CardDescription className="text-base">
              Transform your study materials into actionable insights with AI-powered summarization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-background/50">
                <div className="p-3 rounded-full bg-primary/10 mb-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Instant Summaries</h3>
                <p className="text-sm text-muted-foreground">
                  Get concise summaries of lengthy documents and key points extraction
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-background/50">
                <div className="p-3 rounded-full bg-primary/10 mb-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Key Definitions</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically extract and define important terms from your materials
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-background/50">
                <div className="p-3 rounded-full bg-primary/10 mb-3">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Auto-Generated Quizzes</h3>
                <p className="text-sm text-muted-foreground">
                  Create practice quizzes instantly from your study materials
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-background/50 border border-primary/20">
              <p className="text-sm text-center">
                <span className="font-semibold text-primary">Pro Plans Include:</span> Unlimited document summarization, 
                support for PDF, DOCX, TXT, MD, and image files, plus priority AI processing
              </p>
            </div>
          </CardContent>
        </Card>

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