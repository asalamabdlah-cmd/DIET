import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Plus, Coffee, Utensils, Moon, Candy, Loader2, ChefHat, Mic, MicOff, Pencil, Trash2, Check, X } from "lucide-react";
import { estimateFoodCalories, generateMealRecipe } from "../services/geminiService";
import type { DietRecord, UserProfile } from "../types";

interface DietViewProps {
  profile: UserProfile;
  onAddRecord: (record: Omit<DietRecord, 'id' | 'time'>) => void;
  onUpdateRecord: (id: string, patch: Partial<Omit<DietRecord, 'id' | 'time'>>) => void;
  onDeleteRecord: (id: string) => void;
  records: DietRecord[];
}

export default function DietView({ profile, onAddRecord, onUpdateRecord, onDeleteRecord, records }: DietViewProps) {
  const [input, setInput] = useState("");
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationResult, setEstimationResult] = useState<any>(null);
  const [mode, setMode] = useState<'estimate' | 'recipe'>('estimate');
  const [recipe, setRecipe] = useState("");
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeCalTarget, setRecipeCalTarget] = useState(0);
  const [recipePreference, setRecipePreference] = useState("");
  const [recipeCalDirty, setRecipeCalDirty] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCal, setEditCal] = useState(0);
  const [editCarbs, setEditCarbs] = useState(0);
  const [editProtein, setEditProtein] = useState(0);
  const [editFat, setEditFat] = useState(0);
  const [editType, setEditType] = useState<DietRecord['type']>('lunch');

  // Sync recipe calorie target with remaining, unless user manually changed it
  const todayIntake = records.filter(r => new Date(r.time).toDateString() === new Date().toDateString())
    .reduce((sum, r) => sum + r.calories, 0);
  const remainingCal = Math.max(0, profile.recommendedIntake - todayIntake);

  useEffect(() => {
    if (!recipeCalDirty) {
      setRecipeCalTarget(remainingCal);
    }
  }, [remainingCal, recipeCalDirty]);

  // ── Voice Input ──
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("当前浏览器不支持语音输入，请使用 Chrome 或 Edge");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'zh-CN';
    rec.interimResults = false;
    rec.continuous = false;
    recognitionRef.current = rec;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => { console.error('[语音]', e); setListening(false); };
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput(prev => prev ? prev + '，' + text : text);
    };

    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // ── Food Estimation ──
  const handleEstimate = async () => {
    if (!input.trim()) return;
    setIsEstimating(true);
    setEstimationResult(null);
    try {
      const result = await estimateFoodCalories(input);
      setEstimationResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleConfirm = () => {
    if (estimationResult) {
      onAddRecord({
        name: estimationResult.name,
        calories: estimationResult.calories,
        carbs: estimationResult.carbs,
        protein: estimationResult.protein,
        fat: estimationResult.fat,
        type: 'lunch',
      });
      setEstimationResult(null);
      setInput("");
    }
  };

  // ── Recipe Generation ──
  const handleGenerateRecipe = async () => {
    setRecipeLoading(true);
    setRecipe("");
    const calTarget = recipeCalTarget > 0 ? recipeCalTarget : remainingCal;
    try {
      const text = await generateMealRecipe(
        { recommendedIntake: profile.recommendedIntake, currentWeight: profile.currentWeight, targetWeight: profile.targetWeight, gender: profile.gender },
        calTarget,
        recipePreference
      );
      setRecipe(text);
    } catch (err) {
      setRecipe("AI 生成失败，请稍后重试。建议：鸡胸肉沙拉 + 蒸红薯 + 紫菜蛋花汤（约400kcal）");
    } finally {
      setRecipeLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'breakfast': return <Coffee size={24} />;
      case 'lunch': return <Utensils size={24} />;
      case 'dinner': return <Moon size={24} />;
      default: return <Candy size={24} />;
    }
  };

  const getColorClassForType = (type: string) => {
    switch (type) {
      case 'breakfast': return 'bg-secondary-fixed/40 text-on-secondary-fixed';
      case 'lunch': return 'bg-primary-fixed/50 text-on-primary-fixed';
      case 'dinner': return 'bg-tertiary-fixed/40 text-on-tertiary-fixed';
      default: return 'bg-surface-container-highest text-on-surface-variant';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8 pb-32"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-on-surface">记录今日饮食</h2>
        <p className="text-lg text-on-surface-variant">告诉助手你吃的内容，AI 帮你轻松估算。</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('estimate')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === 'estimate' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'}`}
        >
          <Sparkles size={14} className="inline mr-1" />估算食物
        </button>
        <button
          onClick={() => setMode('recipe')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === 'recipe' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'}`}
        >
          <ChefHat size={14} className="inline mr-1" />AI 食谱
        </button>
      </div>

      {mode === 'estimate' ? (
        /* ── Food Estimation Card ── */
        <div className="bg-surface-container-lowest rounded-[32px] p-6 soft-shadow">
          <div className="flex flex-col gap-6">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-40 bg-surface-container rounded-2xl p-5 pr-14 text-lg text-on-surface border-none focus:ring-2 focus:ring-primary-fixed-dim placeholder:text-outline resize-none transition-shadow"
                placeholder="今天吃了什么？例如：半碗米饭、红烧肉..."
              />
              {/* Voice button */}
              <div className="absolute bottom-4 right-4">
                <button
                  onClick={listening ? stopListening : startListening}
                  className={`w-10 h-10 rounded-full shadow-sm flex items-center justify-center transition-all ${
                    listening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:text-primary'
                  }`}
                  title={listening ? '停止录音' : '语音输入'}
                >
                  {listening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleEstimate}
              disabled={isEstimating || !input.trim()}
              className="w-full h-14 bg-primary text-on-primary rounded-full flex items-center justify-center gap-2 font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
            >
              {isEstimating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="fill-current" />}
              AI 智能估算
            </button>
          </div>
        </div>
      ) : (
        /* ── Recipe Card ── */
        <div className="bg-surface-container-lowest rounded-[32px] p-6 soft-shadow">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-on-surface-variant">今日还可摄入</p>
                <p className="text-2xl font-bold text-primary">{remainingCal} <span className="text-sm font-medium text-on-surface-variant">kcal</span></p>
              </div>
              <div className="text-right text-xs text-on-surface-variant">
                <p>推荐摄入 {profile.recommendedIntake} kcal</p>
                <p>已摄入 {todayIntake} kcal</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">目标热量 (kcal)</label>
                <input
                  type="number"
                  value={recipeCalTarget}
                  onChange={e => { setRecipeCalTarget(Number(e.target.value) || 0); setRecipeCalDirty(true); }}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2.5 text-on-surface text-sm font-bold outline-none border-2 border-transparent focus:border-primary"
                  placeholder={String(remainingCal)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">想吃啥 (选填)</label>
                <input
                  type="text"
                  value={recipePreference}
                  onChange={e => setRecipePreference(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2.5 text-on-surface text-sm font-bold outline-none border-2 border-transparent focus:border-primary"
                  placeholder="如：川菜、海鲜、素食"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateRecipe}
              disabled={recipeLoading}
              className="w-full h-14 bg-primary text-on-primary rounded-full flex items-center justify-center gap-2 font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
            >
              {recipeLoading ? <Loader2 size={20} className="animate-spin" /> : <ChefHat size={20} />}
              {recipeLoading ? '正在生成食谱...' : 'AI 生成食谱'}
            </button>

            {recipe && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary-fixed/20 border border-primary-fixed-dim rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 text-primary mb-3">
                  <Sparkles size={18} className="fill-current" />
                  <span className="text-sm font-bold">AI 推荐食谱</span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">{recipe}</p>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Estimation Result */}
      <AnimatePresence>
        {estimationResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-primary-fixed/20 border border-primary-fixed-dim rounded-[32px] p-6 shadow-sm overflow-hidden relative"
          >
            <div className="relative z-10 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles size={24} className="fill-current" />
                  <h3 className="text-xl font-bold">智能分析: {estimationResult.name}</h3>
                </div>
                <span className="bg-surface-container-lowest text-primary px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  {estimationResult.weight}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: '热量', value: estimationResult.calories, unit: 'kcal', color: 'bg-surface-container-lowest/80' },
                  { label: '碳水', value: `${estimationResult.carbs}g`, color: 'bg-secondary-fixed/50' },
                  { label: '蛋白质', value: `${estimationResult.protein}g`, color: 'bg-tertiary-fixed/50' },
                  { label: '脂肪', value: `${estimationResult.fat}g`, color: 'bg-red-100/40' },
                ].map((stat, i) => (
                  <div key={i} className={`${stat.color} backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm`}>
                    <span className="text-sm text-on-surface-variant mb-1">{stat.label}</span>
                    <span className="text-xl font-bold text-on-surface">{stat.value}</span>
                    {stat.unit && <span className="text-[10px] text-outline uppercase font-bold">{stat.unit}</span>}
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-4 mt-2 bg-surface-container-lowest text-primary rounded-2xl font-bold border border-primary-fixed-dim hover:bg-primary-fixed/30 transition-colors shadow-sm"
              >
                确认添加至今日饮食
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Summary */}
      <div className="space-y-6 pt-4">
        <div className="flex items-end justify-between px-2">
          <h3 className="text-2xl font-bold text-on-surface">今日饮食</h3>
          <p className="text-on-surface-variant font-medium">已摄入 <span className="text-xl font-bold text-primary">{todayIntake}</span> kcal</p>
        </div>

        <div className="flex flex-col gap-4">
          {records.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant italic">今天还没有记录哦，快来记一笔吧！</div>
          ) : (
            records.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map((record) => (
              <div key={record.id}>
                {editId === record.id ? (
                  /* ── Edit Mode ── */
                  <div className="bg-primary-fixed/10 border border-primary/20 rounded-2xl p-4 space-y-3">
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="w-full bg-white rounded-xl px-3 py-2 text-sm font-bold outline-none border border-surface-variant" />
                    <div className="grid grid-cols-4 gap-2">
                      {(['breakfast','lunch','dinner','snack'] as DietRecord['type'][]).map(t => (
                        <button key={t} onClick={() => setEditType(t)}
                          className={`py-1.5 rounded-full text-xs font-bold transition-colors ${editType === t ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'}`}>
                          {{breakfast:'早餐',lunch:'午餐',dinner:'晚餐',snack:'加餐'}[t]}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div><label className="text-[10px] text-on-surface-variant">热量</label><input type="number" value={editCal} onChange={e => setEditCal(Number(e.target.value)||0)} className="w-full bg-white rounded-lg px-2 py-1.5 text-xs font-bold outline-none border border-surface-variant" /></div>
                      <div><label className="text-[10px] text-on-surface-variant">碳水g</label><input type="number" value={editCarbs} onChange={e => setEditCarbs(Number(e.target.value)||0)} className="w-full bg-white rounded-lg px-2 py-1.5 text-xs font-bold outline-none border border-surface-variant" /></div>
                      <div><label className="text-[10px] text-on-surface-variant">蛋白g</label><input type="number" value={editProtein} onChange={e => setEditProtein(Number(e.target.value)||0)} className="w-full bg-white rounded-lg px-2 py-1.5 text-xs font-bold outline-none border border-surface-variant" /></div>
                      <div><label className="text-[10px] text-on-surface-variant">脂肪g</label><input type="number" value={editFat} onChange={e => setEditFat(Number(e.target.value)||0)} className="w-full bg-white rounded-lg px-2 py-1.5 text-xs font-bold outline-none border border-surface-variant" /></div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditId(null)} className="p-2 rounded-full bg-surface-container-highest text-on-surface-variant"><X size={16} /></button>
                      <button onClick={() => {
                        onUpdateRecord(record.id, { name: editName, calories: editCal, carbs: editCarbs, protein: editProtein, fat: editFat, type: editType });
                        setEditId(null);
                      }} className="p-2 rounded-full bg-primary text-white"><Check size={16} /></button>
                    </div>
                  </div>
                ) : (
                  /* ── Read Mode ── */
                  <div className="group bg-surface-container-lowest rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-surface-container transition-all hover:-translate-y-1">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${getColorClassForType(record.type)}`}>
                      {getIconForType(record.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-on-surface mb-0.5">{record.name}</h4>
                      <p className="text-sm text-on-surface-variant font-medium">
                        {new Date(record.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xl font-bold text-on-surface">{record.calories}</span>
                        <span className="text-xs text-outline block font-bold uppercase">kcal</span>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {
                          setEditId(record.id);
                          setEditName(record.name);
                          setEditCal(record.calories);
                          setEditCarbs(record.carbs);
                          setEditProtein(record.protein);
                          setEditFat(record.fat);
                          setEditType(record.type);
                        }} className="p-1.5 rounded-full hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => { if (confirm('确定删除这条饮食记录？')) onDeleteRecord(record.id); }}
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
      </div>
    </motion.div>
  );
}
