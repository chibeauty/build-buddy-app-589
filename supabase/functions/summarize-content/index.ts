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

    const systemPrompt = `You are an expert educational AI assistant that helps students learn effectively. 
Your role is to analyze study materials and extract the most important information in a clear, educational format.
Focus on understanding, not just memorization.`;

    const userPrompt = `Analyze the following study material and extract key learning elements.

Study Material:
${content.substring(0, 50000)}

Please provide:
1. A comprehensive summary (2-3 well-structured paragraphs that capture the main concepts and ideas)
2. 5-7 key points or takeaways (the most important concepts students should remember)
${includeDefinitions ? '3. Important definitions and terms (identify 3-5 crucial terms with clear, concise definitions)' : ''}
${includeQuiz ? '4. 5 multiple choice questions (test understanding, not just recall - include 4 options per question)' : ''}

Make the content educational, clear, and focused on helping students understand the material deeply.`;

    console.log('Processing content with AI...');

    // Build tool definition for structured output
    const tools = [{
      type: "function",
      function: {
        name: "create_study_summary",
        description: "Create a structured summary with key points, definitions, and quiz questions from study material",
        parameters: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "A comprehensive 2-3 paragraph summary of the study material"
            },
            keyPoints: {
              type: "array",
              items: { type: "string" },
              description: "5-7 key points or main takeaways from the material"
            },
            definitions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  term: { type: "string", description: "The term or concept" },
                  definition: { type: "string", description: "Clear definition of the term" }
                },
                required: ["term", "definition"]
              },
              description: "Important terms and their definitions (3-5 key terms)"
            },
            quizQuestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string", description: "The quiz question" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    description: "Exactly 4 answer options"
                  },
                  correctAnswer: { type: "string", description: "The correct answer (must match one of the options)" }
                },
                required: ["question", "options", "correctAnswer"]
              },
              description: "5 multiple choice questions to test understanding"
            }
          },
          required: ["summary", "keyPoints", "definitions", "quizQuestions"]
        }
      }
    }];

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
        tools: tools,
        tool_choice: { type: "function", function: { name: "create_study_summary" } }
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
    console.log('AI Response received');
    
    let result;
    try {
      // Extract result from tool call
      const toolCall = data.choices[0].message.tool_calls?.[0];
      if (toolCall && toolCall.function) {
        result = JSON.parse(toolCall.function.arguments);
      } else {
        throw new Error('No tool call found in response');
      }
      
      // Validate structure
      if (!result.summary || !Array.isArray(result.keyPoints)) {
        throw new Error('Invalid response structure');
      }
      
      // Ensure arrays exist even if empty
      result.definitions = result.definitions || [];
      result.quizQuestions = result.quizQuestions || [];
      
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to generate valid summary format');
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
