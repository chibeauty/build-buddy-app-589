import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, includeDefinitions = false, includeQuiz = false } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check AI credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ai_credits')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const creditsNeeded = 5;
    if (!profile || profile.ai_credits < creditsNeeded) {
      return new Response(
        JSON.stringify({ error: 'Insufficient AI credits' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build prompt based on requested features
    let systemPrompt = 'You are an educational AI assistant that helps students understand and learn from their study materials. Always respond with valid JSON.';
    let userPrompt = `Analyze the following study material and provide:\n\n`;
    
    userPrompt += `1. A comprehensive summary (2-3 paragraphs)\n`;
    userPrompt += `2. 5-7 key points or takeaways\n`;
    
    if (includeDefinitions) {
      userPrompt += `3. Important definitions or terms (extract at least 3-5 key terms with definitions)\n`;
    }
    
    if (includeQuiz) {
      userPrompt += `4. 5 multiple choice quiz questions with 4 options each and indicate the correct answer\n`;
    }
    
    userPrompt += `\nProvide your response in valid JSON format with this structure:\n`;
    userPrompt += `{\n`;
    userPrompt += `  "summary": "string",\n`;
    userPrompt += `  "keyPoints": ["string"],\n`;
    userPrompt += `  "definitions": [{"term": "string", "definition": "string"}],\n`;
    userPrompt += `  "quizQuestions": [{"question": "string", "options": ["string"], "correctAnswer": "string"}]\n`;
    userPrompt += `}\n\n`;
    userPrompt += `Study Material:\n${content.substring(0, 10000)}`;

    console.log('Processing content with AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error('AI processing failed');
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content;
    
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      console.error('Failed to parse AI response:', resultText);
      // Fallback to basic summary
      result = {
        summary: resultText,
        keyPoints: [],
        definitions: [],
        quizQuestions: []
      };
    }

    // Deduct credits
    const { error: deductError } = await supabase.rpc('deduct_ai_credits', {
      _user_id: user.id,
      _credits: creditsNeeded,
      _feature_type: 'content_summary'
    });

    if (deductError) {
      console.error('Error deducting credits:', deductError);
    }

    console.log('Content summarized successfully');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in summarize-content:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
