import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Loader2, Sparkles, Download, AlertCircle, 
  Volume2, VolumeX, Upload, RefreshCcw, Wand2, X, Info
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
  { id: CharacterName.PIPI, label: "皮皮", desc: "活泼" },
  { id: CharacterName.SHANDIAN, label: "闪电", desc: "灵动" },
  { id: CharacterName.TANGTANG, label: "糖糖", desc: "甜美" },
  { id: CharacterName.ZACK, label: "Zack", desc: "酷飒" },
  { id: CharacterName.BADOU, label: "八斗", desc: "睿智" },
];

// --- 核心图像处理：彻底解决上传慢的问题 ---
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
        const MAX_SIDE = 1080; // 优化至 1080p 级别，兼顾清晰度与上传速度

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
            resolve(new File([blob], "compressed_avatar.jpg", { type: 'image/jpeg' }));
          } else {
            reject(new Error('图片处理失败'));
          }
        }, 'image/jpeg', 0.82); // 0.82 是画质与体积的平衡点
      };
      img.onerror = () => reject(new Error('图片加载异常'));
    };
    reader.onerror = () => reject(new Error('文件读取异常'));
  });
};

// --- API 请求封装 ---
const difyApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user", "web-visitor");
    const res = await fetch(`${DIFY_BASE_URL}/files/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${DIFY_API_KEY}` },
      body: formData,
    });
    if (!res.ok) throw new Error("上传请求超时或接口异常");
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
        inputs: { ip_name: charName, user_image: { type: "image", transfer_method: "local_file", upload_file_id: fileId } },
        response_mode: "blocking",
        user: `user-${Date.now()}`,
      }),
    });
    if (!res.ok) throw new Error("AI 生成任务启动失败");
    const json = await res.json();
    if (json.data?.status === "failed") throw new Error(json.data.error || "工作流执行中断");
    return json.data?.outputs?.poster_url;
  }
};

