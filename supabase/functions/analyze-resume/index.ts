import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, jobDescription } = await req.json();
    
    if (!resumeText || !jobDescription) {
      return new Response(JSON.stringify({ error: "Missing resumeText or jobDescription" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert technical recruiter and resume analyzer. You will analyze a resume against a job description and return a structured JSON response.

Perform these 3 analyses:

1. **Semantic JD Match**: Compare skills, experience, and qualifications semantically. "Python/PyTorch" should match "Machine Learning". Score 0-100.

2. **X-Y-Z Impact Scorer**: Extract bullet points from the resume. For each, check if it follows Google's X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]". Check for:
   - hasAction: starts with a strong action verb
   - hasMetric: contains a number, percentage, or measurable outcome
   - hasTool: mentions a specific tool, technology, or method
   Score each bullet 0-3. Only include the top 8 most important bullets.

3. **AI-Authenticity Redliner**: Find overused buzzwords (streamlined, leveraged, synergy, spearheaded, navigated, cutting-edge, best-in-class, proactive, dynamic, results-driven, innovative, robust, seamless, holistic, paradigm). For each found, suggest an authentic alternative.

4. **Probing Questions**: Generate 3 specific, difficult interview questions targeting the resume's weakest areas.

Return ONLY valid JSON matching this exact structure:
{
  "overallScore": number (0-100),
  "semanticMatch": {
    "score": number (0-100),
    "matchedSkills": string[],
    "missingSkills": string[],
    "summary": string
  },
  "xyzScorer": {
    "score": number (0-100),
    "bullets": [{ "text": string, "hasMetric": boolean, "hasTool": boolean, "hasAction": boolean, "score": number, "suggestion": string }],
    "strongBullets": number,
    "weakBullets": number
  },
  "buzzwordRedliner": {
    "score": number (0-100, higher = more authentic),
    "flaggedWords": [{ "word": string, "count": number, "alternative": string }],
    "authenticity": string
  },
  "probingQuestions": string[]
}`;

    const userPrompt = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_analysis",
            description: "Return the structured resume analysis result",
            parameters: {
              type: "object",
              properties: {
                overallScore: { type: "number" },
                semanticMatch: {
                  type: "object",
                  properties: {
                    score: { type: "number" },
                    matchedSkills: { type: "array", items: { type: "string" } },
                    missingSkills: { type: "array", items: { type: "string" } },
                    summary: { type: "string" }
                  },
                  required: ["score", "matchedSkills", "missingSkills", "summary"]
                },
                xyzScorer: {
                  type: "object",
                  properties: {
                    score: { type: "number" },
                    bullets: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          text: { type: "string" },
                          hasMetric: { type: "boolean" },
                          hasTool: { type: "boolean" },
                          hasAction: { type: "boolean" },
                          score: { type: "number" },
                          suggestion: { type: "string" }
                        },
                        required: ["text", "hasMetric", "hasTool", "hasAction", "score", "suggestion"]
                      }
                    },
                    strongBullets: { type: "number" },
                    weakBullets: { type: "number" }
                  },
                  required: ["score", "bullets", "strongBullets", "weakBullets"]
                },
                buzzwordRedliner: {
                  type: "object",
                  properties: {
                    score: { type: "number" },
                    flaggedWords: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          word: { type: "string" },
                          count: { type: "number" },
                          alternative: { type: "string" }
                        },
                        required: ["word", "count", "alternative"]
                      }
                    },
                    authenticity: { type: "string" }
                  },
                  required: ["score", "flaggedWords", "authenticity"]
                },
                probingQuestions: { type: "array", items: { type: "string" } }
              },
              required: ["overallScore", "semanticMatch", "xyzScorer", "buzzwordRedliner", "probingQuestions"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "return_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(aiData));
      throw new Error("AI did not return structured data");
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
