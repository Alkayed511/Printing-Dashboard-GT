import React, { useState } from 'react';
import { X, FileDown, Calendar as CalendarIcon, CalendarDays } from 'lucide-react';

interface ExportReportModalProps {
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ onClose }) => {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'custom'>('daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleExport = () => {
    let url = `/api/reports/export/pdf?type=${reportType}&startDate=${startDate}`;
    if (reportType === 'custom') {
      url += `&endDate=${endDate}`;
    }
    
    // Open the PDF (HTML page that auto-prints) in a new tab
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg">
              <FileDown className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-zinc-100">استخراج تقارير الجرد</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          
          {/* Report Type Selector */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-zinc-300">نوع الجرد (فترة التقرير)</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReportType('daily')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                  reportType === 'daily'
                    ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
              >
                <CalendarIcon className="w-5 h-5" />
                <span className="text-xs font-bold">يومي</span>
              </button>
              
              <button
                type="button"
                onClick={() => setReportType('monthly')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                  reportType === 'monthly'
                    ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
              >
                <CalendarDays className="w-5 h-5" />
                <span className="text-xs font-bold">شهري</span>
              </button>
              
              <button
                type="button"
                onClick={() => setReportType('custom')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                  reportType === 'custom'
                    ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
              >
                <CalendarIcon className="w-5 h-5" />
                <span className="text-xs font-bold">مخصص</span>
              </button>
            </div>
          </div>

          {/* Date Selectors */}
          <div className="space-y-4 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
            {reportType === 'daily' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400">تاريخ اليوم</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            {reportType === 'monthly' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400">الشهر والسنة</label>
                <input
                  type="month"
                  value={startDate.substring(0, 7)}
                  onChange={(e) => setStartDate(e.target.value + '-01')}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            {reportType === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">من تاريخ</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">إلى تاريخ</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-sm transition-all"
          >
            <FileDown className="w-4 h-4" />
            <span>عرض وطباعة (PDF)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
