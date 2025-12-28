import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Loader2, Sparkles, Download, AlertCircle, Eye, Music, Volume2, VolumeX, Upload, X, Image as ImageIcon } from 'lucide-react';

console.log('App script starting...');

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
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

interface DifyWorkflowResponse {
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: {
      poster_url: string;
      [key: string]: any;
    };
    error: any;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

// --- CONSTANTS ---
const DIFY_API_KEY = "app-jehf2wTtMhaNfYkGflbtXHFX";
const DIFY_BASE_URL = "https://api.dify.ai/v1";

const CHARACTERS = [
  { id: CharacterName.PIPI, label: "皮皮", desc: "活泼可爱" },
  { id: CharacterName.SHANDIAN, label: "闪电", desc: "聪明机智" },
  { id: CharacterName.TANGTANG, label: "糖糖", desc: "甜美贴心" },
  { id: CharacterName.ZACK, label: "Zack", desc: "帅气酷炫" },
  { id: CharacterName.BADOU, label: "八斗", desc: "憨厚老实" },
];

const AUDIO_CONFIG = {
  BGM_URL: "https://ia800403.us.archive.org/21/items/CNY_Music/GongXiGongXi.mp3", 
  SUCCESS_SFX_URL: "https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/pause.mp3" 
};

// --- SERVICES ---
const uploadFileToDify = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user", "web-client-user");

  const response = await fetch(`${DIFY_BASE_URL}/files/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DIFY_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `File upload failed: ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) errorMsg = errorJson.message;
    } catch (e) {
      const text = await response.text();
      if (text) errorMsg += ` ${text}`;
    }
    throw new Error(errorMsg);
  }

  const data: DifyFileUploadResponse = await response.json();
  return data.id;
};

