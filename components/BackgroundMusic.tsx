import React, { useState, useRef, useEffect } from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';
import { AUDIO_CONFIG } from '../constants.ts';

export const BackgroundMusic: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Attempt auto-play on mount (often blocked by browsers without interaction, but worth a try)
    if (audioRef.current) {
        audioRef.current.volume = 0.4; // Slightly lower volume for background
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => setIsPlaying(true))
                .catch((error) => {
                    console.log("Autoplay prevented by browser, waiting for user interaction.");
                    setIsPlaying(false);
                });
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
      <audio 
        ref={audioRef} 
        src={AUDIO_CONFIG.BGM_URL} 
        loop 
      />
      
      <button
        onClick={togglePlay}
        className={`
          relative w-12 h-12 rounded-full flex items-center justify-center border-2 border-cn-gold shadow-lg
          transition-all duration-500 overflow-hidden
          ${isPlaying ? 'bg-cn-red animate-spin-slow' : 'bg-gray-800'}
        `}
        style={{ animationDuration: '3s' }}
        title="播放粤语贺岁金曲"
      >
        {/* Vinyl Record decorative lines */}
        <div className="absolute inset-0 rounded-full border border-white/10 m-1"></div>
        <div className="absolute inset-0 rounded-full border border-white/10 m-3"></div>
        
        {/* Icon */}
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

      {/* Tailwind Custom Animation Injection for this component */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        @keyframes music-bar {
            0%, 100% { height: 20%; }
            50% { height: 100%; }
        }
        .animate-music-bar-1 { animation: music-bar 0.6s ease-in-out infinite; }
        .animate-music-bar-2 { animation: music-bar 0.8s ease-in-out infinite; }
        .animate-music-bar-3 { animation: music-bar 0.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};