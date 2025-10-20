import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { content, summaryLength } = await req.json();
    console.log('Summarizing content, length:', summaryLength || 'medium');

    const lengthInstructions = {
      short: 'Provide a brief 2-3 sentence summary',
      medium: 'Provide a comprehensive paragraph (5-7 sentences) summarizing the key points',
      long: 'Provide a detailed summary with multiple paragraphs covering all important aspects'
    };

    const instruction = lengthInstructions[summaryLength as keyof typeof lengthInstructions] || lengthInstructions.medium;

    const systemPrompt = `You are an expert at summarizing educational content. 
Extract the most important information and present it in a clear, concise manner that's easy to understand.`;

    const userPrompt = `${instruction}:

${content}

Focus on:
- Main concepts and key points
- Important definitions and terms
- Critical relationships and connections
- Actionable takeaways

Provide the summary in a clear, well-structured format.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
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
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Failed to summarize content');
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;
    
    console.log('Content summarized successfully');

    return new Response(JSON.stringify({ summary }), {
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
