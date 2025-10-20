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

    const { content, subject, cardCount } = await req.json();
    console.log('Generating flashcards:', { subject, cardCount });

    const systemPrompt = `You are an expert at creating educational flashcards using spaced repetition principles. 
Create flashcards that are concise, focused on key concepts, and optimized for memorization.
Always return valid JSON with the exact structure requested.`;

    const userPrompt = `Create ${cardCount || 10} flashcards based on the following content:

Subject: ${subject}
Content: ${content}

Return ONLY a JSON array with this exact structure:
[
  {
    "front_text": "The question or prompt (keep it concise)",
    "back_text": "The answer or explanation"
  }
]

Guidelines:
- Each flashcard should focus on ONE concept
- Front side should be a clear question or prompt
- Back side should be a concise, accurate answer
- Avoid overly complex or multi-part questions
- Use simple, direct language
- Include key terms and definitions
- Cover the most important concepts from the content`;

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
      throw new Error('Failed to generate flashcards');
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    console.log('Flashcards generated successfully');

    // Try to parse as JSON
    let flashcards;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : generatedContent;
      flashcards = JSON.parse(jsonString);
      
      // Validate structure
      if (!Array.isArray(flashcards)) {
        throw new Error('Response is not an array');
      }
    } catch (e) {
      console.error('Failed to parse flashcards JSON:', e);
      throw new Error('Failed to generate valid flashcards format');
    }

    return new Response(JSON.stringify({ flashcards }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-flashcards:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
