import { supabase } from './supabase';
import type { DietRecord, ExerciseRecord, WeightRecord, UserProfile } from '../types';
import { calcRecommendedIntake } from '../types';

// ── User Profile ──

export async function loadProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    name: data.name,
    gender: data.gender || '女',
    avatarUrl: data.avatar_url || null,
    age: data.age,
    height: data.height,
    currentWeight: data.current_weight,
    targetWeight: data.target_weight,
    currentBodyFat: data.current_body_fat,
    targetBodyFat: data.target_body_fat,
    bmr: data.bmr,
    recommendedIntake: data.recommended_intake,
  };
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const row = {
    user_id: user.id,
    name: profile.name,
    gender: profile.gender,
    age: profile.age,
    height: profile.height,
    current_weight: profile.currentWeight,
    target_weight: profile.targetWeight,
    current_body_fat: profile.currentBodyFat,
    target_body_fat: profile.targetBodyFat,
    avatar_url: (profile as any).avatarUrl || null,
    bmr: profile.bmr,
    recommended_intake: profile.recommendedIntake,
  };

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('user_profiles').update(row).eq('user_id', user.id);
  } else {
    await supabase.from('user_profiles').insert(row);
  }
}

export async function ensureProfile(userEmail: string): Promise<UserProfile> {
  const existing = await loadProfile();
  if (existing) {
    // Always recalculate recommendedIntake from current formula on load
    const recalc = calcRecommendedIntake(existing.bmr, existing.gender);
    if (existing.recommendedIntake !== recalc) {
      existing.recommendedIntake = recalc;
      await saveProfile(existing);
    }
    return existing;
  }

  const bmr = 1400;
  const profile: UserProfile = {
    name: userEmail.split('@')[0],
    gender: '女',
    age: 30,
    height: 165,
    currentWeight: 65,
    targetWeight: 58,
    currentBodyFat: 28,
    targetBodyFat: 24,
    bmr,
    recommendedIntake: calcRecommendedIntake(bmr, '女'),
  };

  await saveProfile(profile);
  return profile;
}

export async function uploadAvatar(file: File): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${user.id}.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    console.error('[DB] 头像上传失败:', error);
    return null;
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
  return urlData.publicUrl;
}

// ── Diet Records ──

export async function loadDietRecords(): Promise<DietRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('diet_records')
    .select('*')
    .eq('user_id', user.id)
    .order('time', { ascending: false })
    .limit(200);

  if (error || !data) return [];

  return data.map(r => ({
    id: r.id,
    name: r.name,
    calories: r.calories,
    carbs: r.carbs,
    protein: r.protein,
    fat: r.fat,
    type: r.type as DietRecord['type'],
    time: new Date(r.time),
  }));
}

export async function addDietRecord(record: Omit<DietRecord, 'id' | 'time'>): Promise<DietRecord | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('登录已过期，请退出后重新登录');
  }

  const { data, error } = await supabase
    .from('diet_records')
    .insert({
      user_id: user.id,
      name: record.name,
      calories: Math.round(record.calories),
      carbs: Math.round(record.carbs),
      protein: Math.round(record.protein),
      fat: Math.round(record.fat),
      type: record.type,
      time: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[DB] 添加饮食记录失败:', error.message, error.details, error.code);
    if (error.code === '42501') throw new Error('权限不足，请联系管理员');
    if (error.code === '23505') throw new Error('记录已存在');
    throw new Error(`保存失败：${error.message}`);
  }
  if (!data) throw new Error('保存失败：服务器未返回数据');

  return {
    id: data.id,
    name: data.name,
    calories: data.calories,
    carbs: data.carbs,
    protein: data.protein,
    fat: data.fat,
    type: data.type as DietRecord['type'],
    time: new Date(data.time),
  };
}

export async function updateDietRecord(id: string, patch: Partial<Omit<DietRecord, 'id' | 'time'>>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const updateData: any = {};
  if (patch.name !== undefined) updateData.name = patch.name;
  if (patch.calories !== undefined) updateData.calories = Math.round(patch.calories);
  if (patch.carbs !== undefined) updateData.carbs = Math.round(patch.carbs);
  if (patch.protein !== undefined) updateData.protein = Math.round(patch.protein);
  if (patch.fat !== undefined) updateData.fat = Math.round(patch.fat);
  if (patch.type !== undefined) updateData.type = patch.type;

  const { error } = await supabase
    .from('diet_records')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[DB] 更新饮食记录失败:', error.message, error.details);
    return false;
  }
  return true;
}

export async function deleteDietRecord(id: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('diet_records')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

// ── Exercise Records ──

export async function loadExerciseRecords(): Promise<ExerciseRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('exercise_records')
    .select('*')
    .eq('user_id', user.id)
    .order('time', { ascending: false })
    .limit(200);

  if (error || !data) return [];

  return data.map(r => ({
    id: r.id,
    name: r.name,
    duration: r.duration,
    caloriesBurned: r.calories_burned,
    time: new Date(r.time),
  }));
}

export async function addExerciseRecord(record: Omit<ExerciseRecord, 'id' | 'time'>): Promise<ExerciseRecord | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('登录已过期，请退出后重新登录');
  }

  const { data, error } = await supabase
    .from('exercise_records')
    .insert({
      user_id: user.id,
      name: record.name,
      duration: record.duration,
      calories_burned: record.caloriesBurned,
      time: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[DB] 添加运动记录失败:', error.message, error.details, error.code);
    if (error.code === '42501') throw new Error('权限不足，请联系管理员');
    throw new Error(`保存失败：${error.message}`);
  }
  if (!data) throw new Error('保存失败：服务器未返回数据');

  return {
    id: data.id,
    name: data.name,
    duration: data.duration,
    caloriesBurned: data.calories_burned,
    time: new Date(data.time),
  };
}

export async function updateExerciseRecord(id: string, patch: Partial<Omit<ExerciseRecord, 'id' | 'time'>>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('exercise_records')
    .update({
      name: patch.name,
      duration: patch.duration,
      calories_burned: patch.caloriesBurned,
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[DB] 更新运动记录失败:', error.message, error.details);
    return false;
  }
  return true;
}

export async function deleteExerciseRecord(id: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('exercise_records')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

// ── Weight Records ──

export async function loadWeightRecords(): Promise<WeightRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('weight_records')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(200);

  if (error || !data) return [];

  return data.map(r => ({
    id: r.id,
    date: r.date,
    weight: r.weight,
  }));
}

export async function addWeightRecord(weight: number): Promise<WeightRecord | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('[DB] 体重保存失败：未登录');
    return null;
  }

  const today = new Date().toISOString().split('T')[0];

  // If already recorded today, update instead
  const { data: existing, error: findErr } = await supabase
    .from('weight_records')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  if (findErr) {
    console.error('[DB] 体重查询失败:', findErr);
    return null;
  }

  if (existing) {
    const { data, error } = await supabase
      .from('weight_records')
      .update({ weight })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('[DB] 体重更新失败:', error);
      return null;
    }
    console.log('[DB] 体重已更新:', today, weight, 'kg');
    return { id: data.id, date: data.date, weight: data.weight };
  }

  const { data, error } = await supabase
    .from('weight_records')
    .insert({ user_id: user.id, date: today, weight })
    .select()
    .single();

  if (error) {
    console.error('[DB] 体重插入失败:', error);
    return null;
  }

  console.log('[DB] 体重已保存:', today, weight, 'kg');
  return { id: data.id, date: data.date, weight: data.weight };
}
