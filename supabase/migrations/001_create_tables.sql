-- 用户资料表
CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  age           INT NOT NULL DEFAULT 30,
  height        REAL NOT NULL DEFAULT 165,
  current_weight REAL NOT NULL DEFAULT 65,
  target_weight  REAL NOT NULL DEFAULT 58,
  current_body_fat REAL DEFAULT 28,
  target_body_fat  REAL DEFAULT 24,
  activity_level  TEXT NOT NULL DEFAULT '中度活动',
  bmr             REAL NOT NULL DEFAULT 1400,
  recommended_intake REAL NOT NULL DEFAULT 1500,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 饮食记录表
CREATE TABLE diet_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  calories   INT NOT NULL,
  carbs      INT NOT NULL DEFAULT 0,
  protein    INT NOT NULL DEFAULT 0,
  fat        INT NOT NULL DEFAULT 0,
  type       TEXT NOT NULL DEFAULT 'lunch' CHECK (type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  time       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 运动记录表
CREATE TABLE exercise_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  duration        INT NOT NULL DEFAULT 30,
  calories_burned INT NOT NULL DEFAULT 0,
  time            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 体重记录表
CREATE TABLE weight_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  weight     REAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_diet_records_user_time ON diet_records(user_id, time DESC);
CREATE INDEX idx_exercise_records_user_time ON exercise_records(user_id, time DESC);
CREATE INDEX idx_weight_records_user_date ON weight_records(user_id, date DESC);

-- ============================================================
-- RLS 策略：用户只能访问自己的数据
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;

-- user_profiles
CREATE POLICY "users_select_own_profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- diet_records
CREATE POLICY "users_select_own_diet" ON diet_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_diet" ON diet_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_diet" ON diet_records
  FOR DELETE USING (auth.uid() = user_id);

-- exercise_records
CREATE POLICY "users_select_own_exercise" ON exercise_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_exercise" ON exercise_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_exercise" ON exercise_records
  FOR DELETE USING (auth.uid() = user_id);

-- weight_records
CREATE POLICY "users_select_own_weight" ON weight_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_weight" ON weight_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_weight" ON weight_records
  FOR DELETE USING (auth.uid() = user_id);
