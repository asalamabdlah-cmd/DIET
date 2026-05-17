import type { UserProfile } from "../types";

// ── DeepSeek 配置 ──

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";

function ensureKey() {
  if (!DEEPSEEK_KEY || DEEPSEEK_KEY.startsWith('sk-your-')) {
    throw new Error('DeepSeek API Key 未配置，请在 .env 中设置 VITE_DEEPSEEK_API_KEY');
  }
}

async function callDeepSeek(systemPrompt: string, userPrompt: string): Promise<string> {
  ensureKey();

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("[DeepSeek] 请求失败:", res.status, errBody);
    throw new Error(`DeepSeek 请求失败 (${res.status})`);
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content || "";
  console.log("[DeepSeek] 原始回复:", text.slice(0, 200));
  return text;
}

function extractJson(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("DeepSeek 未返回有效 JSON");
  return JSON.parse(match[0]);
}

// ── 食物热量估算 ──

export async function estimateFoodCalories(foodDescription: string) {
  const text = await callDeepSeek(
    "你是一个营养学专家。根据用户描述估算食物的营养成分。只返回 JSON，不要任何解释。",
    `分析以下食物描述，估算其营养成分（单位：g）。

食物描述："${foodDescription}"

返回 JSON：
{
  "name": "食物名称",
  "weight": "估算重量，如'约200g'",
  "calories": 热量(kcal),
  "carbs": 碳水(g),
  "protein": 蛋白(g),
  "fat": 脂肪(g)
}`
  );

  return extractJson(text);
}

// ── 饮食建议 ──

