import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://hireflowly.nishagoswami.com",
  "https://nishagoswami.com",
  "https://www.nishagoswami.com",
  "http://localhost:5173",
];

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? DEFAULT_ALLOWED_ORIGINS.join(","))
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const MAX_TEXT_LENGTH = 20000; // char limit per field to cap spend and abuse
const MAX_BODY_BYTES = 120_000; // rough safety cap
const RATE_LIMIT_PER_IP = 60; // per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const AI_TIMEOUT_MS = 30_000;
const AI_MAX_ATTEMPTS = 3;
const AI_RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL");

const corsHeadersBase = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const requestSchema = z.object({
  resumeText: z.string().min(1).max(MAX_TEXT_LENGTH),
  jobDescription: z.string().min(1).max(MAX_TEXT_LENGTH),
  role: z.enum(['SWE', 'PM', 'DS', 'Design', 'Sales']).optional(),
  seniority: z.enum(['Junior', 'Mid', 'Senior']).optional(),
});

const analysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  semanticMatch: z.object({
    score: z.number().min(0).max(100),
    matchedSkills: z.array(z.string()),
    missingSkills: z.array(z.string()),
    summary: z.string(),
  }),
  xyzScorer: z.object({
    score: z.number().min(0).max(100),
    bullets: z.array(z.object({
      text: z.string(),
      hasMetric: z.boolean(),
      hasTool: z.boolean(),
      hasAction: z.boolean(),
      score: z.number().min(0).max(3),
      suggestion: z.string(),
    })).max(8),
    strongBullets: z.number().nonnegative(),
    weakBullets: z.number().nonnegative(),
  }),
  buzzwordRedliner: z.object({
    score: z.number().min(0).max(100),
    flaggedWords: z.array(z.object({
      word: z.string(),
      count: z.number().nonnegative(),
      alternative: z.string(),
    })),
    authenticity: z.string(),
  }),
  probingQuestions: z.array(z.string()).max(5),
  rewrites: z.array(z.object({
    bullet: z.string(),
    suggestedRewrite: z.string(),
    expectedScoreLift: z.number().nonnegative().max(10),
    explanation: z.string(),
  })).optional(),
  skillGaps: z.array(z.object({
    skill: z.string(),
    jdContext: z.string(),
    suggestedPlacement: z.string(),
    priority: z.enum(['High', 'Medium', 'Low']),
  })).optional(),
  confidenceBands: z.object({
    semanticMatch: z.object({
      score: z.number().min(0).max(100),
      confidence: z.number().min(0).max(100),
      reasoning: z.string(),
    }),
    xyzScorer: z.object({
      score: z.number().min(0).max(100),
      confidence: z.number().min(0).max(100),
      reasoning: z.string(),
    }),
    buzzwordRedliner: z.object({
      score: z.number().min(0).max(100),
      confidence: z.number().min(0).max(100),
      reasoning: z.string(),
    }),
  }).optional(),
});

const kv = await Deno.openKv();

function buildCorsHeaders(origin: string | null, correlationId: string) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "";
  return {
    ...corsHeadersBase,
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "X-Correlation-ID": correlationId,
    "Content-Type": "application/json",
  };
}

function errorResponse(status: number, code: string, message: string, headers: HeadersInit) {
  return new Response(JSON.stringify({ error: { code, message } }), { status, headers });
}

async function rateLimit(identifier: string, limit: number, windowMs: number) {
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const key = ["rate", "analyze-resume", identifier, windowStart];
  const current = await kv.get<number>(key);
  const nextCount = (current?.value ?? 0) + 1;
  await kv.set(key, nextCount, { expireIn: windowMs });
  return nextCount <= limit;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number {
  const base = 350 * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 180);
  return base + jitter;
}

async function callAiGatewayWithRetry(
  payload: unknown,
  apiKey: string,
  aiGatewayUrl: string,
  correlationId: string,
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; text: string }> {
  let lastStatus = 502;
  let lastText = "AI service unavailable";

  for (let attempt = 0; attempt < AI_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const response = await fetch(aiGatewayUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        clearTimeout(timeout);
        return { ok: true, data };
      }

      const text = await response.text();
      lastStatus = response.status;
      lastText = text;

      console.error("[ai_gateway_attempt_failed]", {
        attempt: attempt + 1,
        status: response.status,
        correlationId,
      });

      clearTimeout(timeout);

      const shouldRetry = AI_RETRYABLE_STATUS.has(response.status) && attempt < AI_MAX_ATTEMPTS - 1;
      if (!shouldRetry) {
        return { ok: false, status: response.status, text };
      }

      await sleep(backoffMs(attempt));
    } catch (error) {
      clearTimeout(timeout);
      const timeoutError = isAbortError(error);

      lastStatus = timeoutError ? 408 : 502;
      lastText = timeoutError ? "request_timeout" : "network_error";

      console.error("[ai_gateway_attempt_error]", {
        attempt: attempt + 1,
        timeoutError,
        correlationId,
      });

      if (attempt >= AI_MAX_ATTEMPTS - 1) {
        return { ok: false, status: lastStatus, text: lastText };
      }

      await sleep(backoffMs(attempt));
    }
  }

  return { ok: false, status: lastStatus, text: lastText };
}

