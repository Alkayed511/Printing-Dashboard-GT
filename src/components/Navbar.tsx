import React from 'react';
import { 
  Printer, 
  Network, 
  RefreshCw, 
  Plus, 
  Kanban, 
  Code2, 
  BarChart3, 
  Calendar,
  Layers,
  Settings,
  FileDown,
  Minus,
  Bell,
  BellRing
} from 'lucide-react';
import { ServerConfig } from '../types';

interface NavbarProps {
  config: ServerConfig;
  activeTab: 'kanban' | 'compact' | 'stats' | 'code';
  setActiveTab: (tab: 'kanban' | 'compact' | 'stats' | 'code') => void;
  onOpenConfig: () => void;
  onOpenNewJob: () => void;
  onOpenExport: () => void;
  onRefresh: () => void;
  onChangeDate: (newDate: string) => void;
  isRefreshing: boolean;
  totalJobsCount: number;
  pendingJobsCount: number;
  unacknowledgedCount?: number;
  onAcknowledgeAlert?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  activeTab,
  setActiveTab,
  onOpenConfig,
  onOpenNewJob,
  onOpenExport,
  onRefresh,
  onChangeDate,
  isRefreshing,
  totalJobsCount,
  pendingJobsCount,
  unacknowledgedCount = 0,
  onAcknowledgeAlert,
}) => {
  const adjustDate = (days: number) => {
    try {
      const dateStr = (config.currentDate || '').trim();
      const parts = dateStr.split(/[-/]/);
      let year = new Date().getFullYear();
      let month = new Date().getMonth() + 1;
      let day = new Date().getDate();

      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          day = parseInt(parts[2], 10);
        } else {
          // DD-MM-YYYY
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
        }
      } else if (parts.length === 2) {
        // DD-MM or D-M
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

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 text-white sticky top-0 z-30 shadow-md shrink-0">
      {/* Ultra Compact & Balanced Main Navigation Bar */}
      <div className="max-w-[1800px] mx-auto w-full px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        
        {/* Start Section (Right in RTL): Brand & Title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full border-2 border-orange-500 overflow-hidden shrink-0 shadow-sm">
            <div className="absolute inset-0 bg-zinc-700"></div>
            <span className="relative z-10 font-black italic text-xs text-white font-mono" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>GT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-zinc-100 whitespace-nowrap">
              نظام تتبع أوامر الطباعة
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
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>لوحة كانبان</span>
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
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>عرض شبكي</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>الإحصائيات</span>
          </button>
        </nav>

        {/* End Section (Left in RTL): Stats, Path, Work Date, Notification, Refresh, Inventory & New Order */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
          
          {/* Summary Stats Badge */}
          <div className="text-[11px] text-zinc-400 font-mono hidden xl:flex items-center gap-2 bg-zinc-950 px-2 py-1 rounded border border-zinc-800/80 shrink-0">
            <span>المكتمل: <strong className="text-emerald-400 font-bold">{totalJobsCount - pendingJobsCount}</strong></span>
            <span>•</span>
            <span>الانتظار: <strong className="text-amber-400 font-bold">{pendingJobsCount}</strong></span>
          </div>

          {/* Path Badge */}
          <button
            onClick={onOpenConfig}
            className="hidden lg:flex bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded-md border border-zinc-700 items-center gap-1.5 transition-colors text-xs shrink-0"
            title="تعديل مسار الشبكة"
          >
            <span className="text-zinc-400 text-[10px]">المسار:</span>
            <code className="text-orange-300 text-[11px] font-mono max-w-[110px] xl:max-w-[150px] truncate dir-ltr">
              {config.basePath}
            </code>
          </button>

          {/* Work Date Switcher */}
          <div className="flex items-center bg-zinc-950 rounded-md border border-zinc-800 p-0.5 shrink-0">
            <button
              onClick={() => adjustDate(-1)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="اليوم السابق"
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="flex flex-col items-center px-1.5 min-w-[55px]">
              <span className="text-[9px] text-zinc-500 font-bold -mb-0.5 cursor-pointer hover:text-orange-300" onClick={resetToToday} title="العودة لليوم">تاريخ العمل</span>
              <span className="font-mono text-orange-400 font-bold text-xs dir-ltr">
                {config.currentDate}
              </span>
            </div>
            <button
              onClick={() => adjustDate(1)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="اليوم التالي"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Alert Notification */}
          <button
            onClick={onAcknowledgeAlert}
            className={`relative p-1.5 rounded-md border transition-all shrink-0 ${
              unacknowledgedCount > 0
                ? 'bg-red-600 text-white border-red-500 hover:bg-red-500 shadow-md animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300 hover:text-white'
            }`}
            title={unacknowledgedCount > 0 ? `تنبيه: ${unacknowledgedCount} طلب جديد` : 'لا توجد تنبيهات جديدة'}
          >
            {unacknowledgedCount > 0 ? (
              <BellRing className="w-3.5 h-3.5 text-white" />
            ) : (
              <Bell className="w-3.5 h-3.5 text-zinc-400" />
            )}
            {unacknowledgedCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-yellow-300 text-red-950 text-[10px] font-black rounded-full flex items-center justify-center border border-red-700 shadow font-mono">
                {unacknowledgedCount}
              </span>
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-zinc-300 hover:text-white transition-all shrink-0"
            title="تحديث تلقائي للملفات"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Export */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold px-2 py-1 rounded-md transition-all text-xs shrink-0"
            title="تصدير تقرير الجرد"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">جرد</span>
          </button>

          {/* New Job */}
          <button
            onClick={onOpenNewJob}
            className="flex items-center gap-1 bg-orange-600 hover:bg-orange-500 text-white font-bold px-2.5 py-1 rounded-md transition-all text-xs shadow-sm shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>أمر جديد</span>
          </button>
        </div>

      </div>
    </header>
  );
};
