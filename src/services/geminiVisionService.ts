// ── Gemini Vision API — 食物图像识别 ──

function getKey(): string {
  const definedKey = process.env.GEMINI_API_KEY;
  if (definedKey && definedKey.length > 10) return definedKey;
  const importKey = (import.meta as any).env?.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (importKey && importKey.length > 10) return importKey;
  throw new Error('未配置 Gemini API Key，请在 GitHub Secrets 中设置 GEMINI_API_KEY');
}

export interface FoodAnalysis {
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  weight?: string;
}

// Use REST API (like DeepSeek) for reliability — handles non-standard API key formats
export async function analyzeFoodImage(
  base64Data: string,
  mimeType: string = 'image/jpeg',
): Promise<FoodAnalysis> {
  const apiKey = getKey();

  const body = {
    contents: [{
      role: 'user',
      parts: [
        {
          text: `Analyze this food photo. Identify the food items and estimate total nutrition.
Return ONLY a JSON object (no markdown, no explanation):
{
  "name": "food name in Chinese",
  "calories": estimated total kcal (integer),
  "carbs": total carbs in grams (integer),
  "protein": total protein in grams (integer),
  "fat": total fat in grams (integer),
  "weight": "estimated portion weight like 约200g"
}
If no food is visible, return:
{ "name": "未识别到食物", "calories": 0, "carbs": 0, "protein": 0, "fat": 0, "weight": "" }`
        },
        {
          inlineData: {
            mimeType,
            data: base64Data,
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  };

  // Try gemini-2.0-flash (more widely available) — append key as query param
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000), // 20s timeout — small image, should be fast
  });

  if (!res.ok) {
    let errText = '';
    try { errText = await res.text(); } catch {}
    console.error('[GeminiVision] API 错误:', res.status, errText.slice(0, 200));
    // Try to extract the actual error message from the response
    let errMsg = errText;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson?.error?.message || errText;
    } catch {}
    throw new Error(`${errMsg}`);
  }

  const json = await res.json();
  const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('[GeminiVision] 原始回复:', text.slice(0, 300));

  if (!text) throw new Error('Gemini 未返回结果');

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
