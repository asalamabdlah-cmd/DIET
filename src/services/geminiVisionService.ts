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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000), // 30s timeout
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[GeminiVision] API 错误:', res.status, errText);
    if (res.status === 400) throw new Error('请求无效，请重试');
    if (res.status === 403) throw new Error('API Key 无权限，请检查密钥');
    if (res.status === 429) throw new Error('请求太频繁，请稍后再试');
    throw new Error(`识别失败 (${res.status})`);
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
