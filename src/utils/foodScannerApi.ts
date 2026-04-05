/**
 * Food Safety Scanner API Utility (NVIDIA NIM Edition)
 * ==================================================
 * workflow: 2-Step analysis (Phi-3.5 Vision -> Gemma-2-27b Reasoning)
 */

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_API_KEY = (import.meta.env.VITE_NVIDIA_API_KEY || "").toString().trim();

const VISION_MODEL = "microsoft/phi-3.5-vision-instruct";
const REASONING_MODEL = "google/gemma-2-27b-it";

const MAX_IMAGE_DIMENSION = 700; // conservative for 180kb base64 limit
const JPEG_QUALITY = 0.5;
const REQUEST_TIMEOUT_MS = 60000;

const FOOD_SAFETY_SYSTEM_PROMPT = `You are a Food Safety AI for NourishNet.
Analyze the food description and return a JSON safety report.

RULES:
- Detect visible spoilage (mold, slime, discoloration).
- Assess overall visual Risk Level (LOW/MEDIUM/HIGH).
- Provide a confidence level and a user-facing safety message.

JSON FORMAT:
{
  "food_identified": "Name",
  "expiry_date_visible": "Yes / No",
  "detected_expiry_text": "Date if any",
  "visible_issues": ["Issue 1", "Issue 2"],
  "risk_level": "LOW / MEDIUM / HIGH",
  "confidence": "Low / Medium / High",
  "user_message": "Safety advice"
}
Return ONLY valid JSON.`;

export interface FoodScanResult {
    food_identified: string;
    expiry_date_visible: string;
    detected_expiry_text: string;
    visible_issues: string[];
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    confidence: "Low" | "Medium" | "High";
    user_message: string;
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
            if (!ctx) return reject(new Error("Canvas context"));
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load error")); };
        img.src = url;
    });
}

function parseScanResponse(raw: string): FoodScanResult {
    const text = raw.trim().replace(/^```json/, "").replace(/```$/, "").trim();
    try {
        const parsed = JSON.parse(text);
        return {
            food_identified: parsed.food_identified || "Unknown",
            expiry_date_visible: parsed.expiry_date_visible || "No",
            detected_expiry_text: parsed.detected_expiry_text || "Not Visible",
            visible_issues: Array.isArray(parsed.visible_issues) ? parsed.visible_issues : [],
            risk_level: ["LOW", "MEDIUM", "HIGH"].includes(parsed.risk_level) ? parsed.risk_level : "MEDIUM",
            confidence: parsed.confidence || "Medium",
            user_message: parsed.user_message || "Assessment incomplete."
        };
    } catch { throw new Error("JSON parse failure"); }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try { return await fetch(url, { ...options, signal: controller.signal }); }
    finally { clearTimeout(id); }
}

async function callNvidiaNIM(model: string, messages: any[]) {
    const resp = await fetchWithTimeout(NVIDIA_API_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${NVIDIA_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 1024 })
    }, REQUEST_TIMEOUT_MS);
    if (!resp.ok) throw new Error(`NIM Error ${resp.status}`);
    const data = await resp.json();
    return data.choices[0].message.content;
}

export async function scanFoodImage(file: File): Promise<FoodScanResult> {
    const base64Image = await compressImageForApi(file);

    // Step 1: Vision
    console.log("[NVIDIA NIM] Step 1: Safety Vision Analysis (Phi-3.5)");
    const description = await callNvidiaNIM(VISION_MODEL, [
        { role: "user", content: `Examine this food image for spoilage indicators like mold, discoloration, or texture issues. Describe every visible detail. <img src="${base64Image}" />` }
    ]);

    // Step 2: Safety Reasoning
    console.log("[NVIDIA NIM] Step 2: Safety Reasoning (Gemma)");
    const safetyJson = await callNvidiaNIM(REASONING_MODEL, [
        { role: "system", content: FOOD_SAFETY_SYSTEM_PROMPT },
        { role: "user", content: `Visual Report: ${description}\nProvide JSON.` }
    ]);

    return parseScanResponse(safetyJson);
}
