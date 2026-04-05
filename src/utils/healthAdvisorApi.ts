/**
 * AI Health Advisor API Utility (NVIDIA NIM Edition)
 * =================================================
 * migration: OpenRouter -> NVIDIA NIM
 * workflow: 2-Step analysis (Phi-3.5 Vision -> Gemma-2-27b Chat)
 */

const NVIDIA_API_URL = "/api/nvidia";
// API Key is now hidden and injected securely by the backend proxy.

// Optimized Model Stack
const VISION_MODEL = "microsoft/phi-3.5-vision-instruct";
const REASONING_MODEL = "google/gemma-2-27b-it";

const MAX_IMAGE_DIMENSION = 800; // Phi-3.5 handles up to this well
const JPEG_QUALITY = 0.5;
const REQUEST_TIMEOUT_MS = 60000;

const HEALTH_ADVISOR_SYSTEM_PROMPT = `You are an AI Health Advisor for NourishNet. 
Analyze the provided food description and return a structured JSON response.

DIETARY GUIDELINES:
- Assess risks (LOW/MODERATE/HIGH) for Diabetes, Cholesterol, and Weight Gain.
- estimate Macros (Protein, Carbs, Fats) and Calories.
- Flag Allergens (Dairy, Gluten, Peanuts, etc.).
- Give a 2-3 sentence AI health suggestion.

JSON FORMAT:
{
  "food_name": "Name",
  "estimated_calories": 500,
  "serving_size": "1 plate",
  "macros": { "protein": 20, "carbs": 60, "fats": 15 },
  "allergens": ["Gluten"],
  "diabetic_risk": { "level": "MEDIUM", "reason": "Reason" },
  "cholesterol_impact": { "level": "LOW", "reason": "Reason" },
  "weight_gain_potential": { "level": "HIGH", "percentage": 75, "reason": "Reason" },
  "ai_suggestion": "Suggestion text",
  "nutrients_summary": "Short nutrients summary"
}
Return ONLY valid JSON. No pre-amble.`;

export interface HealthRiskLevel {
    level: "LOW" | "MODERATE" | "HIGH";
    reason: string;
}

export interface WeightGainRisk extends HealthRiskLevel {
    percentage: number;
}

export interface Macronutrients {
    protein: number;
    carbs: number;
    fats: number;
}

export interface HealthAdvisorResult {
    food_name: string;
    estimated_calories: number;
    serving_size: string;
    macros: Macronutrients;
    allergens: string[];
    diabetic_risk: HealthRiskLevel;
    cholesterol_impact: HealthRiskLevel;
    weight_gain_potential: WeightGainRisk;
    ai_suggestion: string;
    nutrients_summary: string;
}

async function compressImageForApi(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;
            if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
                const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            const canvas = document.createElement("canvas");
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas context error"));
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load error")); };
        img.src = url;
    });
}

function parseHealthResponse(raw: string): HealthAdvisorResult {
    const text = raw.trim().replace(/^```json/, "").replace(/```$/, "").trim();
    try {
        const parsed = JSON.parse(text);
        const normalizeLevel = (val: any) => ["LOW", "MODERATE", "HIGH"].includes(val?.toUpperCase()) ? val.toUpperCase() : "MODERATE";
        return {
            food_name: parsed.food_name || "Unknown Food",
            estimated_calories: Number(parsed.estimated_calories) || 0,
            serving_size: parsed.serving_size || "1 serving",
            macros: {
                protein: Number(parsed.macros?.protein) || 0,
                carbs: Number(parsed.macros?.carbs) || 0,
                fats: Number(parsed.macros?.fats) || 0
            },
            allergens: Array.isArray(parsed.allergens) ? parsed.allergens : [],
            diabetic_risk: { level: normalizeLevel(parsed.diabetic_risk?.level), reason: parsed.diabetic_risk?.reason || "" },
            cholesterol_impact: { level: normalizeLevel(parsed.cholesterol_impact?.level), reason: parsed.cholesterol_impact?.reason || "" },
            weight_gain_potential: { level: normalizeLevel(parsed.weight_gain_potential?.level), percentage: Number(parsed.weight_gain_potential?.percentage) || 0, reason: parsed.weight_gain_potential?.reason || "" },
            ai_suggestion: parsed.ai_suggestion || "No suggestion available.",
            nutrients_summary: parsed.nutrients_summary || ""
        };
    } catch (e) {
        throw new Error("Failed to parse AI response as JSON");
    }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try { return await fetch(url, { ...options, signal: controller.signal }); }
    finally { clearTimeout(id); }
}

async function callNvidiaNIM(model: string, messages: any[]) {
    const response = await fetchWithTimeout(NVIDIA_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 1024 })
    }, REQUEST_TIMEOUT_MS);

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`NVIDIA API Error ${response.status}: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

export async function analyzeHealthRisk(file: File): Promise<HealthAdvisorResult> {
    const base64Image = await compressImageForApi(file);
    
    // Step 1: Vision (Phi-3.5)
    console.log("[NVIDIA NIM] Step 1: Vision Analysis (Phi-3.5)");
    const description = await callNvidiaNIM(VISION_MODEL, [
        { 
            role: "user", 
            content: `Describe this food image in technical detail for a health analysis. Mention ingredients, cooking method, and any visible signs of freshness or processing. <img src="${base64Image}" />` 
        }
    ]);

    // Step 2: Reasoning (Gemma)
    console.log("[NVIDIA NIM] Step 2: Health Reasoning (Gemma)");
    const healthJson = await callNvidiaNIM(REASONING_MODEL, [
        { role: "user", content: `${HEALTH_ADVISOR_SYSTEM_PROMPT}\n\nFood Description: ${description}\nAnalyze and return strictly valid JSON.` }
    ]);

    return parseHealthResponse(healthJson);
}
