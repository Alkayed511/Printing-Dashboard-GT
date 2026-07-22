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
  onOpenNewJobWithPrinter?: (printer: PrinterType) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  jobs,
  onMoveJob,
  onSelectJob,
  onDeleteJob,
  onOpenNewJobWithPrinter,
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
    <div className="space-y-4">
      
      {/* Search & High Density Filter Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -tranzinc-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الملف، العميل، نوع الخامة، الأبعاد..."
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-xs text-zinc-400 hover:text-white"
            >
              مسح
            </button>
          )}
        </div>

        {/* Printers Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin text-sm pb-1 md:pb-0">
          <button
            onClick={() => setSelectedPrinterFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              selectedPrinterFilter === 'ALL'
                ? 'bg-orange-600 text-white'
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  selectedPrinterFilter === p.id
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <span>{p.id.toUpperCase()}</span>
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-zinc-700/50 text-[11px]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* High Density Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        
        {/* Productivity Analytics Card (High Density Feature Card) */}
        <div className="bg-orange-950/20 rounded-xl border border-orange-500/30 flex flex-col p-5 justify-between items-center gap-4 relative shadow-sm min-h-[300px]">
          <div className="flex items-center justify-between w-full border-b border-orange-500/20 pb-3">
            <span className="text-sm font-bold text-orange-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              مؤشر الإنتاجية اليومي
            </span>
            <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-md font-mono">LIVE</span>
          </div>

          <div className="flex flex-col items-center justify-center my-auto">
            <span className="text-5xl font-black text-orange-400 font-mono tracking-tight">
              {jobs.length > 0 ? Math.round((jobs.filter(j => j.status === 'done').length / jobs.length) * 100) : 0}%
            </span>
            <span className="text-xs text-orange-300 uppercase tracking-widest mt-2">
              نسبة إنجاز الأوامر
            </span>
          </div>

          <div className="w-full space-y-3">
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-orange-500 h-full transition-all duration-500" 
                style={{ 
                  width: `${jobs.length > 0 ? Math.round((jobs.filter(j => j.status === 'done').length / jobs.length) * 100) : 0}%` 
                }} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3 w-full text-center text-sm">
              <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                <div className="text-xs text-zinc-400 mb-1">قيد الانتظار</div>
                <div className="text-lg font-bold text-amber-400 font-mono">
                  {jobs.filter(j => j.status === 'pending').length}
                </div>
              </div>
              <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                <div className="text-xs text-zinc-400 mb-1">مكتمل (done)</div>
                <div className="text-lg font-bold text-emerald-400 font-mono">
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
          const doneJobs = printerJobs.filter((j) => j.status === 'done');

          return (
            <div 
              key={printer.id}
              className="bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col overflow-hidden shadow-sm hover:border-zinc-700 transition-colors"
            >
              {/* Card Header */}
              <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-orange-300">
                    Printer: {printer.id.toUpperCase()}
                  </span>
                  <span className="text-xs text-zinc-400">({printer.nameAr})</span>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenNewJobWithPrinter && (
                    <button
                      onClick={() => onOpenNewJobWithPrinter(printer.id)}
                      className="p-1.5 hover:bg-zinc-700 rounded-md text-orange-300 transition-colors"
                      title="إضافة أمر جديد بهذه الطابعة"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Single Column: Pending Jobs */}
              <div className="flex flex-col flex-grow overflow-hidden min-h-[300px]">
                <div className="bg-amber-950/30 text-amber-400 text-xs font-bold px-3 py-2 flex items-center justify-between border-b border-amber-900/30">
                  <span>قيد الانتظار</span>
                  <span className="bg-amber-500/20 px-1.5 py-0.5 rounded-md font-mono text-amber-300 text-[11px]">
                    {pendingJobs.length}
                  </span>
                </div>

                <div className="p-2 flex flex-col gap-2 overflow-y-auto max-h-[450px] scrollbar-thin flex-1">
                  {pendingJobs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500 italic my-auto">
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
