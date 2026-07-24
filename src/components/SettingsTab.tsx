import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw, Calendar, CheckCircle2, Network, HelpCircle, Save, Settings } from 'lucide-react';
import { ServerConfig } from '../types';

const samplePrinters = ['eco', 'solvint', 'r2r'];

interface SettingsTabProps {
  config: ServerConfig;
  onSaveConfig: (cfg: ServerConfig) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  onSaveConfig,
}) => {
  const [basePath, setBasePath] = useState(config.basePath);
  const [currentDate, setCurrentDate] = useState(config.currentDate);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(config.autoRefreshInterval);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setBasePath(config.basePath);
    setCurrentDate(config.currentDate);
    setAutoRefreshInterval(config.autoRefreshInterval);
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      basePath,
      currentDate,
      autoRefreshInterval,
    });
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-zinc-100">إعدادات النظام</h2>
              <p className="text-sm text-zinc-400 mt-1">إدارة المسارات، والمزامنة، وتفضيلات التطبيق</p>
            </div>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          
          {/* Base Path Input */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-zinc-200 flex items-center justify-between">
              <span className="flex items-center gap-2 text-base">
                <HardDrive className="w-5 h-5 text-cyan-400" />
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
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              يمكنك كتابة مسار شبكي محلي مثل <code className="text-zinc-300 dir-ltr bg-zinc-800 px-1.5 py-0.5 rounded">\\192.168.1.100\PrintShare</code> أو مسار قرص صلب مثل <code className="text-zinc-300 dir-ltr bg-zinc-800 px-1.5 py-0.5 rounded">C:\PrintJobs</code>
            </p>
          </div>

          <hr className="border-zinc-800" />

          {/* Date & Auto Refresh */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Date Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2 text-base">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  تاريخ مجلد العمل المطلوب
                </label>
              </div>
              <input
                type="text"
                placeholder="23-7 أو 2026-07-23"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-amber-200 font-mono focus:outline-none focus:border-blue-500"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentDate(`${new Date().getDate()}-${new Date().getMonth() + 1}`)}
                  className="text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors flex-1 text-center"
                >
                  تعيين إلى اليوم (D-M)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
                  className="text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors flex-1 text-center"
                >
                  صيغة كاملة (YYYY-MM-DD)
                </button>
              </div>
              <p className="text-xs text-zinc-400 text-center">يُنشأ مجلد بهذا التاريخ داخل المسار الرئيسي تلقائياً</p>
            </div>

            {/* Auto Refresh Select */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2 text-base">
                <RefreshCw className="w-5 h-5 text-blue-400" />
                معدل التحديث التلقائي للواجهة
              </label>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                <option value={2}>تحديث سريـع (كل ثانتين)</option>
                <option value={5}>تحديث قياسي (كل 5 ثوانٍ) - مألوف</option>
                <option value={10}>تحديث هادئ (كل 10 ثوانٍ)</option>
                <option value={0}>تحديث يدوي فقط (متوقف)</option>
              </select>
              <p className="text-xs text-zinc-400 mt-1">يضمن ظهور الملفات فور نقلها من قِبل الفني</p>
            </div>
          </div>

          {/* Directory Structure Preview */}
          <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              معاينة مسارات الشبكة المعتمدة لليوم:
            </h4>
            <div className="space-y-1 text-xs font-mono dir-ltr text-left text-zinc-400 bg-zinc-900/90 p-4 rounded-lg border border-zinc-800 overflow-x-auto">
              <div className="text-amber-300 font-semibold mb-1">{basePath.trim() || 'BASE_PATH'}\{currentDate}\</div>
              {samplePrinters.slice(0, 3).map((p) => (
                <div key={p} className="pl-5 text-zinc-300">
                  ├── <span className="text-blue-300">{p}</span> \ <span className="text-zinc-500">(الملفات هنا = قيد الانتظار)</span>
                  <br />
                  │   └── <span className="text-emerald-400">{p}\done</span> \ <span className="text-zinc-500">(الملفات هنا = مكتمل)</span>
                </div>
              ))}
              <div className="pl-5 text-zinc-500 mt-1">├── ... [باقي الطابعات]</div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 flex items-center justify-end border-t border-zinc-800">
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>تم حفظ الإعدادات!</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>حفظ التغييرات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