// --- 主应用组件 ---
const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedChar, setSelectedChar] = useState<CharacterName>(CharacterName.PIPI);
  const [status, setStatus] = useState<null | 'compressing' | 'uploading' | 'generating'>(null);
  const [error, setError] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const bgmRef = useRef<HTMLAudioElement>(null);
  const sfxClick = useRef<HTMLAudioElement>(null);
  const sfxSuccess = useRef<HTMLAudioElement>(null);

  const playSfx = (ref: React.RefObject<HTMLAudioElement>) => {
    if (ref.current) {
      ref.current.currentTime = 0;
      ref.current.play().catch(() => {});
    }
  };

  // 图像处理逻辑
  const processNewFile = async (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setError("请选择有效的图片文件。");
      return;
    }
    playSfx(sfxClick);
    setError(null);
    setPosterUrl(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    
    // 异步后台压缩，不影响用户选人
    try {
      const compressed = await compressImage(selected);
      setCompressedFile(compressed);
    } catch (e) {
      setError("图片预处理失败");
    }
  };

  // 拖拽相关逻辑
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processNewFile(droppedFile);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;
    playSfx(sfxClick);
    setError(null);
    
    try {
      let readyFile = compressedFile;
      if (!readyFile) {
        setStatus('compressing');
        readyFile = await compressImage(file);
      }

      setStatus('uploading');
      const fileId = await difyApi.upload(readyFile);

      setStatus('generating');
      const url = await difyApi.generate(fileId, selectedChar);
      
      setPosterUrl(url);
      playSfx(sfxSuccess);
      if (window['confetti']) {
        window['confetti']({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#C5A059', '#7A1A1A'] });
      }
    } catch (err: any) {
      setError(err.message || "由于网络拥堵，生成失败，请重试。");
    } finally {
      setStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-cn-red text-ink font-serif relative overflow-x-hidden">
      {/* 音频控制 */}
      <audio ref={bgmRef} src={AUDIO_CONFIG.BGM_URL} loop preload="none" />
      <audio ref={sfxClick} src={AUDIO_CONFIG.CLICK_SFX_URL} preload="none" />
      <audio ref={sfxSuccess} src={AUDIO_CONFIG.SUCCESS_SFX_URL} preload="none" />
      
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={() => {
            if (isBgmPlaying) bgmRef.current?.pause();
            else bgmRef.current?.play().catch(() => {});
            setIsBgmPlaying(!isBgmPlaying);
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-cn-gold/50 shadow-2xl transition-all ${isBgmPlaying ? 'bg-cn-red-light animate-spin-slow' : 'bg-black/20 hover:bg-black/40'}`}
        >
          {isBgmPlaying ? <Volume2 className="text-cn-gold" size={20} /> : <VolumeX className="text-cn-gold" size={20} />}
        </button>
      </div>

      <div className="fixed inset-0 bg-noise opacity-30 pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 md:py-16 flex flex-col items-center">
        
        {/* 标题区 */}
        <header className="text-center mb-10 animate-fade-in">
          <div className="text-cn-gold tracking-[0.4em] text-xs mb-3 font-bold opacity-80 uppercase">2026 丙午马年 · 新春特辑</div>
          <h1 className="text-5xl md:text-7xl font-bold text-gold-gradient mb-6 drop-shadow-lg">新春 · 映像</h1>
          <div className="flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-cn-gold/40"></span>
            <p className="text-white/80 text-lg tracking-[0.2em] italic">定制您的二零二六贺岁海报</p>
            <span className="h-px w-10 bg-cn-gold/40"></span>
          </div>
        </header>

        {/* 主交互面板 */}
        <main className="w-full bg-paper rounded-lg shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col md:flex-row overflow-hidden border-2 border-cn-gold/10">
          
          {/* 左侧：步骤指引 */}
          <div className="w-full md:w-[400px] p-8 md:p-12 bg-[#FDFBF7] flex flex-col border-b md:border-b-0 md:border-r border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-cn-red mb-2 flex items-center gap-2">
                 <Wand2 size={20} className="text-cn-gold" />
                 制作工序
              </h2>
              <p className="text-xs text-gray-400">简单三步，生成您的专属年画</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-cn-red text-sm flex items-start gap-2 animate-shake">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: 上传 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-cn-red flex items-center gap-2">
                   <span className="w-5 h-5 rounded-full bg-cn-red text-white flex items-center justify-center text-xs">1</span>
                   上传照片
                </label>
                {preview && <button onClick={() => { setFile(null); setPreview(null); }} className="text-[10px] text-gray-300 hover:text-cn-red flex items-center gap-1"><RefreshCcw size={10}/>重选</button>}
              </div>
              
              <div 
                onClick={() => document.getElementById('file-input')?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative h-44 border-2 border-dashed rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden
                  ${isDragging ? 'border-cn-gold bg-cn-gold/5 scale-[0.98]' : (preview ? 'border-cn-gold' : 'border-gray-200 hover:border-cn-gold/50 hover:bg-gray-50')}`}
              >
                <input id="file-input" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processNewFile(e.target.files[0])} />
                {preview ? (
                  <img src={preview} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center px-4 pointer-events-none">
                    <Upload className={`mx-auto mb-2 transition-colors ${isDragging ? 'text-cn-gold' : 'text-gray-300 group-hover:text-cn-gold'}`} size={28} />
                    <p className="text-sm font-bold text-gray-600 mb-1">点击选择图片</p>
                    <p className="text-[10px] text-gray-400">( 或直接拖拽照片至此处 )</p>
                  </div>
                )}
                {preview && (
                   <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold tracking-widest border border-white px-3 py-1 rounded-full">点击更换</span>
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-start gap-1.5 text-[10px] text-gray-400 bg-gray-50 p-2 rounded">
                <Info size={12} className="shrink-0 mt-0.5 text-cn-gold" />
                <p>小贴士：建议上传<span className="text-cn-red font-bold">正面、五官清晰</span>的半身照或大头照，AI 融合效果更佳。</p>
              </div>
            </div>

            {/* Step 2: 角色 */}
            <div className="mb-10">
              <label className="text-sm font-bold text-cn-red flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full bg-cn-red text-white flex items-center justify-center text-xs">2</span>
                选择合影伙伴
              </label>
              <div className="grid grid-cols-5 gap-2">
                {CHARACTERS.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => { playSfx(sfxClick); setSelectedChar(char.id); }}
                    className={`h-12 flex flex-col items-center justify-center rounded-sm border transition-all
                      ${selectedChar === char.id ? 'bg-cn-red border-cn-red text-cn-gold shadow-md scale-105' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-cn-gold/30'}`}
                  >
                    <span className="text-xs font-bold leading-none">{char.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={!!status || !file}
              className={`mt-auto w-full py-4 rounded-lg font-bold tracking-[0.2em] transition-all relative overflow-hidden group
                ${!!status || !file ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none' : 'bg-cn-red text-cn-gold hover:bg-[#601010] shadow-xl hover:-translate-y-0.5'}`}
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {status ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span className="text-sm">
                      {status === 'compressing' && '照片预处理中...'}
                      {status === 'uploading' && '上传至工坊...'}
                      {status === 'generating' && 'AI 正在显影...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span className="text-base">生成新年海报</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* 右侧：预览区 */}
          <div className="flex-1 bg-[#EEECE5] p-6 md:p-12 relative flex items-center justify-center min-h-[500px]">
            <div className="absolute inset-0 bg-paper-texture opacity-30 mix-blend-multiply pointer-events-none"></div>
            
            <div className={`relative bg-white p-4 shadow-2xl transition-all duration-1000 ${posterUrl ? 'scale-100' : 'scale-[0.97] opacity-80'}`}>
              <div className="w-full max-w-[360px] aspect-[3/4] bg-[#F9F7F2] border border-gray-200 flex items-center justify-center relative overflow-hidden group">
                
                {!posterUrl && !status && (
                  <div className="text-center opacity-10 select-none">
                    <Sparkles size={64} className="mx-auto mb-6" />
                    <p className="writing-vertical font-bold text-3xl tracking-[1em] h-32 flex items-center justify-center">万象更新</p>
                  </div>
                )}

                {status && (
                  <div className="text-center z-10 p-8">
                    <div className="w-14 h-14 border-4 border-cn-red/10 border-t-cn-red rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-cn-red font-bold tracking-[0.4em] animate-pulse text-lg">新春锦绣 正在显现</p>
                    <p className="text-gray-400 text-[10px] mt-2 uppercase tracking-widest">Generating Masterpiece...</p>
                  </div>
                )}

                {posterUrl && (
                  <>
                    <img src={posterUrl} className="w-full h-full object-cover animate-fade-in" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-6 backdrop-blur-[2px]">
                      <a href={posterUrl} download target="_blank" className="flex items-center gap-2 bg-white text-cn-red px-6 py-3 rounded-full font-bold shadow-xl hover:bg-cn-gold hover:text-white transition-all transform hover:scale-105">
                        <Download size={18} />
                        保存到相册
                      </a>
                      <button onClick={() => { setPosterUrl(null); playSfx(sfxClick); }} className="text-white/70 hover:text-white flex items-center gap-1 text-xs border-b border-white/20 pb-0.5">
                        <RefreshCcw size={12} /> 重新制作
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="absolute bottom-6 right-6 writing-vertical text-[8px] text-gray-400 opacity-40 leading-none">二零二六 丙午年春 摄于新春映像馆</div>
            </div>
          </div>
        </main>

        <footer className="mt-10 text-white/30 text-[10px] tracking-[0.4em] text-center uppercase">
          Technology Driven by Dify AI Workflow · Quality Guaranteed
        </footer>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 1.2s ease-out forwards; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .bg-noise { background-image: url('https://www.transparenttextures.com/patterns/stardust.png'); }
        .bg-paper-texture { background-image: url('https://www.transparenttextures.com/patterns/cream-paper.png'); }
        .text-gold-gradient {
          background: linear-gradient(to bottom, #E5C585, #C5A059, #E5C585);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .animate-spin-slow { animation: spin 10s linear infinite; }
        .writing-vertical { writing-mode: vertical-rl; }
      `}</style>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);