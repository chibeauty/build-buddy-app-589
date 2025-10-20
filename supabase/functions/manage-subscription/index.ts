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

    const { action, subscriptionId, newPlanId } = await req.json();

    // Get current subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (subError) throw subError;

    if (action === 'cancel') {
      // Mark subscription for cancellation at period end
      await supabaseClient
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      console.log('Subscription marked for cancellation:', subscriptionId);

      return new Response(
        JSON.stringify({ success: true, message: 'Subscription will be cancelled at period end' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'reactivate') {
      // Reactivate cancelled subscription
      await supabaseClient
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: false,
          cancelled_at: null,
        })
        .eq('id', subscriptionId);

      console.log('Subscription reactivated:', subscriptionId);

      return new Response(
        JSON.stringify({ success: true, message: 'Subscription reactivated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'downgrade') {
      // Schedule downgrade to take effect at end of billing period
      if (!newPlanId) {
        throw new Error('New plan ID is required for downgrade');
      }

      // Store the pending plan change
      await supabaseClient
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      // Store pending plan change in metadata
      await supabaseClient
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          subscription_id: subscriptionId,
          paystack_reference: `downgrade_${subscriptionId}_${Date.now()}`,
          amount: 0,
          currency: 'NGN',
          status: 'pending',
          transaction_type: 'subscription',
          metadata: {
            action: 'downgrade',
            new_plan_id: newPlanId,
            scheduled_for: subscription.current_period_end,
          },
        });

      console.log('Downgrade scheduled:', subscriptionId, 'to plan:', newPlanId);

      return new Response(
        JSON.stringify({ success: true, message: 'Downgrade scheduled for end of billing period' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'cancel_downgrade') {
      // Cancel a scheduled downgrade
      await supabaseClient
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: false,
          cancelled_at: null,
        })
        .eq('id', subscriptionId);

      console.log('Downgrade cancelled:', subscriptionId);

      return new Response(
        JSON.stringify({ success: true, message: 'Downgrade cancelled successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error managing subscription:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});