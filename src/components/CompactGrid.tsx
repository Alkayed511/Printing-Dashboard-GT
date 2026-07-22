import React from 'react';
import { PrintJob, PrinterType, FileStatus } from '../types';
import { PRINTERS_LIST } from '../data/printers';
import { Printer, CheckCircle2, Clock, ArrowLeft, ArrowRight, Layers } from 'lucide-react';

interface CompactGridProps {
  jobs: PrintJob[];
  onMoveJob: (id: string, targetStatus: FileStatus) => void;
  onSelectJob: (job: PrintJob) => void;
}

export const CompactGrid: React.FC<CompactGridProps> = ({
  jobs,
  onMoveJob,
  onSelectJob,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {PRINTERS_LIST.map((printer) => {
        const printerJobs = jobs.filter((j) => j.printer === printer.id);
        const pending = printerJobs.filter((j) => j.status === 'pending');
        const done = printerJobs.filter((j) => j.status === 'done');

        return (
          <div
            key={printer.id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-900 font-bold"
                  style={{ backgroundColor: printer.accentColor }}
                >
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">{printer.nameAr}</h3>
                  <span className="text-[10px] text-zinc-400 font-mono">{printer.id.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 font-bold">
                  {pending.length} معلق
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-bold">
                  {done.length} تم
                </span>
              </div>
            </div>

            {/* Quick List Pending */}
            <div className="space-y-2 flex-1">
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>أوامر معلقة ({pending.length})</span>
              </h4>

              {pending.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-2">لا توجد ملفات معلقة</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                  {pending.map((job) => (
                    <div
                      key={job.id}
                      className="p-2 bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 rounded-lg flex items-center justify-between gap-2 text-xs text-zinc-200"
                    >
                      <span
                        onClick={() => onSelectJob(job)}
                        className="truncate cursor-pointer hover:text-blue-300 font-medium flex-1"
                      >
                        {job.filename}
                      </span>
                      <span className="text-zinc-500 font-mono text-[10px]">
                        {(job.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      <button
                        onClick={() => onMoveJob(job.id, 'done')}
                        className="p-1 text-emerald-400 hover:bg-emerald-950/50 rounded transition-colors shrink-0"
                        title="إنهاء الأمر"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick List Done */}
            <div className="pt-2 border-t border-zinc-800/60">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>مكتمل مؤخراً ({done.length})</span>
              </h4>
              {done.length === 0 ? (
                <p className="text-[11px] text-zinc-500 italic">لا توجد ملفات مكتملة</p>
              ) : (
                <p className="text-xs text-zinc-400 truncate">
                  آخر ملف: <strong className="text-zinc-200">{done[0].filename}</strong>
                </p>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};
