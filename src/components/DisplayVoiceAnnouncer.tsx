import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, RotateCcw, X, Radio } from 'lucide-react';
import { VoiceNote } from '../types';

interface DisplayVoiceAnnouncerProps {
  myDepartment?: string | 'all' | null;
  language?: 'ar' | 'en';
}

export const DisplayVoiceAnnouncer: React.FC<DisplayVoiceAnnouncerProps> = ({
  myDepartment,
  language = 'ar'
}) => {
  const isAr = language === 'ar';
  
  const [activeVoiceNote, setActiveVoiceNote] = useState<VoiceNote | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const seenNoteIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchLatestVoiceNote = async () => {
    try {
      const res = await fetch(`/api/voice-notes?t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();
      const latest: VoiceNote | null = data.latestVoiceNote;

      if (!latest) return;

      // Filter by department if target specified
      if (
        latest.departmentId &&
        latest.departmentId !== 'all' &&
        myDepartment &&
        myDepartment !== 'all' &&
        latest.departmentId !== myDepartment
      ) {
        return;
      }

      // If new voice note detected
      if (latest.id && latest.id !== seenNoteIdRef.current) {
        seenNoteIdRef.current = latest.id;
        setActiveVoiceNote(latest);
        setAudioError(false);
        playAudioNote(latest.audioUrl);
      }
    } catch (e) {
      console.error('Error fetching voice notes:', e);
    }
  };

  const playAudioNote = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        console.error('Autoplay error:', err);
        setAudioError(true);
      });

    audio.onended = () => {
      setIsPlaying(false);
    };
  };

  const handleReplay = () => {
    if (activeVoiceNote) {
      playAudioNote(activeVoiceNote.audioUrl);
    }
  };

  const handleDismiss = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setActiveVoiceNote(null);
  };

  useEffect(() => {
    // Initial fetch and poll every 3 seconds
    fetchLatestVoiceNote();
    const interval = setInterval(fetchLatestVoiceNote, 3000);
    return () => clearInterval(interval);
  }, [myDepartment]);

  if (!activeVoiceNote) return null;

  return (
    <div className="fixed inset-x-0 top-6 z-50 px-4 max-w-2xl mx-auto pointer-events-auto animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-red-950/95 via-zinc-900/95 to-red-950/95 border-2 border-red-500/80 rounded-2xl p-5 shadow-[0_0_50px_rgba(239,68,68,0.4)] backdrop-blur-xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 rounded-xl text-white shadow-lg shadow-red-600/40 animate-pulse">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-red-500/20 text-red-300 font-bold px-2.5 py-0.5 rounded-full border border-red-500/40">
                  {isAr ? 'تنبيه صوتي مباشر من الإدارة' : 'Live Management Voice Alert'}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {new Date(activeVoiceNote.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                <span>{activeVoiceNote.sender || (isAr ? 'إدارة المطبعة' : 'Management')}</span>
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Animated Audio Equalizer Visualizer */}
        <div className="flex items-center justify-between gap-4 bg-black/40 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <Volume2 className={`w-6 h-6 ${isPlaying ? 'text-red-400 animate-bounce' : 'text-zinc-500'}`} />
            <div className="flex items-center gap-1 h-8">
              {[...Array(12)].map((_, i) => (
                <span
                  key={i}
                  className={`w-1 bg-red-500 rounded-full transition-all duration-150 ${
                    isPlaying ? 'animate-pulse' : 'h-2 opacity-30'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(15, (i % 5) * 6 + 10)}px` : '8px',
                    animationDelay: `${(i % 4) * 0.15}s`
                  }}
                ></span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {audioError && (
              <button
                type="button"
                onClick={handleReplay}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isAr ? 'اضغط لتشغيل الصوت' : 'Click to Play Audio'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReplay}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 border border-zinc-700"
            >
              <RotateCcw className="w-3.5 h-3.5 text-secondary-400" />
              <span>{isAr ? 'إعادة التشغيل' : 'Replay'}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded-lg"
            >
              {isAr ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
