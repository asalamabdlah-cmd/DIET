-- 添加 UPDATE 策略（饮食和运动记录的编辑功能需要）
CREATE POLICY "users_update_own_diet" ON diet_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_exercise" ON exercise_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_weight" ON weight_records
  FOR UPDATE USING (auth.uid() = user_id);
