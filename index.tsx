import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Loader2, Sparkles, Download, AlertCircle, Eye, Volume2, VolumeX, Upload, X, ChevronRight, Wand2, RefreshCcw } from 'lucide-react';

// --- TYPES ---
enum CharacterName {
  PIPI = '皮皮',
  SHANDIAN = '闪电',
  TANGTANG = '糖糖',
  ZACK = 'Zack',
  BADOU = '八斗'
}

interface GenerationState {
  isLoading: boolean;
  error: string | null;
  posterUrl: string | null;
}

interface DifyFileUploadResponse {
  id: string;
}

interface DifyWorkflowResponse {
  data: {
    status: string;
    outputs: {
      poster_url: string;
    };
  };
}

// --- CONSTANTS ---
const DIFY_API_KEY = "app-jehf2wTtMhaNfYkGflbtXHFX";
const DIFY_BASE_URL = "https://api.dify.ai/v1";

const CHARACTERS = [
  { id: CharacterName.PIPI, label: "皮皮", desc: "活泼", color: "bg-orange-50" },
  { id: CharacterName.SHANDIAN, label: "闪电", desc: "机智", color: "bg-blue-50" },
  { id: CharacterName.TANGTANG, label: "糖糖", desc: "甜美", color: "bg-pink-50" },
  { id: CharacterName.ZACK, label: "Zack", desc: "酷炫", color: "bg-purple-50" },
  { id: CharacterName.BADOU, label: "八斗", desc: "憨厚", color: "bg-green-50" },
];

const AUDIO_CONFIG = {
  BGM_URL: "https://ia800503.us.archive.org/15/items/ChineseNewYearMusic/Chinese%20New%20Year%20Music%20-%2001%20-%20Spring%20Festival%20Overture.mp3", 
  SUCCESS_SFX_URL: "https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/pause.mp3" 
};

