import React, { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  Network, 
  RefreshCw, 
  Plus, 
  Kanban, 
  BarChart3, 
  Calendar,
  Layers,
  Settings,
  FileDown, 
  MonitorPlay,
  Minus,
  Bell,
  BellRing,
  BellOff,
  ChevronDown,
  Volume2,
  VolumeX,
  Play,
  Check,
  X,
  Sliders,
  CheckCircle2,
  Clock,
  Eye,
  SlidersHorizontal,
  Smartphone,
  ShieldAlert
} from 'lucide-react';
import { ServerConfig, PrintJob } from '../types';
import { translations } from '../translations';
import { playNotificationSound } from '../utils/audio';

interface NavbarProps {
  config: ServerConfig;
  activeTab: 'kanban' | 'compact' | 'stats' | 'settings';
  setActiveTab: (tab: 'kanban' | 'compact' | 'stats' | 'settings') => void;
  onOpenExport: () => void;
  onRefresh: () => void;
  onChangeDate: (newDate: string) => void;
  isRefreshing: boolean;
  totalJobsCount: number;
  pendingJobsCount: number;
  allJobs?: PrintJob[];
  unacknowledgedJobs?: PrintJob[];
  onDismissNotification?: (id: string) => void;
  onDismissAllNotifications?: () => void;
  onAcknowledgeAlert?: () => void;
  onSelectJob?: (job: PrintJob) => void;
  onUpdateConfig?: (updates: Partial<ServerConfig>) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  activeTab,
  setActiveTab,
  onOpenExport,
  onRefresh,
  onChangeDate,
  isRefreshing,
  totalJobsCount,
  pendingJobsCount,
  allJobs = [],
  unacknowledgedJobs = [],
  onDismissNotification,
  onDismissAllNotifications,
  onAcknowledgeAlert,
  onSelectJob,
  onUpdateConfig,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dropdownTab, setDropdownTab] = useState<'list' | 'options'>('list');
  const [filterMode, setFilterMode] = useState<'unread' | 'all' | 'done'>('unread');
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const unacknowledgedCount = unacknowledgedJobs.length;

  // Check desktop notification permissions on load
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission as any);
    } else {
      setPushStatus('unsupported');
    }
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPushStatus(permission as any);
      } catch (e) {
        console.error('Error requesting notification permission:', e);
      }
    }
  };

  const getBellColorClass = () => {
    switch (config.notificationColor) {
      case 'blue': return 'bg-blue-600 border-blue-500 hover:bg-blue-500';
      case 'green': return 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500';
      case 'orange': return 'bg-orange-600 border-orange-500 hover:bg-orange-500';
      case 'purple': return 'bg-purple-600 border-purple-500 hover:bg-purple-500';
      default: return 'bg-red-600 border-red-500 hover:bg-red-500';
    }
  };

  const getPrinterBadgeClass = (printer: string) => {
    switch (printer.toLowerCase()) {
      case 'eco': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'solvint': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'r2r': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'cutter': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'dtf': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'flat': case 'flat small': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const adjustDate = (days: number) => {
    try {
      const dateStr = (config.currentDate || '').trim();
      const parts = dateStr.split(/[-/]/);
      let year = new Date().getFullYear();
      let month = new Date().getMonth() + 1;
      let day = new Date().getDate();

      if (parts.length === 3) {
        if (parts[0].length === 4) {
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          day = parseInt(parts[2], 10);
        } else {
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
        }
      } else if (parts.length === 2) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
      }

      const dateObj = new Date(year, month - 1, day);
      dateObj.setDate(dateObj.getDate() + days);

      if (parts.length === 3 && parts[0].length === 4) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        onChangeDate(`${y}-${m}-${d}`);
      } else if (parts.length === 3) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        onChangeDate(`${d}-${m}-${y}`);
      } else {
        onChangeDate(`${dateObj.getDate()}-${dateObj.getMonth() + 1}`);
      }
    } catch (e) {
      console.error('Error adjusting date', e);
    }
  };

  const resetToToday = () => {
    if (config.currentDate && config.currentDate.length === 10 && config.currentDate.startsWith('20')) {
      const todayIso = new Date().toISOString().split('T')[0];
      onChangeDate(todayIso);
    } else {
      onChangeDate(`${new Date().getDate()}-${new Date().getMonth() + 1}`);
    }
  };

  const t = translations[config.language || 'ar'];

  // Filter notification jobs
  const displayedJobs = () => {
    if (filterMode === 'unread') return unacknowledgedJobs;
    if (filterMode === 'done') return allJobs.filter(j => j.status === 'done');
    return allJobs; // 'all'
  };

  const handleToggleMute = () => {
    const isMuted = config.notificationSound === 'off';
    const nextSound = isMuted ? 'default' : 'off';
    if (onUpdateConfig) {
      onUpdateConfig({ notificationSound: nextSound });
    }
  };

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 text-white sticky top-0 z-30 shadow-md shrink-0">
      {/* Ultra Compact & Balanced Main Navigation Bar */}
      <div className="max-w-[1800px] mx-auto w-full px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        
        {/* Start Section: Brand & Title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full border-2 border-primary-500 overflow-hidden shrink-0 shadow-sm">
            <div className="absolute inset-0 bg-zinc-700"></div>
            <span className="relative z-10 font-black italic text-xs text-white font-mono" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>GT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-zinc-100 whitespace-nowrap">
              {t.navAppTitle}
            </h1>
            <span className="text-zinc-500 font-normal text-[10px] font-mono hidden md:inline-block">v2.4.0</span>
          </div>
        </div>

        {/* Center Section: Centered Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 shrink-0 mx-auto">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'kanban'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>{t.navKanban}</span>
            {pendingJobsCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                {pendingJobsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('compact')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'compact'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.navCompact}</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{t.navStats}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-secondary-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{t.navSettings}</span>
          </button>
        </nav>

        {/* End Section: Stats, Work Date, Dropdown Notification Bell, Refresh, Display & Export */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
          
          {/* Summary Stats Badge */}
          <div className="text-[11px] text-zinc-400 font-mono hidden xl:flex items-center gap-2 bg-zinc-950 px-2 py-1 rounded border border-zinc-800/80 shrink-0">
            <span>{t.navCompleted}: <strong className="text-emerald-400 font-bold">{totalJobsCount - pendingJobsCount}</strong></span>
            <span>•</span>
            <span>{t.navPending}: <strong className="text-amber-400 font-bold">{pendingJobsCount}</strong></span>
          </div>

          {/* Path Badge */}
          <button
            onClick={() => setActiveTab('settings')}
            className="hidden lg:flex bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded-md border border-zinc-700 items-center gap-1.5 transition-colors text-xs shrink-0"
          >
            <span className="text-zinc-400 text-[10px]">{t.navPath}:</span>
            <code className="text-primary-300 text-[11px] font-mono max-w-[110px] xl:max-w-[150px] truncate dir-ltr">
              {config.basePath}
            </code>
          </button>

          {/* Work Date Switcher */}
          <div className="flex items-center bg-zinc-950 rounded-md border border-zinc-800 p-0.5 shrink-0">
            <button
              onClick={() => adjustDate(-1)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="flex flex-col items-center px-1.5 min-w-[55px]">
              <span className="text-[9px] text-zinc-500 font-bold -mb-0.5 cursor-pointer hover:text-primary-300" onClick={resetToToday}>{t.navWorkDate}</span>
              <span className="font-mono text-primary-400 font-bold text-xs dir-ltr">
                {config.currentDate}
              </span>
            </div>
            <button
              onClick={() => adjustDate(1)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Alert Notification Bell Button & Full Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              title={t.notifTitle}
              className={`relative flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-200 shrink-0 select-none ${
                unacknowledgedCount > 0
                  ? `${getBellColorClass()} text-white shadow-lg shadow-red-500/20 animate-pulse`
                  : 'bg-zinc-800/90 hover:bg-zinc-700 border-zinc-700 text-zinc-200 hover:text-white'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {unacknowledgedCount > 0 ? (
                  <BellRing className="w-4 h-4 text-white" />
                ) : (
                  <Bell className="w-4 h-4 text-zinc-300" />
                )}
                {unacknowledgedCount > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-amber-400 text-zinc-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-900 shadow font-mono">
                    {unacknowledgedCount}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-zinc-400 ${isNotificationsOpen ? 'rotate-180 text-primary-400' : ''}`} />
            </button>

            {/* Notification Dropdown Panel */}
            {isNotificationsOpen && (
              <div className="absolute top-full left-0 sm:left-0 sm:right-auto mt-2 w-80 sm:w-96 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                
                {/* Panel Header */}
                <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary-500/10 border border-primary-500/20 rounded-lg text-primary-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-zinc-100 flex items-center gap-1.5">
                        {t.notifTitle}
                        {unacknowledgedCount > 0 && (
                          <span className="bg-rose-500/20 text-rose-300 text-[10px] px-1.5 py-0.2 rounded-full border border-rose-500/30 font-mono">
                            {unacknowledgedCount} {t.notifFilterNew}
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Mute / Unmute Quick Sound Toggle */}
                    <button
                      onClick={handleToggleMute}
                      title={config.notificationSound === 'off' ? t.notifSoundUnmute : t.notifSoundMute}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        config.notificationSound === 'off'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                          : 'bg-zinc-800 border-zinc-700 text-emerald-400 hover:bg-zinc-700'
                      }`}
                    >
                      {config.notificationSound === 'off' ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Tabs (Notifications List vs Options) */}
                <div className="flex border-b border-zinc-800 bg-zinc-950/40 p-1 gap-1">
                  <button
                    onClick={() => setDropdownTab('list')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      dropdownTab === 'list'
                        ? 'bg-zinc-800 text-primary-300 border border-zinc-700 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{t.notifTabsList}</span>
                    {unacknowledgedCount > 0 && (
                      <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-mono">
                        {unacknowledgedCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setDropdownTab('options')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      dropdownTab === 'options'
                        ? 'bg-zinc-800 text-secondary-300 border border-zinc-700 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{t.notifTabsOptions}</span>
                  </button>
                </div>

                {/* TAB 1: NOTIFICATIONS LIST */}
                {dropdownTab === 'list' && (
                  <div className="p-2 space-y-2">
                    {/* Filters & Actions Bar */}
                    <div className="flex items-center justify-between bg-zinc-950/60 p-1 rounded-xl border border-zinc-800/80">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setFilterMode('unread')}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                            filterMode === 'unread'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {t.notifFilterNew} ({unacknowledgedCount})
                        </button>
                        <button
                          onClick={() => setFilterMode('all')}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                            filterMode === 'all'
                              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {t.notifFilterAll} ({allJobs.length})
                        </button>
                        <button
                          onClick={() => setFilterMode('done')}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                            filterMode === 'done'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {t.notifFilterDone}
                        </button>
                      </div>

                      {unacknowledgedCount > 0 && (
                        <button
                          onClick={() => {
                            if (onDismissAllNotifications) onDismissAllNotifications();
                            else if (onAcknowledgeAlert) onAcknowledgeAlert();
                          }}
                          className="text-[10px] text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/20 transition-colors font-semibold"
                        >
                          {t.notifMarkAllRead}
                        </button>
                      )}
                    </div>

                    {/* Scrollable Notification Cards List */}
                    <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-1.5 p-0.5">
                      {displayedJobs().length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-zinc-700 stroke-[1.5]" />
                          <span>{t.notifNoAlerts}</span>
                        </div>
                      ) : (
                        displayedJobs().map((job) => {
                          const isUnacknowledged = unacknowledgedJobs.some((u) => u.id === job.id);
                          return (
                            <div
                              key={job.id}
                              onClick={() => {
                                if (onSelectJob) onSelectJob(job);
                                setIsNotificationsOpen(false);
                              }}
                              className={`group flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isUnacknowledged
                                  ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-zinc-100 shadow-sm'
                                  : 'bg-zinc-950/40 hover:bg-zinc-800/60 border-zinc-800 text-zinc-300'
                              }`}
                            >
                              <div className="flex items-start gap-2 min-w-0 flex-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase font-bold shrink-0 ${getPrinterBadgeClass(job.printer)}`}>
                                  {job.printer}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-zinc-100 truncate dir-ltr text-right group-hover:text-primary-300 transition-colors" title={job.filename}>
                                    {job.filename}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                                    <span className="flex items-center gap-1 font-mono">
                                      <Clock className="w-3 h-3 text-zinc-500" />
                                      {new Date(job.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {job.customerName && (
                                      <span className="truncate text-zinc-300 max-w-[100px]">
                                        • {job.customerName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSelectJob) onSelectJob(job);
                                    setIsNotificationsOpen(false);
                                  }}
                                  title={t.notifJobDetails}
                                  className="p-1 text-zinc-400 hover:text-primary-300 hover:bg-zinc-800 rounded transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                {isUnacknowledged && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onDismissNotification) onDismissNotification(job.id);
                                    }}
                                    title={t.hideAlert}
                                    className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: NOTIFICATION OPTIONS & PREFERENCES */}
                {dropdownTab === 'options' && (
                  <div className="p-3 space-y-3.5 max-h-80 overflow-y-auto scrollbar-thin">
                    
                    {/* Option 1: Alert Sound & Tone Selector */}
                    <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                          <span>{t.notifSoundSetting}</span>
                        </label>
                        
                        {/* Test Sound Button */}
                        <button
                          type="button"
                          onClick={() => playNotificationSound(config.notificationSound || 'default')}
                          className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-500/30 transition-all active:scale-95"
                        >
                          <Play className="w-3 h-3 fill-emerald-300" />
                          <span>{t.notifTestSound}</span>
                        </button>
                      </div>

                      {/* Sound Choice Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {[
                          { id: 'default', label: t.soundDefault, icon: '🛎️' },
                          { id: 'shorts', label: t.soundShorts, icon: '🔥' },
                          { id: 'alt1', label: t.soundFast, icon: '⚡' },
                          { id: 'alt2', label: t.soundSlow, icon: '🎵' },
                          { id: 'off', label: t.soundOff, icon: '🔇' },
                        ].map((snd) => {
                          const isActive = (config.notificationSound || 'default') === snd.id;
                          return (
                            <button
                              key={snd.id}
                              type="button"
                              onClick={() => {
                                if (onUpdateConfig) onUpdateConfig({ notificationSound: snd.id });
                                playNotificationSound(snd.id);
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isActive
                                  ? 'bg-primary-600 text-white shadow'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                <span>{snd.icon}</span>
                                <span>{snd.label}</span>
                              </span>
                              {isActive && <Check className="w-3.5 h-3.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Option 2: Browser Desktop Push Notifications */}
                    <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-cyan-400" />
                          <span>{t.notifPushTitle}</span>
                        </label>
                      </div>

                      {pushStatus === 'granted' ? (
                        <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{t.notifPushActive}</span>
                        </div>
                      ) : pushStatus === 'denied' ? (
                        <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{t.notifPushBlocked}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={requestPushPermission}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition-all shadow"
                        >
                          <BellRing className="w-3.5 h-3.5" />
                          <span>{t.notifEnablePush}</span>
                        </button>
                      )}
                    </div>

                    {/* Option 3: Notification Duration */}
                    <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800 space-y-1.5">
                      <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>{t.durationTitle}</span>
                      </label>
                      <div className="grid grid-cols-4 gap-1 pt-1">
                        {[
                          { val: 0, label: 'يدوي' },
                          { val: 5, label: '5ث' },
                          { val: 10, label: '10ث' },
                          { val: 30, label: '30ث' },
                        ].map((dur) => {
                          const isActive = config.notificationDuration === dur.val;
                          return (
                            <button
                              key={dur.val}
                              type="button"
                              onClick={() => {
                                if (onUpdateConfig) onUpdateConfig({ notificationDuration: dur.val });
                              }}
                              className={`py-1 text-center text-xs font-bold rounded-md transition-all ${
                                isActive
                                  ? 'bg-amber-500 text-zinc-950'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                              }`}
                            >
                              {dur.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Option 4: Alert Color */}
                    <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800 space-y-1.5">
                      <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-rose-400" />
                        <span>{t.colorTitle}</span>
                      </label>
                      <div className="flex items-center gap-2 pt-1 justify-between">
                        {[
                          { id: 'red', bg: 'bg-red-500' },
                          { id: 'orange', bg: 'bg-orange-500' },
                          { id: 'blue', bg: 'bg-blue-500' },
                          { id: 'green', bg: 'bg-emerald-500' },
                          { id: 'purple', bg: 'bg-purple-500' },
                        ].map((clr) => {
                          const isActive = (config.notificationColor || 'red') === clr.id;
                          return (
                            <button
                              key={clr.id}
                              type="button"
                              onClick={() => {
                                if (onUpdateConfig) onUpdateConfig({ notificationColor: clr.id });
                              }}
                              className={`w-7 h-7 rounded-full ${clr.bg} transition-all flex items-center justify-center ${
                                isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : 'opacity-70 hover:opacity-100'
                              }`}
                            >
                              {isActive && <Check className="w-4 h-4 text-white stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Open Full System Settings */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('settings');
                        setIsNotificationsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs rounded-xl border border-zinc-700 transition-all"
                    >
                      <Settings className="w-4 h-4 text-secondary-400" />
                      <span>{t.notifFullSettings}</span>
                    </button>

                  </div>
                )}

              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-zinc-300 hover:text-white transition-all shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* TV Display Mode */}
          <button
            onClick={() => window.open(window.location.pathname + '?display=true', '_blank')}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold px-2 py-1 rounded-md transition-all text-xs shrink-0"
          >
            <MonitorPlay className="w-3.5 h-3.5 text-secondary-400" />
            <span className="hidden sm:inline">{t.navDisplay}</span>
          </button>

          {/* Export */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold px-2 py-1 rounded-md transition-all text-xs shrink-0"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{t.navExport}</span>
          </button>

        </div>

      </div>
    </header>
  );
};
