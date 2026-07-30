import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw, Calendar, CheckCircle2, Network, HelpCircle, Save, Settings, Bell, Palette, Clock, Copy, ExternalLink, Globe, Check, Upload, Play, Volume2 } from 'lucide-react';
import { ServerConfig } from '../types';
import { translations } from '../translations';
import { playNotificationSound } from '../utils/audio';

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
  const [customSoundUrl, setCustomSoundUrl] = useState(config.customSoundUrl || '');
  const [notificationColor, setNotificationColor] = useState(config.notificationColor || 'red');
  const [notificationDuration, setNotificationDuration] = useState(config.notificationDuration || 0);
  const [disableMouseInDisplayMode, setDisableMouseInDisplayMode] = useState(config.disableMouseInDisplayMode || false);
  const [themeColor, setThemeColor] = useState(config.themeColor || 'orange');
  const [secondaryColor, setSecondaryColor] = useState(config.secondaryColor || 'blue');
  const [language, setLanguage] = useState(config.language || 'ar');
  const [localIp, setLocalIp] = useState(config.localIp || '');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedOnline, setCopiedOnline] = useState(false);
  const [copiedLan, setCopiedLan] = useState(false);

  const activeLocalIp = localIp.trim() || config.localIp || 'localhost';
  const onlineDisplayUrl = window.location.origin + window.location.pathname + '?display=true';
  const lanDisplayUrl = `http://${activeLocalIp}:3000/?display=true`;

  const copyToClipboard = (text: string, type: 'online' | 'lan') => {
    navigator.clipboard.writeText(text);
    if (type === 'online') {
      setCopiedOnline(true);
      setTimeout(() => setCopiedOnline(false), 2000);
    } else {
      setCopiedLan(true);
      setTimeout(() => setCopiedLan(false), 2000);
    }
  };

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
      customSoundUrl,
      notificationColor,
      notificationDuration,
      disableMouseInDisplayMode,
      themeColor,
      secondaryColor,
      language,
      localIp,
    });
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const t = translations[language];

  return (
    <div className={`max-w-4xl mx-auto p-4 animate-in fade-in duration-200 ${language === 'en' ? 'dir-ltr text-left' : 'dir-rtl text-right'}`}>
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary-500/10 border border-secondary-500/20 rounded-xl text-secondary-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-zinc-100">{t.settings}</h2>
              <p className="text-sm text-zinc-400 mt-1">{t.settingsDesc}</p>
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
                {t.basePathTitle}
              </span>
              <span className="text-xs text-zinc-400 font-normal">{t.basePathSub}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={basePath}
                onChange={(e) => setBasePath(e.target.value)}
                placeholder={t.basePathPlaceholder}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono text-cyan-300 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 dir-ltr text-left"
                required
              />
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              {t.basePathHelp} <code className="text-zinc-300 dir-ltr bg-zinc-800 px-1.5 py-0.5 rounded">\\192.168.1.100\PrintShare</code> {t.basePathHelp2} <code className="text-zinc-300 dir-ltr bg-zinc-800 px-1.5 py-0.5 rounded">C:\PrintJobs</code>
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
                  {t.dateTitle}
                </label>
              </div>
              <input
                type="text"
                placeholder={t.datePlaceholder}
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
                  {t.dateSetToday}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
                  className="text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors flex-1 text-center"
                >
                  {t.dateSetFull}
                </button>
              </div>
              <p className="text-xs text-zinc-400 text-center">{t.dateHelp}</p>
            </div>

            {/* Auto Refresh Select */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2 text-base">
                <RefreshCw className="w-5 h-5 text-secondary-400" />
                {t.autoRefreshTitle}
              </label>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-secondary-500"
              >
                <option value={2}>{t.refreshFast}</option>
                <option value={5}>{t.refreshStandard}</option>
                <option value={10}>{t.refreshSlow}</option>
                <option value={0}>{t.refreshManual}</option>
              </select>
              <p className="text-xs text-zinc-400 mt-1">{t.refreshHelp}</p>
            </div>
          </div>


          <hr className="border-zinc-800" />

          {/* Notifications Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" />
              {t.notificationsTitle}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sound */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-zinc-400" />
                    {t.soundTitle}
                  </label>
                  <button
                    type="button"
                    onClick={() => playNotificationSound(notificationSound, customSoundUrl)}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/30 transition-all active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-emerald-400" />
                    <span>تجربة الصوت</span>
                  </button>
                </div>

                <select
                  value={notificationSound}
                  onChange={(e) => {
                    const sound = e.target.value;
                    setNotificationSound(sound);
                    playNotificationSound(sound, customSoundUrl);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-secondary-500"
                >
                  <option value="default">{t.soundDefault}</option>
                  <option value="shorts">{t.soundShorts}</option>
                  <option value="faaaaaa">{t.soundFaaaaaa}</option>
                  <option value="custom">📁 ملف صوتي مخصص (Uploaded Audio File)</option>
                  <option value="alt1">{t.soundFast}</option>
                  <option value="alt2">{t.soundSlow}</option>
                  <option value="off">{t.soundOff}</option>
                </select>

                {/* Upload Exact Audio File Box */}
                <div className="pt-1">
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-xl p-3 text-xs text-zinc-300 transition-all text-center">
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <Upload className="w-4 h-4" />
                      <span>{customSoundUrl ? 'تغيير ملف الصوت الأصلي (MP3/WAV)' : 'رفع ملف الصوت الأصلي بدون تعديل'}</span>
                    </div>
                    <span className="text-[11px] text-zinc-500">ارفع ملفك الصوتي وسيعمل كما هو بالظبط بدون أي تغيير</span>
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            const result = event.target?.result as string;
                            if (result) {
                              setCustomSoundUrl(result);
                              setNotificationSound('custom');
                              if (typeof localStorage !== 'undefined') {
                                localStorage.setItem('customSoundUrl', result);
                              }
                              // Try posting to backend server
                              try {
                                const resp = await fetch('/api/upload-sound', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ audioData: result })
                                });
                                const data = await resp.json();
                                if (data.customSoundUrl) {
                                  setCustomSoundUrl(data.customSoundUrl);
                                  playNotificationSound('custom', data.customSoundUrl);
                                  return;
                                }
                              } catch (err) {
                                console.warn('Server upload failed, using local base64 sound:', err);
                              }
                              playNotificationSound('custom', result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {customSoundUrl && (
                    <div className="mt-2 flex items-center justify-between bg-emerald-950/40 border border-emerald-800/60 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300">
                      <div className="flex items-center gap-1.5 truncate">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">تم حفظ الصوت الأصلي بنجاح</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => playNotificationSound('custom', customSoundUrl)}
                        className="flex items-center gap-1 font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded text-[10px]"
                      >
                        <Play className="w-2.5 h-2.5 fill-emerald-300" />
                        <span>تشغيل</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-zinc-400" />
                  {t.colorTitle}
                </label>
                <select
                  value={notificationColor}
                  onChange={(e) => setNotificationColor(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-secondary-500"
                >
                  <option value="red">{t.colorRed}</option>
                  <option value="orange">{t.colorOrange}</option>
                  <option value="blue">{t.colorBlue}</option>
                  <option value="green">{t.colorGreen}</option>
                  <option value="purple">{t.colorPurple}</option>
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  {t.durationTitle}
                </label>
                <select
                  value={notificationDuration}
                  onChange={(e) => setNotificationDuration(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-secondary-500"
                >
                  <option value={0}>{t.durationManual}</option>
                  <option value={5}>{t.duration5s}</option>
                  <option value={10}>{t.duration10s}</option>
                  <option value={30}>{t.duration30s}</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-zinc-800" />

          {/* Network & Online Display Links */}
          <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Network className="w-4 h-4 text-emerald-400" />
                {t.displayLinkTitle}
              </h4>
              <span className="text-xs text-zinc-400">{t.displayLinkHelp}</span>
            </div>

            {/* Online / WAN Cloud Display Link (Global Internet) */}
            <div className="bg-zinc-900/90 p-4 rounded-xl border border-emerald-500/50 space-y-3 shadow-lg shadow-emerald-950/20">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  {t.wanTitle}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                  WAN / INTERNET READY
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <code className="flex-1 bg-zinc-950 border border-emerald-800/60 rounded-lg p-2.5 text-emerald-300 font-mono text-xs dir-ltr text-left truncate w-full sm:w-auto">
                  {onlineDisplayUrl}
                </code>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => window.open(onlineDisplayUrl, '_blank')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t.openDisplayBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(onlineDisplayUrl, 'online')}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 border border-zinc-700 transition-colors shrink-0"
                  >
                    {copiedOnline ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOnline ? t.copied : t.copyLinkBtn}</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-emerald-200/80 leading-relaxed">
                {t.wanHelp}
              </p>

              {/* QR Code for WAN Display Link */}
              <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-4 flex-wrap sm:flex-nowrap bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
                <div className="bg-white p-1.5 rounded-lg shrink-0 border border-zinc-300 shadow-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(onlineDisplayUrl)}`}
                    alt="WAN Display QR Code"
                    className="w-20 h-20"
                  />
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-zinc-200">{t.qrCodeTitle}</h5>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    امسح هذا الرمز باستخدام كاميرا الهاتـف أو الشاشة الذكية لفتح شاشة العرض مباشرة عبر الإنترنت (WAN).
                  </p>
                </div>
              </div>
            </div>

            {/* Local LAN Server IP Link */}
            <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">
                  {t.ipAddressTitle}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={localIp}
                    onChange={(e) => setLocalIp(e.target.value)}
                    placeholder={language === 'ar' ? 'تلقائي (Automatic)' : 'Automatic'}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 dir-ltr text-left"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">{t.ipAddressHelp}</p>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-zinc-300 block">
                  {t.lanDisplayLinkTitle}
                </span>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <code className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-lg p-2.5 text-amber-300/90 font-mono text-xs dir-ltr text-left truncate w-full sm:w-auto">
                    {lanDisplayUrl}
                  </code>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => window.open(lanDisplayUrl, '_blank')}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 border border-zinc-700 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t.openDisplayBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(lanDisplayUrl, 'lan')}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 border border-zinc-700 transition-colors shrink-0"
                    >
                      {copiedLan ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLan ? t.copied : t.copyLinkBtn}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-lg text-xs text-amber-200/90 leading-relaxed space-y-1">
                <p className="font-bold">⚠️ توضيح هـام بخصوص شبكات WAN و LAN:</p>
                <p>
                  عنوان IP المحلي <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">{activeLocalIp}</code> يكتشف عنوان جهاز السيرفر تلقائياً في الشبكة المحلية (LAN)، ويمكنك تغييره بحرية في أي وقت.
                </p>
                <p>
                  لشتغيل الشاشة عبر شبكة الإنترنت (WAN) على أي شاشة أو هاتف خارجي: <strong>استخدم رابط WAN الأخضر المباشر أعلاه</strong> أو امسح كود QR بكل سهولة!
                </p>
              </div>
            </div>
          </div>
          
          <hr className="border-zinc-800" />

          {/* Directory Structure Preview */}
          <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-400"></span>
              {t.previewTitle}
            </h4>
            <div className="space-y-1 text-xs font-mono dir-ltr text-left text-zinc-400 bg-zinc-900/90 p-4 rounded-lg border border-zinc-800 overflow-x-auto">
              <div className="text-amber-300 font-semibold mb-1">{basePath.trim() || 'BASE_PATH'}\{currentDate}\</div>
              {samplePrinters.slice(0, 3).map((p) => (
                <div key={p} className="pl-5 text-zinc-300">
                  ├── <span className="text-secondary-300">{p}</span> \ <span className="text-zinc-500">{t.previewWait}</span>
                  <br />
                  │   └── <span className="text-emerald-400">{p}\done</span> \ <span className="text-zinc-500">{t.previewDone}</span>
                </div>
              ))}
              <div className="pl-5 text-zinc-500 mt-1">├── ... [{t.previewRest}]</div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-secondary-400" />
              {t.appearanceTitle}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-zinc-400" />
                    {t.themeTitle}
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-zinc-400 px-1">{t.primaryColor}</span>
                      <select
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-secondary-500"
                      >
                        <option value="orange">{t.colorOrange}</option>
                        <option value="blue">{t.colorBlue}</option>
                        <option value="green">{t.colorGreen}</option>
                        <option value="purple">{t.colorPurple}</option>
                        <option value="rose">{t.colorRose}</option>
                      </select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-zinc-400 px-1">{t.secondaryColor}</span>
                      <select
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-secondary-500"
                      >
                        <option value="blue">{t.colorBlue}</option>
                        <option value="orange">{t.colorOrange}</option>
                        <option value="green">{t.colorGreen}</option>
                        <option value="purple">{t.colorPurple}</option>
                        <option value="rose">{t.colorRose}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2 flex flex-col justify-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={disableMouseInDisplayMode}
                      onChange={(e) => setDisableMouseInDisplayMode(e.target.checked)}
                      className="w-5 h-5 rounded border-zinc-700 text-secondary-500 focus:ring-secondary-500 bg-zinc-900"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-200">{t.disableMouseTitle}</span>
                      <span className="text-xs text-zinc-400">{t.disableMouseDesc}</span>
                    </div>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-zinc-400" />
                    {t.languageTitle}
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-secondary-500"
                  >
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
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
                  <span>{t.saveSuccess}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{t.saveChanges}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
