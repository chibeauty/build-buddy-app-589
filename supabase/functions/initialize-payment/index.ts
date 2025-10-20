import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { planId, packageId, referralCode, isUpgrade, currentSubscriptionId } = await req.json();

    let amount: number;
    let currency: string;
    let metadata: any;
    let transactionType: string;

    if (packageId) {
      // Handle credit package purchase
      const { data: pkg, error: pkgError } = await supabaseClient
        .from('ai_credit_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (pkgError) throw pkgError;

      // Get user profile for email
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      amount = Math.round(Number(pkg.price) * 100);
      currency = pkg.currency;
      transactionType = 'credit_purchase';
      metadata = {
        user_id: user.id,
        package_id: packageId,
        credits: pkg.credits,
        type: 'credit_purchase',
        customer_name: profile?.full_name || 'User',
      };
    } else if (planId) {
      // Handle subscription
      // Get plan details
      const { data: plan, error: planError } = await supabaseClient
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) throw planError;

      let finalAmount = plan.price;

      // Calculate prorated amount for upgrades
      if (isUpgrade && currentSubscriptionId) {
        const { data: currentSub } = await supabaseClient
          .from('user_subscriptions')
          .select('*, subscription_plans(*)')
          .eq('id', currentSubscriptionId)
          .single();

        if (currentSub) {
          const currentPeriodEnd = new Date(currentSub.current_period_end);
          const now = new Date();
          const daysRemaining = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const totalDays = currentSub.subscription_plans.billing_interval === 'monthly' ? 30 : 365;
          
          // Calculate unused amount from current plan
          const unusedAmount = (currentSub.subscription_plans.price / totalDays) * daysRemaining;
          
          // Calculate prorated amount for new plan
          const newPlanProrated = (plan.price / totalDays) * daysRemaining;
          
          // Final amount is the difference
          finalAmount = Math.max(0, newPlanProrated - unusedAmount);
        }
      }

      // Get user profile for email
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      amount = Math.round(finalAmount * 100);
      currency = plan.currency;
      transactionType = isUpgrade ? 'upgrade' : 'subscription';
      metadata = {
        user_id: user.id,
        plan_id: planId,
        type: 'subscription',
        referral_code: referralCode || null,
        customer_name: profile?.full_name || 'User',
        is_upgrade: isUpgrade || false,
        current_subscription_id: currentSubscriptionId || null,
      };
    } else {
      throw new Error('Either planId or packageId is required');
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    // Initialize Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount,
        currency,
        metadata,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-payment`,
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Failed to initialize payment');
    }

    // Create pending transaction record
    await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        paystack_reference: paystackData.data.reference,
        amount: amount / 100,
        currency,
        status: 'pending',
        transaction_type: transactionType,
        metadata,
      });

    console.log('Payment initialized:', paystackData.data.reference);

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error initializing payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});