import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, Download, AlertCircle, Eye } from 'lucide-react';
import { CharacterName, GenerationState } from './types.ts';
import { CHARACTERS, AUDIO_CONFIG } from './constants.ts';
import { uploadFileToDify, runDifyWorkflow } from './services/difyService.ts';
import { CharacterSelector } from './components/CharacterSelector.tsx';
import { ImageUploader } from './components/ImageUploader.tsx';
import { Fireworks } from './components/Fireworks.tsx';
import { BackgroundMusic } from './components/BackgroundMusic.tsx';

const App = () => {
  const [selectedChar, setSelectedChar] = useState<CharacterName>(CharacterName.PIPI);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    posterUrl: null,
  });
  
  // Audio Refs
  const sfxSuccessRef = useRef<HTMLAudioElement | null>(null);
  const sfxClickRef = useRef<HTMLAudioElement | null>(null);

  // Play Click Sound
  const playClickSound = () => {
    if (sfxClickRef.current) {
        sfxClickRef.current.currentTime = 0;
        sfxClickRef.current.volume = 0.4;
        sfxClickRef.current.play().catch(() => {});
    }
  };

  // Play Success Sound when poster is generated
  useEffect(() => {
    if (state.posterUrl && sfxSuccessRef.current) {
        sfxSuccessRef.current.currentTime = 0;
        sfxSuccessRef.current.volume = 0.6;
        sfxSuccessRef.current.play().catch(e => console.log("SFX blocked", e));
    }
  }, [state.posterUrl]);

  const handleGenerate = async () => {
    playClickSound();
    if (!file) {
      setState(prev => ({ ...prev, error: "请先上传一张照片" }));
      return;
    }

    setState({ isLoading: true, error: null, posterUrl: null });

    try {
      // Step 1: Upload File (Compression now happens inside this service)
      const fileId = await uploadFileToDify(file);
      
      // Step 2: Run Workflow
      const url = await runDifyWorkflow(fileId, selectedChar);
      
      setState({ isLoading: false, error: null, posterUrl: url });
    } catch (err: any) {
      console.error(err);
      setState({ 
        isLoading: false, 
        error: err.message || "生成失败，请更换照片重试。", 
        posterUrl: null 
      });
    }
  };

  const handleReset = () => {
    playClickSound();
    setFile(null);
    setState({ isLoading: false, error: null, posterUrl: null });
  };

  const handlePreviewMode = (e: React.MouseEvent) => {
    e.preventDefault();
    playClickSound();
    setState({
        isLoading: false,
        error: null,
        posterUrl: "https://images.unsplash.com/photo-1546188994-07c34f295f55?q=80&w=2070&auto=format&fit=crop"
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 font-serif bg-noise">
      <Fireworks trigger={!!state.posterUrl} />
      <BackgroundMusic />
      
      {/* SFX Audio Elements with preload none to save initial load time */}
      <audio ref={sfxSuccessRef} src={AUDIO_CONFIG.SUCCESS_SFX_URL} preload="none" />
      <audio ref={sfxClickRef} src={AUDIO_CONFIG.CLICK_SFX_URL} preload="none" />
      
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-cn-gold opacity-50 pointer-events-none"></div>
      <div className="fixed top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-cn-gold opacity-50 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-cn-gold opacity-50 pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-cn-gold opacity-50 pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-4xl relative z-10">
        
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-block border-b-2 border-cn-gold pb-2 mb-4">
            <span className="text-cn-gold tracking-[0.3em] text-sm uppercase">2026 New Year Special</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-cn-gold gold-text-shadow mb-4">
            新年合影
          </h1>
          <p className="text-white/80 text-lg italic max-w-lg mx-auto">
            与二零二六年的福气，来一场穿越时空的合照。
          </p>
        </header>

        {/* Content Area */}
        <div className="glass-panel text-gray-800 rounded-lg shadow-2xl p-6 md:p-10 transition-all duration-500">
          
          {state.error && (
             <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-4 rounded shadow-sm flex items-start gap-3" role="alert">
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <div>
                    <strong className="font-bold block mb-1">影像制作受阻</strong>
                    <span className="block text-sm">{state.error}</span>
                </div>
             </div>
          )}

          <div className="flex flex-col md:flex-row gap-10">
            
            {/* Left Column: Input Form */}
            <div className={`flex-1 transition-all duration-500 ${state.posterUrl ? 'hidden md:block md:w-1/3 md:opacity-50 pointer-events-none' : 'w-full'}`}>
              <ImageUploader 
                file={file} 
                onFileChange={(f) => { if(f) playClickSound(); setFile(f); }} 
                disabled={state.isLoading || !!state.posterUrl} 
              />
              
              <CharacterSelector 
                selected={selectedChar} 
                onSelect={(c) => { playClickSound(); setSelectedChar(c); }}
                disabled={state.isLoading || !!state.posterUrl}
              />

              {!state.posterUrl && (
                <button
                  onClick={handleGenerate}
                  disabled={state.isLoading || !file}
                  className={`
                    w-full py-4 text-lg font-bold uppercase tracking-wider text-white rounded-lg shadow-lg transition-all
                    flex items-center justify-center gap-2
                    ${state.isLoading || !file 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-cn-red to-cn-red-light hover:from-cn-gold hover:to-cn-gold-light hover:text-cn-red transform hover:-translate-y-1'}
                  `}
                >
                  {state.isLoading ? (
                    <>
                      <Loader2 className="animate-spin" /> 正在洗印中...
                    </>
                  ) : (
                    <>
                      <Sparkles /> 生成新年海报
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Right Column: Output / Result */}
            {(state.isLoading || state.posterUrl) && (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                
                {state.isLoading && (
                   <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-full h-96 bg-gray-200/50 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-paper-texture opacity-30"></div>
                        <div className="text-center relative z-10">
                          <Loader2 size={48} className="animate-spin text-cn-gold mx-auto mb-4" />
                          <p className="text-cn-red-light font-serif text-xl">正在冲印新年映像...</p>
                          <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Processing Image</p>
                        </div>
                      </div>
                   </div>
                )}

                {state.posterUrl && !state.isLoading && (
                  <div className="w-full flex flex-col items-center animate-fade-in-up">
                    <div className="relative p-2 bg-white shadow-2xl rounded-lg transform rotate-1 hover:rotate-0 transition-transform duration-500">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-cn-gold rounded-lg pointer-events-none z-10"></div>
                      <img 
                        src={state.posterUrl} 
                        alt="Generated Poster" 
                        className="w-full rounded h-auto max-h-[70vh] object-contain"
                      />
                    </div>
                    
                    <div className="flex gap-4 mt-8">
                       <a 
                        href={state.posterUrl} 
                        download="2026_NewYear_Poster.png"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-cn-gold text-cn-red font-bold py-3 px-6 rounded-full hover:bg-white hover:text-cn-gold transition-colors shadow-lg"
                       >
                         <Download size={20} /> 保存海报
                       </a>
                       <button
                        onClick={handleReset}
                        className="flex items-center gap-2 bg-transparent border-2 border-cn-red text-cn-red font-bold py-3 px-6 rounded-full hover:bg-cn-red hover:text-white transition-colors"
                       >
                         重新生成
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-12 text-center text-cn-gold/60 text-sm">
          <p>© 2026 新年照相馆 · Powered by Dify AI</p>
          <div className="mt-2">
            <a href="#" onClick={handlePreviewMode} className="inline-flex items-center gap-1 text-xs opacity-50 hover:opacity-100 border-b border-transparent hover:border-cn-gold transition-all">
                <Eye size={10} /> 预览设计样图
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;