import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Loader2, Sparkles, Download, AlertCircle, 
  Volume2, VolumeX, Upload, RefreshCcw, Wand2 
} from 'lucide-react';

// --- 配置与常量 ---
const DIFY_API_KEY = "app-jehf2wTtMhaNfYkGflbtXHFX";
const DIFY_BASE_URL = "https://api.dify.ai/v1";

const AUDIO_CONFIG = {
  BGM_URL: "https://ia800503.us.archive.org/15/items/ChineseNewYearMusic/Chinese%20New%20Year%20Music%20-%2001%20-%20Spring%20Festival%20Overture.mp3", 
  SUCCESS_SFX_URL: "https://ia801402.us.archive.org/16/items/firework_202201/fireworks.mp3", 
  CLICK_SFX_URL: "https://ia902807.us.archive.org/29/items/sound_effects_202008/WoodBlock.mp3"
};

enum CharacterName {
  PIPI = '皮皮',
  SHANDIAN = '闪电',
  TANGTANG = '糖糖',
  ZACK = 'Zack',
  BADOU = '八斗'
}

const CHARACTERS = [
  { id: CharacterName.PIPI, label: "皮皮" },
  { id: CharacterName.SHANDIAN, label: "闪电" },
  { id: CharacterName.TANGTANG, label: "糖糖" },
  { id: CharacterName.ZACK, label: "Zack" },
  { id: CharacterName.BADOU, label: "八斗" },
];

// --- 核心工具函数 ---

// 架构级优化 1: 强力图像压缩管道
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIDE = 1200; // 限制长边，确保 Dify 接口秒级响应

        if (width > height && width > MAX_SIDE) {
          height *= MAX_SIDE / width;
          width = MAX_SIDE;
        } else if (height > MAX_SIDE) {
          width *= MAX_SIDE / height;
          height = MAX_SIDE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], "upload.jpg", { type: 'image/jpeg' }));
          } else {
            reject(new Error('压缩失败'));
          }
        }, 'image/jpeg', 0.8); // 80% 质量，体积与清晰度的黄金平衡
      };
      img.onerror = () => reject(new Error('图片解析失败'));
    };
    reader.onerror = () => reject(new Error('读取失败'));
  });
};

// --- API 服务 ---
const api = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user", "web-user");
    const res = await fetch(`${DIFY_BASE_URL}/files/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${DIFY_API_KEY}` },
      body: formData,
    });
    if (!res.ok) throw new Error("服务器上传失败");
    return (await res.json()).id;
  },
  generate: async (fileId: string, charName: string) => {
    const res = await fetch(`${DIFY_BASE_URL}/workflows/run`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          ip_name: charName,
          user_image: { type: "image", transfer_method: "local_file", upload_file_id: fileId },
        },
        response_mode: "blocking",
        user: "web-user-" + Date.now(),
      }),
    });
    if (!res.ok) throw new Error("工作流启动失败");
    const json = await res.json();
    if (json.data?.status === "failed") throw new Error(json.data.error || "生成失败");
    return json.data?.outputs?.poster_url;
  }
};

// --- 子组件 ---

