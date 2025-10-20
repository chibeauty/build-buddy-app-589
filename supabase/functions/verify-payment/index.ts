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
    const { reference } = await req.json();
    
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    // Verify transaction with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      throw new Error('Payment verification failed');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const metadata = paystackData.data.metadata;
    const userId = metadata.user_id;
    const planId = metadata.plan_id;
    const referralCode = metadata.referral_code;

    // Update transaction status
    await supabaseClient
      .from('payment_transactions')
      .update({
        status: 'success',
        payment_method: paystackData.data.channel,
      })
      .eq('paystack_reference', reference);

    // Get plan details
    const { data: plan } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    // Calculate subscription period
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    if (plan.billing_interval === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else if (plan.billing_interval === 'yearly') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    // Create or update subscription
    const { data: existingSubscription } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      await supabaseClient
        .from('user_subscriptions')
        .update({
          plan_id: planId,
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
          paystack_customer_code: paystackData.data.customer.customer_code,
        })
        .eq('id', existingSubscription.id);
    } else {
      await supabaseClient
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
          paystack_customer_code: paystackData.data.customer.customer_code,
        });
    }

    // Add AI credits to user profile
    await supabaseClient
      .from('profiles')
      .update({
        ai_credits: plan.ai_credits,
      })
      .eq('id', userId);

    // Process referral if exists
    if (referralCode) {
      const { data: referralCodeData } = await supabaseClient
        .from('referral_codes')
        .select('user_id')
        .eq('code', referralCode)
        .single();

      if (referralCodeData && referralCodeData.user_id !== userId) {
        const rewardAmount = plan.price * 0.1; // 10% referral reward

        // Create referral record
        await supabaseClient
          .from('referrals')
          .insert({
            referrer_id: referralCodeData.user_id,
            referred_id: userId,
            referral_code: referralCode,
            reward_amount: rewardAmount,
            reward_status: 'paid',
            paid_at: new Date().toISOString(),
          });

        // Update referral code stats
        await supabaseClient.rpc('increment', {
          table_name: 'referral_codes',
          row_id: referralCodeData.user_id,
          column_name: 'total_referrals',
        });

        // Add reward to referrer's AI credits
        const { data: referrerProfile } = await supabaseClient
          .from('profiles')
          .select('ai_credits')
          .eq('id', referralCodeData.user_id)
          .single();

        await supabaseClient
          .from('profiles')
          .update({
            ai_credits: (referrerProfile?.ai_credits || 0) + 100, // Bonus credits as reward
          })
          .eq('id', referralCodeData.user_id);
      }
    }

    console.log('Payment verified and subscription created:', reference);

    return new Response(
      JSON.stringify({ success: true, message: 'Payment verified successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});