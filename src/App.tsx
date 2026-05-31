import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HomeView from './views/HomeView';
import DietView from './views/DietView';
import ExerciseView from './views/ExerciseView';
import WeightView from './views/WeightView';
import ProfileView from './views/ProfileView';
import LoginView from './views/LoginView';
import { ErrorFallback } from './components/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';
import type { UserProfile, DietRecord, ExerciseRecord, WeightRecord } from './types';
import {
  ensureProfile, saveProfile,
  loadDietRecords, addDietRecord as addDietToDb, updateDietRecord as updateDietToDb, deleteDietRecord as deleteDietFromDb,
  loadExerciseRecords, addExerciseRecord as addExerciseToDb, updateExerciseRecord as updateExToDb, deleteExerciseRecord as deleteExFromDb,
  loadWeightRecords, addWeightRecord as addWeightToDb,
} from './lib/supabaseService';
import { Leaf, LogOut } from 'lucide-react';

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeView, setActiveView] = useState('home');
  const [renderError, setRenderError] = useState<Error | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: '用户',
    gender: '女',
    age: 30,
    height: 165,
    currentWeight: 65,
    targetWeight: 58,
    currentBodyFat: 28,
    targetBodyFat: 24,
    bmr: 1400,
    recommendedIntake: 1500,
  });

  const [dietRecords, setDietRecords] = useState<DietRecord[]>([]);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);

  // Catch global JS errors
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      console.error('[App] 全局错误:', event.error);
      setRenderError(event.error || new Error(event.message));
      event.preventDefault();
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Load user data from Supabase after login
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setDataLoading(true);
      try {
        const [prof, diet, exercise, weight] = await Promise.all([
          ensureProfile(user.email!),
          loadDietRecords(),
          loadExerciseRecords(),
          loadWeightRecords(),
        ]);
        setProfile(prof);
        setDietRecords(diet);
        setExerciseRecords(exercise);
        setWeightRecords(weight);
      } catch (err) {
        console.error('[App] 数据加载失败:', err);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user]);

  const addDietRecord = async (record: Omit<DietRecord, 'id' | 'time'>) => {
    const saved = await addDietToDb(record);
    if (!saved) throw new Error('添加饮食记录失败');
    setDietRecords(prev => [saved, ...prev]);
  };

  const addExerciseRecord = async (record: Omit<ExerciseRecord, 'id' | 'time'>) => {
    const saved = await addExerciseToDb(record);
    if (!saved) throw new Error('添加运动记录失败');
    setExerciseRecords(prev => [saved, ...prev]);
  };

  const updateWeight = async (weight: number) => {
    const today = new Date().toISOString().split('T')[0];

    // Optimistic update: update profile immediately
    setProfile(prev => {
      const updated = { ...prev, currentWeight: weight };
      saveProfile(updated);
      return updated;
    });

    // Update local weight records
    setWeightRecords(prev => {
      const idx = prev.findIndex(r => r.date === today);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], weight };
        return next;
      }
      const newRecord: WeightRecord = {
        id: 'local-' + Math.random().toString(36).substr(2, 9),
        date: today,
        weight,
      };
      return [newRecord, ...prev];
    });

    // Persist to Supabase (background)
    try {
      const saved = await addWeightToDb(weight);
      if (saved) {
        setWeightRecords(prev => prev.map(r => r.date === today ? saved : r));
      }
    } catch (err) {
      console.error('[App] 体重保存到 Supabase 失败:', err);
    }
  };

  const updateDietRecord = async (id: string, patch: Partial<Omit<DietRecord, 'id' | 'time'>>) => {
    setDietRecords(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    await updateDietToDb(id, patch);
  };

  const deleteDietRecord = async (id: string) => {
    setDietRecords(prev => prev.filter(r => r.id !== id));
    await deleteDietFromDb(id);
  };

  const updateExerciseRecord = async (id: string, patch: Partial<Omit<ExerciseRecord, 'id' | 'time'>>) => {
    setExerciseRecords(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    await updateExToDb(id, patch);
  };

  const deleteExerciseRecord = async (id: string) => {
    setExerciseRecords(prev => prev.filter(r => r.id !== id));
    await deleteExFromDb(id);
  };

  if (renderError) {
    return <ErrorFallback error={renderError} onReset={() => window.location.reload()} />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-on-surface-variant">验证身份中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-on-surface-variant">加载数据中...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView profile={profile} dietRecords={dietRecords} exerciseRecords={exerciseRecords} weightRecords={weightRecords} onNavigate={setActiveView} />;
      case 'diet':
        return <DietView profile={profile} onAddRecord={addDietRecord} onUpdateRecord={updateDietRecord} onDeleteRecord={deleteDietRecord} records={dietRecords} />;
      case 'exercise':
        return <ExerciseView profile={profile} onAddRecord={addExerciseRecord} onUpdateRecord={updateExerciseRecord} onDeleteRecord={deleteExerciseRecord} records={exerciseRecords} />;
      case 'weight':
        return <WeightView profile={profile} records={weightRecords} onAddRecord={updateWeight} />;
      case 'profile':
        return <ProfileView profile={profile} onUpdateProfile={(p) => { setProfile(p); saveProfile(p); }} onSignOut={signOut} />;
      default:
        return <HomeView profile={profile} dietRecords={dietRecords} exerciseRecords={exerciseRecords} weightRecords={weightRecords} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <div className="hidden md:block">
        <Navigation activeView={activeView} onSetView={setActiveView} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
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
                {(profile as any).avatarUrl ? (
                  <img src={(profile as any).avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-container flex items-center justify-center text-primary font-bold text-sm">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {renderView()}
          </div>
        </main>
      </div>

      <div className="md:hidden">
        <Navigation activeView={activeView} onSetView={setActiveView} />
      </div>
    </div>
  );
}
