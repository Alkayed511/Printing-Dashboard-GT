import React, { useState, useMemo } from 'react';
import {
  Printer,
  Search,
  Plus,
  Filter,
  Calendar,
  Clock,
  Layers,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  User,
  Cpu,
  Box,
  CheckCircle2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { PrintLog, Machine, Material, Order } from '../../types/printManager';
import { deletePrintLog } from '../../firebase/services';
import { LogPrintQuantityModal } from './LogPrintQuantityModal';

interface PrintLogsViewProps {
  logs: PrintLog[];
  machines: Machine[];
  materials: Material[];
  orders: Order[];
  onOpenLogModal: () => void;
}

export const PrintLogsView: React.FC<PrintLogsViewProps> = ({
  logs,
  machines,
  materials,
  orders,
  onOpenLogModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [machineFilter, setMachineFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [wasteOnly, setWasteOnly] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Date boundaries
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.substring(0, 7), [todayStr]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Machine filter
      if (machineFilter !== 'all' && log.machineId !== machineFilter) return false;

      // Waste filter
      if (wasteOnly && (!log.wasteQuantity || log.wasteQuantity <= 0)) return false;

      // Period filter
      const logDate = (log.printedAt || log.createdAt || '').substring(0, 10);
      if (periodFilter === 'today' && logDate !== todayStr) return false;
      if (periodFilter === 'month' && !logDate.startsWith(currentMonthStr)) return false;
      if (periodFilter === 'week') {
        const diffDays = (new Date().getTime() - new Date(logDate).getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesOrder = log.orderNumber?.toLowerCase().includes(term);
        const matchesCust = log.customerName?.toLowerCase().includes(term);
        const matchesMachine = log.machineName?.toLowerCase().includes(term);
        const matchesMat = log.materialName?.toLowerCase().includes(term);
        const matchesOp = log.operator?.toLowerCase().includes(term);
        const matchesNotes = log.notes?.toLowerCase().includes(term);
        return matchesOrder || matchesCust || matchesMachine || matchesMat || matchesOp || matchesNotes;
      }

      return true;
    });
  }, [logs, machineFilter, periodFilter, wasteOnly, searchTerm, todayStr, currentMonthStr]);

  // KPI Calculations across filtered logs
  const totals = useMemo(() => {
    let sqm = 0;
    let linear = 0;
    let pieces = 0;
    let waste = 0;

    filteredLogs.forEach(l => {
      sqm += l.areaSqm || 0;
      linear += l.linearMeters || 0;
      pieces += l.quantityPrinted || 0;
      waste += l.wasteQuantity || 0;
    });

    const wastePercent = pieces + waste > 0 ? ((waste / (pieces + waste)) * 100).toFixed(1) : '0';

    return {
      sqm: Math.round(sqm * 100) / 100,
      linear: Math.round(linear * 100) / 100,
      pieces,
      waste,
      wastePercent,
    };
  }, [filteredLogs]);

  // Delete handler
  const handleDeleteLog = async (logId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟ سيتم تعديل كميات الأمر وعداد الماكينة تلقائياً.')) {
      try {
        setDeletingId(logId);
        await deletePrintLog(logId);
      } catch (err) {
        console.error('Delete print log error:', err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'رقم السجل',
      'التاريخ والوقت',
      'رقم أمر الطباعة',
      'العميل',
      'الماكينة',
      'المادة / الخامة',
      'الكمية المطبوعة (قطع)',
      'المساحة (م²)',
      'الأمتار الطولية (م.ط)',
      'الهادر / التالف (قطع)',
      'المشغل',
      'دقة الطباعة',
      'ملاحظات التشغيل'
    ];

    const rows = filteredLogs.map(l => [
      l.id,
      l.printedAt || l.createdAt,
      l.orderNumber || '',
      `"${(l.customerName || '').replace(/"/g, '""')}"`,
      `"${(l.machineName || '').replace(/"/g, '""')}"`,
      `"${(l.materialName || '').replace(/"/g, '""')}"`,
      l.quantityPrinted || 0,
      l.areaSqm || 0,
      l.linearMeters || 0,
      l.wasteQuantity || 0,
      `"${(l.operator || '').replace(/"/g, '""')}"`,
      `"${(l.printSpeed || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Print_Quantities_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-l from-slate-900 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              تسجيل كميات الإنتاج الفعلي
            </span>
            <span className="text-xs text-slate-400">{filteredLogs.length} دفعة مسجلة</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">سجل دفعات كميات الطباعة</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            توثيق كل دفعة طباعة منجزة على الماكينات، الأمتار المربعة، الأمتار الطولية، وحساب الهادر الفعلي
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenLogModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>تسجيل دفعة طباعة جديدة</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all"
            title="تصدير كشف الكميات إلى ملف CSV / Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Square Meters */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-300">إجمالي المساحة المطبوعة</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400">{totals.sqm} <span className="text-sm font-normal text-slate-400">م²</span></div>
          <div className="mt-1 text-[11px] text-slate-500">حسب مقاسات الدفعات المسجلة</div>
        </div>

        {/* Total Linear Meters */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-300">الأمتار الطولية (رول)</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-400">{totals.linear} <span className="text-sm font-normal text-slate-400">م.ط</span></div>
          <div className="mt-1 text-[11px] text-slate-500">طول الخامة المستهلكة من الرولات</div>
        </div>

        {/* Total Pieces */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-300">إجمالي القطع المنجزة</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">{totals.pieces} <span className="text-sm font-normal text-slate-400">قطعة / حبة</span></div>
          <div className="mt-1 text-[11px] text-slate-500">بوسترات، لوحات، ملصقات، تيشرتات</div>
        </div>

        {/* Waste / Scrap */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-300">الهادر والتالف (سكراب)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400">{totals.waste} <span className="text-sm font-normal text-slate-400">قطعة</span></div>
          <div className="mt-1 text-[11px] text-rose-400/80">نسبة التلف: <strong>{totals.wastePercent}%</strong></div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث برقم الأمر، العميل، الماكينة، الخامة، أو اسم المشغل..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-sm text-white placeholder-slate-500 transition-all text-right"
            />
            <Search className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Machine Filter */}
            <select
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-blue-500 font-semibold"
            >
              <option value="all">كل الماكينات</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            {/* Waste Toggle */}
            <button
              onClick={() => setWasteOnly(!wasteOnly)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                wasteOnly
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>هادر فقط</span>
            </button>
          </div>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-800/60 text-xs font-bold">
          <span className="text-slate-400 ml-2">الفترة:</span>
          <button
            onClick={() => setPeriodFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              periodFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            كل الفترات ({logs.length})
          </button>
          <button
            onClick={() => setPeriodFilter('today')}
            className={`px-3 py-1.5 rounded-xl transition ${
              periodFilter === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            اليوم
          </button>
          <button
            onClick={() => setPeriodFilter('week')}
            className={`px-3 py-1.5 rounded-xl transition ${
              periodFilter === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            آخر 7 أيام
          </button>
          <button
            onClick={() => setPeriodFilter('month')}
            className={`px-3 py-1.5 rounded-xl transition ${
              periodFilter === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            الشهر الحالي
          </button>
        </div>
      </div>

      {/* Print Logs List / Table */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
          <Printer className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">لا توجد دفعات طباعة مسجلة مطابقة للبحث</h3>
          <p className="text-xs text-slate-400 mb-4">اضغط على زر "تسجيل دفعة طباعة جديدة" لتوثيق إنتاج ماكينات الورشة</p>
          <button
            onClick={onOpenLogModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
          >
            تسجيل دفعة طباعة الآن
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map(log => {
            const hasWaste = log.wasteQuantity && log.wasteQuantity > 0;
            const logTime = log.printedAt
              ? new Date(log.printedAt).toLocaleString('ar-JO', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : log.createdAt?.substring(0, 16);

            return (
              <div
                key={log.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition"
              >
                {/* Left side: Order & Spec details */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs text-white bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                      {log.orderNumber || 'أمر عام'}
                    </span>

                    <span className="text-xs font-bold text-slate-200">
                      {log.customerName || 'عميل نقدي / مباشر'}
                    </span>

                    <span className="text-xs text-slate-400 flex items-center gap-1 mr-auto sm:mr-0">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {logTime}
                    </span>
                  </div>

                  {/* Machine & Material info */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      <span>{log.machineName || 'ماكينة غير محددة'}</span>
                    </span>

                    {log.materialName && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{log.materialName}</span>
                      </span>
                    )}

                    {log.printSpeed && (
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-semibold">
                        {log.printSpeed}
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>المشغل: <strong className="text-slate-200">{log.operator}</strong></span>
                    </span>
                  </div>

                  {/* Notes if any */}
                  {log.notes && (
                    <p className="text-xs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      ملاحظات: {log.notes}
                    </p>
                  )}
                </div>

                {/* Right side: Printed quantities badges and delete action */}
                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <div className="flex items-center gap-2">
                    {/* Pieces */}
                    <div className="text-center px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <span className="text-[10px] text-emerald-400 font-bold block">الكمية المطبوعة</span>
                      <span className="text-base font-black text-emerald-400">{log.quantityPrinted} <span className="text-xs font-normal">قطعة</span></span>
                    </div>

                    {/* Sqm */}
                    {log.areaSqm > 0 && (
                      <div className="text-center px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <span className="text-[10px] text-blue-400 font-bold block">المساحة</span>
                        <span className="text-base font-black text-blue-400">{log.areaSqm} <span className="text-xs font-normal">م²</span></span>
                      </div>
                    )}

                    {/* Linear meters */}
                    {log.linearMeters > 0 && (
                      <div className="text-center px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                        <span className="text-[10px] text-indigo-400 font-bold block">طولي</span>
                        <span className="text-base font-black text-indigo-400">{log.linearMeters} <span className="text-xs font-normal">م.ط</span></span>
                      </div>
                    )}

                    {/* Waste if any */}
                    {hasWaste && (
                      <div className="text-center px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <span className="text-[10px] text-rose-400 font-bold block">الهادر / تالف</span>
                        <span className="text-base font-black text-rose-400">{log.wasteQuantity} <span className="text-xs font-normal">قطعة</span></span>
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    disabled={deletingId === log.id}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white transition"
                    title="حذف هذا السجل والتراجع عن الكميات المضافة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
