/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Utensils, Dumbbell, Scale, Flame, ChevronRight, Info } from "lucide-react";
import type { DietRecord, ExerciseRecord, UserProfile } from "../types";

// Note: Re-mapping icons to lucide equivalent
const icons = {
  diet: Utensils,
  exercise: () => <ActivityIcon />, 
  weight: Scale,
  flame: Flame,
};

function ActivityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

interface HomeViewProps {
  profile: UserProfile;
  dietRecords: DietRecord[];
  exerciseRecords: ExerciseRecord[];
  onNavigate: (view: string) => void;
}

export default function HomeView({ profile, dietRecords, exerciseRecords, onNavigate }: HomeViewProps) {
  const todayRecords = dietRecords.filter(r => {
    const d = new Date(r.time);
    return d.toDateString() === new Date().toDateString();
  });
  const todayExercise = exerciseRecords.filter(r => {
    const d = new Date(r.time);
    return d.toDateString() === new Date().toDateString();
  });

  const totalIntake = todayRecords.reduce((sum, r) => sum + r.calories, 0);
  const totalBurned = todayExercise.reduce((sum, r) => sum + r.caloriesBurned, 0);
  const remaining = profile.recommendedIntake - totalIntake + totalBurned;
  
  const progressPercent = Math.min((totalIntake / profile.recommendedIntake) * 100, 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Greeting */}
      <section id="greeting" className="mb-4">
        <h1 className="text-3xl font-bold text-on-surface mb-2">上午好，{profile.name}</h1>
        <div className="inline-flex items-center gap-2 bg-primary-fixed/40 px-4 py-2 rounded-full">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px]">😊</div>
          <span className="text-sm font-semibold text-on-primary-fixed-variant">今日处于减脂状态</span>
        </div>
      </section>

      {/* Hero Calorie Card */}
      <section 
        id="calorie-hero"
        className="bg-surface-container-lowest rounded-3xl p-8 soft-shadow flex flex-col items-center relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary-fixed/20 rounded-full blur-2xl pointer-events-none" />
        
        <h2 className="text-on-surface-variant mb-6 font-medium">今日还能摄入 (kcal)</h2>
        
        <div className="relative w-56 h-56 rounded-full bg-surface-container flex items-center justify-center mb-8 shadow-inner">
          <div className="absolute inset-2 rounded-full bg-surface-container-lowest shadow-sm flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-primary mb-1">{remaining}</span>
            <span className="text-sm text-on-surface-variant font-medium">目标 {profile.recommendedIntake}</span>
          </div>
          
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle className="text-surface-container-highest" cx="50" cy="50" fill="none" r="46" stroke="currentColor" strokeWidth="6" />
            <motion.circle 
              className="text-primary" 
              cx="50" cy="50" fill="none" r="46" 
              stroke="currentColor" 
              strokeWidth="6"
              strokeDasharray="289" 
              initial={{ strokeDashoffset: 289 }}
              animate={{ strokeDashoffset: 289 - (289 * progressPercent) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round" 
            />
          </svg>
        </div>
        
        <div className="flex items-center justify-center gap-2 bg-surface-container-low px-5 py-2.5 rounded-full w-full max-w-[200px] border border-surface-variant/30">
          <Flame size={16} className="text-secondary fill-secondary" />
          <span className="text-sm font-bold text-on-surface">热量缺口: 200 kcal</span>
        </div>
      </section>

      {/* Stats Grid */}
      <section id="stats-grid" className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-5 soft-shadow flex flex-col gap-3 group hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Utensils size={18} className="text-tertiary" />
            <span className="text-sm font-medium">今日摄入</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-on-surface">{totalIntake}</span>
            <span className="text-sm text-on-surface-variant font-medium">kcal</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-5 soft-shadow flex flex-col gap-3 group hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <ActivityIcon />
            <span className="text-sm font-medium">今日消耗</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-on-surface">{totalBurned}</span>
            <span className="text-sm text-on-surface-variant font-medium">kcal</span>
          </div>
        </div>
      </section>

      {/* Suggestion Banner */}
      <section id="suggestion" className="bg-secondary-fixed/20 border border-secondary-fixed/30 rounded-2xl p-5 soft-shadow flex items-start gap-4">
        <div className="bg-secondary-container text-on-secondary-container w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
          <Info size={20} className="fill-current text-white" />
        </div>
        <div className="flex flex-col gap-1 pt-1">
          <span className="text-sm font-bold text-on-surface">温馨提示</span>
          <span className="text-sm text-on-surface-variant leading-relaxed">蛋白质摄入略显不足，晚餐建议补充一些鸡蛋、牛奶或瘦肉哦。</span>
        </div>
      </section>

      {/* Quick Actions */}
      <section id="quick-actions" className="pb-8">
        <h3 className="text-xl font-bold text-on-surface mb-5">快速记录</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'diet', label: '记饮食', icon: Utensils, color: 'primary' },
            { id: 'exercise', label: '记运动', icon: ActivityIcon, color: 'tertiary' },
            { id: 'weight', label: '记体重', icon: Scale, color: 'secondary' },
          ].map((action) => (
            <button 
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="bg-surface-container-lowest hover:bg-surface-container-low transition-all rounded-2xl p-4 soft-shadow flex flex-col items-center justify-center gap-3 group active:scale-95"
            >
              <div className={`w-14 h-14 rounded-full bg-${action.color}-fixed/50 group-hover:bg-${action.color}-fixed flex items-center justify-center transition-colors shadow-sm`}>
                <action.icon size={28} className={`text-${action.color}`} />
              </div>
              <span className="text-sm font-semibold text-on-surface">{action.label}</span>
            </button>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
