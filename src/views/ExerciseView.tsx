/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion } from "motion/react";
import { PlusCircle, Clock, Activity, Coffee, Smile, History, ChevronRight } from "lucide-react";
import type { ExerciseRecord } from "../types";

interface ExerciseViewProps {
  onAddRecord: (record: Omit<ExerciseRecord, 'id' | 'time'>) => void;
  records: ExerciseRecord[];
}

export default function ExerciseView({ onAddRecord, records }: ExerciseViewProps) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (!input.trim()) return;
    // Mocking logic to extract duration from string like "散步 1小时"
    const durationMatch = input.match(/(\d+)/);
    const duration = durationMatch ? parseInt(durationMatch[0]) : 30;
    const isHour = input.includes('小时');
    const finalDuration = isHour ? duration * 60 : duration;

    onAddRecord({
      name: input.replace(/(\d+).*/, '').trim() || '运动',
      duration: finalDuration,
      caloriesBurned: Math.round(finalDuration * 5), // Simple heuristic
    });
    setInput("");
  };

  const todayTotal = records.filter(r => new Date(r.time).toDateString() === new Date().toDateString())
    .reduce((sum, r) => sum + r.caloriesBurned, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8 pb-32"
    >
      {/* Banner */}
      <section className="bg-primary-container/20 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Smile size={24} className="text-primary fill-primary/20" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-on-surface mb-1">太棒了！</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">运动让心情更愉悦，身体也更轻盈了。记录下此刻的活力吧。</p>
        </div>
      </section>

      {/* Input */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-md border border-surface-container/50 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none" />
        <h3 className="text-xl font-bold text-on-surface mb-6 relative z-10">记录今日活动</h3>
        
        <div className="bg-surface-container-low rounded-xl p-5 flex items-center gap-4 mb-6 focus-within:ring-2 focus-within:ring-primary/40 transition-shadow relative z-10">
          <Activity size={24} className="text-primary/70" />
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-lg text-on-surface placeholder:text-on-surface-variant/60" 
            placeholder="做了什么运动？例如：散步 1小时" 
            type="text"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        
        <button 
          onClick={handleAdd}
          className="w-full bg-primary text-on-primary h-14 rounded-full font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm relative z-10 active:scale-[0.98]"
        >
          <PlusCircle size={20} />
          添加记录
        </button>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-8 soft-shadow border border-surface-container/50 flex flex-col justify-center items-center text-center relative overflow-hidden group">
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-secondary-fixed/20 rounded-full blur-2xl pointer-events-none group-hover:bg-secondary-fixed/40 transition-colors" />
          <span className="text-sm font-bold text-on-surface-variant mb-3 relative z-10">今日预估消耗</span>
          <div className="text-4xl font-bold text-primary mb-2 flex items-baseline gap-1 relative z-10">
            {todayTotal} <span className="text-sm text-on-surface-variant font-medium">kcal</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-container/30 rounded-full text-secondary font-bold text-xs relative z-10">
            <Coffee size={14} />
            相当于少吃了一块蛋糕
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-8 soft-shadow border border-surface-container/50 flex flex-col justify-center items-center text-center group">
          <span className="text-sm font-bold text-on-surface-variant mb-4">本周活动达成</span>
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle className="text-surface-container-high" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeWidth="8" />
              <motion.circle 
                className="text-primary" 
                cx="50" cy="50" fill="transparent" r="42" 
                stroke="currentColor" 
                strokeDasharray="263.89" 
                initial={{ strokeDashoffset: 263.89 }}
                animate={{ strokeDashoffset: 263.89 - (263.89 * 3) / 5 }} // Mock 3/5
                transition={{ duration: 1.5, delay: 0.2 }}
                strokeLinecap="round" strokeWidth="8" 
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-on-surface">3/5</span>
              <span className="text-xs font-bold text-on-surface-variant">天</span>
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 soft-shadow border border-surface-container/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-on-surface">今日运动记录</h3>
          <button className="text-primary font-bold text-sm hover:underline underline-offset-4">查看全部</button>
        </div>
        
        <div className="space-y-2">
          {records.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant italic">还没开始运动吗？活动一下吧！</div>
          ) : (
            records.reverse().map((record) => (
              <div key={record.id} className="group flex justify-between items-center p-4 rounded-xl hover:bg-surface-container-low transition-all border border-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Activity size={28} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-base font-bold text-on-surface">{record.name}</div>
                    <div className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                      <Clock size={12} /> {record.duration >= 60 ? `${Math.floor(record.duration / 60)}小时${record.duration % 60 || ''}` : `${record.duration}分钟`}
                    </div>
                  </div>
                </div>
                <div className="text-xl font-bold text-primary flex items-center gap-1">
                  -{record.caloriesBurned} <span className="text-xs text-on-surface-variant font-medium">kcal</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
}
