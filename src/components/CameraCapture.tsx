import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Loader2, RefreshCw, Check, AlertCircle, Zap } from 'lucide-react';
import { analyzeFoodImage, type FoodAnalysis } from '../services/geminiVisionService';

type CameraState = 'idle' | 'requesting' | 'live' | 'analyzing' | 'result' | 'error';

interface CameraCaptureProps {
  onResult: (food: { name: string; calories: number; carbs: number; protein: number; fat: number; weight?: string }) => void;
  onClose: () => void;
}

export default function CameraCapture({ onResult, onClose }: CameraCaptureProps) {
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  // Track when to attach stream to video (solves race condition)
  const [pendingStream, setPendingStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Cleanup on unmount ──
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setPendingStream(null);
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  // ── Attach stream once video element appears in DOM ──
  useEffect(() => {
    if (!pendingStream || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = pendingStream;
    video.play().catch(err => console.error('[Camera] play failed:', err));
    streamRef.current = pendingStream;
    setPendingStream(null);
    setCameraState('live');
  }, [pendingStream]);

  // ── Start Camera ──
  const startCamera = async () => {
    setCameraState('requesting');
    setErrorMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      // Set state to 'requesting-live-transition' first so video element renders,
      // then useEffect will attach the stream once videoRef is ready
      setPendingStream(stream);
      // Keep state as requesting until useEffect attaches stream → sets 'live'
    } catch (err: any) {
      console.error('[Camera] 打开失败:', err);
      if (err.name === 'NotAllowedError') {
        setErrorMessage('摄像头权限被拒绝，请在浏览器设置中允许访问摄像头');
      } else if (err.name === 'NotFoundError') {
        setErrorMessage('未检测到摄像头');
      } else if (err.name === 'NotReadableError') {
        setErrorMessage('摄像头被其他应用占用');
      } else {
        setErrorMessage(`无法打开摄像头：${err.message}`);
      }
      setCameraState('error');
    }
  };

  // ── Capture Frame ──
  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);

    // Stop camera after capture
    stopStream();
    setCameraState('analyzing');

    // Analyze
    const bareBase64 = dataUrl.split(',')[1];
    analyzeFoodImage(bareBase64, 'image/jpeg')
      .then(result => {
        setAnalysis(result);
        setCameraState('result');
      })
      .catch(err => {
        console.error('[Camera] 分析失败:', err);
        setErrorMessage(err?.message || 'AI 分析失败，请重试');
        setCameraState('error');
      });
  };

  // ── Confirm & Pass to Parent ──
  const confirm = () => {
    if (!analysis || analysis.calories === 0) return;
    onResult({
      name: analysis.name,
      calories: analysis.calories,
      carbs: analysis.carbs,
      protein: analysis.protein,
      fat: analysis.fat,
      weight: analysis.weight,
    });
    onClose();
  };

  // ── Retry ──
  const retry = () => {
    setCapturedImage(null);
    setAnalysis(null);
    setErrorMessage('');
    startCamera();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3">
          <span className="text-white text-sm font-bold">
            {(cameraState === 'live' || pendingStream) && '对准食物，点击拍照'}
            {cameraState === 'analyzing' && 'AI 分析中...'}
            {cameraState === 'result' && '识别结果'}
            {cameraState === 'error' && '出错了'}
          </span>
          <button
            onClick={() => { stopStream(); onClose(); }}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col items-center justify-center">

          {/* ── IDLE ── */}
          {cameraState === 'idle' && (
            <div className="flex flex-col items-center gap-6 px-8 text-center">
              <div className="w-28 h-28 rounded-full bg-white/10 flex items-center justify-center">
                <Camera size={48} className="text-white" />
              </div>
              <div>
                <h2 className="text-white text-2xl font-bold mb-2">拍照识别食物</h2>
                <p className="text-white/60 text-sm">用相机对准食物，AI 自动识别并估算热量</p>
              </div>
              <button
                onClick={startCamera}
                className="px-8 py-3.5 rounded-full bg-white text-black font-bold text-lg hover:bg-white/90 transition-all active:scale-95 flex items-center gap-2"
              >
                <Camera size={20} />
                打开相机
              </button>
            </div>
          )}

          {/* ── REQUESTING (before stream) ── */}
          {cameraState === 'requesting' && !pendingStream && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={40} className="text-white animate-spin" />
              <p className="text-white/60 text-sm">请求摄像头权限...</p>
            </div>
          )}

          {/* ── LIVE (stream ready or already attached) ── */}
          {(cameraState === 'live' || pendingStream) && (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Capture button */}
              <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                <button
                  onClick={capture}
                  className="w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 transition-all active:scale-90 flex items-center justify-center shadow-lg"
                >
                  <div className="w-16 h-16 rounded-full bg-white" />
                </button>
              </div>
            </div>
          )}

          {/* ── ANALYZING ── */}
          {cameraState === 'analyzing' && capturedImage && (
            <div className="relative w-full h-full">
              <img src={capturedImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                  <Loader2 size={36} className="text-white animate-spin" />
                </div>
                <p className="text-white font-bold text-lg">AI 正在识别食物...</p>
                <p className="text-white/50 text-sm">可能需要几秒钟</p>
              </div>
            </div>
          )}

          {/* ── RESULT ── */}
          {cameraState === 'result' && analysis && (
            <div className="w-full max-w-sm mx-auto px-6">
              {capturedImage && (
                <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 shadow-lg">
                  <img src={capturedImage} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-primary fill-current" />
                  <span className="text-sm font-bold text-primary">AI 识别结果</span>
                </div>

                <h3 className="text-xl font-bold text-on-surface mb-4">{analysis.name}</h3>
                {analysis.weight && (
                  <p className="text-xs text-on-surface-variant mb-3">{analysis.weight}</p>
                )}

                <div className="grid grid-cols-4 gap-2 mb-6">
                  {[
                    { label: '热量', value: analysis.calories, unit: 'kcal' },
                    { label: '碳水', value: `${analysis.carbs}g` },
                    { label: '蛋白', value: `${analysis.protein}g` },
                    { label: '脂肪', value: `${analysis.fat}g` },
                  ].map((s, i) => (
                    <div key={i} className="bg-surface-container-low rounded-xl p-3 text-center">
                      <span className="text-xs text-on-surface-variant block mb-1">{s.label}</span>
                      <span className="text-sm font-bold text-on-surface">{s.value}</span>
                      {s.unit && <span className="text-[10px] text-outline block">{s.unit}</span>}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={retry}
                    className="flex-1 py-3 rounded-full bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} />
                    重新拍照
                  </button>
                  <button
                    onClick={confirm}
                    disabled={analysis.calories === 0}
                    className="flex-1 py-3 rounded-full bg-primary text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Check size={18} />
                    确认添加
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {cameraState === 'error' && (
            <div className="flex flex-col items-center gap-6 px-8 text-center max-w-sm">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={36} className="text-red-400" />
              </div>
              <p className="text-white font-bold text-lg">识别失败</p>
              <p className="text-white/60 text-sm leading-relaxed">{errorMessage}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => onClose()}
                  className="px-6 py-3 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                >
                  关闭
                </button>
                <button
                  onClick={retry}
                  className="px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-white/90 transition-all active:scale-95"
                >
                  重试
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </AnimatePresence>
  );
}
