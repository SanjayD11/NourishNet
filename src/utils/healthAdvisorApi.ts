/**
 * AI Health Advisor API Utility
 * ================================
 * Calls Pollinations.ai Vision API to analyze food images for health risks.
 * Returns structured health insights: diabetic risk, cholesterol impact,
 * weight gain potential, and personalized AI suggestions.
 * 
 * Completely independent from the food safety scanner used in Add Food.
 */

const POLLINATIONS_API_URL = "https://gen.pollinations.ai/v1/chat/completions";
const POLLINATIONS_API_KEY = "sk_bmnpBskVyDRvqKS8mykWHKyeekTqRSuY";

const MAX_IMAGE_DIMENSION = 768;
const JPEG_QUALITY = 0.6;
const REQUEST_TIMEOUT_MS = 60000;
const MAX_RETRIES = 2;

const HEALTH_ADVISOR_SYSTEM_PROMPT = `You are an AI Health Advisor integrated inside a food-sharing platform called NourishNet.

Your job is to analyze uploaded food images and return structured health-risk insights for the user.

IMPORTANT RULES:
- Identify the food item from the image.
- Estimate approximate calorie count per typical serving.
- Assess health risks across 3 dimensions: Diabetic Risk, Cholesterol Impact, and Weight Gain potential.
- Each risk should be rated as "LOW", "MODERATE", or "HIGH".
- Provide a brief explanation (1 sentence) for each risk.
- Give a personalized AI health suggestion (2-3 sentences max).
- If the image is unclear or not food, say so in the suggestion field.
- Never claim to be a medical professional.
- Never guarantee health outcomes.

OUTPUT FORMAT (STRICT JSON ONLY):

{
  "food_name": "",
  "estimated_calories": 0,
  "serving_size": "",
  "diabetic_risk": {
    "level": "LOW / MODERATE / HIGH",
    "reason": ""
  },
  "cholesterol_impact": {
    "level": "LOW / MODERATE / HIGH",
    "reason": ""
  },
  "weight_gain_potential": {
    "level": "LOW / MODERATE / HIGH",
    "percentage": 0,
    "reason": ""
  },
  "ai_suggestion": "",
  "nutrients_summary": ""
}

For weight_gain_potential.percentage, estimate a rough % likelihood of contributing to weight gain if consumed regularly (0-100).
For nutrients_summary, provide a very brief 1-line summary of key nutrients.
Never return explanations outside JSON.`;

export interface HealthRiskLevel {
    level: "LOW" | "MODERATE" | "HIGH";
    reason: string;
}

export interface WeightGainRisk extends HealthRiskLevel {
    percentage: number;
}

export interface HealthAdvisorResult {
    food_name: string;
    estimated_calories: number;
    serving_size: string;
    diabetic_risk: HealthRiskLevel;
    cholesterol_impact: HealthRiskLevel;
    weight_gain_potential: WeightGainRisk;
    ai_suggestion: string;
    nutrients_summary: string;
}

/**
 * Compress and resize image for API transmission
 */
function compressImageForApi(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let { width, height } = img;

            if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
                if (width > height) {
                    height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
                    width = MAX_IMAGE_DIMENSION;
                } else {
                    width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
                    height = MAX_IMAGE_DIMENSION;
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Could not create canvas context"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const dataUri = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
            resolve(dataUri);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image for compression"));
        };

        img.src = url;
    });
}

/**
 * Parse the AI response into a validated HealthAdvisorResult
 */
function parseHealthResponse(raw: string): HealthAdvisorResult {
    let text = raw.trim();

    if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    let parsed: Record<string, unknown>;
    try {
        parsed = JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            parsed = JSON.parse(match[0]);
        } else {
            throw new Error("Could not parse AI response as JSON");
        }
    }

    const normalizeLevel = (val: unknown): "LOW" | "MODERATE" | "HIGH" => {
        const s = String(val || "MODERATE").toUpperCase().trim();
        if (s === "LOW") return "LOW";
        if (s === "HIGH") return "HIGH";
        return "MODERATE";
    };

    const diabeticRisk = (parsed.diabetic_risk as Record<string, unknown>) || {};
    const cholesterolImpact = (parsed.cholesterol_impact as Record<string, unknown>) || {};
    const weightGain = (parsed.weight_gain_potential as Record<string, unknown>) || {};

    return {
        food_name: String(parsed.food_name || "Unknown Food"),
        estimated_calories: Number(parsed.estimated_calories) || 0,
        serving_size: String(parsed.serving_size || "1 serving"),
        diabetic_risk: {
            level: normalizeLevel(diabeticRisk.level),
            reason: String(diabeticRisk.reason || "Unable to assess"),
        },
        cholesterol_impact: {
            level: normalizeLevel(cholesterolImpact.level),
            reason: String(cholesterolImpact.reason || "Unable to assess"),
        },
        weight_gain_potential: {
            level: normalizeLevel(weightGain.level),
            percentage: Math.min(100, Math.max(0, Number(weightGain.percentage) || 50)),
            reason: String(weightGain.reason || "Unable to assess"),
        },
        ai_suggestion: String(parsed.ai_suggestion || "Could not generate a health suggestion for this image."),
        nutrients_summary: String(parsed.nutrients_summary || ""),
    };
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Analyze a food image for health risks using Pollinations.ai Vision API.
 */
export async function analyzeHealthRisk(file: File): Promise<HealthAdvisorResult> {
    const dataUri = await compressImageForApi(file);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                await new Promise((r) => setTimeout(r, 1500 * Math.pow(2, attempt - 1)));
            }

            const response = await fetchWithTimeout(
                POLLINATIONS_API_URL,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${POLLINATIONS_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "openai-large",
                        temperature: 0.3,
                        max_tokens: 1500,
                        messages: [
                            { role: "system", content: HEALTH_ADVISOR_SYSTEM_PROMPT },
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: "Analyze this food image for health risks. Return ONLY a valid JSON object with food_name, estimated_calories, serving_size, diabetic_risk, cholesterol_impact, weight_gain_potential, ai_suggestion, and nutrients_summary." },
                                    { type: "image_url", image_url: { url: dataUri } },
                                ],
                            },
                        ],
                    }),
                },
                REQUEST_TIMEOUT_MS
            );

            if (!response.ok) {
                const errorText = await response.text().catch(() => "");
                throw new Error(`API error ${response.status}: ${errorText.slice(0, 200)}`);
            }

            const data = await response.json();
            console.log("[HealthAdvisor] API response:", JSON.stringify(data).slice(0, 500));

            // Try multiple paths to extract content
            const content = data?.choices?.[0]?.message?.content
                || data?.choices?.[0]?.text
                || data?.message?.content
                || (typeof data === 'string' ? data : null);

            if (!content) {
                console.error("[HealthAdvisor] Full response structure:", JSON.stringify(data));
                // If this is a retry-able empty response, continue to next attempt
                throw new Error("Empty response from AI — retrying...");
            }

            return parseHealthResponse(content);
        } catch (err: any) {
            lastError = err;
            if (err.name === "AbortError") {
                throw new Error("Analysis timed out. Please try again.");
            }
            console.warn(`[HealthAdvisor] Attempt ${attempt + 1} failed:`, err.message);
        }
    }

    throw lastError || new Error("Analysis failed after multiple attempts");
}
