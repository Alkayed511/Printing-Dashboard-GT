import React, { useState, useEffect } from 'react';
import JobCustomerLink from './JobCustomerLink';
import { PrintJob, FileStatus, ServerConfig } from '../types';
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
  Edit3,
  Save,
  QrCode,
  Smartphone,
  Copy,
  Check,
  Download,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';

interface JobDetailsModalProps {
  job: PrintJob | null;
  onRefreshJobs?: () => void;
  onClose: () => void;
  onMoveJob: (id: string, targetStatus: FileStatus) => void;
  onUpdateJob?: (id: string, updates: Partial<PrintJob>) => void;
  basePath: string;
  currentDate: string;
  config: ServerConfig;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  onRefreshJobs,
  onClose,
  onMoveJob,
  onUpdateJob,
  basePath,
  currentDate,
  config,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PrintJob>>({});
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [useLanIp, setUseLanIp] = useState(false);

  const isAr = (config.language || 'ar') === 'ar';

  useEffect(() => {
    if (job) {
      setEditForm({
        customerName: job.customerName,
        material: job.material,
        quantity: job.quantity,
        notes: job.notes,
        dimensions: job.dimensions
      });
      setIsEditing(false);
    }
  }, [job]);

  // Compute direct URL to this specific print job
  const getJobDirectUrl = () => {
    if (typeof window === 'undefined' || !job) return '';
    if (useLanIp && config.localIp) {
      return `http://${config.localIp}:3000/?jobId=${encodeURIComponent(job.id)}`;
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('jobId', job.id);
      return url.toString();
    } catch (e) {
      return `${window.location.origin}/?jobId=${encodeURIComponent(job.id)}`;
    }
  };

  const jobUrl = getJobDirectUrl();

