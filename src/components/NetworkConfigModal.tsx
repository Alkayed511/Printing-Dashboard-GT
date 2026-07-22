import React, { useState } from 'react';
import { X, Network, Calendar, RefreshCw, CheckCircle2, HelpCircle, HardDrive } from 'lucide-react';
import { ServerConfig } from '../types';

interface NetworkConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ServerConfig;
  onSaveConfig: (newConfig: Partial<ServerConfig>) => void;
}

export const NetworkConfigModal: React.FC<NetworkConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [basePath, setBasePath] = useState(config.basePath);
  const [currentDate, setCurrentDate] = useState(config.currentDate);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(config.autoRefreshInterval);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      basePath,
      currentDate,
      autoRefreshInterval: Number(autoRefreshInterval),
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const samplePrinters = ['eco', 'solvint', 'r2r', 'cutter', 'dtf', 'flat', 'flat samel'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-2xl w-full shadow-2xl text-zinc-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-100">إعدادات مسار المجلد على الشبكة المحلية</h3>
              <p className="text-xs text-zinc-400">ربط المجلد الرئيسي وتحديد تاريخ العمل وسرعة التحديث</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Base Path Input */}
          <div>
            <label className="block text-sm font-semibold text-zinc-200 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                مسار المجلد الرئيسي (Base Path)
              </span>
              <span className="text-xs text-zinc-400 font-normal">Windows SMB / Local Path</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={basePath}
                onChange={(e) => setBasePath(e.target.value)}
                placeholder="مثال: \\SERVER\PrintJobs أو C:\PrintShopFolder"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono text-cyan-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dir-ltr text-left"
                required
              />
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              يمكنك كتابة مسار شبكي محلي مثل <code className="text-zinc-300 dir-ltr bg-zinc-800 px-1 py-0.5 rounded">\\192.168.1.100\PrintShare</code> أو مسار قرص صلب مثل <code className="text-zinc-300 dir-ltr bg-zinc-800 px-1 py-0.5 rounded">C:\PrintJobs</code>
            </p>
          </div>

          {/* Date & Auto Refresh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Date Input */}
            <div>
              <label className="block text-sm font-semibold text-zinc-200 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                تاريخ مجلد العمل المطلوب
              </label>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-amber-200 font-mono focus:outline-none focus:border-blue-500"
                required
              />
              <p className="text-[11px] text-zinc-400 mt-1">يُنشأ مجلد بهذا التاريخ داخل المسار الرئيسي تلقائياً</p>
            </div>

            {/* Auto Refresh Select */}
            <div>
              <label className="block text-sm font-semibold text-zinc-200 mb-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                معدل التحديث التلقائي للواجهة
              </label>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                <option value={2}>تحديث سريـع (كل ثانتين)</option>
                <option value={5}>تحديث قياسي (كل 5 ثوانٍ) - مألوف</option>
                <option value={10}>تحديث هادئ (كل 10 ثوانٍ)</option>
                <option value={0}>تحديث يدوي فقط (متوقف)</option>
              </select>
              <p className="text-[11px] text-zinc-400 mt-1">يضمن ظهور الملفات فور نقلها من قِبل الفني</p>
            </div>

          </div>

          {/* Directory Structure Preview */}
          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              معاينة مسارات الشبكة المعتمدة لليوم:
            </h4>
            <div className="space-y-1 text-[11px] font-mono dir-ltr text-left text-zinc-400 bg-zinc-900/90 p-3 rounded-lg border border-zinc-800 overflow-x-auto">
              <div className="text-amber-300 font-semibold">{basePath.trim() || 'BASE_PATH'}\{currentDate}\</div>
              {samplePrinters.slice(0, 3).map((p) => (
                <div key={p} className="pl-4 text-zinc-300">
                  ├── <span className="text-blue-300">{p}</span> \ <span className="text-zinc-500">(الملفات هنا = قيد الانتظار)</span>
                  <br />
                  │   └── <span className="text-emerald-400">{p}\done</span> \ <span className="text-zinc-500">(الملفات هنا = مكتمل)</span>
                </div>
              ))}
              <div className="pl-4 text-zinc-500">├── ... [باقي الطابعات cutter, dtf, flat, flat samel]</div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>تم الحفظ!</span>
                </>
              ) : (
                <span>حفظ التغييرات وتطبيق</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
