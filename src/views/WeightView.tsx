/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Award, Info, Scale, TrendingDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { WeightRecord, UserProfile } from "../types";

interface WeightViewProps {
  profile: UserProfile;
  records: WeightRecord[];
  onAddRecord: (weight: number) => void;
}

export default function WeightView({ profile, records, onAddRecord }: WeightViewProps) {
  const [newWeight, setNewWeight] = useState("");
  const [timeRange, setTimeRange] = useState<'7' | '30'>('7');

  const handleAdd = () => {
    const val = parseFloat(newWeight);
    if (!isNaN(val) && val > 0) {
      onAddRecord(val);
      setNewWeight("");
    }
  };

  // Mock chart data if no records
  const chartData = records.length > 0 ? records.map(r => ({
    date: r.date,
    weight: r.weight,
  })) : [
    { date: '一', weight: 66.5 },
    { date: '二', weight: 66.2 },
    { date: '三', weight: 66.0 },
    { date: '四', weight: 65.8 },
    { date: '五', weight: 65.9 },
    { date: '六', weight: 65.7 },
    { date: '日', weight: 65.5 },
  ];

  const diff = records.length > 1 
    ? (records[records.length - 1].weight - records[records.length - 2].weight).toFixed(1)
    : "-0.5"; // mock diff

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8 pb-32"
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Current Weight */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 soft-shadow flex-1 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Scale size={120} className="text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-on-surface-variant mb-3">当前体重</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-on-surface">{profile.currentWeight}</span>
              <span className="text-base font-medium text-on-surface-variant">kg</span>
            </div>
            <p className="text-sm font-bold text-tertiary-container mt-3 flex items-center gap-1">
              <TrendingDown size={14} />
              比上周减轻了 {Math.abs(Number(diff))} kg，继续保持哦！
            </p>
          </div>
          <div className="mt-8 flex gap-3">
            <input 
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="flex-1 bg-surface-container-low rounded-full px-5 text-on-surface border-none focus:ring-2 focus:ring-primary/40"
              placeholder="今日体重"
              type="number"
            />
            <button 
              onClick={handleAdd}
              className="bg-primary text-on-primary font-bold rounded-full h-12 px-6 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm active:scale-95"
            >
              <Plus size={18} />
              更新
            </button>
          </div>
        </div>

        {/* Goal Card */}
        <div className="bg-primary-container rounded-3xl p-8 flex-1 flex flex-col justify-between text-on-primary-container relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-md">
          <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:opacity-20 transition-opacity">
            <Award size={160} />
          </div>
          <div>
            <h2 className="text-sm font-bold mb-3 opacity-80">目标体重</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">{profile.targetWeight}</span>
              <span className="text-base font-medium opacity-80">kg</span>
            </div>
          </div>
          <div className="mt-8 bg-surface-container-lowest/20 rounded-2xl p-5 backdrop-blur-sm border border-surface-container-lowest/30">
            <p className="text-sm font-medium">还差 <strong className="text-lg">{(profile.currentWeight - profile.targetWeight).toFixed(1)} kg</strong> 就能达成目标了！加油！</p>
            <div className="w-full bg-surface-container-lowest/30 h-2.5 rounded-full mt-4 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, (1 - (profile.currentWeight - profile.targetWeight) / 10) * 100))}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-surface-container-lowest h-full rounded-full" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <section className="bg-surface-container-lowest rounded-[32px] p-8 soft-shadow">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-xl font-bold text-on-surface">体重变化趋势</h2>
          <div className="flex gap-2 bg-surface-container-low rounded-full p-1 border border-surface-container">
            <button 
              onClick={() => setTimeRange('7')}
              className={`px-5 py-1.5 rounded-full font-bold text-sm transition-all ${timeRange === '7' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'}`}
            >
              7天
            </button>
            <button 
              onClick={() => setTimeRange('30')}
              className={`px-5 py-1.5 rounded-full font-bold text-sm transition-all ${timeRange === '30' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'}`}
            >
              30天
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#43664d" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#43664d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#efeeeb" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#727972', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                hide 
                domain={['dataMin - 1', 'dataMax + 1']} 
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 8px 30px rgba(132,169,140,0.1)',
                  fontWeight: 'bold'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#43664d" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorWeight)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 flex justify-center items-center gap-2 py-2 px-4 bg-surface-container-low rounded-xl w-fit mx-auto">
          <Info size={14} className="text-tertiary-container" />
          <p className="text-xs font-medium text-on-surface-variant italic">轻微的波动是正常的，关注长期趋势即可。</p>
        </div>
      </section>
    </motion.div>
  );
}
