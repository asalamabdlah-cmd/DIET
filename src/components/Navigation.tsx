/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, Utensils, Activity, Scale, User } from "lucide-react";

interface NavigationProps {
  activeView: string;
  onSetView: (view: string) => void;
}

export default function Navigation({ activeView, onSetView }: NavigationProps) {
  const navItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'diet', label: '饮食', icon: Utensils },
    { id: 'exercise', label: '运动', icon: Activity },
    { id: 'weight', label: '体重', icon: Scale },
    { id: 'profile', label: '我的', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-white/80 dark:bg-surface-container-lowest/80 backdrop-blur-md nav-shadow rounded-t-2xl md:static md:rounded-none md:bg-transparent md:shadow-none md:flex-col md:justify-start md:gap-4 md:w-20 md:h-full md:pt-10">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onSetView(item.id)}
            id={`nav-${item.id}`}
            className={`flex flex-col items-center justify-center transition-all duration-200 cursor-pointer w-16 md:w-12 h-12 rounded-2xl md:rounded-xl ${
              isActive 
                ? 'text-primary bg-primary-container/30 scale-100' 
                : 'text-on-surface-variant hover:text-primary scale-90'
            }`}
          >
            <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[11px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
