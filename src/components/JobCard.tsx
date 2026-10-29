import React from 'react';
import { 
  Check, 
  RotateCcw, 
  Trash2, 
  Eye, 
  User
} from 'lucide-react';
import { PrintJob, FileStatus } from '../types';

interface JobCardProps {
  job: PrintJob;
  onMoveJob: (id: string, targetStatus: FileStatus) => void;
  onSelectJob: (job: PrintJob) => void;
  onDeleteJob: (id: string) => void;
  onUpdateJob?: (id: string, updates: Partial<PrintJob>) => void;
  language?: 'ar' | 'en';
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onMoveJob,
  onSelectJob,
  onDeleteJob,
  language = 'ar',
}) => {
  const isDone = job.status === 'done';
  const isAr = language === 'ar';

  return (
    <div
      className={`gt-job-card group relative p-2.5 rounded-lg border transition-all ${
        isDone
          ? 'bg-zinc-900/90 border-emerald-900/40 hover:border-emerald-700/50 opacity-80'
          : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Top Header Row: Order ID & Actions */}
      <div className="flex items-center justify-between gap-1.5 mb-2 border-b border-zinc-800/60 pb-1.5">
        <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/60 shrink-0">
          #{job.id}
        </span>

        {/* Card Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-80 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onSelectJob(job)}
            className="p-1.5 sm:p-1 text-zinc-300 hover:text-white rounded-md hover:bg-zinc-700 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
            title={isAr ? 'معاينة التفاصيل' : 'View details'}
          >
            <Eye className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteJob(job.id)}
            className="p-1.5 sm:p-1 text-zinc-400 hover:text-rose-400 rounded-md hover:bg-rose-950/30 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
            title={isAr ? 'حذف' : 'Delete'}
          >
            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content: Filename & Customer Name */}
      <div 
        onClick={() => onSelectJob(job)}
        className="cursor-pointer space-y-1 mb-2"
      >
        <div 
          className={`text-xs font-mono truncate font-bold leading-tight ${
            isDone ? 'text-zinc-400 line-through' : 'text-zinc-100 hover:text-primary-300'
          }`}
          title={job.filename}
        >
          {job.filename}
        </div>

        {job.customerName && (
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate">
            <User className="w-3 h-3 text-zinc-500 shrink-0" />
            <span className="truncate font-medium">{job.customerName}</span>
          </div>
        )}
      </div>

      {/* Bottom Footer Row: Printer Name, Size / Quantity, Move Button */}
      <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/80 text-[11px]">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-zinc-300 font-bold font-mono truncate max-w-[80px] bg-zinc-800/80 px-1.5 py-0.5 rounded">
            {job.printer.toUpperCase()}
          </span>
          <span className="text-zinc-500 font-mono">
            {(job.sizeBytes / (1024 * 1024)).toFixed(1)} MB
          </span>
          {job.quantity && (
            <span className="text-secondary-400 font-mono font-bold bg-secondary-950/60 px-1 rounded border border-secondary-800/40">
              x{job.quantity}
            </span>
          )}
        </div>

        {isDone ? (
          <button
            type="button"
            onClick={() => onMoveJob(job.id, 'pending')}
            className="text-secondary-400 hover:text-secondary-300 flex items-center gap-1 font-bold px-2.5 py-1 sm:py-0.5 rounded-md bg-secondary-950/60 border border-secondary-800/60 text-xs sm:text-[10px] transition-all min-h-[32px] sm:min-h-0"
            title={isAr ? 'إعادة لقائمة الانتظار' : 'Back to pending'}
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
            <span>{isAr ? 'انتظار' : 'Pending'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onMoveJob(job.id, 'done')}
            className="text-emerald-300 hover:text-white flex items-center gap-1 font-bold px-2.5 py-1 sm:py-0.5 rounded-md bg-emerald-900/50 border border-emerald-700/60 text-xs sm:text-[10px] transition-all hover:bg-emerald-800/60 min-h-[32px] sm:min-h-0"
            title={isAr ? 'نقل للمكتمل' : 'Mark as done'}
          >
            <Check className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
            <span>{isAr ? 'إتمام' : 'Done'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
