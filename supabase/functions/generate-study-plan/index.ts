import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

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

    const { subject, goalType, targetSkillLevel, dailyTimeMinutes, examDate } = await req.json();
    console.log('Generating study plan for:', { subject, goalType, targetSkillLevel });

    const systemPrompt = `You are an expert educational AI assistant specializing in creating personalized study plans. 
Generate a detailed, actionable study plan based on the user's goals and constraints.`;

    const userPrompt = `Create a comprehensive study plan with the following parameters:
- Subject: ${subject}
- Goal Type: ${goalType}
- Target Skill Level: ${targetSkillLevel || 'Intermediate'}
- Daily Study Time: ${dailyTimeMinutes} minutes
${examDate ? `- Exam Date: ${examDate}` : ''}

Please provide:
1. A structured weekly schedule with specific topics to cover each day
2. Recommended study techniques for this subject
3. Milestone checkpoints to track progress
4. Estimated timeline to achieve the goal

Format the response as a JSON object with the following structure:
{
  "title": "Suggested plan title",
  "description": "Brief overview of the plan",
  "weeklySchedule": [
    {
      "week": 1,
      "topics": ["topic1", "topic2"],
      "focusAreas": "Description of what to focus on this week"
    }
  ],
  "studyTechniques": ["technique1", "technique2"],
  "milestones": ["milestone1", "milestone2"]
}`;

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
      throw new Error('Failed to generate study plan');
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    console.log('Study plan generated successfully');

    // Try to parse as JSON, if it fails return as text
    let studyPlan;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : generatedContent;
      studyPlan = JSON.parse(jsonString);
    } catch (e) {
      console.log('Could not parse as JSON, returning as text');
      studyPlan = {
        title: `${subject} Study Plan`,
        description: generatedContent,
        weeklySchedule: [],
        studyTechniques: [],
        milestones: []
      };
    }

    return new Response(JSON.stringify({ studyPlan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-study-plan:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
