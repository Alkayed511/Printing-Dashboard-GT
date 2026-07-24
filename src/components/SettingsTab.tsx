import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw, Calendar, CheckCircle2, Network, HelpCircle, Save, Settings, Bell, Palette, Clock } from 'lucide-react';
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
  const [notificationSound, setNotificationSound] = useState(config.notificationSound || 'default');
  const [notificationColor, setNotificationColor] = useState(config.notificationColor || 'red');
  const [notificationDuration, setNotificationDuration] = useState(config.notificationDuration || 0);
  const [disableMouseInDisplayMode, setDisableMouseInDisplayMode] = useState(config.disableMouseInDisplayMode || false);
  const [themeColor, setThemeColor] = useState(config.themeColor || 'orange');
  const [secondaryColor, setSecondaryColor] = useState(config.secondaryColor || 'blue');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setBasePath(config.basePath);
    setCurrentDate(config.currentDate);
    setAutoRefreshInterval(config.autoRefreshInterval);
    setNotificationSound(config.notificationSound || 'default');
    setNotificationColor(config.notificationColor || 'red');
    setNotificationDuration(config.notificationDuration || 0);
    setDisableMouseInDisplayMode(config.disableMouseInDisplayMode || false);
    setThemeColor(config.themeColor || 'orange');
    setSecondaryColor(config.secondaryColor || 'blue');
  }, [config]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('primary-orange', 'primary-blue', 'primary-green', 'primary-purple', 'primary-rose');
    root.classList.remove('secondary-orange', 'secondary-blue', 'secondary-green', 'secondary-purple', 'secondary-rose');
    root.classList.add(`primary-${themeColor || 'orange'}`);
    root.classList.add(`secondary-${secondaryColor || 'blue'}`);
  }, [themeColor, secondaryColor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      basePath,
      currentDate,
      autoRefreshInterval,
      notificationSound,
      notificationColor,
      notificationDuration,
      disableMouseInDisplayMode,
      themeColor,
      secondaryColor,
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
            <div className="p-3 bg-secondary-500/10 border border-secondary-500/20 rounded-xl text-secondary-400">
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
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono text-cyan-300 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 dir-ltr text-left"
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
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-amber-200 font-mono focus:outline-none focus:border-secondary-500"
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
                <RefreshCw className="w-5 h-5 text-secondary-400" />
                معدل التحديث التلقائي للواجهة
              </label>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-secondary-500"
              >
                <option value={2}>تحديث سريـع (كل ثانتين)</option>
                <option value={5}>تحديث قياسي (كل 5 ثوانٍ) - مألوف</option>
                <option value={10}>تحديث هادئ (كل 10 ثوانٍ)</option>
                <option value={0}>تحديث يدوي فقط (متوقف)</option>
              </select>
              <p className="text-xs text-zinc-400 mt-1">يضمن ظهور الملفات فور نقلها من قِبل الفني</p>
            </div>
          </div>


          <hr className="border-zinc-800" />

          {/* Notifications Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" />
              إعدادات التنبيهات
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sound */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-zinc-400" />
                  صوت التنبيه
                </label>
                <select
                  value={notificationSound}
                  onChange={(e) => setNotificationSound(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-secondary-500"
                >
                  <option value="default">الافتراضي (جرس)</option>
                  <option value="alt1">نغمة سريعة</option>
                  <option value="alt2">نغمة هادئة</option>
                  <option value="off">إيقاف الصوت</option>
                </select>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-zinc-400" />
                  لون شريط التنبيه
                </label>
                <select
                  value={notificationColor}
                  onChange={(e) => setNotificationColor(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-secondary-500"
                >
                  <option value="red">أحمر (افتراضي)</option>
                  <option value="orange">برتقالي</option>
                  <option value="blue">أزرق</option>
                  <option value="green">أخضر</option>
                  <option value="purple">بنفسجي</option>
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  مدة بقاء التنبيه
                </label>
                <select
                  value={notificationDuration}
                  onChange={(e) => setNotificationDuration(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-secondary-500"
                >
                  <option value={0}>إبقاء حتى التأكيد (يدوي)</option>
                  <option value={5}>يختفي بعد 5 ثوانٍ</option>
                  <option value={10}>يختفي بعد 10 ثوانٍ</option>
                  <option value={30}>يختفي بعد 30 ثانية</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-zinc-800" />

          {/* Network Display Link */}
          <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Network className="w-4 h-4 text-emerald-400" />
             : رابط شاشة العرض للأجهزة الأخرى
            </h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-emerald-400 font-mono text-sm dir-ltr text-center">
                http://{config.localIp || 'localhost'}:3000/?display=true
              </code>
            </div>
            <p className="text-xs text-zinc-500">اكتب هذا الرابط في متصفح أي جهاز آخر متصل بنفس الشبكة (واي فاي أو سلك) لفتح شاشة العرض.</p>
          </div>
          
          <hr className="border-zinc-800" />

          {/* Directory Structure Preview */}
          <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-400"></span>
              معاينة مسارات الشبكة المعتمدة لليوم:
            </h4>
            <div className="space-y-1 text-xs font-mono dir-ltr text-left text-zinc-400 bg-zinc-900/90 p-4 rounded-lg border border-zinc-800 overflow-x-auto">
              <div className="text-amber-300 font-semibold mb-1">{basePath.trim() || 'BASE_PATH'}\{currentDate}\</div>
              {samplePrinters.slice(0, 3).map((p) => (
                <div key={p} className="pl-5 text-zinc-300">
                  ├── <span className="text-secondary-300">{p}</span> \ <span className="text-zinc-500">(الملفات هنا = قيد الانتظار)</span>
                  <br />
                  │   └── <span className="text-emerald-400">{p}\done</span> \ <span className="text-zinc-500">(الملفات هنا = مكتمل)</span>
                </div>
              ))}
              <div className="pl-5 text-zinc-500 mt-1">├── ... [باقي الطابعات]</div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-secondary-400" />
              إعدادات شاشة العرض والمظهر
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-zinc-400" />
                    ألوان الواجهة
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-zinc-400 px-1">اللون الرئيسي</span>
                      <select
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-secondary-500"
                      >
                        <option value="orange">برتقالي</option>
                        <option value="blue">أزرق</option>
                        <option value="green">أخضر</option>
                        <option value="purple">بنفسجي</option>
                        <option value="rose">وردي</option>
                      </select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-zinc-400 px-1">اللون الثانوي</span>
                      <select
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-secondary-500"
                      >
                        <option value="blue">أزرق</option>
                        <option value="orange">برتقالي</option>
                        <option value="green">أخضر</option>
                        <option value="purple">بنفسجي</option>
                        <option value="rose">وردي</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 flex flex-col justify-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disableMouseInDisplayMode}
                    onChange={(e) => setDisableMouseInDisplayMode(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-700 text-secondary-500 focus:ring-secondary-500 bg-zinc-900"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-200">تعطيل الماوس في شاشة العرض</span>
                    <span className="text-xs text-zinc-400">منع التفاعل مع البطاقات عند فتح وضع شاشة العرض</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <hr className="border-zinc-800" />
          <div className="pt-6 flex items-center justify-end border-t border-zinc-800">
            <button
              type="submit"
              className="flex items-center gap-2 bg-secondary-600 hover:bg-secondary-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-secondary-600/20 transition-all text-sm"
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
