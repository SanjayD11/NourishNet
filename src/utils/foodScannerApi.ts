/**
 * Food Safety Scanner API Utility
 * ================================
 * Calls Pollinations.ai Vision API to analyze food images for safety.
 * Includes image compression, retry logic, and timeout handling.
 */

const POLLINATIONS_API_URL = "https://gen.pollinations.ai/v1/chat/completions";
const POLLINATIONS_API_KEY = "sk_bmnpBskVyDRvqKS8mykWHKyeekTqRSuY";

const MAX_IMAGE_DIMENSION = 768;
const JPEG_QUALITY = 0.6;
const REQUEST_TIMEOUT_MS = 60000;
const MAX_RETRIES = 2;

const FOOD_SAFETY_SYSTEM_PROMPT = `You are a Food Safety AI Scanner integrated inside a food-sharing platform.

Your job is to analyze uploaded food images and return structured, reliable, risk-based output.

IMPORTANT RULES:
- Only analyze what is visually observable.
- Do NOT guess invisible contamination.
- Do NOT hallucinate expiry dates if not visible.
- If information is unclear, say "Not Visible".
- Never guarantee food safety.
- Provide risk estimation only based on visual evidence.

TASKS:

1. Identify the food item (short name).
2. Detect visible spoilage indicators:
   - Mold (white/green/black fuzzy spots)
   - Discoloration
   - Slimy texture
   - Excess moisture leakage
   - Swollen packaging
   - Torn or damaged packaging
3. Detect expiry or best-before date if clearly visible.
4. Assess overall visual risk level:
   - LOW → No visible issues
   - MEDIUM → Minor concerns / unclear freshness
   - HIGH → Visible spoilage or damage
5. Provide short user-facing message.

OUTPUT FORMAT (STRICT JSON ONLY):

{
  "food_identified": "",
  "expiry_date_visible": "Yes / No",
  "detected_expiry_text": "",
  "visible_issues": [],
  "risk_level": "LOW / MEDIUM / HIGH",
  "confidence": "Low / Medium / High",
  "user_message": ""
}

If image quality is poor, reduce confidence.
Never return explanations outside JSON.`;

export interface FoodScanResult {
    food_identified: string;
    expiry_date_visible: string;
    detected_expiry_text: string;
    visible_issues: string[];
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    confidence: "Low" | "Medium" | "High";
    user_message: string;
}

/**
 * Compress and resize a File to a small JPEG data URI suitable for API transmission.
 * This prevents ERR_CONNECTION_CLOSED errors from oversized payloads.
 */
function compressImageForApi(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let { width, height } = img;

            // Downscale to max dimension
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
 * Parse the AI response text into a validated FoodScanResult
 */
function parseResponse(raw: string): FoodScanResult {
    let text = raw.trim();

    // Strip markdown code fences if present
    if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    let parsed: Record<string, unknown>;
    try {
        parsed = JSON.parse(text);
    } catch {
        // Try to extract JSON from the text
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            parsed = JSON.parse(match[0]);
        } else {
            throw new Error("Could not parse AI response as JSON");
        }
    }

    // Normalize and validate
    const result: FoodScanResult = {
        food_identified: String(parsed.food_identified || "Unknown"),
        expiry_date_visible: "No",
        detected_expiry_text: String(parsed.detected_expiry_text || "Not Visible"),
        visible_issues: [],
        risk_level: "MEDIUM",
        confidence: "Medium",
        user_message: String(parsed.user_message || "Unable to fully assess food safety from image."),
    };

    // expiry_date_visible
    const exp = String(parsed.expiry_date_visible || "No").trim();
    result.expiry_date_visible = exp.toLowerCase().startsWith("yes") ? "Yes" : "No";

    // risk_level
    const risk = String(parsed.risk_level || "MEDIUM").toUpperCase().trim();
    if (risk === "LOW" || risk === "MEDIUM" || risk === "HIGH") {
        result.risk_level = risk;
    }

    // confidence
    const conf = String(parsed.confidence || "Medium").trim();
    const confCap = conf.charAt(0).toUpperCase() + conf.slice(1).toLowerCase();
    if (confCap === "Low" || confCap === "Medium" || confCap === "High") {
        result.confidence = confCap as "Low" | "Medium" | "High";
    }

    // visible_issues
    if (Array.isArray(parsed.visible_issues)) {
        result.visible_issues = parsed.visible_issues.map(String);
    }

    return result;
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
 * Scan a food image using Pollinations.ai Vision API.
 * Compresses the image first, retries on failure.
 */
export async function scanFoodImage(file: File): Promise<FoodScanResult> {
    // Compress image to reduce payload size (prevents ERR_CONNECTION_CLOSED)
    const dataUri = await compressImageForApi(file);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Exponential backoff on retries
            if (attempt > 0) {
                await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
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
                        model: "openai",
                        response_format: { type: "json_object" },
                        temperature: 0.2,
                        max_tokens: 1024,
                        messages: [
                            { role: "system", content: FOOD_SAFETY_SYSTEM_PROMPT },
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: "Analyze this food image for safety. Return ONLY the JSON object." },
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
            const content = data?.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error("Empty response from AI");
            }

            return parseResponse(content);
        } catch (err: any) {
            lastError = err;
            // Don't retry on abort (user navigated away)
            if (err.name === "AbortError") {
                throw new Error("Scan timed out. Please try again.");
            }
            // Continue to next retry attempt
        }
    }

    throw lastError || new Error("Scan failed after multiple attempts");
}
