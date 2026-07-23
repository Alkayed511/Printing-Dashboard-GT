import React from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Check, 
  RotateCcw, 
  Trash2, 
  Eye, 
  Maximize2, 
  Layers, 
  Clock, 
  User, 
  Hash, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { PrintJob, FileStatus } from '../types';

interface JobCardProps {
  job: PrintJob;
  onMoveJob: (id: string, targetStatus: FileStatus) => void;
  onSelectJob: (job: PrintJob) => void;
  onDeleteJob: (id: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onMoveJob,
  onSelectJob,
  onDeleteJob,
}) => {
  const isDone = job.status === 'done';

  return (
    <div
      className={`group relative p-2 rounded-md border transition-all ${
        isDone
          ? 'bg-zinc-900/90 border-emerald-900/40 hover:border-emerald-700/50 opacity-80'
          : 'bg-zinc-800/60 border-zinc-700/60 hover:border-orange-500/50'
      }`}
    >
      {/* Header: Filename & Actions */}
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <div 
          onClick={() => onSelectJob(job)}
          className={`text-xs font-mono truncate font-semibold cursor-pointer ${
            isDone ? 'text-zinc-400 line-through' : 'text-zinc-200 hover:text-orange-300'
          }`}
          title={job.filename}
        >
          {job.filename}
        </div>

        <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
          <button
            onClick={() => onSelectJob(job)}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-700"
            title="معاينة"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteJob(job.id)}
            className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-rose-950/30"
            title="حذف"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer: Printer / Size / Move Action */}
      <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/80 text-[11px]">
        <div className="flex flex-col gap-0.2">
          <span className="text-zinc-300 font-bold font-mono truncate max-w-[100px]">
            {job.printer.toUpperCase()}
          </span>
          <span className="text-zinc-500 font-mono text-[9px]">
            {(job.sizeBytes / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>

        {isDone ? (
          <button
            onClick={() => onMoveJob(job.id, 'pending')}
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold px-2 py-0.5 rounded bg-amber-950/40 text-[10px]"
            title="إعادة للانتظار"
          >
            <RotateCcw className="w-3 h-3" />
            <span>انتظار</span>
          </button>
        ) : (
          <button
            onClick={() => onMoveJob(job.id, 'done')}
            className="text-emerald-300 hover:text-white flex items-center gap-1 font-bold px-2 py-0.5 rounded bg-emerald-800/40 border border-emerald-700/50 text-[10px]"
            title="نقل للمكتمل"
          >
            <Check className="w-3 h-3" />
            <span>إتمام</span>
          </button>
        )}
      </div>
    </div>
  );
};
