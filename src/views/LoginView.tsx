import { useState, type FormEvent, type KeyboardEvent, type ClipboardEvent, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Leaf, Mail, ArrowRight, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginView() {
  const { signInWithEmail, verifyOtp, authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'verifying' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const OTP_LEN = 8;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isValidQQEmail = (email: string) => /^[1-9]\d{4,11}@qq\.com$/.test(email.trim());

  const doVerify = useCallback(async (code: string) => {
    if (code.length !== OTP_LEN) return;
    setStatus('verifying');
    setErrorMsg('');
    const { error } = await verifyOtp(email.trim(), code);
    if (error) {
      setStatus('error');
      setErrorMsg(error);
      setOtp(Array(OTP_LEN).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [email, verifyOtp]);

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    if (!isValidQQEmail(trimmed)) {
      setStatus('error');
      setErrorMsg('请输入有效的 QQ 邮箱');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    const { error } = await signInWithEmail(trimmed);
    if (error) { setStatus('error'); setErrorMsg(error); }
    else { setStatus('sent'); setOtp(Array(OTP_LEN).fill('')); setTimeout(() => inputRefs.current[0]?.focus(), 100); }
  };

  const onOtpChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...otp];
    next[i] = v.slice(-1);
    setOtp(next);
    if (v && i < OTP_LEN - 1) inputRefs.current[i + 1]?.focus();
  };

  const onOtpKeyDown = (i: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const onOtpPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    if (!paste) return;
    const next = Array(OTP_LEN).fill('');
    paste.split('').forEach((d, i) => { if (i < OTP_LEN) next[i] = d; });
    setOtp(next);
  };

  const handleResend = async () => {
    setStatus('loading');
    const { error } = await signInWithEmail(email.trim());
    if (error) { setStatus('error'); setErrorMsg(error); }
    else { setStatus('sent'); setOtp(Array(OTP_LEN).fill('')); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg mb-4"><Leaf size={32} fill="currentColor" /></div>
          <h1 className="text-2xl font-bold text-on-surface">轻盈助手</h1>
          <p className="text-sm text-on-surface-variant mt-2">智能健康管理，遇见更好的自己</p>
        </div>

        {/* Auth error */}
        {authError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-700 flex-1">{authError}</p>
            <button onClick={clearAuthError} className="text-red-400 hover:text-red-600">&times;</button>
          </motion.div>
        )}

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-3xl soft-shadow p-8">
          {status === 'sent' || status === 'verifying' ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center mb-5"><ShieldCheck size={28} className="text-primary" /></div>
              <h2 className="text-xl font-bold text-on-surface mb-1">输入验证码</h2>
              <p className="text-sm text-on-surface-variant mb-6">验证码已发送至 <span className="font-semibold text-on-surface">{email}</span></p>

              <div className="flex gap-1.5 mb-6" onPaste={onOtpPaste}>
                {otp.map((d, i) => (
                  <input key={i} ref={el => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1}
                    value={d} onChange={e => onOtpChange(i, e.target.value)} onKeyDown={e => onOtpKeyDown(i, e)}
                    className={`w-9 h-12 rounded-lg bg-surface-container-low text-center text-lg font-bold text-on-surface outline-none border-2 ${status === 'error' ? 'border-red-400' : 'border-surface-variant/30 focus:border-primary'} transition-colors`} />
                ))}
              </div>

              <button
                onClick={() => doVerify(otp.join(''))}
                disabled={status === 'verifying' || otp.some(c => !c)}
                className="w-full h-11 bg-primary disabled:bg-primary/40 text-white rounded-xl font-semibold mb-2 active:scale-[0.98] transition-all"
              >
                {status === 'verifying' ? '验证中...' : '确认验证'}
              </button>

              {status === 'error' && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 flex items-center gap-1 mb-4"><AlertCircle size={14} /> {errorMsg}</motion.p>}

              <div className="flex gap-4 text-sm">
                <button onClick={() => { setStatus('idle'); setOtp(Array(OTP_LEN).fill('')); }} className="text-on-surface-variant hover:text-on-surface">更换邮箱</button>
                <button onClick={handleResend} className="text-primary font-semibold hover:underline">重新发送</button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div><h2 className="text-xl font-bold text-on-surface mb-1">登录</h2><p className="text-sm text-on-surface-variant">输入 QQ 邮箱，获取 8 位验证码</p></div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface flex items-center gap-1.5"><Mail size={16} className="text-primary" />QQ 邮箱</label>
                <div className="relative">
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                    placeholder="123456789@qq.com" autoFocus
                    className={`w-full h-12 px-4 pr-10 rounded-xl border-2 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all ${status === 'error' ? 'border-red-400' : 'border-surface-variant/50 focus:border-primary'}`} />
                  {email && isValidQQEmail(email) && <CheckCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" />}
                </div>
                {status === 'error' && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} />{errorMsg}</motion.p>}
              </div>
              <button type="submit" disabled={status === 'loading'} className="w-full h-12 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98]">
                {status === 'loading' ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>发送中...</> : <>{'获取验证码'}<ArrowRight size={18} /></>}
              </button>
              <p className="text-xs text-on-surface-variant text-center">未注册账号将自动创建</p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
