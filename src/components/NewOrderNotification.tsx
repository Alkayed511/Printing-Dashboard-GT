import React, { useEffect, useState } from 'react';
import { Bell, BellRing, Volume2, VolumeX, CheckCircle2, X, Printer, AlertTriangle } from 'lucide-react';
import { PrintJob } from '../types';

interface NewOrderNotificationProps {
  unacknowledgedJobs: PrintJob[];
  onAcknowledge: () => void;
  onSelectJob?: (job: PrintJob) => void;
}

export const NewOrderNotification: React.FC<NewOrderNotificationProps> = ({
  unacknowledgedJobs,
  onAcknowledge,
  onSelectJob,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [audioAllowed, setAudioAllowed] = useState(true);

  const count = unacknowledgedJobs.length;

  // Sound generator using Web Audio API
  useEffect(() => {
    if (count === 0 || isMuted) return;

    let audioCtx: AudioContext | null = null;
    let intervalId: any = null;

    const playChime = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        if (!audioCtx || audioCtx.state === 'closed') {
          audioCtx = new AudioContextClass();
        }

        if (audioCtx.state === 'suspended') {
          audioCtx.resume().then(() => setAudioAllowed(true)).catch(() => setAudioAllowed(false));
        }

        const now = audioCtx.currentTime;

        // Tone 1: High Pitch Alert (880Hz - A5)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.25);

        // Tone 2: Higher Escalating Pitch (1174Hz - D6)
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1174.66, now + 0.15);
        gain2.gain.setValueAtTime(0.35, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.55);

        // Tone 3: Third Echo Note (1318.5Hz - E6)
        const osc3 = audioCtx.createOscillator();
        const gain3 = audioCtx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(1318.5, now + 0.3);
        gain3.gain.setValueAtTime(0.3, now + 0.3);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc3.connect(gain3);
        gain3.connect(audioCtx.destination);
        osc3.start(now + 0.3);
        osc3.stop(now + 0.7);

      } catch (err) {
        console.error('Audio chime play error:', err);
      }
    };

    // Play immediately
    playChime();

    // Repeat every 2.2 seconds until user acknowledges
    intervalId = setInterval(playChime, 2200);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [count, isMuted]);

  if (count === 0) return null;

  return (
    <div className="fixed top-20 left-4 sm:left-6 z-50 dir-rtl max-w-md w-full animate-bounce-once">
      {/* Cascading layered backdrop effect */}
      <div className="relative">
        {/* Layer 3 (Bottom shadow card) */}
        <div className="absolute inset-0 translate-y-3 translate-x-2 bg-red-950/80 rounded-2xl border border-red-800/50 shadow-2xl pointer-events-none" />
        
        {/* Layer 2 (Middle card) */}
        <div className="absolute inset-0 translate-y-1.5 translate-x-1 bg-red-800/90 rounded-2xl border border-red-600/60 shadow-xl pointer-events-none" />

        {/* Main Foreground Cascading Card */}
        <div className="relative bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-4 sm:p-5 shadow-2xl shadow-red-900/80 border-2 border-red-400/80 backdrop-blur-md">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-red-400/40 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center p-2 bg-white/20 rounded-xl animate-pulse">
                <BellRing className="w-6 h-6 text-white animate-wiggle" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight flex items-center gap-2">
                  <span>طلب طباعة جديد!</span>
                  <span className="bg-yellow-300 text-red-950 text-xs px-2 py-0.5 rounded-full font-black font-mono">
                    {count} {count === 1 ? 'طلب' : 'طلبات'}
                  </span>
                </h3>
                <p className="text-xs text-red-100 font-medium">صوت التنبيه يعمل حتى تقوم بالملاحظة</p>
              </div>
            </div>

            {/* Mute toggle button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border transition-all ${
                isMuted
                  ? 'bg-red-900/60 border-red-400/50 text-red-200 hover:bg-red-900'
                  : 'bg-white/20 border-white/40 text-white hover:bg-white/30'
              }`}
              title={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 animate-pulse" />}
            </button>
          </div>

          {/* List of New Incoming Orders (Cascading items) */}
          <div className="space-y-2 max-h-48 overflow-y-auto pl-1 dir-rtl scrollbar-thin">
            {unacknowledgedJobs.slice(0, 4).map((job) => (
              <div
                key={job.id}
                onClick={() => onSelectJob?.(job)}
                className="bg-black/25 hover:bg-black/40 border border-white/20 rounded-xl p-2.5 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Printer className="w-4 h-4 text-yellow-300 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-white truncate dir-ltr text-right">{job.filename}</div>
                    <div className="text-[11px] text-red-200">
                      الطابعة: <span className="font-semibold text-yellow-200">{job.printer.toUpperCase()}</span> | {job.customerName || 'عميل جديد'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded text-red-100 shrink-0">
                  {job.dimensions}
                </span>
              </div>
            ))}

            {count > 4 && (
              <div className="text-center text-xs text-yellow-200 font-medium py-1">
                + {count - 4} طلبات إضافية في قائمة الانتظار
              </div>
            )}
          </div>

          {/* Action Button to Acknowledge / Stop Sound */}
          <div className="mt-4 pt-3 border-t border-red-400/40 flex items-center gap-2">
            <button
              onClick={onAcknowledge}
              className="flex-1 bg-white hover:bg-yellow-300 text-red-900 font-black text-sm py-2.5 px-4 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-red-700" />
              <span>إيقاف التنبيه وقراءة الطلبات</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
