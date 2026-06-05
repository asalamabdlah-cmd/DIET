import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Utensils, Scale, Flame, Info, TrendingDown, TrendingUp, Minus, Sparkles } from "lucide-react";
import type { DietRecord, ExerciseRecord, WeightRecord, UserProfile } from "../types";
import { generateDietSuggestion, generateDailySummary } from "../services/geminiService";
import { useCountUp } from "../hooks/useCountUp";

interface HomeViewProps {
  profile: UserProfile;
  dietRecords: DietRecord[];
  exerciseRecords: ExerciseRecord[];
  weightRecords: WeightRecord[];
  onNavigate: (view: string) => void;
}

function ActivityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function getTodayRecords<T extends { time: Date }>(records: T[]): T[] {
  const today = new Date().toDateString();
  return records.filter(r => new Date(r.time).toDateString() === today);
}

function getYesterdayRecords<T extends { time: Date }>(records: T[]): T[] {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = d.toDateString();
  return records.filter(r => new Date(r.time).toDateString() === yesterday);
}

export default function HomeView({ profile, dietRecords, exerciseRecords, weightRecords, onNavigate }: HomeViewProps) {
  const todayDiet = getTodayRecords(dietRecords);
  const todayEx = getTodayRecords(exerciseRecords);
  const yesterdayDiet = getYesterdayRecords(dietRecords);
  const yesterdayEx = getYesterdayRecords(exerciseRecords);

  const totalIntake = todayDiet.reduce((s, r) => s + r.calories, 0);
  const totalBurned = todayEx.reduce((s, r) => s + r.caloriesBurned, 0);
  const yesterdayIntake = yesterdayDiet.reduce((s, r) => s + r.calories, 0);
  const yesterdayBurned = yesterdayEx.reduce((s, r) => s + r.caloriesBurned, 0);

  // ── 计算逻辑 ──
  // 总消耗 = 基础代谢 + 400 日常走动 + 实际运动消耗
  // 推荐摄入 = 总消耗 − 减脂缺口（已在 profile 中存储）
  // 还能摄入 = 总消耗 − 已摄入
  const totalBudget = profile.bmr + 400 + totalBurned;
  const remaining = totalBudget - totalIntake;
  const deficit = totalBudget - totalIntake;
  const progressPercent = Math.min((totalIntake / Math.max(totalBudget, 1)) * 100, 100);

  // Animated numbers
  const animatedRemaining = useCountUp(Math.max(0, remaining));
  const animatedIntake = useCountUp(totalIntake);
  const animatedBurned = useCountUp(totalBurned);

  // AI suggestion
  const [suggestion, setSuggestion] = useState("正在分析今日饮食...");
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSuggestionLoading(true);

    const carbs = todayDiet.reduce((s, r) => s + r.carbs, 0);
    const protein = todayDiet.reduce((s, r) => s + r.protein, 0);
    const fat = todayDiet.reduce((s, r) => s + r.fat, 0);

    const remainingForSuggestion = totalBudget - totalIntake;

    generateDietSuggestion(
      {
        recommendedIntake: profile.recommendedIntake,
        targetWeight: profile.targetWeight,
        currentWeight: profile.currentWeight,
      },
      { calories: totalIntake, carbs, protein, fat, remaining: remainingForSuggestion }
    ).then(result => {
      if (!cancelled) {
        setSuggestion(result.text);
        setSuggestionLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [dietRecords, profile.recommendedIntake]);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 6 ? '夜深了' : hour < 12 ? '上午好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

  const getGreetingTag = () => {
    if (deficit > 500) return { icon: '🔥', text: '热量缺口充足，高效燃脂中' };
    if (deficit > 200) return { icon: '😊', text: '今日处于减脂状态' };
    if (deficit > -100) return { icon: '⚖️', text: '热量接近平衡' };
    return { icon: '🍽️', text: '今日摄入偏多，注意控制哦' };
  };
  const tag = getGreetingTag();

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <section className="mb-4">
        <h1 className="text-3xl font-bold text-on-surface mb-2">{greeting}，{profile.name}</h1>
        <div className="inline-flex items-center gap-2 bg-primary-fixed/40 px-4 py-2 rounded-full">
          <span>{tag.icon}</span>
          <span className="text-sm font-semibold text-on-primary-fixed-variant">{tag.text}</span>
        </div>
      </section>

      {/* Hero Calorie Card */}
      <section className="bg-surface-container-lowest rounded-3xl p-8 soft-shadow flex flex-col items-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary-fixed/20 rounded-full blur-2xl pointer-events-none" />

        <h2 className="text-on-surface-variant mb-6 font-medium">今日还能摄入 (kcal)</h2>

        <div className="relative w-56 h-56 rounded-full bg-surface-container flex items-center justify-center mb-8 shadow-inner">
          <div className="absolute inset-2 rounded-full bg-surface-container-lowest shadow-sm flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-primary mb-1">{animatedRemaining}</span>
            <span className="text-sm text-on-surface-variant font-medium">推荐 {profile.recommendedIntake}</span>
            <span className="text-xs text-on-surface-variant/60 mt-0.5">
              总消耗 {totalBudget} kcal
            </span>
            {totalBurned > 0 && (
              <span className="text-xs text-green-600 font-medium">含运动 +{animatedBurned} kcal</span>
            )}
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
              animate={{ strokeDashoffset: 289 - (289 * Math.min(progressPercent, 100)) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full w-full max-w-[220px] border transition-colors ${
          deficit >= 0 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
        }`}>
          <Flame size={16} className={deficit >= 0 ? 'text-green-600' : 'text-orange-500'} />
          <span className="text-sm font-bold text-on-surface">
            热量缺口: {deficit >= 0 ? '+' : ''}{deficit} kcal
          </span>
        </div>
      </section>

      {/* Today vs Yesterday */}
      <section className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">今日</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-lowest rounded-2xl p-4 soft-shadow">
              <div className="flex items-center gap-1.5 text-on-surface-variant mb-2">
                <Utensils size={14} />
                <span className="text-xs font-medium">摄入</span>
              </div>
              <p className="text-xl font-bold text-on-surface">{animatedIntake}</p>
              <p className="text-[10px] text-on-surface-variant">kcal</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-4 soft-shadow">
              <div className="flex items-center gap-1.5 text-on-surface-variant mb-2">
                <ActivityIcon />
                <span className="text-xs font-medium">消耗</span>
              </div>
              <p className="text-xl font-bold text-on-surface">{animatedBurned}</p>
              <p className="text-[10px] text-on-surface-variant">kcal</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">昨天</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-low rounded-2xl p-4 opacity-80">
              <div className="flex items-center gap-1.5 text-on-surface-variant mb-2">
                <Utensils size={14} />
                <span className="text-xs font-medium">摄入</span>
              </div>
              <p className="text-xl font-bold text-on-surface">{yesterdayIntake}</p>
              <p className="text-[10px] text-on-surface-variant">kcal</p>
            </div>
            <div className="bg-surface-container-low rounded-2xl p-4 opacity-80">
              <div className="flex items-center gap-1.5 text-on-surface-variant mb-2">
                <ActivityIcon />
                <span className="text-xs font-medium">消耗</span>
              </div>
              <p className="text-xl font-bold text-on-surface">{yesterdayBurned}</p>
              <p className="text-[10px] text-on-surface-variant">kcal</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deficit comparison */}
      {yesterdayIntake > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant">
          {totalIntake < yesterdayIntake ? (
            <><TrendingDown size={14} className="text-green-600" /> 比昨天少摄入 {yesterdayIntake - totalIntake} kcal</>
          ) : totalIntake > yesterdayIntake ? (
            <><TrendingUp size={14} className="text-orange-500" /> 比昨天多摄入 {totalIntake - yesterdayIntake} kcal</>
          ) : (
            <><Minus size={14} /> 与昨天摄入持平</>
          )}
        </div>
      )}

      {/* Suggestion Banner */}
      <section className="bg-secondary-fixed/20 border border-secondary-fixed/30 rounded-2xl p-5 soft-shadow flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
          suggestionLoading ? 'bg-primary-container animate-pulse' : 'bg-secondary-container'
        }`}>
          {suggestionLoading ? (
            <Sparkles size={18} className="text-primary" />
          ) : (
            <Info size={20} className="fill-current text-white" />
          )}
        </div>
        <div className="flex flex-col gap-1 pt-1 min-w-0">
          <span className="text-sm font-bold text-on-surface">温馨提示</span>
          <span className="text-sm text-on-surface-variant leading-relaxed">{suggestion}</span>
        </div>
      </section>

      {/* Daily Summary */}
      <section className="bg-surface-container-lowest rounded-2xl p-5 soft-shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Sparkles size={18} className="text-primary fill-current" />
            今日总结
          </h3>
          <button
            onClick={async () => {
              setSummaryLoading(true);
              setSummary("");
              const sortedW = [...weightRecords].sort((a, b) => a.date.localeCompare(b.date));
              const todayW = sortedW.find(r => r.date === new Date().toISOString().split('T')[0]);
              const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
              const yesterdayW = sortedW.find(r => r.date === yesterdayStr);
              const wc = todayW && yesterdayW ? todayW.weight - yesterdayW.weight : null;

              const text = await generateDailySummary(
                { recommendedIntake: profile.recommendedIntake, currentWeight: profile.currentWeight, targetWeight: profile.targetWeight, bmr: profile.bmr },
                { dietCalories: totalIntake, dietCarbs: todayDiet.reduce((s, r) => s + r.carbs, 0), dietProtein: todayDiet.reduce((s, r) => s + r.protein, 0), dietFat: todayDiet.reduce((s, r) => s + r.fat, 0), exerciseCalories: totalBurned, weightChange: wc }
              );
              setSummary(text);
              setSummaryLoading(false);
            }}
            className="text-xs font-bold text-primary bg-primary-fixed/30 px-4 py-2 rounded-full hover:bg-primary-fixed/50 transition-colors"
          >
            {summaryLoading ? '生成中...' : '生成总结'}
          </button>
        </div>
        {summary && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-on-surface-variant leading-relaxed">
            {summary}
          </motion.p>
        )}
        {!summary && !summaryLoading && (
          <p className="text-sm text-on-surface-variant/60 italic">记录完今天的饮食和运动后，点击生成总结</p>
        )}
        {summaryLoading && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            DeepSeek 正在分析今日数据...
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="pb-8">
        <h3 className="text-xl font-bold text-on-surface mb-5">快速记录</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'diet', label: '记饮食', icon: Utensils },
            { id: 'exercise', label: '记运动', icon: ActivityIcon },
            { id: 'weight', label: '记体重', icon: Scale },
          ].map((action) => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="bg-surface-container-lowest hover:bg-surface-container-low transition-all rounded-2xl p-4 soft-shadow flex flex-col items-center justify-center gap-3 group active:scale-95"
            >
              <div className="w-14 h-14 rounded-full bg-primary-fixed/60 group-hover:bg-primary-fixed flex items-center justify-center transition-colors shadow-sm">
                <action.icon size={28} className="text-primary" />
              </div>
              <span className="text-sm font-semibold text-on-surface">{action.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