  // Generate QR Code whenever job or URL changes
  useEffect(() => {
    let isMounted = true;
    if (!job?.id || !jobUrl) return;

    const generateQRCode = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(jobUrl, {
          width: 320,
          margin: 2,
          color: {
            dark: '#09090b',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        });
        if (isMounted) {
          setQrDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQRCode();
    return () => {
      isMounted = false;
    };
  }, [job?.id, jobUrl]);

  if (!job) return null;

  const handleSave = () => {
    if (onUpdateJob && job) {
      onUpdateJob(job.id, editForm);
    }
    setIsEditing(false);
  };

  const handleCopyLink = async () => {
    if (!jobUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jobUrl);
      } else {
        const el = document.createElement('textarea');
        el.value = jobUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    const sanitizedName = job.filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `QR-Job-${job.printer}-${sanitizedName}.png`;
    link.click();
  };

  const printerInfo = (config.printers || []).find((p) => p.id === job.printer);
  const isDone = job.status === 'done';

  const fullFilePath = `${basePath}\\${currentDate}\\${job.printer}${isDone ? '\\done' : ''}\\${job.filename}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-2xl w-full shadow-2xl text-zinc-100 max-h-[92vh] flex flex-col overflow-hidden">
        <JobCustomerLink job={job} onLinked={() => onRefreshJobs?.()} />
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 sm:p-2.5 rounded-xl text-zinc-900 font-bold bg-primary-500"
            >
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-zinc-100">{printerInfo?.name || job.printer}</h3>
                <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {job.printer.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                {isAr ? 'بطاقة تفاصيل أمر الطباعة' : 'Print Job Details Card'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)} 
                className="text-zinc-400 hover:text-white p-2 sm:p-1 rounded-lg hover:bg-zinc-800 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center" 
                title={isAr ? 'تعديل البيانات' : 'Edit Specs'}
              >
                <Edit3 className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleSave} 
                className="text-emerald-400 hover:text-emerald-300 p-2 sm:p-1 rounded-lg hover:bg-zinc-800 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center" 
                title={isAr ? 'حفظ التعديلات' : 'Save Changes'}
              >
                <Save className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 sm:p-1 rounded-lg hover:bg-zinc-800 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          
          {/* Blueprint Mock Preview */}
          <div className="relative p-6 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden text-center space-y-2">
            <div className="absolute top-3 right-3">
              {isDone ? (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isAr ? 'مكتمل (طباعة نهائية)' : 'Completed (Done)'}
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  {isAr ? 'قيد الانتظار والطباعة' : 'Pending in Queue'}
                </span>
              )}
            </div>

            <FileText className="w-12 h-12 text-secondary-400 mx-auto" />
            <h2 className="text-base font-bold text-zinc-100 font-mono dir-ltr">{job.filename}</h2>
            <p className="text-xs text-zinc-400">
              {isAr ? 'حجم الملف:' : 'File Size:'} {(job.sizeBytes / (1024 * 1024)).toFixed(2)} {isAr ? 'ميجابايت' : 'MB'}
            </p>
          </div>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-zinc-400 flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                {isAr ? 'الأبعاد' : 'Dimensions'}
              </span>
              {!isEditing ? (
                <strong className="text-zinc-100 block text-sm">{job.dimensions || (isAr ? 'غير محدد' : 'N/A')}</strong>
              ) : (
                <input type="text" value={editForm.dimensions || ''} onChange={e => setEditForm({...editForm, dimensions: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 text-sm focus:outline-none focus:border-secondary-500" />
              )}
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-zinc-400 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-secondary-400" />
                {isAr ? 'الكمية' : 'Quantity'}
              </span>
              {!isEditing ? (
                <strong className="text-zinc-100 block text-sm">{job.quantity || 1} {isAr ? 'قطعة' : 'pcs'}</strong>
              ) : (
                <input type="number" value={editForm.quantity || 1} onChange={e => setEditForm({...editForm, quantity: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 text-sm focus:outline-none focus:border-secondary-500" min="1" />
              )}
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-zinc-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                {isAr ? 'الخامة' : 'Material'}
              </span>
              {!isEditing ? (
                <strong className="text-zinc-100 block text-sm">{job.material || (isAr ? 'عادية' : 'Standard')}</strong>
              ) : (
                <input type="text" value={editForm.material || ''} onChange={e => setEditForm({...editForm, material: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 text-sm focus:outline-none focus:border-secondary-500" />
              )}
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-zinc-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                {isAr ? 'العميل' : 'Customer'}
              </span>
              {!isEditing ? (
                <strong className="text-zinc-100 block text-sm">{job.customerName || (isAr ? 'عميل' : 'Client')}</strong>
              ) : (
                <input type="text" value={editForm.customerName || ''} onChange={e => setEditForm({...editForm, customerName: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 text-sm focus:outline-none focus:border-secondary-500" />
              )}
            </div>
          </div>

          {/* Notes */}
          {(job.notes || isEditing) && (
            <div className="p-3.5 bg-amber-950/20 border border-amber-800/30 rounded-xl text-xs space-y-1">
              <strong className="text-amber-300 block">
                {isAr ? '📝 تعليمات المصمم للفني:' : '📝 Operator Instructions:'}
              </strong>
              {!isEditing ? (
                <p className="text-zinc-300">{job.notes}</p>
              ) : (
                <textarea 
                  value={editForm.notes || ''} 
                  onChange={e => setEditForm({...editForm, notes: e.target.value})} 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 text-sm focus:outline-none focus:border-secondary-500 min-h-[60px]" 
                  placeholder={isAr ? 'أضف تعليمات هنا...' : 'Add special instructions...'}
                />
              )}
            </div>
          )}

          {/* Unique QR Code for Quick Mobile Access */}
          <div className="p-4 bg-zinc-950/90 border border-zinc-800 rounded-2xl space-y-3 shadow-lg">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-secondary-500/10 rounded-lg text-secondary-400 border border-secondary-500/20">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                    <span>{isAr ? 'رمز QR للمسح المباشر بالجوال' : 'Mobile Direct QR Code'}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                      {isAr ? 'فتح فوري' : 'Instant Direct'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {isAr 
                      ? 'امسح الكود بكاميرا الهاتف لفتح بطاقة هذا الطلب مباشرة وإدارته من الجوال' 
                      : 'Scan with your mobile camera to open and manage this print job directly'}
                  </p>
                </div>
              </div>

              {config.localIp && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setUseLanIp(!useLanIp)}
                    className={`text-[10px] px-2 py-1 rounded-md font-mono border transition-all ${
                      useLanIp 
                        ? 'bg-secondary-500/20 text-secondary-300 border-secondary-500/40 font-bold' 
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                    title={isAr ? (useLanIp ? 'معتمد عنوان IP المحلي' : 'التبديل إلى عنوان IP المحلي للشبكة') : 'Toggle Local LAN IP'}
                  >
                    {useLanIp ? 'LAN IP' : 'WEB URL'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* QR Image Box */}
              <div className="flex flex-col items-center shrink-0">
                <div className="p-2.5 bg-white rounded-xl shadow-md border border-zinc-200 inline-flex items-center justify-center">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt={`QR code for job ${job.id}`} 
                      className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
                    />
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center text-zinc-500">
                      <QrCode className="w-8 h-8 animate-pulse text-zinc-400" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono flex items-center justify-center gap-1 mt-1.5">
                  <Smartphone className="w-3 h-3 text-cyan-400" />
                  <span>{isAr ? 'مسح سريع بالكاميرا' : 'Camera Scan'}</span>
                </span>
              </div>

              {/* Direct Link and Action Buttons */}
              <div className="flex-1 w-full space-y-2.5 text-xs min-w-0">
                <div className="space-y-1">
                  <span className="text-[11px] text-zinc-400 font-medium block">
                    {isAr ? 'رابط الوصول المباشر لهذا الطلب:' : 'Direct Access URL for this Job:'}
                  </span>
                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5">
                    <code className="flex-1 text-[11px] font-mono text-cyan-300 truncate dir-ltr text-left px-1">
                      {jobUrl}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all flex items-center gap-1 shrink-0 ${
                        copiedLink 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                      title={isAr ? 'نسخ الرابط المباشر' : 'Copy direct link'}
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isAr ? 'نسخ الرابط' : 'Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Secondary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    disabled={!qrDataUrl}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isAr ? 'حفظ صورة الرمز (PNG)' : 'Download QR Image'}</span>
                  </button>

                  <a
                    href={jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'فتح في تبويب جديد' : 'Open in New Tab'}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Network Path */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs space-y-1">
            <span className="text-zinc-400 flex items-center gap-1.5 font-bold">
              <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
              {isAr ? 'المسار على الشبكة المحاسبية:' : 'Network SMB File Path:'}
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
              {isAr ? 'إغلاق' : 'Close'}
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
                <span>{isAr ? 'إعادة إلى قائمة الانتظار' : 'Return to Pending'}</span>
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
                <span>{isAr ? 'اعتماد نقل الملف إلى (Done)' : 'Mark as Done'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
