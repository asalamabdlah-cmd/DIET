import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Leaf, Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginView() {
  const { signInWithEmail, authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isValidQQEmail = (email: string) => {
    return /^[1-9]\d{4,11}@qq\.com$/.test(email.trim());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) return;
    if (!isValidQQEmail(trimmed)) {
      setStatus('error');
      setErrorMsg('请输入有效的 QQ 邮箱（如：123456789@qq.com）');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    const { error } = await signInWithEmail(trimmed);

    if (error) {
      setStatus('error');
      setErrorMsg(error);
    } else {
      setStatus('sent');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg mb-4">
            <Leaf size={32} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">轻盈助手</h1>
          <p className="text-sm text-on-surface-variant mt-2">智能健康管理，遇见更好的自己</p>
        </div>

        {/* Auth error banner (expired link, etc.) */}
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle size={16} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700">{authError}</p>
              <p className="text-xs text-red-500 mt-1">请重新输入邮箱获取新链接</p>
            </div>
            <button
              onClick={clearAuthError}
              className="text-red-400 hover:text-red-600 transition-colors shrink-0"
            >
              <span className="text-lg leading-none">&times;</span>
            </button>
          </motion.div>
        )}

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-3xl soft-shadow p-8">
          {status === 'sent' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-4"
            >
              <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center mb-5">
                <CheckCircle size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-on-surface mb-2">邮件已发送</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                一封含有登录链接的邮件已发送至
                <br />
                <span className="font-semibold text-on-surface">{email}</span>
              </p>
              <p className="text-xs text-on-surface-variant mt-4">
                请点击邮件中的链接完成登录，链接在 24 小时内有效
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-on-surface mb-1">登录</h2>
                <p className="text-sm text-on-surface-variant">输入 QQ 邮箱，一键免密登录</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <Mail size={16} className="text-primary" />
                  QQ 邮箱
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    placeholder="123456789@qq.com"
                    className={`w-full h-12 px-4 pr-10 rounded-xl border-2 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all ${
                      status === 'error'
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-surface-variant/50 focus:border-primary'
                    }`}
                    autoFocus
                  />
                  {email && isValidQQEmail(email) && (
                    <CheckCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" />
                  )}
                </div>
                {status === 'error' && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle size={14} />
                    {errorMsg}
                  </motion.p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full h-12 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    发送中...
                  </span>
                ) : (
                  <>
                    发送登录链接
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <p className="text-xs text-on-surface-variant text-center">
                未注册账号将自动创建，登录即表示同意服务条款
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
