/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { User, Edit3, Ruler, Scale, Activity, Heart, Flame, Utensils } from "lucide-react";
import type { UserProfile } from "../types";

interface ProfileViewProps {
  profile: UserProfile;
}

export default function ProfileView({ profile }: ProfileViewProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 pb-32"
    >
      {/* Header Profile Section */}
      <section className="flex flex-col items-center mb-12">
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-white soft-shadow mb-6 overflow-hidden border-4 border-surface ring-4 ring-primary/5">
          <img 
            alt={profile.name}
            className="w-full h-full object-cover" 
            src={`https://lh3.googleusercontent.com/aida-public/AB6AXuA85KAHogN4OzOs09W8Yg-SiUN7EBPCfRnoQhmXCFJsexc__FQ655ddrJe0aWwrvxpNf05b6W021bgTsz_pfB03mwoByK_YeUMBZPV2tGvSJLrm__-dafIlZcRN37qetQ_cFqblFqOdapARYjzf3jJTWVlE8zxmNEmqeJZp0sJM72ns5GfXl_H2giaifzDanvZg6cDui_fIO8n-ZKuacEeJ4c3THtEm-llcUOI-pwqgMycre-YylnElWH8ESByoREbkNYAc6hW_qwU`}
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="text-3xl font-bold text-on-surface mb-2">{profile.name}</h1>
        <p className="text-on-surface-variant font-medium">开启轻盈每一天</p>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-surface-container-lowest rounded-3xl soft-shadow p-8 flex flex-col relative group transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <User size={20} className="text-primary" />
              基本信息
            </h2>
            <button className="text-primary hover:text-primary-container transition-colors">
              <Edit3 size={20} />
            </button>
          </div>
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
        </div>

        {/* Weight Goals */}
        <div className="bg-surface-container-lowest rounded-3xl soft-shadow p-8 flex flex-col relative group transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <Scale size={20} className="text-primary" />
              体重目标
            </h2>
            <button className="text-primary hover:text-primary-container transition-colors">
              <Edit3 size={20} />
            </button>
          </div>
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
              <p className="text-2xl font-bold text-on-surface">{profile.currentBodyFat || 32} <span className="text-sm font-medium text-on-surface-variant">%</span></p>
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">目标体脂率</p>
              <p className="text-2xl font-bold text-primary">{profile.targetBodyFat || 28} <span className="text-sm font-medium opacity-70">%</span></p>
            </div>
          </div>
          <div className="mt-8 bg-surface-container-low rounded-full h-2.5 overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '25%' }}
              transition={{ duration: 1 }}
              className="bg-primary h-full rounded-full opacity-70 shadow-sm" 
            />
          </div>
        </div>

        {/* Health Metrics */}
        <div className="bg-surface-container-lowest rounded-3xl soft-shadow p-8 md:col-span-2 flex flex-col relative group transition-all hover:translate-y-[-2px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <Heart size={20} className="text-primary fill-primary/10" />
              健康指标
            </h2>
            <button className="text-primary hover:text-primary-container transition-colors">
              <Edit3 size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x divide-surface-variant/30">
            <div className="flex flex-col items-center text-center">
              <div className="bg-secondary-fixed text-on-secondary-fixed rounded-full p-3 mb-4 shadow-sm">
                <Activity size={24} />
              </div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">活动水平</p>
              <p className="text-lg font-bold text-on-surface">{profile.activityLevel}</p>
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
        </div>
      </div>
    </motion.div>
  );
}