// --- SERVICES ---
const uploadFileToDify = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user", "web-client-user");

  const response = await fetch(`${DIFY_BASE_URL}/files/upload`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${DIFY_API_KEY}` },
    body: formData,
  });

  if (!response.ok) throw new Error("图片上传失败，请重试。");
  const data: DifyFileUploadResponse = await response.json();
  return data.id;
};

const runDifyWorkflow = async (fileId: string, characterName: string): Promise<string> => {
  const payload = {
    inputs: {
      ip_name: characterName,
      user_image: { type: "image", transfer_method: "local_file", upload_file_id: fileId },
    },
    response_mode: "blocking",
    user: "web-client-user-" + Date.now(),
  };

  const response = await fetch(`${DIFY_BASE_URL}/workflows/run`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DIFY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("生成任务启动失败。");
  const result: DifyWorkflowResponse = await response.json();
  
  if (result.data.status === "failed" || !result.data.outputs?.poster_url) {
     throw new Error("AI 未能成功生成海报，请稍后重试。");
  }
  return result.data.outputs.poster_url;
};

// --- COMPONENTS ---

// 1. Fireworks
declare const confetti: any;
const Fireworks: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  useEffect(() => {
    if (trigger && typeof confetti === 'function') {
      const duration = 4000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999, colors: ['#C5A059', '#7A1A1A', '#FFFFFF'] };
      
      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 40 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: 0.1 + Math.random() * 0.2, y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: 0.7 + Math.random() * 0.2, y: Math.random() - 0.2 } }));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [trigger]);
  return null;
};

// 2. BackgroundMusic
const BackgroundMusic: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
        // Just set the volume, do not call play() by default
        audioRef.current.volume = 0.3; 
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Playback prevented:", error);
            });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col items-center gap-2">
      <audio 
        ref={audioRef} 
        src={AUDIO_CONFIG.BGM_URL} 
        loop 
      />
      
      <button
        onClick={togglePlay}
        className={`
          relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center 
          shadow-[0_0_15px_rgba(197,160,89,0.5)] border-2 border-[#C5A059]
          transition-all duration-500 overflow-hidden group
          ${isPlaying ? 'bg-[#7A1A1A] animate-spin-slow' : 'bg-black/40 hover:bg-[#7A1A1A]'}
        `}
        title={isPlaying ? "暂停音乐" : "播放春节序曲"}
      >
        <div className="absolute inset-1 rounded-full border border-[#C5A059]/30 border-dashed"></div>
        <div className={`relative z-10 text-[#C5A059] transition-transform duration-300 ${isPlaying ? 'scale-110' : 'scale-100'}`}>
          {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      </button>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

// 3. ImageUploader
const ImageUploader: React.FC<{ file: File | null; onFileChange: (f: File | null) => void; disabled: boolean }> = ({ file, onFileChange, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!file) setPreview(null);
  }, [file]);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
    onFileChange(selectedFile);
  };

  return (
    <div className="group animate-slide-up-stagger" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center justify-between mb-3">
        <label className="text-cn-red font-bold text-base tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cn-gold rotate-45 inline-block"></span>
          上传肖像
        </label>
        {preview && !disabled && (
           <button onClick={(e) => { e.stopPropagation(); onFileChange(null); if(inputRef.current) inputRef.current.value=''; }} className="text-xs text-gray-400 hover:text-cn-red transition-colors border-b border-transparent hover:border-cn-red">清除</button>
        )}
      </div>
      
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(!disabled && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        className={`
          relative w-full h-48 rounded-sm border transition-all duration-500 ease-out cursor-pointer overflow-hidden
          ${isDragging ? 'border-cn-gold bg-cn-gold/5 border-solid' : 'border-dashed border-gray-300 hover:border-cn-gold/50 hover:bg-paper'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          ${preview ? 'bg-gray-100 border-none shadow-inner' : ''}
        `}
      >
        <input type="file" ref={inputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} disabled={disabled} />
        
        {preview ? (
          <div className="w-full h-full relative">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <span className="text-white opacity-0 hover:opacity-100 transition-opacity">更换图片</span>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <div className="p-3 mb-2 rounded-full border border-gray-200 group-hover:border-cn-gold/30 transition-colors">
                 <Upload size={20} className="text-gray-300 group-hover:text-cn-gold transition-colors" />
            </div>
            <p className="font-serif text-sm text-gray-500 tracking-wide">点击或拖拽上传照片</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 4. CharacterSelector
const CharacterSelector: React.FC<{ selected: CharacterName; onSelect: (c: CharacterName) => void; disabled: boolean }> = ({ selected, onSelect, disabled }) => {
  return (
    <div className="animate-slide-up-stagger" style={{ animationDelay: '0.2s' }}>
      <label className="text-cn-red font-bold text-base tracking-widest flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 bg-cn-gold rotate-45 inline-block"></span>
        挑选伙伴
      </label>
      <div className="grid grid-cols-5 gap-3">
        {CHARACTERS.map((char, idx) => {
          const isSelected = selected === char.id;
          return (
            <button
              key={char.id}
              disabled={disabled}
              onClick={() => onSelect(char.id)}
              className={`
                relative flex flex-col items-center gap-2 p-2 rounded-sm transition-all duration-300 group
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white hover:shadow-sm'}
                ${isSelected ? 'bg-white shadow-md ring-1 ring-cn-gold/30' : ''}
              `}
            >
              <div className={`
                w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500
                ${isSelected 
                  ? 'bg-cn-red text-cn-gold scale-110 shadow-inner' 
                  : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'}
              `}>
                {char.label[0]}
              </div>
              <span className={`text-xs font-bold tracking-wide transition-colors font-serif ${isSelected ? 'text-cn-red' : 'text-gray-400'}`}>
                {char.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- APP COMPONENT ---
const App = () => {
  const [selectedChar, setSelectedChar] = useState<CharacterName>(CharacterName.PIPI);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<GenerationState>({ isLoading: false, error: null, posterUrl: null });
  const sfxRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (state.posterUrl && sfxRef.current) {
        sfxRef.current.currentTime = 0;
        sfxRef.current.volume = 0.5;
        sfxRef.current.play().catch(() => {});
    }
  }, [state.posterUrl]);

  const handleGenerate = async () => {
    if (!file) return;
    setState({ isLoading: true, error: null, posterUrl: null });
    try {
      const fileId = await uploadFileToDify(file);
      const url = await runDifyWorkflow(fileId, selectedChar);
      setState({ isLoading: false, error: null, posterUrl: url });
    } catch (err: any) {
      setState({ isLoading: false, error: err.message, posterUrl: null });
    }
  };

  const handleReset = () => {
    setFile(null);
    setState({ isLoading: false, error: null, posterUrl: null });
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    setState({ isLoading: false, error: null, posterUrl: "https://images.unsplash.com/photo-1546188994-07c34f295f55?q=80&w=2070&auto=format&fit=crop" });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center font-serif relative bg-[#7A1A1A] text-[#2C2C2C]">
      {/* Dynamic Backgrounds */}
      <div className="fixed inset-0 bg-noise opacity-20 pointer-events-none mix-blend-overlay z-0"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_30%,_#9E2A2B_0%,_#7A1A1A_80%)] pointer-events-none z-0"></div>
      
      {/* Decorative Traditional Elements */}
      <div className="fixed top-0 left-0 p-8 pointer-events-none z-0 opacity-30">
        <div className="writing-vertical text-6xl font-bold text-black mix-blend-soft-light select-none tracking-[0.5em]">恭贺新禧</div>
      </div>
      <div className="fixed bottom-0 right-0 p-8 pointer-events-none z-0 opacity-30">
        <div className="writing-vertical text-6xl font-bold text-black mix-blend-soft-light select-none tracking-[0.5em]">万事胜意</div>
      </div>

      <Fireworks trigger={!!state.posterUrl} />
      <BackgroundMusic />
      <audio ref={sfxRef} src={AUDIO_CONFIG.SUCCESS_SFX_URL} />
      
      {/* Main Container */}
      <div className="relative z-10 w-full max-w-7xl px-4 py-8 md:py-12 flex flex-col items-center">
        
        {/* Header Section */}
        <header className="text-center mb-10 md:mb-14 relative w-full">
            <div className="inline-flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-4 text-cn-gold/80 mb-2">
                    <span className="h-[1px] w-12 bg-cn-gold/50"></span>
                    <span className="text-xs tracking-[0.4em] uppercase">Private Customization</span>
                    <span className="h-[1px] w-12 bg-cn-gold/50"></span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold text-gold-gradient tracking-widest drop-shadow-md">
                    二零二六
                </h1>
                
                <div className="flex items-center gap-3 mt-2">
                    <span className="bg-cn-gold text-cn-red text-xs px-2 py-0.5 font-bold rounded-sm">丙午年</span>
                    <h2 className="text-2xl md:text-3xl text-white/90 font-light tracking-[0.2em]">
                        新春 · 映像
                    </h2>
                </div>
            </div>
        </header>

        {/* Content Card - Magazine Layout */}
        <div className="w-full bg-paper rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] flex flex-col md:flex-row overflow-hidden relative border-4 border-double border-cn-gold/20 min-h-[600px]">
            
            {/* LEFT: Editor Panel (40%) */}
            <div className="w-full md:w-[400px] lg:w-[450px] bg-[#FDFBF7] p-8 md:p-10 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 z-20 shrink-0">
                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-cn-red mb-1">定制工坊</h3>
                    <p className="text-xs text-gray-400 tracking-wider">CUSTOM STUDIO</p>
                </div>

                <div className="flex-1 flex flex-col gap-8">
                     {state.error && (
                        <div className="bg-red-50 border border-red-200 text-cn-red text-sm px-4 py-3 rounded-sm flex items-start gap-2">
                           <AlertCircle size={16} className="mt-0.5 shrink-0" />
                           <span>{state.error}</span>
                        </div>
                     )}

                     <ImageUploader file={file} onFileChange={setFile} disabled={state.isLoading} />
                     <CharacterSelector selected={selectedChar} onSelect={setSelectedChar} disabled={state.isLoading} />
                </div>

                <div className="mt-10 pt-6 border-t border-dashed border-gray-300">
                    <button
                        onClick={handleGenerate}
                        disabled={state.isLoading || !file}
                        className={`
                          w-full py-4 text-base font-bold tracking-[0.2em] transition-all duration-500
                          flex items-center justify-center gap-3 relative overflow-hidden group
                          ${state.isLoading || !file 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-cn-red text-cn-gold hover:bg-[#601010] shadow-lg hover:shadow-xl'}
                        `}
                    >
                        {state.isLoading ? (
                            <><Loader2 className="animate-spin" size={18} /> 正在冲印中...</>
                        ) : (
                            <>
                                <Wand2 size={18} /> 
                                <span className="relative z-10">生成贺岁海报</span>
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            </>
                        )}
                    </button>
                    <div className="text-center mt-4">
                        <a href="#" onClick={handlePreview} className="text-[10px] text-gray-300 hover:text-cn-red transition-colors tracking-widest border-b border-transparent hover:border-cn-red/50 pb-0.5">
                            预览设计效果
                        </a>
                    </div>
                </div>
            </div>

            {/* RIGHT: Preview Canvas (Flex Grow) */}
            <div className="flex-1 bg-[#EEECE5] relative flex flex-col items-center justify-center p-8 md:p-12 min-h-[500px]">
                {/* Texture Overlay */}
                <div className="absolute inset-0 bg-paper-texture opacity-50 mix-blend-multiply pointer-events-none"></div>
                
                {/* Decorative Frame Lines */}
                <div className="absolute top-6 left-6 w-full h-[1px] bg-gray-300"></div>
                <div className="absolute top-6 left-6 w-[1px] h-full bg-gray-300"></div>
                <div className="absolute bottom-6 right-6 w-full h-[1px] bg-gray-300"></div>
                <div className="absolute bottom-6 right-6 w-[1px] h-full bg-gray-300"></div>

                {/* The Poster Frame */}
                <div className={`
                    relative bg-white p-4 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                    ${state.posterUrl ? 'scale-100 opacity-100 rotate-0' : 'scale-95 opacity-80'}
                `}>
                    <div className="relative border border-gray-100 bg-white w-full max-w-[400px] aspect-[3/4] flex items-center justify-center overflow-hidden">
                        
                        {!state.posterUrl && !state.isLoading && (
                            <div className="text-center p-8 opacity-40">
                                <div className="w-20 h-20 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="text-gray-400" size={24} />
                                </div>
                                <div className="writing-vertical mx-auto h-24 text-gray-500 font-bold tracking-widest text-lg">虚位以待</div>
                            </div>
                        )}

                        {state.isLoading && (
                            <div className="flex flex-col items-center z-10">
                                <div className="w-16 h-16 border-2 border-cn-red/10 border-t-cn-red rounded-full animate-spin mb-6"></div>
                                <p className="text-cn-red font-bold tracking-[0.3em] animate-pulse">影像显影中...</p>
                            </div>
                        )}

                        {state.posterUrl && !state.isLoading && (
                            <img 
                                src={state.posterUrl} 
                                alt="2026 New Year Poster" 
                                className="w-full h-full object-cover animate-fade-in block"
                            />
                        )}
                        
                        {/* Overlay Actions */}
                        {state.posterUrl && (
                             <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                                <a 
                                    href={state.posterUrl} 
                                    download="2026_NewYear_Poster.png"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-white text-cn-red w-12 h-12 rounded-full flex items-center justify-center hover:bg-cn-gold hover:text-white transition-all shadow-xl hover:scale-110"
                                    title="下载高清原图"
                                >
                                    <Download size={20} />
                                </a>
                                <button
                                    onClick={handleReset}
                                    className="bg-white text-gray-600 w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all shadow-xl hover:scale-110"
                                    title="重新制作"
                                >
                                    <RefreshCcw size={20} />
                                </button>
                             </div>
                        )}
                    </div>
                </div>

                {/* Footer Mark */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 tracking-[0.3em] uppercase opacity-60">
                    2026 Lunar New Year Collection
                </div>
            </div>
        </div>

        <footer className="mt-8 text-white/40 text-xs font-light tracking-widest">
            © 2026 新年照相馆 · 技术支持 Dify AI
        </footer>

      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");
const root = ReactDOM.createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);