export async function generateDietSuggestion(profile: {
  recommendedIntake: number;
  targetWeight: number;
  currentWeight: number;
}, todayIntake: { calories: number; carbs: number; protein: number; fat: number; remaining?: number }) {
  const remaining = todayIntake.remaining ?? (profile.recommendedIntake - todayIntake.calories);
  const carbRatio = todayIntake.carbs > 0 ? Math.round(todayIntake.carbs * 4 / todayIntake.calories * 100) : 0;
  const proteinRatio = todayIntake.protein > 0 ? Math.round(todayIntake.protein * 4 / todayIntake.calories * 100) : 0;
  const fatRatio = todayIntake.fat > 0 ? Math.round(todayIntake.fat * 9 / todayIntake.calories * 100) : 0;

  if (todayIntake.calories === 0) {
    return { text: "今日还没有饮食记录，记得按时吃饭哦！减脂期建议三餐规律，早餐要吃得丰盛。", quick: true };
  }

  try {
    const userPrompt = `用户今日饮食汇总：
- 已摄入 ${todayIntake.calories}kcal（目标${profile.recommendedIntake}kcal，剩余${remaining}kcal）
- 碳水${todayIntake.carbs}g 蛋白${todayIntake.protein}g 脂肪${todayIntake.fat}g
- 当前体重${profile.currentWeight}kg，目标${profile.targetWeight}kg

请用一两句话给出温馨的饮食建议。风格温暖鼓励，像朋友一样。关注蛋白质是否充足、碳水脂肪是否均衡、热量是否超标。建议具体的食物（如"晚餐加个鸡蛋"）。`;

    const text = await callDeepSeek(
      "你是一个营养师。用户给了你今日饮食数据，请给出简短的温馨建议。一两句话，不要超过80字。",
      userPrompt
    );

    return { text: text.trim().replace(/^["']|["']$/g, ''), quick: false };
  } catch {
    // Fallback to rule-based suggestion
    let text = "";
    if (remaining < 0) {
      text = `今日已超过目标 ${Math.abs(remaining)}kcal，明天注意控制份量哦。`;
    } else if (proteinRatio < 15 && todayIntake.calories > 0) {
      text = "蛋白质摄入偏少，晚餐可以加个鸡蛋、一杯牛奶或一块鸡胸肉。";
    } else if (carbRatio > 60) {
      text = "碳水比例偏高，主食可以适当减量，多吃些蔬菜和蛋白质。";
    } else {
      text = `还有 ${remaining}kcal 可以摄入，记得多吃蔬菜水果，保持营养均衡。`;
    }
    return { text, quick: true };
  }
}

// ── 每日总结 ──

export async function generateDailySummary(profile: {
  recommendedIntake: number;
  currentWeight: number;
  targetWeight: number;
  bmr: number;
}, today: {
  dietCalories: number; dietCarbs: number; dietProtein: number; dietFat: number;
  exerciseCalories: number;
  weightChange: number | null;
}) {
  const totalExpenditure = profile.bmr + 400 + today.exerciseCalories;
  const deficit = totalExpenditure - today.dietCalories;
  const weightInfo = today.weightChange !== null
    ? `今日体重变化：${today.weightChange > 0 ? '+' : ''}${today.weightChange}kg`
    : '今日未记录体重';

  const prompt = `用户今日数据：
- 总消耗 ${totalExpenditure}kcal（BMR${profile.bmr}+日常400${today.exerciseCalories ? '+运动'+today.exerciseCalories : ''}），实际摄入 ${today.dietCalories}kcal
- 碳水${today.dietCarbs}g 蛋白${today.dietProtein}g 脂肪${today.dietFat}g
- 热量缺口 ${deficit}kcal
- 当前体重 ${profile.currentWeight}kg，目标 ${profile.targetWeight}kg
- ${weightInfo}

请生成一段不超过120字的今日总结，语气温暖鼓励。包括：热量完成情况、减脂进度点评、明日一两句建议。`;

  try {
    const text = await callDeepSeek(
      "你是一个温暖的减脂教练。根据用户数据生成简短的今日总结和明日建议。120字以内。",
      prompt
    );
    return text.trim().replace(/^["']|["']$/g, '');
  } catch {
    if (deficit > 300) return `今日热量缺口 ${deficit}kcal，燃脂状态良好。继续保持饮食节奏和运动习惯！`;
    if (deficit > 0) return `今日缺口 ${deficit}kcal，平稳减脂中。明天继续保持饮食节奏，适当增加运动量效果更好。`;
    return `今日摄入偏多，热量盈余 ${Math.abs(deficit)}kcal。明天建议控制主食份量，多吃蔬菜和蛋白质。`;
  }
}

// ── AI 食谱生成 ──

export async function generateMealRecipe(profile: {
  recommendedIntake: number;
  currentWeight: number;
  targetWeight: number;
  gender: string;
}, calorieTarget: number, preference?: string) {
  const prefText = preference
    ? `用户想吃：${preference}。根据这个偏好来推荐。`
    : '';

  const prompt = `用户信息：${profile.gender}，体重${profile.currentWeight}kg，目标${profile.targetWeight}kg
每日推荐摄入 ${profile.recommendedIntake}kcal，本次目标热量 ${calorieTarget}kcal
${prefText}

请推荐一餐食谱，要求：
1. 给出2-3道菜的具体名称和简要做法
2. 每道菜标注估算热量
3. 总热量不超过 ${Math.max(calorieTarget, 300)}kcal
4. 高蛋白、适量碳水、低脂肪
5. 家常菜，适合中国人口味

返回纯文本，分点说明，不超过200字。`;

  try {
    const text = await callDeepSeek(
      "你是一个营养厨师，为用户推荐减脂食谱。回答简洁实用。",
      prompt
    );
    return text.trim().replace(/^["']|["']$/g, '');
  } catch {
    return `推荐食谱（约${Math.max(calorieTarget, 300)}kcal）：\n1. 鸡胸肉沙拉 - 鸡胸肉100g、生菜、小番茄，橄榄油少许（约250kcal）\n2. 紫菜蛋花汤 - 鸡蛋1个、紫菜少许（约80kcal）\n3. 蒸红薯一个（约120kcal）`;
  }
}

// ── 运动热量估算 ──

export interface ExerciseEstimation {
  name: string;
  duration: number;
  caloriesBurned: number;
  summary: string;
  isExercise: boolean;
  reason?: string;
}

function buildExercisePrompt(userInput: string, profile: Pick<UserProfile, 'currentWeight' | 'age' | 'gender'>) {
  return `你是运动科学专家，精通力量训练和有氧运动的能量消耗计算。

用户信息：${profile.gender} ${profile.currentWeight}kg ${profile.age}岁
输入："${userInput}"

## 运动判断
- isExercise=false：非运动闲聊 → name/duration/caloriesBurned 全为 0

## 推算规则（isExercise=true 时）

### 情况1：用户给出了重量和次数（如"卧推80kg 30个"、"深蹲100kg 5组每组8个"）
不要用"次数×几秒"来算时间！力量训练的实际时长包含热身、组间休息、换片等。

**推算步骤：**
a) 推断组数：如果用户没说组数，按常识推断（如30个卧推大概率是3组×10个或5组×6个，不会一组做完）
b) 估算实际时长（必须包含热身+组间休息）：
   - 热身：5~8分钟
   - 每组：30~60秒动作 + 1.5~3分钟休息
   - 例如 3组卧推 = 8热身 + 3×(0.75+2) ≈ 16分钟
c) 根据负重占体重的比例调整MET：
   - 负重 < 体重50%：MET基础值
   - 负重 50%~100%体重：MET×1.3
   - 负重 > 体重：MET×1.6
   - 例如 ${profile.currentWeight}kg 体重推80kg（123%体重），MET应显著上调
d) 热量 = MET × ${profile.currentWeight}kg × (时长÷60)

**力量训练MET基础值：**
卧推6.0 / 深蹲负重8.0 / 硬拉8.0 / 推举5.0 / 划船6.0
哑铃弯举4.0 / 臂屈伸4.0 / 引体向上8.0
俯卧撑5.0 / 仰卧起坐4.0 / 自重深蹲5.0 / 弓步蹲5.0

### 情况2：用户给出了时长（如"跑步一小时"、"跳绳半小时"）
- 直接提取时长，用户说什么就是什么
- 匹配MET值，计算热量 = MET × ${profile.currentWeight}kg × (时长÷60)

### 情况3：只说动作没说时间也没说次数（如"打篮球"、"游泳"）
- 根据常识推断典型时长（篮球约40-60分钟、游泳约30-45分钟）

## MET参考表
| 运动 | MET | 运动 | MET |
|------|-----|------|-----|
| 跑步8km/h | 8.3 | 慢跑 | 6.0 |
| 快走 | 5.0 | 散步 | 3.5 |
| 跳绳快/中 | 12/10 | 游泳 | 8.0 |
| 骑车15km/h | 7.5 | HIIT | 10.0 |
| 波比跳 | 8.0 | 爬楼梯 | 8.0 |
| 瑜伽 | 3.0 | 广场舞 | 4.5 |
| 篮球 | 6.5 | 足球 | 7.0 |
| 羽毛球 | 5.5 | 乒乓球 | 4.0 |

## 关键原则
- 有重量有次数 → 必须推断合理的组数+热身+休息，不要用次数×几秒算时间
- 有时间说时间 → 用户说了时间就按用户说的算
- 负重越大 + MET越高 + 休息越多 + 时长越长 = 消耗越多
- summary 必须包含关键信息如"卧推80kg×30次，约16分钟"`;
}

export async function estimateExerciseCalories(
  userInput: string,
  profile: Pick<UserProfile, 'currentWeight' | 'age' | 'gender'>
): Promise<ExerciseEstimation> {
  const prompt = buildExercisePrompt(userInput, profile)
    + "\n\n直接返回 JSON（不要 markdown 代码块）：{\"isExercise\":true/false,\"name\":\"运动名\",\"duration\":分钟数,\"caloriesBurned\":热量,\"summary\":\"描述\",\"reason\":\"说明\"}";

  const text = await callDeepSeek(
    "你是一个运动科学专家。只返回 JSON，不要任何解释。",
    prompt
  );

  return extractJson(text);
}