const BackgroundMusic: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed top-6 right-6 z-50">
      <audio ref={audioRef} src={AUDIO_CONFIG.BGM_URL} loop preload="none" />
      <button 
        onClick={toggle}
        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-cn-gold shadow-2xl transition-all ${isPlaying ? 'bg-cn-red animate-spin-slow' : 'bg-black/40'}`}
      >
        {isPlaying ? <Volume2 className="text-cn-gold" size={20} /> : <VolumeX className="text-cn-gold" size={20} />}
      </button>
    </div>
  );
};

// --- 主应用 ---

const App = () => {
  // 状态管理
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedChar, setSelectedChar] = useState<CharacterName>(CharacterName.PIPI);
  const [loadingStep, setLoadingStep] = useState<string | null>(null); // 'compressing' | 'uploading' | 'generating'
  const [error, setError] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  // 音效引用
  const sfxClick = useRef<HTMLAudioElement>(null);
  const sfxSuccess = useRef<HTMLAudioElement>(null);

  const playSfx = (ref: React.RefObject<HTMLAudioElement>) => {
    if (ref.current) {
      ref.current.currentTime = 0;
      ref.current.play().catch(() => {});
    }
  };

  // 架构级优化 1：文件选择后立即触发压缩
  const handleFileChange = useCallback(async (selected: File) => {
    playSfx(sfxClick);
    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    
    // 后台立即压缩，不阻塞用户选择角色
    try {
      const comp = await compressImage(selected);
      setCompressedFile(comp);
    } catch (err) {
      setError("图片处理失败，请更换一张。");
    }
  }, []);

  const handleGenerate = async () => {
    if (!file) return;
    playSfx(sfxClick);
    setError(null);
    setPosterUrl(null);
    
    try {
      // 1. 检查压缩状态
      let targetFile = compressedFile;
      if (!targetFile) {
        setLoadingStep('compressing');
        targetFile = await compressImage(file);
        setCompressedFile(targetFile);
      }

      // 2. 上传
      setLoadingStep('uploading');
      const fileId = await api.upload(targetFile);

      // 3. 生成
      setLoadingStep('generating');
      const url = await api.generate(fileId, selectedChar);
      
      setPosterUrl(url);
      playSfx(sfxSuccess);
      
      // 触发烟花 (如果全局 confetti 可用)
      if (window['confetti']) {
        window['confetti']({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#C5A059', '#7A1A1A'] });
      }
    } catch (err: any) {
      setError(err.message || "由于网络拥堵，生成失败，请重试。");
    } finally {
      setLoadingStep(null);
    }
  };

  return (
    <div className="min-h-screen bg-cn-red text-ink font-serif relative overflow-x-hidden selection:bg-cn-gold selection:text-cn-red">
      <BackgroundMusic />
      <audio ref={sfxClick} src={AUDIO_CONFIG.CLICK_SFX_URL} preload="none" />
      <audio ref={sfxSuccess} src={AUDIO_CONFIG.SUCCESS_SFX_URL} preload="none" />
      
      {/* 装饰底纹 */}
      <div className="fixed inset-0 bg-noise opacity-20 pointer-events-none z-0"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
        
        {/* 头部标题 */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="text-cn-gold tracking-[0.5em] text-sm mb-4 opacity-70">LUNAR NEW YEAR 2026</div>
          <h1 className="text-6xl md:text-8xl font-bold text-gold-gradient mb-6">二零二六</h1>
          <div className="h-px w-24 bg-cn-gold mx-auto mb-6 opacity-30"></div>
          <p className="text-white/80 text-xl tracking-[0.2em]">新春映像 · 定制工坊</p>
        </header>

        {/* 核心交互区 */}
        <main className="w-full bg-paper rounded-sm shadow-2xl flex flex-col md:flex-row border-4 border-double border-cn-gold/20 overflow-hidden">
          
          {/* 左侧：控制面板 */}
          <div className="w-full md:w-[420px] p-8 md:p-12 bg-white border-r border-gray-100 flex flex-col shrink-0">
            <h2 className="text-2xl font-bold text-cn-red mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-cn-gold rotate-45"></span>
              参数设置
            </h2>

            {/* 错误显示 */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-cn-red text-sm flex items-start gap-2 animate-shake">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* 上传器 */}
            <div className="mb-10">
              <label className="block text-xs text-gray-400 tracking-widest uppercase mb-4">Step 1. 上传肖像</label>
              <div 
                onClick={() => document.getElementById('file-input')?.click()}
                className={`group relative h-48 border-2 border-dashed rounded-sm transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden
                  ${preview ? 'border-cn-gold' : 'border-gray-200 hover:border-cn-gold/50 hover:bg-gray-50'}`}
              >
                <input id="file-input" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
                {preview ? (
                  <img src={preview} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto text-gray-300 group-hover:text-cn-gold transition-colors mb-2" size={24} />
                    <span className="text-sm text-gray-400">点击上传照片</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-bold tracking-widest">更换照片</span>
                </div>
              </div>
            </div>

            {/* 角色选择 */}
            <div className="mb-10">
              <label className="block text-xs text-gray-400 tracking-widest uppercase mb-4">Step 2. 挑选伙伴</label>
              <div className="grid grid-cols-5 gap-2">
                {CHARACTERS.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => { playSfx(sfxClick); setSelectedChar(char.id); }}
                    className={`h-12 rounded-sm border transition-all text-xs font-bold
                      ${selectedChar === char.id ? 'bg-cn-red border-cn-red text-cn-gold shadow-lg scale-105' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-cn-gold/30'}`}
                  >
                    {char.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={!!loadingStep || !file}
              className={`mt-auto w-full py-5 rounded-sm font-bold tracking-[0.3em] transition-all relative overflow-hidden group
                ${!!loadingStep || !file ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-cn-red text-cn-gold hover:shadow-xl hover:-translate-y-0.5'}`}
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loadingStep ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>
                      {loadingStep === 'compressing' && '图片压缩中...'}
                      {loadingStep === 'uploading' && '影像上传中...'}
                      {loadingStep === 'generating' && 'AI 创作中...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    <span>立即生成</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* 右侧：预览画布 */}
          <div className="flex-1 bg-[#EEECE5] p-8 md:p-16 relative flex items-center justify-center min-h-[500px]">
            {/* 纸张纹理 */}
            <div className="absolute inset-0 bg-paper-texture opacity-40 mix-blend-multiply pointer-events-none"></div>
            
            {/* 装饰边框 */}
            <div className="absolute inset-8 border border-gray-300/50 pointer-events-none"></div>

            <div className={`relative bg-white p-4 shadow-2xl transition-all duration-1000 ${posterUrl ? 'scale-100 rotate-0' : 'scale-95 opacity-80'}`}>
              <div className="w-full max-w-[380px] aspect-[3/4] bg-gray-50 border border-gray-100 flex items-center justify-center relative overflow-hidden group">
                
                {!posterUrl && !loadingStep && (
                  <div className="text-center opacity-20">
                    <Sparkles size={48} className="mx-auto mb-4" />
                    <p className="writing-vertical font-bold text-2xl tracking-[0.5em]">虚位以待</p>
                  </div>
                )}

                {loadingStep && (
                  <div className="text-center z-10">
                    <div className="w-12 h-12 border-2 border-cn-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-cn-red font-bold tracking-widest animate-pulse">影像冲印中...</p>
                  </div>
                )}

                {posterUrl && (
                  <>
                    <img src={posterUrl} className="w-full h-full object-cover animate-fade-in" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <a href={posterUrl} download target="_blank" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-cn-red hover:bg-cn-gold hover:text-white transition-all">
                        <Download size={20} />
                      </a>
                      <button onClick={() => { setPosterUrl(null); playSfx(sfxClick); }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all">
                        <RefreshCcw size={20} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 底部标记 */}
            <div className="absolute bottom-6 text-[10px] text-gray-400 tracking-[0.4em] uppercase opacity-50">
              © 2026 Lunar New Year Photography Studio
            </div>
          </div>
        </main>

        <footer className="mt-12 text-white/30 text-xs tracking-widest text-center">
          技术驱动 AI 创意 · Dify Workflow Engine
        </footer>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .bg-noise { background-image: url('https://www.transparenttextures.com/patterns/stardust.png'); }
        .bg-paper-texture { background-image: url('https://www.transparenttextures.com/patterns/cream-paper.png'); }
        .text-gold-gradient {
          background: linear-gradient(to bottom, #C5A059, #E5C585, #C5A059);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        .writing-vertical { writing-mode: vertical-rl; }
      `}</style>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);