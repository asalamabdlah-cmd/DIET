import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  error: Error | null;
  onReset: () => void;
}

export function ErrorFallback({ error, onReset }: Props) {
  if (!error) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl soft-shadow p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">页面出错了</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed break-all">
          {error.message || '发生未知错误'}
        </p>
        <p className="text-xs text-on-surface-variant/70">
          请尝试刷新页面，或清除浏览器缓存后重试
        </p>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          <RefreshCw size={18} />
          刷新页面
        </button>
      </div>
    </div>
  );
}

/**
 * Wraps a render function in try/catch to catch rendering errors.
 * Not as comprehensive as a React class ErrorBoundary, but catches
 * most synchronous rendering errors.
 */
export function safeRender<T>(fn: () => T, fallback: (err: Error) => T): T {
  try {
    return fn();
  } catch (err) {
    console.error('[safeRender]', err);
    return fallback(err instanceof Error ? err : new Error(String(err)));
  }
}
