import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HomeView from './views/HomeView';
import DietView from './views/DietView';
import ExerciseView from './views/ExerciseView';
import WeightView from './views/WeightView';
import ProfileView from './views/ProfileView';
import LoginView from './views/LoginView';
import { useAuth } from './contexts/AuthContext';
import { ActivityLevel, type UserProfile, type DietRecord, type ExerciseRecord, type WeightRecord } from './types';
import { Leaf, LogOut } from 'lucide-react';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [activeView, setActiveView] = useState('home');

  const [profile, setProfile] = useState<UserProfile>({
    name: user?.email?.split('@')[0] || '用户',
    age: 30,
    height: 165,
    currentWeight: 65,
    targetWeight: 58,
    currentBodyFat: 28,
    targetBodyFat: 24,
    activityLevel: ActivityLevel.MODERATE,
    bmr: 1400,
    recommendedIntake: 1500,
  });

  // Sync user name when email changes
  useEffect(() => {
    if (user?.email) {
      setProfile(prev => ({
        ...prev,
        name: user.email!.split('@')[0],
      }));
    }
  }, [user?.email]);

  const [dietRecords, setDietRecords] = useState<DietRecord[]>([]);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);

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

  // Auth loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-on-surface-variant">加载中...</p>
        </div>
      </div>
    );
  }

  // Not logged in — show login
  if (!user) {
    return <LoginView />;
  }

  // Logged in — show app
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
        return <ProfileView profile={profile} onSignOut={signOut} />;
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

            <div className="flex items-center gap-3">
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                title="退出登录"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">退出</span>
              </button>

              <button
                onClick={() => setActiveView('profile')}
                className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-white shadow-sm hover:ring-2 ring-primary/20 transition-all active:scale-95"
              >
                <div className="w-full h-full bg-primary-container flex items-center justify-center text-primary font-bold text-sm">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              </button>
            </div>
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
