import React from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Maximize2, 
  Hash, 
  User, 
  HardDrive, 
  RotateCcw, 
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { PrintJob, FileStatus } from '../types';
import { PRINTERS_LIST } from '../data/printers';

interface JobDetailsModalProps {
  job: PrintJob | null;
  onClose: () => void;
  onMoveJob: (id: string, targetStatus: FileStatus) => void;
  basePath: string;
  currentDate: string;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  onClose,
  onMoveJob,
  basePath,
  currentDate,
}) => {
  if (!job) return null;

  const printerInfo = PRINTERS_LIST.find((p) => p.id === job.printer);
  const isDone = job.status === 'done';

  const fullFilePath = `${basePath}\\${currentDate}\\${job.printer}${isDone ? '\\done' : ''}\\${job.filename}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-2xl w-full shadow-2xl text-zinc-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-xl text-zinc-900 font-bold"
              style={{ backgroundColor: printerInfo?.accentColor || '#3b82f6' }}
            >
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-zinc-100">{printerInfo?.nameAr}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {job.printer.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-zinc-400">بطاقة تفاصيل أمر الطباعة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Blueprint Mock Preview */}
          <div className="relative p-6 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden text-center space-y-2">
            <div className="absolute top-3 right-3">
              {isDone ? (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  مكتمل (طباعة نهائية)
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  قيد الانتظار والطباعة
                </span>
              )}
            </div>

            <FileText className="w-12 h-12 text-blue-400 mx-auto" />
            <h2 className="text-base font-bold text-zinc-100 font-mono dir-ltr">{job.filename}</h2>
            <p className="text-xs text-zinc-400">حجم الملف: {(job.sizeBytes / (1024 * 1024)).toFixed(2)} ميجابايت</p>
          </div>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-zinc-400 flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                الأبعاد
              </span>
              <strong className="text-zinc-100 block text-sm">{job.dimensions || 'غير محدد'}</strong>
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-zinc-400 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-blue-400" />
                الكمية
              </span>
              <strong className="text-zinc-100 block text-sm">{job.quantity || 1} قطعة</strong>
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-zinc-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                الخامة
              </span>
              <strong className="text-zinc-100 block text-sm">{job.material || 'عادية'}</strong>
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-zinc-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                العميل
              </span>
              <strong className="text-zinc-100 block text-sm">{job.customerName || 'عميل'}</strong>
            </div>
          </div>

          {/* Notes */}
          {job.notes && (
            <div className="p-3.5 bg-amber-950/20 border border-amber-800/30 rounded-xl text-xs space-y-1">
              <strong className="text-amber-300 block">📝 تعليمات المصمم للفني:</strong>
              <p className="text-zinc-300">{job.notes}</p>
            </div>
          )}

          {/* Network Path */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs space-y-1">
            <span className="text-zinc-400 flex items-center gap-1.5 font-bold">
              <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
              المسار على الشبكة المحاسبية:
            </span>
            <code className="block text-[11px] font-mono text-cyan-300 dir-ltr text-left bg-zinc-900 p-2 rounded border border-zinc-800 truncate">
              {fullFilePath}
            </code>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              إغلاق
            </button>

            {isDone ? (
              <button
                onClick={() => {
                  onMoveJob(job.id, 'pending');
                  onClose();
                }}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-xl transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة إلى قائمة الانتظار</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onMoveJob(job.id, 'done');
                  onClose();
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد نقل الملف إلى (Done)</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
