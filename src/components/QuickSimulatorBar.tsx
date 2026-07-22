import React from 'react';
import { Sparkles, Plus, RefreshCw, Layers } from 'lucide-react';
import { PrinterType, PrintJob } from '../types';

interface QuickSimulatorBarProps {
  onAddQuickJob: (printer: PrinterType) => void;
  onAutoPoll: () => void;
  isPolling: boolean;
}

export const QuickSimulatorBar: React.FC<QuickSimulatorBarProps> = ({
  onAddQuickJob,
  onAutoPoll,
  isPolling,
}) => {
  return (
    <div className="bg-zinc-900/90 border-t border-zinc-800 backdrop-blur-md px-4 py-2.5 fixed bottom-0 left-0 right-0 z-20 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left Label */}
        <div className="flex items-center gap-2 text-zinc-300 font-semibold">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>اختبار سريع لإيداع الملفات بالشبكة:</span>
        </div>

        {/* Quick Printer Add Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <button
            onClick={() => onAddQuickJob('eco')}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/70 transition-all font-mono font-bold flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            + ECO
          </button>

          <button
            onClick={() => onAddQuickJob('solvint')}
            className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300 hover:bg-amber-900/70 transition-all font-mono font-bold flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            + SOLVINT
          </button>

          <button
            onClick={() => onAddQuickJob('dtf')}
            className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-300 hover:bg-purple-900/70 transition-all font-mono font-bold flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            + DTF
          </button>

          <button
            onClick={() => onAddQuickJob('cutter')}
            className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 hover:bg-rose-900/70 transition-all font-mono font-bold flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            + CUTTER
          </button>

          <button
            onClick={() => onAddQuickJob('flat')}
            className="px-2.5 py-1 rounded-lg bg-orange-950/60 border border-orange-800/60 text-orange-300 hover:bg-orange-900/70 transition-all font-mono font-bold flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            + FLAT
          </button>
        </div>

        {/* Polling Indicator */}
        <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>المراقبة المباشرة للمجلدات نشطة</span>
        </div>

      </div>
    </div>
  );
};
