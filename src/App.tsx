import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HomeView from './views/HomeView';
import DietView from './views/DietView';
import ExerciseView from './views/ExerciseView';
import WeightView from './views/WeightView';
import ProfileView from './views/ProfileView';
import { ActivityLevel, type UserProfile, type DietRecord, type ExerciseRecord, type WeightRecord } from './types.ts';
import { Leaf, User } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('home');
  
  // Initial Mock State
  const [profile, setProfile] = useState<UserProfile>({
    name: "美娟",
    age: 48,
    height: 160,
    currentWeight: 65.5,
    targetWeight: 60.0,
    currentBodyFat: 32,
    targetBodyFat: 28,
    activityLevel: ActivityLevel.MODERATE,
    bmr: 1350,
    recommendedIntake: 1450,
  });

  const [dietRecords, setDietRecords] = useState<DietRecord[]>([
    { id: '1', name: '一碗燕麦片', calories: 200, carbs: 30, protein: 5, fat: 3, type: 'breakfast', time: new Date() },
    { id: '2', name: '半碗米饭 + 炒青菜', calories: 350, carbs: 45, protein: 8, fat: 12, type: 'lunch', time: new Date() },
  ]);

  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([
    { id: '1', name: '散步', duration: 60, caloriesBurned: 150, time: new Date() },
    { id: '2', name: '广场舞', duration: 40, caloriesBurned: 200, time: new Date() },
  ]);

  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([
    { id: '1', date: '2024-05-10', weight: 66.5 },
    { id: '2', date: '2024-05-11', weight: 66.2 },
    { id: '3', date: '2024-05-12', weight: 66.0 },
    { id: '4', date: '2024-05-13', weight: 65.8 },
    { id: '5', date: '2024-05-14', weight: 65.9 },
    { id: '6', date: '2024-05-15', weight: 65.5 },
  ]);

  const addDietRecord = (record: Omit<DietRecord, 'id' | 'time'>) => {
    const newRecord: DietRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
      time: new Date(),
    };
    setDietRecords(prev => [...prev, newRecord]);
  };

  const addExerciseRecord = (record: Omit<ExerciseRecord, 'id' | 'time'>) => {
    const newRecord: ExerciseRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
      time: new Date(),
    };
    setExerciseRecords(prev => [...prev, newRecord]);
  };

  const updateWeight = (weight: number) => {
    const newRecord: WeightRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      weight,
    };
    setWeightRecords(prev => [...prev, newRecord]);
    setProfile(prev => ({ ...prev, currentWeight: weight }));
  };

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView profile={profile} dietRecords={dietRecords} exerciseRecords={exerciseRecords} onNavigate={setActiveView} />;
      case 'diet':
        return <DietView onAddRecord={addDietRecord} records={dietRecords} />;
      case 'exercise':
        return <ExerciseView onAddRecord={addExerciseRecord} records={exerciseRecords} />;
      case 'weight':
        return <WeightView profile={profile} records={weightRecords} onAddRecord={updateWeight} />;
      case 'profile':
        return <ProfileView profile={profile} />;
      default:
        return <HomeView profile={profile} dietRecords={dietRecords} exerciseRecords={exerciseRecords} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <Navigation activeView={activeView} onSetView={setActiveView} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-surface-variant/20">
          <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveView('home')}>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                <Leaf size={18} fill="currentColor" />
              </div>
              <h1 className="text-xl font-bold text-primary tracking-tight">轻盈助手</h1>
            </div>
            
            <button 
              onClick={() => setActiveView('profile')}
              className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-white shadow-sm hover:ring-2 ring-primary/20 transition-all active:scale-95"
            >
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsshs-FGkJqrAcnhqLpr_7fK3ikOr4XNgdffQ5nq_3F3UU71Sf2w2_QUmDPQTgQ5LRH0qhfAPnk8kKO3qmKfBL2nazSkdLsHknsa0FsuNMM6_viPYrmbNvddp7Xt_KeHlEJkBa0y3X-ThikmBiA57QzFTegv_5XS6um8Ko0USnf8MSF9t8DB1FvxJ-5GVAkGwIddqddOV3AcBnlYTyooM4aDsKtLPUmbGfNfMqG1C0uxjeFgMvdp0A5ZXHySqsKYwHbHQFEpnqcm0" 
                alt="Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>
        </header>

        {/* View Grid */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Navigation activeView={activeView} onSetView={setActiveView} />
      </div>
    </div>
  );
}
