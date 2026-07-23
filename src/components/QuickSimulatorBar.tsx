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
    <div className="bg-zinc-900 border-t border-zinc-800 px-3 py-1.5 shrink-0 shadow-xl z-20">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        
        {/* Left Label */}
        <div className="flex items-center gap-2 text-zinc-300 font-semibold text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>إيداع سريع للملفات:</span>
        </div>

        {/* Quick Printer Add Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-1">
          <button
            onClick={() => onAddQuickJob('eco')}
            className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/70 transition-all font-mono font-bold text-[11px] flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            + ECO
          </button>

          <button
            onClick={() => onAddQuickJob('solvint')}
            className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/60 text-amber-300 hover:bg-amber-900/70 transition-all font-mono font-bold text-[11px] flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            + SOLVINT
          </button>

          <button
            onClick={() => onAddQuickJob('r2r')}
            className="px-2 py-0.5 rounded-md bg-blue-950/60 border border-blue-800/60 text-blue-300 hover:bg-blue-900/70 transition-all font-mono font-bold text-[11px] flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            + R2R
          </button>

          <button
            onClick={() => onAddQuickJob('cutter')}
            className="px-2 py-0.5 rounded-md bg-rose-950/60 border border-rose-800/60 text-rose-300 hover:bg-rose-900/70 transition-all font-mono font-bold text-[11px] flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            + CUTTER
          </button>

          <button
            onClick={() => onAddQuickJob('dtf')}
            className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/60 text-purple-300 hover:bg-purple-900/70 transition-all font-mono font-bold text-[11px] flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            + DTF
          </button>

          <button
            onClick={() => onAddQuickJob('flat')}
            className="px-2 py-0.5 rounded-md bg-orange-950/60 border border-orange-800/60 text-orange-300 hover:bg-orange-900/70 transition-all font-mono font-bold text-[11px] flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            + FLAT
          </button>

          <button
            onClick={() => onAddQuickJob('flat small')}
            className="px-2 py-0.5 rounded-md bg-teal-950/60 border border-teal-800/60 text-teal-300 hover:bg-teal-900/70 transition-all font-mono font-bold text-[11px] flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            + FLAT SMALL
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>تحديث شبكي تلقائي | جاهز</span>
        </div>

      </div>
    </div>
  );
};

