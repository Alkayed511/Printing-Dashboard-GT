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
  Minus
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
}) => {
  const adjustDate = (days: number) => {
    try {
      const parts = config.currentDate.split('-');
      if (parts.length === 2) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const dateObj = new Date(new Date().getFullYear(), m - 1, d);
        dateObj.setDate(dateObj.getDate() + days);
        onChangeDate(`${dateObj.getDate()}-${dateObj.getMonth() + 1}`);
      }
    } catch (e) {
      console.error('Error adjusting date', e);
    }
  };

  const resetToToday = () => {
    onChangeDate(`${new Date().getDate()}-${new Date().getMonth() + 1}`);
  };

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 text-white sticky top-0 z-30 shadow-md">
      {/* High Density Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Network Indicator */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-orange-500 overflow-hidden shadow-sm">
             <div className="absolute inset-0 bg-zinc-700"></div>
             <span className="relative z-10 font-black italic text-lg text-white font-mono tracking-tighter" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>GT</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
              نظام تتبع أوامر الطباعة
            </h1>
            <span className="text-zinc-500 font-normal text-sm mr-2 font-mono hidden sm:inline-block">v2.4.0</span>
          </div>
        </div>

        {/* High Density Header Controls */}
        <div className="flex items-center gap-3 text-sm">
          {/* Path Badge */}
          <button
            onClick={onOpenConfig}
            className="hidden md:flex bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-700 items-center gap-2 transition-colors"
            title="تعديل مسار الشبكة"
          >
            <span className="text-zinc-400 text-xs">المسار:</span>
            <code className="text-orange-300 text-xs font-mono max-w-[150px] lg:max-w-[200px] truncate dir-ltr">
              {config.basePath}
            </code>
          </button>

          {/* Today Date */}
          <div className="hidden lg:flex items-center mx-2 bg-zinc-950 rounded-lg border border-zinc-800 p-1 shadow-inner">
            <button
              onClick={() => adjustDate(-1)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="اليوم السابق"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center px-3 min-w-[80px]">
              <span className="text-[10px] text-zinc-500 font-bold mb-0.5" onClick={resetToToday} title="العودة لليوم" style={{cursor: 'pointer'}}>تاريخ العمل</span>
              <span className="font-mono text-orange-400 font-bold uppercase text-sm dir-ltr">
                {config.currentDate}
              </span>
            </div>
            <button
              onClick={() => adjustDate(1)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="اليوم التالي"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden lg:block w-px h-8 bg-zinc-800 mx-2"></div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-all"
            title="تحديث تلقائي للملفات"
          >
            <RefreshCw className={`w-4 h-4 text-orange-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Export Job */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold px-4 py-1.5 rounded-lg transition-all shadow-sm text-sm"
            title="تصدير تقرير الجرد"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">جرد</span>
          </button>

          {/* Add Job */}
          <button
            onClick={onOpenNewJob}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-1.5 rounded-lg transition-all shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">أمر جديد</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Bar */}
      <div className="bg-zinc-950/80 border-t border-zinc-800/80 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                activeTab === 'kanban'
                  ? 'bg-orange-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>لوحة كانبان</span>
              {pendingJobsCount > 0 && (
                <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-md font-mono">
                  {pendingJobsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('compact')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                activeTab === 'compact'
                  ? 'bg-orange-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>عرض شبكي</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                activeTab === 'stats'
                  ? 'bg-orange-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>الإحصائيات</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                activeTab === 'code'
                  ? 'bg-orange-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>كود Python</span>
            </button>
          </nav>

          <div className="text-xs text-zinc-400 font-mono hidden sm:flex items-center gap-4">
            <span>الانتظار: <strong className="text-amber-400 font-bold text-sm">{pendingJobsCount}</strong></span>
            <span>المكتمل: <strong className="text-emerald-400 font-bold text-sm">{totalJobsCount - pendingJobsCount}</strong></span>
          </div>

        </div>
      </div>
    </header>
  );
};
