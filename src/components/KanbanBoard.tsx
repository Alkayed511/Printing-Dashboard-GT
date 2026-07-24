import React, { useState } from 'react';
import { 
  Printer, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Scissors, 
  Repeat, 
  Shirt, 
  Box, 
  Maximize,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { PrintJob, PrinterType, FileStatus, PrinterInfo } from '../types';
import { PRINTERS_LIST } from '../data/printers';
import { JobCard } from './JobCard';

interface KanbanBoardProps {
  jobs: PrintJob[];
  onMoveJob: (id: string, targetStatus: FileStatus) => void;
  onSelectJob: (job: PrintJob) => void;
  onDeleteJob: (id: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  jobs,
  onMoveJob,
  onSelectJob,
  onDeleteJob,
}) => {
  const [selectedPrinterFilter, setSelectedPrinterFilter] = useState<PrinterType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Icon resolver
  const getPrinterIcon = (iconName: string) => {
    switch (iconName) {
      case 'Printer': return <Printer className="w-5 h-5" />;
      case 'Layers': return <Layers className="w-5 h-5" />;
      case 'Repeat': return <Repeat className="w-5 h-5" />;
      case 'Scissors': return <Scissors className="w-5 h-5" />;
      case 'Shirt': return <Shirt className="w-5 h-5" />;
      case 'Box': return <Box className="w-5 h-5" />;
      case 'Maximize': return <Maximize className="w-5 h-5" />;
      default: return <Printer className="w-5 h-5" />;
    }
  };

  // Filter jobs by search
  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      job.filename.toLowerCase().includes(q) ||
      (job.customerName && job.customerName.toLowerCase().includes(q)) ||
      (job.material && job.material.toLowerCase().includes(q)) ||
      (job.dimensions && job.dimensions.toLowerCase().includes(q))
    );
  });

  // Printer list to render
  const printersToRender = selectedPrinterFilter === 'ALL'
    ? PRINTERS_LIST
    : PRINTERS_LIST.filter((p) => p.id === selectedPrinterFilter);

  return (
    <div className="flex-1 w-full flex flex-col overflow-hidden min-h-0 gap-2">
      
      {/* Search & High Density Filter Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الملف، العميل، نوع الخامة، الأبعاد..."
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-md pr-3 pl-8 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-primary-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
            >
              مسح
            </button>
          )}
        </div>

        {/* Printers Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin text-xs pb-1 md:pb-0 shrink-0">
          <button
            onClick={() => setSelectedPrinterFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${
              selectedPrinterFilter === 'ALL'
                ? 'bg-primary-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            الكل ({jobs.length})
          </button>

          {PRINTERS_LIST.map((p) => {
            const count = jobs.filter((j) => j.printer === p.id).length;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPrinterFilter(p.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-bold whitespace-nowrap transition-all ${
                  selectedPrinterFilter === p.id
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <span>{p.id.toUpperCase()}</span>
                {count > 0 && (
                  <span className="px-1 py-0.2 rounded bg-zinc-700/50 text-[10px]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* High Density Grid Layout - 4 columns x 2 rows, flex full height */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 overflow-hidden min-h-0">
        
        {/* Productivity Analytics Card */}
        <div className="bg-primary-950/20 rounded-lg border border-primary-500/30 flex flex-col p-3 justify-between items-center gap-2 relative shadow-sm h-full min-h-0 overflow-hidden">
          <div className="flex items-center justify-between w-full border-b border-primary-500/20 pb-2 shrink-0">
            <span className="text-xs font-bold text-primary-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-400" />
              مؤشر الإنتاجية اليومي
            </span>
            <span className="text-[10px] bg-primary-500/20 text-primary-300 px-1.5 py-0.5 rounded font-mono">LIVE</span>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-1">
            <span className="text-4xl font-black text-primary-400 font-mono tracking-tight">
              {jobs.length > 0 ? Math.round((jobs.filter(j => j.status === 'done').length / jobs.length) * 100) : 0}%
            </span>
            <span className="text-[11px] text-primary-300 uppercase tracking-wider mt-1">
              نسبة إنجاز الأوامر
            </span>
          </div>

          <div className="w-full space-y-2 shrink-0">
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary-500 h-full transition-all duration-500" 
                style={{ 
                  width: `${jobs.length > 0 ? Math.round((jobs.filter(j => j.status === 'done').length / jobs.length) * 100) : 0}%` 
                }} 
              />
            </div>

            <div className="grid grid-cols-2 gap-2 w-full text-center text-xs">
              <div className="bg-zinc-900/80 p-1.5 rounded-md border border-zinc-800">
                <div className="text-[10px] text-zinc-400 mb-0.5">قيد الانتظار</div>
                <div className="text-base font-bold text-secondary-400 font-mono">
                  {jobs.filter(j => j.status === 'pending').length}
                </div>
              </div>
              <div className="bg-zinc-900/80 p-1.5 rounded-md border border-zinc-800">
                <div className="text-[10px] text-zinc-400 mb-0.5">مكتمل (done)</div>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {jobs.filter(j => j.status === 'done').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High Density Printer Cards */}
        {printersToRender.map((printer) => {
          const printerJobs = filteredJobs.filter((j) => j.printer === printer.id);
          const pendingJobs = printerJobs.filter((j) => j.status === 'pending');

          return (
            <div 
              key={printer.id}
              className="bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col overflow-hidden shadow-sm hover:border-zinc-700 transition-colors h-full min-h-0"
            >
              {/* Card Header */}
              <div className="bg-zinc-800 px-3 py-1.5 border-b border-zinc-700 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-xs text-primary-300 font-mono truncate">
                    Printer: {printer.id.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-zinc-400 truncate hidden sm:inline">({printer.nameAr})</span>
                </div>
              </div>

              {/* Single Column: Pending Jobs */}
              <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="bg-secondary-950/30 text-secondary-400 text-[11px] font-bold px-2.5 py-1 flex items-center justify-between border-b border-secondary-900/30 shrink-0">
                  <span>قيد الانتظار</span>
                  <span className="bg-secondary-500/20 px-1.5 py-0.2 rounded font-mono text-secondary-300 text-[10px]">
                    {pendingJobs.length}
                  </span>
                </div>

                <div className="p-1.5 flex flex-col gap-1.5 overflow-y-auto scrollbar-thin flex-1 min-h-0">
                  {pendingJobs.length === 0 ? (
                    <div className="p-3 text-center text-xs text-zinc-500 italic my-auto">
                      لا توجد ملفات
                    </div>
                  ) : (
                    pendingJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onMoveJob={onMoveJob}
                        onSelectJob={onSelectJob}
                        onDeleteJob={onDeleteJob}
                      />
                    ))
                  )}
                </div>
              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
};
