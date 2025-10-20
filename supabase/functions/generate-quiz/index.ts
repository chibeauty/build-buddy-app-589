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

    const { content, subject, difficulty, questionCount, questionTypes } = await req.json();
    console.log('Generating quiz:', { subject, difficulty, questionCount });

    const systemPrompt = `You are an expert quiz creator. Generate educational quiz questions that are clear, accurate, and appropriate for the specified difficulty level.
Always return valid JSON with the exact structure requested.`;

    const typesDescription = questionTypes?.length > 0 
      ? `Focus on these question types: ${questionTypes.join(', ')}` 
      : 'Mix different question types (multiple choice, true/false, short answer)';

    const userPrompt = `Create ${questionCount} quiz questions based on the following:

Subject: ${subject}
Difficulty: ${difficulty}
Content: ${content}

${typesDescription}

Return ONLY a JSON array with this exact structure:
[
  {
    "question_text": "The question text",
    "question_type": "multiple_choice" or "true_false" or "short_answer",
    "correct_answer": "The correct answer",
    "options": ["option1", "option2", "option3", "option4"] (for multiple choice only, null otherwise),
    "explanation": "Brief explanation of why this is the correct answer"
  }
]

Important: 
- For multiple_choice: provide exactly 4 options
- For true_false: set correct_answer to "true" or "false" and options to null
- For short_answer: set options to null
- Make sure questions test understanding, not just memorization`;

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
      throw new Error('Failed to generate quiz');
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    console.log('Quiz generated successfully');

    // Try to parse as JSON
    let questions;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : generatedContent;
      questions = JSON.parse(jsonString);
      
      // Validate structure
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }
    } catch (e) {
      console.error('Failed to parse quiz JSON:', e);
      throw new Error('Failed to generate valid quiz format');
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-quiz:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
