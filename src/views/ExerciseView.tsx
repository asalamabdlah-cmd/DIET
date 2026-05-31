import { useState } from "react";
import { motion } from "motion/react";
import { Clock, Activity, Sparkles, Loader2, AlertCircle, Zap, Pencil, Trash2, Check, X } from "lucide-react";
import type { ExerciseRecord, UserProfile } from "../types";
import { estimateExerciseCalories } from "../services/geminiService";

interface ExerciseViewProps {
  profile: UserProfile;
  onAddRecord: (record: Omit<ExerciseRecord, 'id' | 'time'>) => void;
  onUpdateRecord: (id: string, patch: Partial<Omit<ExerciseRecord, 'id' | 'time'>>) => void;
  onDeleteRecord: (id: string) => void;
  records: ExerciseRecord[];
}

type EstResult = {
  name: string; duration: number; caloriesBurned: number;
  summary: string; isExercise: boolean; reason?: string;
};

export default function ExerciseView({ profile, onAddRecord, onUpdateRecord, onDeleteRecord, records }: ExerciseViewProps) {
  const [input, setInput] = useState("");
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimation, setEstimation] = useState<EstResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editCal, setEditCal] = useState("");

  const handleEstimate = async () => {
    if (!input.trim()) return;
    setIsEstimating(true);
    setEstimation(null);
    setErrorMsg("");
    try {
      const result = await estimateExerciseCalories(input, {
        currentWeight: profile.currentWeight,
        age: profile.age,
        gender: profile.gender,
      });
      setEstimation(result);
    } catch (err: any) {
      console.error('[Exercise] 估算失败:', err);
      const msg = err?.message || String(err);
      if (msg.includes('未配置') || msg.includes('401')) {
        setErrorMsg('DeepSeek API Key 未配置或无效，请在 .env 中设置 VITE_DEEPSEEK_API_KEY。获取：platform.deepseek.com/api_keys');
      } else {
        setErrorMsg(`AI 调用失败：${msg}`);
      }
    } finally {
      setIsEstimating(false);
    }
  };

  const handleConfirm = async () => {
    if (!estimation || !estimation.isExercise || saving) return;
    setSaving(true);
    try {
      await onAddRecord({
        name: estimation.summary || estimation.name,
        duration: estimation.duration,
        caloriesBurned: estimation.caloriesBurned,
      });
      setEstimation(null);
      setInput("");
    } catch (err) {
      console.error('[Exercise] 保存失败:', err);
      alert('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const todayRecords = records.filter(r => {
    const d = new Date(r.time);
    return d.toDateString() === new Date().toDateString();
  });
  const todayTotal = todayRecords.reduce((sum, r) => sum + r.caloriesBurned, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8 pb-32"
    >
      {/* Input */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-md border border-surface-container/50 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none" />
        <h3 className="text-xl font-bold text-on-surface mb-2 relative z-10">记录运动</h3>
        <p className="text-sm text-on-surface-variant mb-4 relative z-10">
          描述运动类型和时长，DeepSeek 智能推算消耗热量
        </p>

        <div className="relative z-10">
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); setEstimation(null); }}
            className="w-full h-28 bg-surface-container-low rounded-2xl p-5 text-lg text-on-surface placeholder:text-on-surface-variant/50 outline-none border-2 border-transparent focus:border-primary resize-none transition-all"
            placeholder="例如：跑步一小时&#10;或：卧推 80kg 30个"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleEstimate();
              }
            }}
          />
        </div>

        <button
          onClick={handleEstimate}
          disabled={isEstimating || !input.trim()}
          className="w-full bg-primary text-on-primary h-14 rounded-full font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm relative z-10 active:scale-[0.98] mt-4 disabled:opacity-50"
        >
          {isEstimating ? (
            <><Loader2 size={20} className="animate-spin" /> DeepSeek 分析中...</>
          ) : (
            <><Zap size={20} className="fill-current" /> 智能推算</>
          )}
        </button>

        {/* Error */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 relative z-10"
          >
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-red-600 shrink-0">&times;</button>
          </motion.div>
        )}
      </section>

      {/* Estimation Result */}
      {estimation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-[32px] p-6 shadow-sm border ${
            estimation.isExercise
              ? 'bg-primary-fixed/20 border-primary-fixed-dim'
              : 'bg-orange-50 border-orange-200'
          }`}
        >
          {estimation.isExercise ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles size={20} className="fill-current" />
                <span className="text-sm font-bold">DeepSeek 推算结果</span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-2xl font-bold text-on-surface">{estimation.summary}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-primary">{estimation.caloriesBurned}</p>
                  <p className="text-xs text-on-surface-variant font-medium">kcal</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <Clock size={16} />
                <span>{estimation.duration >= 60
                  ? `${Math.floor(estimation.duration / 60)}小时${estimation.duration % 60 ? estimation.duration % 60 + '分钟' : ''}`
                  : `${estimation.duration}分钟`}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setEstimation(null); setInput(""); }}
                  className="flex-1 py-3 rounded-full bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors"
                >
                  重新输入
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="flex-1 py-3 rounded-full bg-primary text-white font-bold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
                >
                  {saving ? '保存中...' : '确认记录'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertCircle size={24} className="text-orange-500" />
              </div>
              <p className="text-lg font-bold text-on-surface">无法识别为运动</p>
              <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
                {estimation.reason || '请描述具体的运动类型，例如"跑步一小时"或"卧推 80kg 30个"。'}
              </p>
              <button
                onClick={() => { setEstimation(null); }}
                className="mt-2 px-6 py-2 rounded-full bg-white border border-orange-200 text-on-surface font-medium hover:bg-orange-50 transition-colors"
              >
                重新输入
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-6 soft-shadow flex flex-col items-center text-center">
          <p className="text-sm font-bold text-on-surface-variant mb-2">今日消耗</p>
          <p className="text-3xl font-bold text-primary">{todayTotal} <span className="text-sm font-medium text-on-surface-variant">kcal</span></p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 soft-shadow flex flex-col items-center text-center">
          <p className="text-sm font-bold text-on-surface-variant mb-2">运动次数</p>
          <p className="text-3xl font-bold text-on-surface">{todayRecords.length} <span className="text-sm font-medium text-on-surface-variant">次</span></p>
        </div>
      </section>

      {/* History */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 soft-shadow border border-surface-container/50">
        <h3 className="text-xl font-bold text-on-surface mb-6">运动记录</h3>
        <div className="space-y-2">
          {todayRecords.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">还没记录运动，快去活动一下吧</div>
          ) : (
            todayRecords.map((record) => (
              <div key={record.id}>
                {editId === record.id ? (
                  /* ── Edit Mode ── */
                  <div className="p-4 rounded-xl bg-primary-fixed/10 border border-primary/20 space-y-3">
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="w-full bg-white rounded-xl px-3 py-2 text-sm font-bold outline-none border border-surface-variant" />
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-on-surface-variant block mb-0.5">时长(分钟)</label>
                        <input type="text" inputMode="numeric" value={editDuration} onChange={e => setEditDuration(e.target.value)}
                          className="w-full bg-white rounded-xl px-3 py-2 text-sm font-bold outline-none border border-surface-variant" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-on-surface-variant block mb-0.5">消耗(kcal)</label>
                        <input type="text" inputMode="numeric" value={editCal} onChange={e => setEditCal(e.target.value)}
                          className="w-full bg-white rounded-xl px-3 py-2 text-sm font-bold outline-none border border-surface-variant" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditId(null)} className="p-2 rounded-full bg-surface-container-highest text-on-surface-variant"><X size={16} /></button>
                      <button onClick={() => {
                        onUpdateRecord(record.id, { name: editName, duration: Number(editDuration)||0, caloriesBurned: Number(editCal)||0 });
                        setEditId(null);
                      }} className="p-2 rounded-full bg-primary text-white"><Check size={16} /></button>
                    </div>
                  </div>
                ) : (
                  /* ── Read Mode ── */
                  <div className="group flex justify-between items-center p-4 rounded-xl hover:bg-surface-container-low transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
                        <Activity size={24} />
                      </div>
                      <div>
                        <div className="text-base font-bold text-on-surface">{record.name}</div>
                        <div className="text-xs text-on-surface-variant flex items-center gap-1">
                          <Clock size={12} />
                          {record.duration >= 60
                            ? `${Math.floor(record.duration / 60)}小时${record.duration % 60 ? record.duration % 60 + '分钟' : ''}`
                            : `${record.duration}分钟`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">-{record.caloriesBurned}</div>
                        <div className="text-xs text-on-surface-variant font-medium">kcal</div>
                      </div>
                      <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {
                          setEditId(record.id);
                          setEditName(record.name);
                          setEditDuration(String(record.duration));
                          setEditCal(String(record.caloriesBurned));
                        }} className="p-1.5 rounded-full hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => { if (confirm('确定删除这条运动记录？')) onDeleteRecord(record.id); }}
                          className="p-1.5 rounded-full hover:bg-red-50 text-on-surface-variant hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
}
