import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithEmail: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Parse URL hash for error params (expired/invalid magic link, etc.)
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const error = params.get('error');
    const errorCode = params.get('error_code');
    const errorDesc = params.get('error_description');

    if (error || errorCode) {
      const messages: Record<string, string> = {
        otp_expired: '登录链接已过期，请重新发送',
        access_denied: '登录链接无效，请重新发送',
        invalid_token: '登录凭证无效，请重新发送',
        token_not_found: '登录链接无效，请重新发送',
      };
      const msg = errorDesc
        ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
        : (messages[errorCode || ''] || '登录链接无效，请重新发送');
      setAuthError(msg);
      // Clean hash from URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    console.log('[Auth] 初始化，检查 session...');

    // Safety timeout: force stop loading after 6 seconds
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('[Auth] 超时 — 强制结束 loading');
        setLoading(false);
      }
    }, 6000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        console.log('[Auth] getSession 完成:', session ? '已登录' : '未登录');
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((err) => {
        console.error('[Auth] getSession 失败:', err);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] onAuthStateChange:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      console.error('[Auth] signInWithOtp 失败:', err);
      if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
        return { error: '无法连接 Supabase 服务。请确认 .env 中的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 已配置为真实项目地址。' };
      }
      return { error: err?.message || '发送失败，请稍后重试' };
    }
  };

  const clearAuthError = () => setAuthError(null);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, authError, clearAuthError, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
