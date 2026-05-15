/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ActivityLevel {
  SEDENTARY = '久坐',
  LIGHT = '轻度活动',
  MODERATE = '中度活动',
  ACTIVE = '活跃',
  VERY_ACTIVE = '非常活跃',
}

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
  duration: number; // minutes
  caloriesBurned: number;
}

export interface WeightRecord {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  weight: number;
}

export interface UserProfile {
  name: string;
  age: number;
  height: number;
  currentWeight: number;
  targetWeight: number;
  currentBodyFat?: number;
  targetBodyFat?: number;
  activityLevel: ActivityLevel;
  bmr: number;
  recommendedIntake: number;
}
