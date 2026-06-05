// ── Gemini Vision API — 食物图像识别 ──

import { GoogleGenAI, createPartFromBase64, createPartFromText, createUserContent } from '@google/genai';

function getKey(): string {
  // Vite injects GEMINI_API_KEY into process.env via define
  const viteKey = (typeof process !== 'undefined' && (process as any).env?.GEMINI_API_KEY) || '';
  if (viteKey && viteKey !== 'MY_GEMINI_API_KEY') return viteKey;

  // Fallback: VITE_ prefix (conventional Vite env var)
  const vitePrefixKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (vitePrefixKey) return vitePrefixKey;

  throw new Error('未配置 Gemini API Key，请在 .env 中设置 GEMINI_API_KEY');
}

export interface FoodAnalysis {
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  weight?: string;
}

export async function analyzeFoodImage(
  base64Data: string,
  mimeType: string = 'image/jpeg',
): Promise<FoodAnalysis> {
  const apiKey = getKey();
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: createUserContent([
      createPartFromText(
        `Analyze this food photo. Identify the food items and estimate total nutrition.
Return ONLY a JSON object (no markdown, no explanation):
{
  "name": "食物名称（中文）",
  "calories": estimated total kcal (integer),
  "carbs": total carbs in grams (integer),
  "protein": total protein in grams (integer),
  "fat": total fat in grams (integer),
  "weight": "估算份量，如 约200g"
}

If no food is visible, return:
{ "name": "未识别到食物", "calories": 0, "carbs": 0, "protein": 0, "fat": 0, "weight": "" }`
      ),
      createPartFromBase64(base64Data, mimeType),
    ]),
    config: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Gemini 未返回结果');

  console.log('[GeminiVision] 原始回复:', text.slice(0, 300));

  // Extract JSON from possible markdown fences or raw text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini 返回格式异常');

  const result = JSON.parse(jsonMatch[0]);

  return {
    name: result.name || '未知食物',
    calories: Math.round(result.calories) || 0,
    carbs: Math.round(result.carbs) || 0,
    protein: Math.round(result.protein) || 0,
    fat: Math.round(result.fat) || 0,
    weight: result.weight || '',
  };
}
