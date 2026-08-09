import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Check, 
  RotateCcw, 
  Trash2, 
  Eye, 
  Clock, 
  Flame, 
  AlertTriangle, 
  CheckCircle2,
  ChevronDown,
  User,
  Hash
} from 'lucide-react';
import { PrintJob, FileStatus, JobPriority } from '../types';

interface JobCardProps {
  job: PrintJob;
  onMoveJob: (id: string, targetStatus: FileStatus) => void;
  onSelectJob: (job: PrintJob) => void;
  onDeleteJob: (id: string) => void;
  onUpdateJob?: (id: string, updates: Partial<PrintJob>) => void;
  language?: 'ar' | 'en';
}

export const getPriorityDetails = (job: PrintJob, language: string = 'ar') => {
  let p: JobPriority = job.priority || 'medium';

  // Infer priority if not explicitly specified
  if (!job.priority) {
    const text = `${job.filename} ${job.notes || ''} ${job.customerName || ''}`.toLowerCase();
    if (text.includes('عاجل') || text.includes('urgent') || text.includes('طارئ') || text.includes('vip') || text.includes('سريع')) {
      p = 'urgent';
    } else if (text.includes('مهم') || text.includes('high') || text.includes('مرتفع') || text.includes('أولوية')) {
      p = 'high';
    } else if (text.includes('عادي') || text.includes('low') || text.includes('بطيء')) {
      p = 'low';
    } else if (text.includes('متوسط') || text.includes('medium')) {
      p = 'medium';
    }
  }

  const isAr = language !== 'en';

  switch (p) {
    case 'urgent':
      return {
        key: 'urgent' as JobPriority,
        label: isAr ? 'عاجل جداً' : 'Urgent',
        badgeBg: 'bg-red-500/20 text-red-300 border-red-500/50',
        sidebarBg: 'bg-red-500',
        borderColor: 'border-red-500/60 hover:border-red-400',
        borderAccent: 'border-s-4 border-s-red-500',
        shadow: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]',
        icon: <Flame className="w-3 h-3 text-red-400 animate-pulse" />
      };
    case 'high':
      return {
        key: 'high' as JobPriority,
        label: isAr ? 'مرتفع' : 'High',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        sidebarBg: 'bg-rose-500',
        borderColor: 'border-rose-500/50 hover:border-rose-400',
        borderAccent: 'border-s-4 border-s-rose-500',
        shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.15)]',
        icon: <AlertTriangle className="w-3 h-3 text-rose-400" />
      };
    case 'medium':
      return {
        key: 'medium' as JobPriority,
        label: isAr ? 'متوسط' : 'Medium',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        sidebarBg: 'bg-amber-500',
        borderColor: 'border-amber-500/50 hover:border-amber-400',
        borderAccent: 'border-s-4 border-s-amber-500',
        shadow: '',
        icon: <Clock className="w-3 h-3 text-amber-400" />
      };
    case 'low':
    default:
      return {
        key: 'low' as JobPriority,
        label: isAr ? 'عادي' : 'Normal',
        badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        sidebarBg: 'bg-emerald-500',
        borderColor: 'border-emerald-500/40 hover:border-emerald-400',
        borderAccent: 'border-s-4 border-s-emerald-500',
        shadow: '',
        icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      };
  }
};

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onMoveJob,
  onSelectJob,
  onDeleteJob,
  onUpdateJob,
  language = 'ar',
}) => {
  const isDone = job.status === 'done';
  const priorityInfo = getPriorityDetails(job, language);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPriorityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePriorityChange = (newPriority: JobPriority) => {
    if (onUpdateJob) {
      onUpdateJob(job.id, { priority: newPriority });
    }
    setShowPriorityMenu(false);
  };

  const isAr = language === 'ar';

  return (
    <div
      className={`group relative p-2.5 rounded-lg border transition-all ${priorityInfo.shadow} ${
        isDone
          ? 'bg-zinc-900/90 border-emerald-900/40 hover:border-emerald-700/50 opacity-80'
          : `bg-zinc-900/90 ${priorityInfo.borderAccent} ${priorityInfo.borderColor}`
      }`}
    >
      {/* Visual Priority Sidebar Indicator Strip */}
      <span 
        className={`absolute top-0 bottom-0 start-0 w-1 rounded-s-lg transition-all ${
          isDone ? 'bg-emerald-600/50' : priorityInfo.sidebarBg
        }`} 
      />

      {/* Top Header Row: Order ID / Customer / Priority Badge / Actions */}
      <div className="flex items-center justify-between gap-1.5 mb-2 border-b border-zinc-800/60 pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/60 shrink-0">
            #{job.id}
          </span>

          {/* Quick Priority Selector Badge */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPriorityMenu(!showPriorityMenu);
              }}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all hover:scale-105 active:scale-95 ${priorityInfo.badgeBg}`}
              title={isAr ? 'تغيير أولوية الطباعة' : 'Change Job Priority'}
            >
              {priorityInfo.icon}
              <span>{priorityInfo.label}</span>
              {onUpdateJob && <ChevronDown className="w-2.5 h-2.5 opacity-60" />}
            </button>

            {/* Dropdown Menu to change priority directly */}
            {showPriorityMenu && onUpdateJob && (
              <div className="absolute start-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1 w-32 space-y-0.5 animate-in fade-in text-xs">
                <button
                  type="button"
                  onClick={() => handlePriorityChange('urgent')}
                  className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-red-950/60 text-red-300 font-bold flex items-center gap-1.5"
                >
                  <Flame className="w-3 h-3 text-red-400" />
                  <span>{isAr ? 'عاجل جداً' : 'Urgent'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePriorityChange('high')}
                  className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-rose-950/60 text-rose-300 font-bold flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>{isAr ? 'مرتفع' : 'High'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePriorityChange('medium')}
                  className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-amber-950/60 text-amber-300 font-bold flex items-center gap-1.5"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{isAr ? 'متوسط' : 'Medium'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePriorityChange('low')}
                  className="w-full text-start px-2 py-1.5 rounded-lg hover:bg-emerald-950/60 text-emerald-300 font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{isAr ? 'عادي' : 'Normal'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card Actions */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onSelectJob(job)}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-700 transition-colors"
            title={isAr ? 'معاينة التفاصيل' : 'View details'}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteJob(job.id)}
            className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-rose-950/30 transition-colors"
            title={isAr ? 'حذف' : 'Delete'}
          >
            <Trash2 className="w-3.5 h-3.5" />
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
            className="text-secondary-400 hover:text-secondary-300 flex items-center gap-1 font-bold px-2 py-0.5 rounded bg-secondary-950/40 border border-secondary-800/40 text-[10px] transition-all"
            title={isAr ? 'إعادة لقائمة الانتظار' : 'Back to pending'}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isAr ? 'انتظار' : 'Pending'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onMoveJob(job.id, 'done')}
            className="text-emerald-300 hover:text-white flex items-center gap-1 font-bold px-2 py-0.5 rounded bg-emerald-900/40 border border-emerald-700/50 text-[10px] transition-all hover:bg-emerald-800/60"
            title={isAr ? 'نقل للمكتمل' : 'Mark as done'}
          >
            <Check className="w-3 h-3" />
            <span>{isAr ? 'إتمام' : 'Done'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
