// ── Gemini Vision API — 食物图像识别 ──

function getKey(): string {
  const definedKey = process.env.GEMINI_API_KEY;
  if (definedKey && definedKey.length > 10) return definedKey;
  const importKey = (import.meta as any).env?.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (importKey && importKey.length > 10) return importKey;
  throw new Error('未配置 Gemini API Key');
}

export interface FoodAnalysis {
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  weight?: string;
}

// ── Simple text test to verify API key works ──
export async function testGeminiKey(): Promise<string> {
  const apiKey = getKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Say "OK" in Chinese' }] }],
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || '(no response)';
}

// ── Image food recognition ──
// Try multiple endpoints (main + China-friendly alias)
const ENDPOINTS = [
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  'https://generativelanguage-pa.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
];

export async function analyzeFoodImage(
  base64Data: string,
  mimeType: string = 'image/jpeg',
): Promise<FoodAnalysis> {
  const apiKey = getKey();

  const body = {
    contents: [{
      parts: [
        {
          text: `Analyze this food photo. Identify the food and estimate nutrition.
Return ONLY a JSON object:
{ "name": "食物名称", "calories": 热量kcal, "carbs": 碳水g, "protein": 蛋白g, "fat": 脂肪g, "weight": "约200g" }
If no food visible: { "name": "未识别", "calories": 0, "carbs": 0, "protein": 0, "fat": 0, "weight": "" }`
        },
        { inlineData: { mimeType, data: base64Data } }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
  };

  console.log('[GeminiVision] 发送请求，图片:', (base64Data.length / 1024).toFixed(1), 'KB');

  // Try each endpoint
  let lastError: Error | null = null;
  for (const url of ENDPOINTS) {
    try {
      console.log('[GeminiVision] 尝试:', url.split('//')[1].split('/')[0]);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j?.error?.message || msg; } catch {}
        throw new Error(msg);
      }

      const json = await res.json();
      const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('[GeminiVision] 回复:', text.slice(0, 200));

      if (!text) throw new Error('Gemini 未返回结果');

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('返回格式异常');

      const result = JSON.parse(jsonMatch[0]);
      return {
        name: result.name || '未知食物',
        calories: Math.round(result.calories) || 0,
        carbs: Math.round(result.carbs) || 0,
        protein: Math.round(result.protein) || 0,
        fat: Math.round(result.fat) || 0,
        weight: result.weight || '',
      };
    } catch (err: any) {
      console.error('[GeminiVision] 端点失败:', err?.message);
      lastError = err;
      // continue to next endpoint
    }
  }

  throw new Error(lastError?.message || '无法连接到 Gemini 服务，请检查网络');
}