const runDifyWorkflow = async (
  fileId: string,
  characterName: string
): Promise<string> => {
  const payload = {
    inputs: {
      ip_name: characterName,
      user_image: {
        type: "image",
        transfer_method: "local_file",
        upload_file_id: fileId,
      },
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

  if (!response.ok) {
    let errorMsg = `Workflow execution failed: ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) {
        errorMsg = errorJson.message;
      } else {
        errorMsg = JSON.stringify(errorJson);
      }
    } catch (e) {
      const text = await response.text();
      if (text) errorMsg += ` ${text}`;
    }
    throw new Error(errorMsg);
  }

  const result: DifyWorkflowResponse = await response.json();
  
  if (result.data.status === "failed") {
    throw new Error("Workflow reported failure status.");
  }

  if (!result.data.outputs || !result.data.outputs.poster_url) {
     throw new Error("Workflow finished but did not return a poster_url.");
  }

  return result.data.outputs.poster_url;
};

// --- COMPONENTS ---

// 1. Fireworks
declare const confetti: any;
const Fireworks: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  useEffect(() => {
    if (trigger && typeof confetti === 'function') {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
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
        audioRef.current.volume = 0.4;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
        }
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-center gap-2">
      <audio ref={audioRef} src={AUDIO_CONFIG.BGM_URL} loop />
      <button
        onClick={togglePlay}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 border-cn-gold shadow-lg transition-all duration-500 overflow-hidden ${isPlaying ? 'bg-cn-red animate-spin-slow' : 'bg-gray-800'}`}
        style={{ animationDuration: '3s' }}
      >
        <div className="absolute inset-0 rounded-full border border-white/10 m-1"></div>
        <div className="absolute inset-0 rounded-full border border-white/10 m-3"></div>
        <div className={`relative z-10 text-cn-gold ${isPlaying ? '' : 'ml-0.5'}`}>
          {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </div>
      </button>
      {isPlaying && (
        <div className="flex gap-1 h-3 items-end justify-center">
            <div className="w-1 bg-cn-gold animate-music-bar-1"></div>
            <div className="w-1 bg-cn-gold animate-music-bar-2"></div>
            <div className="w-1 bg-cn-gold animate-music-bar-3"></div>
        </div>
      )}
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }
        @keyframes music-bar { 0%, 100% { height: 20%; } 50% { height: 100%; } }
        .animate-music-bar-1 { animation: music-bar 0.6s ease-in-out infinite; }
        .animate-music-bar-2 { animation: music-bar 0.8s ease-in-out infinite; }
        .animate-music-bar-3 { animation: music-bar 0.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

// 3. ImageUploader
const ImageUploader: React.FC<{ file: File | null; onFileChange: (f: File | null) => void; disabled: boolean }> = ({ file, onFileChange, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
    onFileChange(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="mb-8">
      <label className="block text-cn-red-light font-serif font-bold text-lg mb-4 text-center">上传您的照片 / Upload Photo</label>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative w-full aspect-[4/3] sm:aspect-[16/9] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${isDragging ? 'border-cn-gold bg-cn-gold/10' : 'border-gray-300 hover:border-cn-gold'} ${disabled ? 'cursor-not-allowed opacity-70' : ''} ${preview ? 'border-solid border-cn-gold' : 'bg-gray-50'}`}
      >
        <input type="file" ref={inputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])} disabled={disabled} />
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            {!disabled && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={clearFile} className="bg-white/90 p-3 rounded-full text-cn-red hover:scale-110 transition-transform shadow-lg"><X size={24} /></button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <div className="p-4 rounded-full bg-gray-100 mb-3 group-hover:scale-110 transition-transform duration-300">
              <Upload size={32} className="text-gray-400 group-hover:text-cn-gold" />
            </div>
            <p className="font-serif text-sm">点击或拖拽上传照片</p>
            <p className="text-xs text-gray-300 mt-1">支持 JPG, PNG</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 4. CharacterSelector
const CharacterSelector: React.FC<{ selected: CharacterName; onSelect: (c: CharacterName) => void; disabled: boolean }> = ({ selected, onSelect, disabled }) => {
  return (
    <div className="mb-8">
      <label className="block text-cn-red-light font-serif font-bold text-lg mb-4 text-center">选择您的合影伙伴 / Select Partner</label>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {CHARACTERS.map((char) => {
          const isSelected = selected === char.id;
          return (
            <button
              key={char.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(char.id)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-300 ${isSelected ? 'border-cn-gold bg-cn-gold/10 scale-105 shadow-md' : 'border-gray-200 hover:border-cn-red-light/50 bg-transparent'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} `}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-2 ${isSelected ? 'bg-cn-red text-cn-gold' : 'bg-gray-100 text-gray-500'}`}>{char.label[0]}</div>
              <span className={`font-serif font-bold text-sm ${isSelected ? 'text-cn-red' : 'text-gray-600'}`}>{char.label}</span>
              {isSelected && <div className="absolute -top-2 -right-2 bg-cn-gold text-white text-xs rounded-full px-1.5 py-0.5 shadow-sm">✔</div>}
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
        sfxRef.current.volume = 0.6;
        sfxRef.current.play().catch(e => console.log("SFX autoplay blocked", e));
    }
  }, [state.posterUrl]);

  const handleGenerate = async () => {
    if (!file) {
      setState(prev => ({ ...prev, error: "请先上传一张照片 (Please upload a photo first)" }));
      return;
    }
    setState({ isLoading: true, error: null, posterUrl: null });
    try {
      const fileId = await uploadFileToDify(file);
      const url = await runDifyWorkflow(fileId, selectedChar);
      setState({ isLoading: false, error: null, posterUrl: url });
    } catch (err: any) {
      let msg = err.message || "生成失败，请稍后重试";
      if (msg.includes("Workflow not published")) {
        msg = "⚠️ 工作流未发布。请前往 Dify 控制台点击右上角 '发布' 按钮。";
      }
      setState({ isLoading: false, error: msg, posterUrl: null });
    }
  };

  const handleReset = () => {
    setFile(null);
    setState({ isLoading: false, error: null, posterUrl: null });
  };

  const handlePreviewMode = (e: React.MouseEvent) => {
    e.preventDefault();
    setState({ isLoading: false, error: null, posterUrl: "https://images.unsplash.com/photo-1546188994-07c34f295f55?q=80&w=2070&auto=format&fit=crop" });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 font-serif bg-noise">
      <Fireworks trigger={!!state.posterUrl} />
      <BackgroundMusic />
      <audio ref={sfxRef} src={AUDIO_CONFIG.SUCCESS_SFX_URL} />
      <div className="fixed top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-cn-gold opacity-50 pointer-events-none"></div>
      <div className="fixed top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-cn-gold opacity-50 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-cn-gold opacity-50 pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-cn-gold opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-4xl relative z-10">
        <header className="text-center mb-10">
          <div className="inline-block border-b-2 border-cn-gold pb-2 mb-4">
            <span className="text-cn-gold tracking-[0.3em] text-sm uppercase">2025 New Year Special</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-cn-gold gold-text-shadow mb-4">新年合影</h1>
          <p className="text-white/80 text-lg italic max-w-lg mx-auto">Create your exclusive New Year magazine cover with our star characters.</p>
        </header>

        <div className="glass-panel text-gray-800 rounded-lg shadow-2xl p-6 md:p-10 transition-all duration-500">
          {state.error && (
             <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-4 rounded shadow-sm flex items-start gap-3" role="alert">
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <div><strong className="font-bold block mb-1">Could not generate poster</strong><span className="block text-sm">{state.error}</span></div>
             </div>
          )}

          <div className="flex flex-col md:flex-row gap-10">
            <div className={`flex-1 transition-all duration-500 ${state.posterUrl ? 'hidden md:block md:w-1/3 md:opacity-50 pointer-events-none' : 'w-full'}`}>
              <ImageUploader file={file} onFileChange={setFile} disabled={state.isLoading || !!state.posterUrl} />
              <CharacterSelector selected={selectedChar} onSelect={setSelectedChar} disabled={state.isLoading || !!state.posterUrl} />
              {!state.posterUrl && (
                <button
                  onClick={handleGenerate}
                  disabled={state.isLoading || !file}
                  className={`w-full py-4 text-lg font-bold uppercase tracking-wider text-white rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 ${state.isLoading || !file ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-cn-red to-cn-red-light hover:from-cn-gold hover:to-cn-gold-light hover:text-cn-red transform hover:-translate-y-1'}`}
                >
                  {state.isLoading ? <><Loader2 className="animate-spin" /> Generating...</> : <><Sparkles /> Generate Poster</>}
                </button>
              )}
            </div>

            {(state.isLoading || state.posterUrl) && (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                {state.isLoading && (
                   <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
                      <div className="w-full h-96 bg-gray-200/50 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 size={48} className="animate-spin text-cn-gold mx-auto mb-4" />
                          <p className="text-cn-red-light font-serif text-xl">Creating Magic...</p>
                          <p className="text-gray-500 text-sm mt-2">Connecting to AI Studio</p>
                        </div>
                      </div>
                   </div>
                )}
                {state.posterUrl && !state.isLoading && (
                  <div className="w-full flex flex-col items-center animate-fade-in-up">
                    <div className="relative p-2 bg-white shadow-2xl rounded-lg transform rotate-1 hover:rotate-0 transition-transform duration-500">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-cn-gold rounded-lg pointer-events-none z-10"></div>
                      <img src={state.posterUrl} alt="Generated Poster" className="w-full rounded h-auto max-h-[70vh] object-contain" />
                    </div>
                    <div className="flex gap-4 mt-8">
                       <a href={state.posterUrl} download="NewYearPoster.png" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-cn-gold text-cn-red font-bold py-3 px-6 rounded-full hover:bg-white hover:text-cn-gold transition-colors shadow-lg"><Download size={20} /> Download</a>
                       <button onClick={handleReset} className="flex items-center gap-2 bg-transparent border-2 border-cn-red text-cn-red font-bold py-3 px-6 rounded-full hover:bg-cn-red hover:text-white transition-colors">Create Another</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <footer className="mt-12 text-center text-cn-gold/60 text-sm">
          <p>© 2025 New Year Studio. Powered by Dify & AI.</p>
          <div className="mt-2">
            <a href="#" onClick={handlePreviewMode} className="inline-flex items-center gap-1 text-xs opacity-50 hover:opacity-100 border-b border-transparent hover:border-cn-gold transition-all"><Eye size={10} /> Test Design Preview (No API)</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");
const root = ReactDOM.createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);