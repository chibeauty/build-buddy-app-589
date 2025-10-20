import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ArrowUp, ArrowDown, AlertCircle, Calendar, Zap } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

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

interface CurrentSubscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  subscription_plans: SubscriptionPlan;
}

export default function ManageSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      // Fetch current subscription
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (subError && subError.code !== 'PGRST116') throw subError;
      
      if (subData) {
        const subscription = {
          ...subData,
          subscription_plans: {
            ...subData.subscription_plans,
            features: Array.isArray(subData.subscription_plans.features) 
              ? subData.subscription_plans.features as string[] 
              : []
          }
        } as CurrentSubscription;
        setCurrentSubscription(subscription);
      }

      // Fetch all available plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (plansError) throw plansError;
      
      const plans = (plansData || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }));
      setAvailablePlans(plans);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan || !currentSubscription) return;

    setProcessing(selectedPlan.id);
    try {
      // Initialize payment for upgrade
      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: { 
          planId: selectedPlan.id,
          isUpgrade: true,
          currentSubscriptionId: currentSubscription.id
        },
      });

      if (error) throw error;

      // Redirect to payment page
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to process upgrade',
        variant: 'destructive',
      });
      setProcessing(null);
    }
  };

  const handleDowngrade = async () => {
    if (!selectedPlan || !currentSubscription) return;

    setProcessing(selectedPlan.id);
    try {
      const { error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: 'downgrade',
          subscriptionId: currentSubscription.id,
          newPlanId: selectedPlan.id,
        },
      });

      if (error) throw error;

      toast({
        title: 'Downgrade Scheduled',
        description: `Your plan will change to ${selectedPlan.name} at the end of your current billing period`,
      });

      setShowDowngradeDialog(false);
      fetchSubscriptionData();
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to process downgrade',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelDowngrade = async () => {
    if (!currentSubscription) return;

    try {
      const { error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: 'cancel_downgrade',
          subscriptionId: currentSubscription.id,
        },
      });

      if (error) throw error;

      toast({
        title: 'Downgrade Cancelled',
        description: 'Your current plan will continue',
      });

      fetchSubscriptionData();
    } catch (error) {
      console.error('Error cancelling downgrade:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel downgrade',
        variant: 'destructive',
      });
    }
  };

  const openUpgradeDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeDialog(true);
  };

  const openDowngradeDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowDowngradeDialog(true);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isUpgrade = (plan: SubscriptionPlan) => {
    return currentSubscription && plan.price > currentSubscription.subscription_plans.price;
  };

  const isDowngrade = (plan: SubscriptionPlan) => {
    return currentSubscription && plan.price < currentSubscription.subscription_plans.price;
  };

  const isCurrent = (plan: SubscriptionPlan) => {
    return currentSubscription?.plan_id === plan.id;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-[400px]" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentSubscription) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Manage Subscription</h1>
          </div>
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No Active Subscription</h3>
                <p className="text-muted-foreground">You don't have an active subscription yet</p>
              </div>
              <Button onClick={() => navigate('/subscription')}>
                View Subscription Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Manage Your Subscription</h1>
            <p className="text-muted-foreground">Upgrade or downgrade your plan</p>
          </div>
        </div>

        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Current Plan</CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </div>
              <Badge>Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-xl mb-2">{currentSubscription.subscription_plans.name}</h3>
                <p className="text-3xl font-bold mb-1">
                  {formatPrice(currentSubscription.subscription_plans.price, currentSubscription.subscription_plans.currency)}
                  <span className="text-base font-normal text-muted-foreground">
                    /{currentSubscription.subscription_plans.billing_interval}
                  </span>
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                  <Zap className="h-4 w-4 text-primary" />
                  {currentSubscription.subscription_plans.ai_credits.toLocaleString()} AI Credits
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Billing Period</p>
                    <p className="text-muted-foreground">
                      {formatDate(currentSubscription.current_period_start)} - {formatDate(currentSubscription.current_period_end)}
                    </p>
                  </div>
                </div>

                {currentSubscription.cancel_at_period_end && (
                  <div className="bg-destructive/10 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Downgrade Scheduled</p>
                      <p className="text-muted-foreground">
                        Changes take effect on {formatDate(currentSubscription.current_period_end)}
                      </p>
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-destructive" 
                        onClick={handleCancelDowngrade}
                      >
                        Cancel downgrade
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Plan Features</h4>
              <div className="grid gap-2 md:grid-cols-2">
                {currentSubscription.subscription_plans.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {availablePlans.map((plan) => (
              <Card 
                key={plan.id}
                className={isCurrent(plan) ? 'border-primary opacity-60' : ''}
              >
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold pt-2">
                    {formatPrice(plan.price, plan.currency)}
                    <span className="text-base font-normal text-muted-foreground">
                      /{plan.billing_interval}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Zap className="h-4 w-4 text-primary" />
                    {plan.ai_credits.toLocaleString()} AI Credits
                  </div>
                  
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {isCurrent(plan) ? (
                    <Badge variant="outline" className="w-full justify-center py-2">
                      Current Plan
                    </Badge>
                  ) : isUpgrade(plan) ? (
                    <Button 
                      className="w-full" 
                      onClick={() => openUpgradeDialog(plan)}
                      disabled={processing === plan.id}
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      {processing === plan.id ? 'Processing...' : 'Upgrade Now'}
                    </Button>
                  ) : isDowngrade(plan) ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => openDowngradeDialog(plan)}
                      disabled={processing === plan.id || currentSubscription.cancel_at_period_end}
                    >
                      <ArrowDown className="h-4 w-4 mr-2" />
                      {processing === plan.id ? 'Processing...' : 'Downgrade'}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        title="Upgrade Plan"
        description={`You'll be charged the prorated amount immediately and your plan will be upgraded to ${selectedPlan?.name}. Your AI credits will be updated instantly.`}
        onConfirm={handleUpgrade}
        confirmText={processing ? 'Processing...' : 'Confirm Upgrade'}
        cancelText="Cancel"
      />

      <ConfirmationDialog
        open={showDowngradeDialog}
        onOpenChange={setShowDowngradeDialog}
        title="Downgrade Plan"
        description={`Your plan will change to ${selectedPlan?.name} at the end of your current billing period (${currentSubscription ? formatDate(currentSubscription.current_period_end) : ''}). You'll continue to have access to your current plan until then.`}
        onConfirm={handleDowngrade}
        confirmText={processing ? 'Processing...' : 'Confirm Downgrade'}
        cancelText="Cancel"
      />
    </MainLayout>
  );
}