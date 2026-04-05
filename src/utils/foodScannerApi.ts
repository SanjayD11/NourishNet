/**
 * Food Safety Scanner API Utility
 * ================================
 * Calls OpenRouter Vision API to analyze food images for safety.
 * Includes image compression, retry logic, and fallback support.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "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";

// Best Free Models
const PRIMARY_MODEL = "google/gemini-flash-1.5-8b:free";
const FALLBACK_MODEL = "mistralai/pixtral-12b:free"; // Pixtral is great for reading labels/mold

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
3. Detect expiry or best-before date if clearly visible on packaging.
4. Assess overall visual risk level (LOW / MEDIUM / HIGH).
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
 * Image compression for API transmission
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
            if (!ctx) { reject(new Error("Canvas context error")); return; }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load error")); };
        img.src = url;
    });
}

function parseResponse(raw: string): FoodScanResult {
    let text = raw.trim();
    if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }
    let parsed: any;
    try {
        parsed = JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error("JSON parse error");
    }
    return {
        food_identified: String(parsed.food_identified || "Unknown"),
        expiry_date_visible: String(parsed.expiry_date_visible || "No"),
        detected_expiry_text: String(parsed.detected_expiry_text || "Not Visible"),
        visible_issues: Array.isArray(parsed.visible_issues) ? parsed.visible_issues.map(String) : [],
        risk_level: (parsed.risk_level === "LOW" || parsed.risk_level === "HIGH") ? parsed.risk_level : "MEDIUM",
        confidence: String(parsed.confidence || "Medium") as any,
        user_message: String(parsed.user_message || "Assessment incomplete."),
    };
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try { return await fetch(url, { ...options, signal: controller.signal }); }
    finally { clearTimeout(id); }
}

export async function scanFoodImage(file: File): Promise<FoodScanResult> {
    const dataUri = await compressImageForApi(file);
    let lastError: Error | null = null;
    const models = [PRIMARY_MODEL, FALLBACK_MODEL, "openrouter/auto:free"];

    for (const modelId of models) {
        for (let i = 0; i <= MAX_RETRIES; i++) {
            try {
                if (i > 0) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i - 1)));
                const response = await fetchWithTimeout(OPENROUTER_API_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": window.location.origin,
                        "X-Title": "NourishNet Food Scanner",
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: [
                            { role: "system", content: FOOD_SAFETY_SYSTEM_PROMPT },
                            { role: "user", content: [
                                { type: "text", text: "Analyze this food for safety. JSON only." },
                                { type: "image_url", image_url: { url: dataUri } }
                            ]}
                        ]
                    }),
                }, REQUEST_TIMEOUT_MS);
                if (!response.ok) throw new Error(`API error ${response.status}`);
                const data = await response.json();
                const content = data?.choices?.[0]?.message?.content;
                if (!content) throw new Error("Empty response");
                return parseResponse(content);
            } catch (err: any) { lastError = err; if (err.name === "AbortError") break; }
        }
    }
    throw lastError || new Error("Scanner failed");
}
