export type Gender = '男' | '女';

// ── 热量常量 ──

/** 每人每日日常生活走动基础消耗（不含健身运动） */
export const DAILY_BASE_MOVE = 400;

/** 固定减脂缺口 (kcal) */
export const WEIGHT_LOSS_DEFICIT = 300;

/** 男性最低摄入 (kcal) */
export const MALE_MIN_INTAKE = 1500;

/** 女性最低摄入 (kcal) */
export const FEMALE_MIN_INTAKE = 1200;

// ── 公式 ──

/** Mifflin-St Jeor：完全静止不动的基础代谢 */
export function calcBMR(weight: number, height: number, age: number, gender: Gender): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === '男' ? base + 5 : base - 161);
}

/** 无运动日的总消耗 = BMR + 400 日常走动 */
export function calcRestingExpenditure(bmr: number): number {
  return bmr + DAILY_BASE_MOVE;
}

/** 总消耗 = BMR + 400 + 运动消耗 */
export function calcTotalExpenditure(bmr: number, exerciseCalories: number): number {
  return bmr + DAILY_BASE_MOVE + exerciseCalories;
}

/** 每日推荐摄入 = BMR + 400 - 减脂缺口，不低于性别最低值 */
export function calcRecommendedIntake(bmr: number, gender: Gender): number {
  const target = bmr + DAILY_BASE_MOVE - WEIGHT_LOSS_DEFICIT;
  const min = gender === '男' ? MALE_MIN_INTAKE : FEMALE_MIN_INTAKE;
  return Math.max(target, min);
}

// ── 数据类型 ──

export interface DietRecord {
  id: string;
  time: Date;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export interface ExerciseRecord {
  id: string;
  time: Date;
  name: string;
  duration: number;
  caloriesBurned: number;
}

export interface WeightRecord {
  id: string;
  date: string;
  weight: number;
}

export interface UserProfile {
  name: string;
  gender: Gender;
  age: number;
  height: number;
  currentWeight: number;
  targetWeight: number;
  currentBodyFat?: number;
  targetBodyFat?: number;
  bmr: number;
  recommendedIntake: number;
}
