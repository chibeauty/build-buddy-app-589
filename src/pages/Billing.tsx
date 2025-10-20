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
import { AlertCircle, CreditCard, Calendar, Activity, ArrowLeft } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { PaymentMethods } from '@/components/PaymentMethods';
import CreditPackages from '@/components/CreditPackages';
import { Separator } from '@/components/ui/separator';

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBillingData();
    }
  }, [user]);

  const fetchBillingData = async () => {
    try {
      // Fetch subscription
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      setSubscription(subData);

      // Fetch transactions
      const { data: transData } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setTransactions(transData || []);

      // Fetch usage
      const { data: usageData } = await supabase
        .from('user_ai_usage')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setUsage(usageData || []);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setCancelling(true);
    try {
      const { error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: 'cancel',
          subscriptionId: subscription.id,
        },
      });

      if (error) throw error;

      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will remain active until the end of the billing period',
      });

      fetchBillingData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
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
          <h1 className="text-3xl font-bold">Billing & Usage</h1>
        </div>

        {subscription && (
          <Card>
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Manage your subscription and billing details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{subscription.subscription_plans.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(subscription.subscription_plans.price, subscription.subscription_plans.currency)} /{' '}
                    {subscription.subscription_plans.billing_interval}
                  </p>
                </div>
                <Badge variant={subscription.cancel_at_period_end ? 'destructive' : 'default'}>
                  {subscription.cancel_at_period_end ? 'Cancelling' : 'Active'}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Current Period</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                </div>
              </div>

              {subscription.cancel_at_period_end && (
                <div className="flex items-start gap-2 p-4 bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Subscription Cancelled</p>
                    <p className="text-sm text-muted-foreground">
                      Your subscription will remain active until {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => navigate('/subscription/manage')}>
                  Manage Plan
                </Button>
                {!subscription.cancel_at_period_end && (
                  <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{transaction.transaction_type}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(transaction.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatPrice(transaction.amount, transaction.currency)}
                        </p>
                        <Badge variant={transaction.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                AI Usage History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usage.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No usage yet</p>
                ) : (
                  usage.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {item.feature_type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
                      </div>
                      <Badge variant="outline">{item.credits_used} credits</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <CreditPackages />

        <Separator />

        <PaymentMethods />

        <Separator />

        {/* Need Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Have questions about your subscription or billing? Contact our support team.
            </p>
            <Button variant="outline" onClick={() => navigate('/help')}>
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Cancel Subscription"
        description="Are you sure you want to cancel your subscription? You'll continue to have access until the end of your billing period."
        onConfirm={handleCancelSubscription}
        confirmText={cancelling ? 'Cancelling...' : 'Yes, Cancel'}
        cancelText="Keep Subscription"
      />
    </MainLayout>
  );
}