serve(async (req) => {
  const correlationId = crypto.randomUUID();
  const origin = req.headers.get("origin");
  const headers = buildCorsHeaders(origin, correlationId);

  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return errorResponse(403, "origin_not_allowed", "Origin not allowed", headers);
    }
    return new Response(null, { headers });
  }

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return errorResponse(403, "origin_not_allowed", "Origin not allowed", headers);
  }

  if (req.headers.get("content-length")) {
    const contentLength = Number(req.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return errorResponse(413, "payload_too_large", "Request body too large", headers);
    }
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowed = await rateLimit(ip, RATE_LIMIT_PER_IP, RATE_LIMIT_WINDOW_MS);
  if (!allowed) {
    return errorResponse(429, "rate_limited", "Rate limit exceeded. Please try again later.", headers);
  }

  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, "invalid_request", parsed.error.flatten().formErrors.join("; ") || "Invalid request", headers);
    }

    const { resumeText, jobDescription, role, seniority } = parsed.data;

    const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY");
    if (!AI_GATEWAY_API_KEY) {
      console.error("[config] Missing AI_GATEWAY_API_KEY", { correlationId });
      return errorResponse(500, "config_missing", "Service misconfigured", headers);
    }

    const aiGatewayUrl = AI_GATEWAY_URL;
    if (!aiGatewayUrl) {
      console.error("[config] Missing AI_GATEWAY_URL", { correlationId });
      return errorResponse(500, "config_missing", "Service misconfigured", headers);
    }

    // Role-specific context
    const roleContextMap: Record<string, string> = {
      SWE: "technical depth, system design, code quality, and engineering best practices",
      PM: "product strategy, cross-functional leadership, metrics-driven decisions, and business impact",
      DS: "statistical rigor, model complexity, data infrastructure, and research contributions",
      Design: "design systems, user research, visual communication, and design thinking",
      Sales: "relationship building, negotiation skills, revenue impact, and customer success",
    };

    const seniorityContextMap: Record<string, string> = {
      Junior: "technical fundamentals, learning speed, and potential for growth",
      Mid: "technical expertise, project ownership, and mentorship of junior team members",
      Senior: "technical leadership, architecture decisions, strategic impact, and mentorship",
    };

    const roleContext = role ? `\nRole context (${role}): Focus on demonstrating ${roleContextMap[role]}.` : "";
    const seniorityContext = seniority ? `\nSeniority level (${seniority}): Evaluate based on expectations for ${seniorityContextMap[seniority]} level.` : "";

    const systemPrompt = `You are an expert technical recruiter and resume analyzer. You will analyze a resume against a job description and return a structured JSON response.${roleContext}${seniorityContext}

Perform these 4 analyses:

1. **Semantic JD Match**: Compare skills, experience, and qualifications semantically. "Python/PyTorch" should match "Machine Learning". Score 0-100.

2. **X-Y-Z Impact Scorer**: Extract bullet points from the resume. For each, check if it follows Google's X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]". Check for:
   - hasAction: starts with a strong action verb
   - hasMetric: contains a number, percentage, or measurable outcome
   - hasTool: mentions a specific tool, technology, or method
   Score each bullet 0-3. Only include the top 8 most important bullets.

3. **AI-Authenticity Redliner**: Find overused buzzwords (streamlined, leveraged, synergy, spearheaded, navigated, cutting-edge, best-in-class, proactive, dynamic, results-driven, innovative, robust, seamless, holistic, paradigm). For each found, suggest an authentic alternative.

4. **Probing Questions**: Generate 3 specific, difficult interview questions targeting the resume's weakest areas.

Optional enhancements (include only if possible):

5. **Actionable Rewrites**: For the 2-3 weakest resume bullets (score < 2), suggest a stronger rewrite that adds metrics or specificity. Include expected score lift (0-10 points).

6. **Skill Gap Roadmap**: For the top 3 missing skills from the JD, describe where they appear in the JD and where/how the candidate should add them in their resume with concrete suggestions.

7. **Confidence Bands**: For each major score (semantic, xyz, buzzword), provide a confidence percentage (0-100) and brief reasoning.

Return ONLY valid JSON. Include rewrites, skillGaps, and confidenceBands only if generated:
{
  "overallScore": number (0-100),
  "semanticMatch": { "score": number, "matchedSkills": string[], "missingSkills": string[], "summary": string },
  "xyzScorer": { "score": number, "bullets": [...], "strongBullets": number, "weakBullets": number },
  "buzzwordRedliner": { "score": number, "flaggedWords": [...], "authenticity": string },
  "probingQuestions": string[],
  "rewrites": [{ "bullet": string, "suggestedRewrite": string, "expectedScoreLift": number, "explanation": string }],
  "skillGaps": [{ "skill": string, "jdContext": string, "suggestedPlacement": string, "priority": "High" | "Medium" | "Low" }],
  "confidenceBands": { "semanticMatch": { "score": number, "confidence": number, "reasoning": string }, "xyzScorer": { ... }, "buzzwordRedliner": { ... } }
}`;

    const userPrompt = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`;
    const aiPayload = {
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
              probingQuestions: { type: "array", items: { type: "string" } },
              rewrites: { type: "array", items: { type: "object", properties: { bullet: { type: "string" }, suggestedRewrite: { type: "string" }, expectedScoreLift: { type: "number" }, explanation: { type: "string" } }, required: ["bullet", "suggestedRewrite", "expectedScoreLift", "explanation"] } },
              skillGaps: { type: "array", items: { type: "object", properties: { skill: { type: "string" }, jdContext: { type: "string" }, suggestedPlacement: { type: "string" }, priority: { type: "string", enum: ["High", "Medium", "Low"] } }, required: ["skill", "jdContext", "suggestedPlacement", "priority"] } },
              confidenceBands: { type: "object", properties: { semanticMatch: { type: "object", properties: { score: { type: "number" }, confidence: { type: "number" }, reasoning: { type: "string" } }, required: ["score", "confidence", "reasoning"] }, xyzScorer: { type: "object", properties: { score: { type: "number" }, confidence: { type: "number" }, reasoning: { type: "string" } }, required: ["score", "confidence", "reasoning"] }, buzzwordRedliner: { type: "object", properties: { score: { type: "number" }, confidence: { type: "number" }, reasoning: { type: "string" } }, required: ["score", "confidence", "reasoning"] } } }
            },
            required: ["overallScore", "semanticMatch", "xyzScorer", "buzzwordRedliner", "probingQuestions"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "return_analysis" } },
    };

    const gatewayResult = await callAiGatewayWithRetry(aiPayload, AI_GATEWAY_API_KEY, aiGatewayUrl, correlationId);
    if (!gatewayResult.ok) {
      console.error("[ai_gateway_error]", { status: gatewayResult.status, text: gatewayResult.text, correlationId });
      if (gatewayResult.status === 429) {
        return errorResponse(429, "ai_rate_limited", "Rate limit exceeded. Please try again in a moment.", headers);
      }
      if (gatewayResult.status === 402) {
        return errorResponse(402, "ai_credit_exhausted", "AI credits exhausted. Please add credits.", headers);
      }
      if (gatewayResult.status === 408) {
        return errorResponse(504, "ai_timeout", "AI service timed out. Please retry.", headers);
      }
      return errorResponse(502, "ai_gateway_error", "AI service unavailable", headers);
    }

    const aiData = gatewayResult.data as {
      choices?: Array<{
        message?: {
          tool_calls?: Array<{
            function?: {
              arguments?: string;
            };
          }>;
        };
      }>;
    };
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error("[ai_missing_tool_call]", { aiData, correlationId });
      return errorResponse(502, "invalid_ai_response", "AI did not return structured data", headers);
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(toolCall.function?.arguments ?? "{}");
    } catch (err) {
      console.error("[ai_parse_error]", { err, correlationId });
      return errorResponse(502, "invalid_ai_payload", "Failed to parse AI response", headers);
    }

    const validated = analysisSchema.safeParse(analysisResult);
    if (!validated.success) {
      console.error("[ai_validation_failed]", { issues: validated.error.issues, correlationId });
      return errorResponse(502, "invalid_model_output", "AI response failed validation", headers);
    }

    // Add role and seniority to response if provided
    const response_payload = {
      ...validated.data,
      ...(role && { role }),
      ...(seniority && { seniority }),
    };

    return new Response(JSON.stringify(response_payload), { headers });
  } catch (e) {
    console.error("[analyze-resume_error]", { error: e, correlationId });
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message.includes("aborted") ? 504 : 500;
    return errorResponse(status, "server_error", message, headers);
  }
});
