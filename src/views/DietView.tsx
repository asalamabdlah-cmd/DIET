import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Plus, Coffee, Utensils, Moon, Candy, Loader2, ChefHat, Mic, MicOff, Pencil, Trash2, Check, X, Camera } from "lucide-react";
import { estimateFoodCalories, generateMealRecipe } from "../services/geminiService";
import type { DietRecord, UserProfile } from "../types";
import EmptyState from "../components/EmptyState";
import CameraCapture from "../components/CameraCapture";

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
  const [recipePreference, setRecipePreference] = useState("轻食");
  const [recipeIngredients, setRecipeIngredients] = useState("");
  const [recipeMealType, setRecipeMealType] = useState<DietRecord['type']>('lunch');
  const [recipeCalDirty, setRecipeCalDirty] = useState(false);
  const [prevRecipes, setPrevRecipes] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Edit state (strings to avoid number input 0-append bug)
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCal, setEditCal] = useState("");
  const [editCarbs, setEditCarbs] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [editFat, setEditFat] = useState("");
  const [editType, setEditType] = useState<DietRecord['type']>('lunch');
  // Recipe cal target as string
  const [recipeCalStr, setRecipeCalStr] = useState("");

  // Sync recipe calorie target with remaining, unless user manually changed it
  const todayStr = new Date().toDateString();
  const todayRecords = records.filter(r => new Date(r.time).toDateString() === todayStr);
  const todayIntake = todayRecords.reduce((sum, r) => sum + r.calories, 0);
  const remainingCal = Math.max(0, profile.recommendedIntake - todayIntake);

  useEffect(() => {
    if (!recipeCalDirty) {
      setRecipeCalTarget(remainingCal);
      setRecipeCalStr(String(remainingCal));
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

  const handleConfirm = async () => {
    if (!estimationResult || saving) return;
    setSaving(true);
    try {
      await onAddRecord({
        name: estimationResult.name,
        calories: estimationResult.calories,
        carbs: estimationResult.carbs,
        protein: estimationResult.protein,
        fat: estimationResult.fat,
        type: 'lunch',
      });
      setEstimationResult(null);
      setInput("");
    } catch (err: any) {
      console.error('[Diet] 保存失败:', err);
      const msg = err?.message || err?.toString() || String(err) || '未知错误';
      alert(`保存失败：${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Recipe Generation ──
  const handleGenerateRecipe = async () => {
    setRecipeLoading(true);
    setRecipe("");
    const calTarget = (Number(recipeCalStr) || 0) > 0 ? Number(recipeCalStr) : remainingCal;
    try {
      const text = await generateMealRecipe(
        { recommendedIntake: profile.recommendedIntake, currentWeight: profile.currentWeight, targetWeight: profile.targetWeight, gender: profile.gender },
        calTarget,
        recipePreference,
        recipeIngredients,
        recipeMealType,
        prevRecipes
      );
      setRecipe(text);
      setPrevRecipes(p => [...p, text].slice(-10)); // remember last 10
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
    <div className="space-y-8 pb-32">
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
              {/* Voice + Camera buttons */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() => setShowCamera(true)}
                  className="w-10 h-10 rounded-full shadow-sm flex items-center justify-center transition-all bg-surface-container-lowest text-on-surface-variant hover:text-primary"
                  title="拍照识别食物"
                >
                  <Camera size={20} />
                </button>
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
            {/* Header */}
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

            {/* Meal type selector */}
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-2 block">选择餐类</label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  ['breakfast', '早餐', '🌅'],
                  ['lunch', '午餐', '☀️'],
                  ['dinner', '晚餐', '🌙'],
                  ['snack', '加餐', '🍎'],
                ] as const).map(([id, label, emoji]) => (
                  <button
                    key={id}
                    onClick={() => setRecipeMealType(id)}
                    className={`py-3 rounded-2xl text-sm font-bold flex flex-col items-center gap-1 transition-all ${
                      recipeMealType === id
                        ? 'bg-primary text-white shadow-md scale-105'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calorie target + preference */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">目标热量 (kcal)</label>
                <input
                  type="text" inputMode="numeric"
                  value={recipeCalStr}
                  onChange={e => { setRecipeCalStr(e.target.value); setRecipeCalDirty(true); }}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2.5 text-on-surface text-sm font-bold outline-none border-2 border-transparent focus:border-primary"
                  placeholder={String(remainingCal || '')}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">口味偏好</label>
                <input
                  type="text"
                  value={recipePreference}
                  onChange={e => setRecipePreference(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl px-3 py-2.5 text-on-surface text-sm font-bold outline-none border-2 border-transparent focus:border-primary"
                  placeholder="轻食、川菜、海鲜..."
                />
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">
                🧺 手头食材
                <span className="font-normal text-on-surface-variant/60 ml-1">输入现有食材，AI 优先利用</span>
              </label>
              <input
                type="text"
                value={recipeIngredients}
                onChange={e => setRecipeIngredients(e.target.value)}
                className="w-full bg-surface-container-low rounded-xl px-3 py-2.5 text-on-surface text-sm font-bold outline-none border-2 border-transparent focus:border-primary"
                placeholder="鸡蛋、西红柿、鸡胸肉、西兰花..."
              />
            </div>

            {/* Generate + Refresh */}
            <div className="flex gap-2">
              <button
                onClick={handleGenerateRecipe}
                disabled={recipeLoading}
                className="flex-1 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center gap-2 font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
              >
                {recipeLoading ? <Loader2 size={20} className="animate-spin" /> : <ChefHat size={20} />}
                {recipeLoading ? '生成中...' : 'AI 生成食谱'}
              </button>
              <button
                onClick={handleGenerateRecipe}
                disabled={recipeLoading || prevRecipes.length === 0}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  prevRecipes.length > 0
                    ? 'bg-primary-fixed/30 text-primary hover:bg-primary-fixed/50'
                    : 'bg-surface-container-highest text-on-surface-variant/30'
                }`}
                title="换一批全新食谱"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
              </button>
            </div>
            {prevRecipes.length > 1 && (
              <p className="text-xs text-on-surface-variant/60 text-center -mt-2">已生成 {prevRecipes.length} 批，每次不同风格</p>
            )}

            {/* Recipe result */}
            {recipe && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-primary-fixed/20 to-secondary-fixed/20 border border-primary-fixed-dim rounded-2xl p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <ChefHat size={60} className="text-primary" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-primary mb-3">
                    <span className="text-lg">{{breakfast:'🌅',lunch:'☀️',dinner:'🌙',snack:'🍎'}[recipeMealType]}</span>
                    <span className="text-sm font-bold capitalize">
                      {{breakfast:'早餐',lunch:'午餐',dinner:'晚餐',snack:'加餐'}[recipeMealType]}食谱
                    </span>
                    <Sparkles size={14} className="fill-current ml-1" />
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">{recipe}</p>
                </div>
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
                disabled={saving}
                className="w-full py-4 mt-2 bg-surface-container-lowest text-primary rounded-2xl font-bold border border-primary-fixed-dim hover:bg-primary-fixed/30 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? '保存中...' : '确认添加至今日饮食'}
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
          {todayRecords.length === 0 ? (
            <EmptyState icon={Utensils} title="今天还没有记录" description="记录你的饮食，AI 帮你轻松估算热量和营养" />
          ) : (
            todayRecords.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map((record) => (
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
                      <div><label className="text-[10px] text-on-surface-variant">热量</label><input type="text" inputMode="numeric" value={editCal} onChange={e => setEditCal(e.target.value)} className="w-full bg-white rounded-lg px-2 py-1.5 text-xs font-bold outline-none border border-surface-variant" /></div>
                      <div><label className="text-[10px] text-on-surface-variant">碳水g</label><input type="text" inputMode="numeric" value={editCarbs} onChange={e => setEditCarbs(e.target.value)} className="w-full bg-white rounded-lg px-2 py-1.5 text-xs font-bold outline-none border border-surface-variant" /></div>
                      <div><label className="text-[10px] text-on-surface-variant">蛋白g</label><input type="text" inputMode="numeric" value={editProtein} onChange={e => setEditProtein(e.target.value)} className="w-full bg-white rounded-lg px-2 py-1.5 text-xs font-bold outline-none border border-surface-variant" /></div>
                      <div><label className="text-[10px] text-on-surface-variant">脂肪g</label><input type="text" inputMode="numeric" value={editFat} onChange={e => setEditFat(e.target.value)} className="w-full bg-white rounded-lg px-2 py-1.5 text-xs font-bold outline-none border border-surface-variant" /></div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditId(null)} className="p-2 rounded-full bg-surface-container-highest text-on-surface-variant"><X size={16} /></button>
                      <button onClick={() => {
                        onUpdateRecord(record.id, { name: editName, calories: Number(editCal)||0, carbs: Number(editCarbs)||0, protein: Number(editProtein)||0, fat: Number(editFat)||0, type: editType });
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
                      <div className="flex gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {
                          setEditId(record.id);
                          setEditName(record.name);
                          setEditCal(String(record.calories));
                          setEditCarbs(String(record.carbs));
                          setEditProtein(String(record.protein));
                          setEditFat(String(record.fat));
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
      {/* ── Camera Food Recognition ── */}
      {showCamera && (
        <CameraCapture
          onClose={() => setShowCamera(false)}
          onResult={(food) => {
            setEstimationResult(food);
            setShowCamera(false);
          }}
        />
      )}
    </div>
  );
}
