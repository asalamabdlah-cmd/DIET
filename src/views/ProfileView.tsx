import { useState, useEffect, type ChangeEvent } from "react";
import { motion } from "motion/react";
import { User, Edit3, Ruler, Scale, Activity, Heart, Flame, Utensils, LogOut, Check, X, RefreshCw } from "lucide-react";
import { uploadAvatar } from "../lib/supabaseService";
import type { UserProfile, Gender } from "../types";
import { calcBMR, calcRecommendedIntake } from "../types";

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onSignOut: () => void;
}

// Helper: number input that doesn't force "0" on empty
function NumInput({ value, onChange, ...rest }: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  className?: string;
  step?: string;
}) {
  const display = value != null ? String(value) : '';

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(undefined);
    } else {
      const n = Number(raw);
      if (!isNaN(n)) onChange(n);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      {...rest}
    />
  );
}

export default function ProfileView({ profile, onUpdateProfile, onSignOut }: ProfileViewProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [bmrManual, setBmrManual] = useState(false);

  // Persist edit state across view switches
  useEffect(() => {
    const saved = sessionStorage.getItem('profile_edit');
    if (saved) {
      try {
        const { section, draft: savedDraft, bmrManual: savedBmr } = JSON.parse(saved);
        setEditingSection(section);
        setDraft(savedDraft);
        setBmrManual(savedBmr);
        sessionStorage.removeItem('profile_edit');
      } catch {}
    }
  }, []);

  // Save editing state on unmount (view switch)
  useEffect(() => {
    return () => {
      if (editingSection) {
        sessionStorage.setItem('profile_edit', JSON.stringify({
          section: editingSection,
          draft,
          bmrManual,
        }));
      }
    };
  }, [editingSection, draft, bmrManual]);

  const startEdit = (section: string) => {
    setDraft({ ...profile });
    setEditingSection(section);
  };

  const cancelEdit = () => {
    // Save state before closing, so user can resume
    sessionStorage.setItem('profile_edit', JSON.stringify({
      section: editingSection, draft, bmrManual,
    }));
    setEditingSection(null);
    setBmrManual(false);
  };

  const saveEdit = () => {
    const updated = { ...draft };
    // Fill undefined numeric fields with 0 before saving
    if (updated.currentBodyFat == null) updated.currentBodyFat = 0;
    if (updated.targetBodyFat == null) updated.targetBodyFat = 0;
    if (updated.currentWeight == null) updated.currentWeight = 65;
    if (updated.targetWeight == null) updated.targetWeight = 58;
    if (updated.height == null) updated.height = 165;
    if (updated.age == null) updated.age = 30;
    if (updated.bmr == null) updated.bmr = 1400;
    if (updated.recommendedIntake == null) updated.recommendedIntake = 1500;

    if (!bmrManual) {
      updated.bmr = calcBMR(updated.currentWeight, updated.height, updated.age, updated.gender);
      updated.recommendedIntake = calcRecommendedIntake(updated.bmr, updated.gender);
    }
    onUpdateProfile(updated);
    setEditingSection(null);
    setBmrManual(false);
  };

  const update = (patch: Partial<UserProfile>) => {
    setDraft(prev => ({ ...prev, ...patch }));
  };

  const autoCalcBmr = () => {
    const w = draft.currentWeight ?? 65;
    const h = draft.height ?? 165;
    const a = draft.age ?? 30;
    const g = draft.gender;
    const newBmr = calcBMR(w, h, a, g);
    const newIntake = calcRecommendedIntake(newBmr, g);
    setDraft(prev => ({ ...prev, bmr: newBmr, recommendedIntake: newIntake }));
    setBmrManual(false);
  };

  const isEditing = (section: string) => editingSection === section;

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <section className="flex flex-col items-center mb-12">
        <label className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-white soft-shadow mb-6 overflow-hidden border-4 border-surface ring-4 ring-primary/5 cursor-pointer group/avatar">
          {(profile as any).avatarUrl ? (
            <img src={(profile as any).avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary-container flex items-center justify-center">
              <span className="text-5xl font-bold text-primary">{profile.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
            <span className="text-white text-xs font-bold">更换</span>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await uploadAvatar(file);
            if (url) onUpdateProfile({ ...profile, avatarUrl: url } as any);
          }} />
        </label>

        {isEditing('header') ? (
          <div className="flex flex-col items-center gap-2">
            <input
              value={draft.name}
              onChange={e => update({ name: e.target.value })}
              className="text-2xl font-bold text-on-surface bg-surface-container-low rounded-xl px-4 py-2 text-center border-2 border-primary outline-none"
              placeholder="你的名字"
              autoFocus
            />
            <div className="flex gap-2">
              {(['男', '女'] as Gender[]).map(g => (
                <button
                  key={g}
                  onClick={() => update({ gender: g })}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                    draft.gender === g
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={saveEdit} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center"><Check size={20} /></button>
              <button onClick={cancelEdit} className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center"><X size={20} /></button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-3xl font-bold text-on-surface mb-1">{profile.name}</h1>
            <p className="text-on-surface-variant font-medium">{profile.gender} · 开启轻盈每一天</p>
            <button
              onClick={() => startEdit('header')}
              className="mt-2 text-sm text-primary font-medium hover:underline underline-offset-2"
            >
              编辑信息
            </button>
          </div>
        )}
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-surface-container-lowest rounded-3xl soft-shadow p-8 group transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <User size={20} className="text-primary" />
              基本信息
            </h2>
            {!isEditing('basic') && (
              <button onClick={() => startEdit('basic')} className="text-primary hover:text-primary-container transition-colors">
                <Edit3 size={20} />
              </button>
            )}
          </div>

          {isEditing('basic') ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">年龄</label>
                  <NumInput value={draft.age} onChange={v => update({ age: v })}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface font-bold text-lg outline-none border-2 border-primary/40 focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">身高 (cm)</label>
                  <NumInput value={draft.height} onChange={v => update({ height: v })}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface font-bold text-lg outline-none border-2 border-primary/40 focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={cancelEdit} className="px-4 py-2 rounded-full bg-surface-container-highest text-on-surface-variant font-medium"><X size={18} /></button>
                <button onClick={saveEdit} className="px-4 py-2 rounded-full bg-primary text-white font-medium"><Check size={18} /></button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">年龄</p>
                <p className="text-2xl font-bold text-on-surface">{profile.age} <span className="text-sm font-medium text-on-surface-variant">岁</span></p>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">身高</p>
                <p className="text-2xl font-bold text-on-surface">{profile.height} <span className="text-sm font-medium text-on-surface-variant">cm</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Weight Goals */}
        <div className="bg-surface-container-lowest rounded-3xl soft-shadow p-8 group transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <Scale size={20} className="text-primary" />
              体重目标
            </h2>
            {!isEditing('weight') && (
              <button onClick={() => startEdit('weight')} className="text-primary hover:text-primary-container transition-colors">
                <Edit3 size={20} />
              </button>
            )}
          </div>

          {isEditing('weight') ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">当前体重 (kg)</label>
                  <NumInput value={draft.currentWeight} onChange={v => update({ currentWeight: v })} step="0.1"
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface font-bold text-lg outline-none border-2 border-primary/40 focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-primary uppercase tracking-wider mb-1 block">目标体重 (kg)</label>
                  <NumInput value={draft.targetWeight} onChange={v => update({ targetWeight: v })} step="0.1"
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-primary font-bold text-lg outline-none border-2 border-primary/40 focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">当前体脂率 (%)</label>
                  <NumInput value={draft.currentBodyFat} onChange={v => update({ currentBodyFat: v })} step="0.1"
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface font-bold text-lg outline-none border-2 border-primary/40 focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-primary uppercase tracking-wider mb-1 block">目标体脂率 (%)</label>
                  <NumInput value={draft.targetBodyFat} onChange={v => update({ targetBodyFat: v })} step="0.1"
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-primary font-bold text-lg outline-none border-2 border-primary/40 focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={cancelEdit} className="px-4 py-2 rounded-full bg-surface-container-highest text-on-surface-variant font-medium"><X size={18} /></button>
                <button onClick={saveEdit} className="px-4 py-2 rounded-full bg-primary text-white font-medium"><Check size={18} /></button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">当前体重</p>
                  <p className="text-2xl font-bold text-on-surface">{profile.currentWeight} <span className="text-sm font-medium text-on-surface-variant">kg</span></p>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">目标体重</p>
                  <p className="text-2xl font-bold text-primary">{profile.targetWeight} <span className="text-sm font-medium opacity-70">kg</span></p>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">当前体脂率</p>
                  <p className="text-2xl font-bold text-on-surface">{profile.currentBodyFat ?? '-'} <span className="text-sm font-medium text-on-surface-variant">%</span></p>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">目标体脂率</p>
                  <p className="text-2xl font-bold text-primary">{profile.targetBodyFat ?? '-'} <span className="text-sm font-medium opacity-70">%</span></p>
                </div>
              </div>
              <div className="mt-8 bg-surface-container-low rounded-full h-2.5 overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, ((profile.currentWeight - profile.targetWeight) / (profile.currentWeight || 1)) * 100))}%` }}
                  transition={{ duration: 1 }}
                  className="bg-primary h-full rounded-full opacity-70 shadow-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* Health Metrics */}
        <div className="bg-surface-container-lowest rounded-3xl soft-shadow p-8 md:col-span-2 group transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <Heart size={20} className="text-primary fill-primary/10" />
              健康指标
            </h2>
            {!isEditing('health') ? (
              <button onClick={() => startEdit('health')} className="text-primary hover:text-primary-container transition-colors">
                <Edit3 size={20} />
              </button>
            ) : (
              <button onClick={autoCalcBmr} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                <RefreshCw size={14} />
                自动测算
              </button>
            )}
          </div>

          {isEditing('health') ? (
            <div className="space-y-5">
              <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-low rounded-xl p-4">
                💡 每日总消耗 = 基础代谢 + 400kcal 日常走动 + 运动消耗<br />
                💡 推荐摄入 = 总消耗 − 300kcal 减脂缺口，男性不低于 1500，女性不低于 1200
              </p>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">
                    基础代谢 (BMR)
                    {bmrManual
                      ? <span className="text-primary text-[10px] font-normal ml-1">手动</span>
                      : <span className="text-green-600 text-[10px] font-normal ml-1">自动测算</span>
                    }
                  </label>
                  <div className="flex items-center gap-2">
                    <NumInput
                      value={draft.bmr}
                      onChange={v => { setBmrManual(true); update({ bmr: v }); }}
                      className="w-full min-w-0 bg-surface-container-low rounded-xl px-4 py-3 text-on-surface font-bold outline-none border-2 border-primary/40 focus:border-primary"
                    />
                    <span className="text-sm text-on-surface-variant font-medium whitespace-nowrap">kcal</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">建议摄入量</label>
                  <div className="flex items-center gap-2">
                    <NumInput
                      value={draft.recommendedIntake}
                      onChange={v => update({ recommendedIntake: v })}
                      className="w-full min-w-0 bg-surface-container-low rounded-xl px-4 py-3 text-primary font-bold outline-none border-2 border-primary/40 focus:border-primary"
                    />
                    <span className="text-sm text-on-surface-variant font-medium whitespace-nowrap">kcal</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={cancelEdit} className="px-4 py-2 rounded-full bg-surface-container-highest text-on-surface-variant font-medium"><X size={18} /></button>
                <button onClick={saveEdit} className="px-4 py-2 rounded-full bg-primary text-white font-medium"><Check size={18} /></button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x divide-surface-variant/30">
              <div className="flex flex-col items-center text-center">
                <div className="bg-secondary-fixed text-on-secondary-fixed rounded-full p-3 mb-4 shadow-sm">
                  <Activity size={24} />
                </div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">日常消耗</p>
                <p className="text-lg font-bold text-on-surface">{profile.bmr + 400} <span className="text-sm font-medium text-on-surface-variant">kcal</span></p>
              </div>
              <div className="flex flex-col items-center text-center md:px-4">
                <div className="bg-tertiary-fixed text-on-tertiary-fixed rounded-full p-3 mb-4 shadow-sm">
                  <Flame size={24} className="fill-current" />
                </div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">基础代谢 (BMR)</p>
                <p className="text-2xl font-bold text-on-surface">{profile.bmr} <span className="text-sm font-medium text-on-surface-variant">kcal</span></p>
              </div>
              <div className="flex flex-col items-center text-center md:pl-4">
                <div className="bg-primary-fixed text-on-primary-fixed rounded-full p-3 mb-4 shadow-sm">
                  <Utensils size={24} />
                </div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">建议摄入量</p>
                <p className="text-2xl font-bold text-primary">{profile.recommendedIntake} <span className="text-sm font-medium text-on-surface-variant">kcal</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium"
      >
        <LogOut size={18} />
        退出登录
      </button>
    </div>
  );
}
