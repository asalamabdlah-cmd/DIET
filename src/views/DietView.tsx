/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Mic, Sparkles, Plus, Coffee, Utensils, Moon, Candy, Loader2 } from "lucide-react";
import { estimateFoodCalories } from "../services/geminiService";
import type { DietRecord } from "../types";

interface DietViewProps {
  onAddRecord: (record: Omit<DietRecord, 'id' | 'time'>) => void;
  records: DietRecord[];
}

export default function DietView({ onAddRecord, records }: DietViewProps) {
  const [input, setInput] = useState("");
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationResult, setEstimationResult] = useState<any>(null);

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
        type: 'lunch', // Simplified
      });
      setEstimationResult(null);
      setInput("");
    }
  };

  const totalIntake = records.filter(r => new Date(r.time).toDateString() === new Date().toDateString())
    .reduce((sum, r) => sum + r.calories, 0);

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
        <p className="text-lg text-on-surface-variant">告诉助手你吃的内容，我们帮你轻松估算。</p>
      </div>

      {/* Recording Card */}
      <div className="bg-surface-container-lowest rounded-[32px] p-6 soft-shadow">
        <div className="flex flex-col gap-6">
          <div className="relative">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-40 bg-surface-container rounded-2xl p-5 text-lg text-on-surface border-none focus:ring-2 focus:ring-primary-fixed-dim placeholder:text-outline resize-none transition-shadow" 
              placeholder="今天吃了什么？例如：半碗米饭、红烧肉..."
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                <Camera size={20} />
              </button>
              <button className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                <Mic size={20} />
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
          <p className="text-on-surface-variant font-medium">已摄入 <span className="text-xl font-bold text-primary">{totalIntake}</span> kcal</p>
        </div>
        
        <div className="flex flex-col gap-4">
          {records.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant italic">今天还没有记录哦，快来记一笔吧！</div>
          ) : (
            records.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map((record) => (
              <div key={record.id} className="bg-surface-container-lowest rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-surface-container transition-all hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${getColorClassForType(record.type)}`}>
                  {getIconForType(record.type)}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-on-surface mb-0.5">{record.name}</h4>
                  <p className="text-sm text-on-surface-variant font-medium">
                    {new Date(record.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-on-surface">{record.calories}</span>
                  <span className="text-xs text-outline block font-bold uppercase">kcal</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
