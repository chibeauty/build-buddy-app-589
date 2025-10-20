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
    const transactionType = metadata.type || 'subscription';
    const referralCode = metadata.referral_code;

    // Update transaction status
    await supabaseClient
      .from('payment_transactions')
      .update({
        status: 'success',
        payment_method: paystackData.data.channel,
      })
      .eq('paystack_reference', reference);

    if (transactionType === 'credit_purchase') {
      // Handle credit package purchase
      const credits = metadata.credits;
      
      // Get current AI credits
      const { data: currentProfile } = await supabaseClient
        .from('profiles')
        .select('ai_credits')
        .eq('id', userId)
        .single();

      // Add credits to user profile
      await supabaseClient
        .from('profiles')
        .update({
          ai_credits: (currentProfile?.ai_credits || 0) + credits,
        })
        .eq('id', userId);

      console.log(`Added ${credits} AI credits to user ${userId}`);
    } else {
      // Handle subscription
      const planId = metadata.plan_id;

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

      // Get current AI credits
      const { data: currentProfile } = await supabaseClient
        .from('profiles')
        .select('ai_credits')
        .eq('id', userId)
        .single();

      // Add AI credits to user profile
      await supabaseClient
        .from('profiles')
        .update({
          ai_credits: (currentProfile?.ai_credits || 0) + plan.ai_credits,
        })
        .eq('id', userId);
    }

    // Store payment method if authorization exists
    if (paystackData.data.authorization) {
      const auth = paystackData.data.authorization;
      
      // Check if payment method already exists
      const { data: existingMethod } = await supabaseClient
        .from('payment_methods')
        .select('id')
        .eq('user_id', userId)
        .eq('paystack_authorization_code', auth.authorization_code)
        .maybeSingle();

      if (!existingMethod && auth.authorization_code) {
        // Check if this is the first payment method
        const { data: existingMethods } = await supabaseClient
          .from('payment_methods')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true);

        await supabaseClient.from('payment_methods').insert({
          user_id: userId,
          paystack_authorization_code: auth.authorization_code,
          card_type: auth.card_type || 'card',
          last_four: auth.last4 || '',
          exp_month: auth.exp_month || '',
          exp_year: auth.exp_year || '',
          bank: auth.bank || null,
          brand: auth.brand || 'card',
          is_default: !existingMethods || existingMethods.length === 0,
        });
      }
    }

    // Process referral if exists (only for subscriptions)
    if (transactionType === 'subscription' && referralCode) {
      const { data: referralCodeData } = await supabaseClient
        .from('referral_codes')
        .select('user_id')
        .eq('code', referralCode)
        .single();

      if (referralCodeData && referralCodeData.user_id !== userId) {
        // Get plan for reward calculation
        const { data: plan } = await supabaseClient
          .from('subscription_plans')
          .select('price')
          .eq('id', metadata.plan_id)
          .single();

        const rewardAmount = plan ? plan.price * 0.1 : 0;

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