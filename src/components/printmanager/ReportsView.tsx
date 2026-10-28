import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Printer,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Cpu,
  User,
  Activity,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Order, Customer, Machine, PrintLog } from '../../types/printManager';
import { listenToPrintLogs } from '../../firebase/services';

interface ReportsViewProps {
  orders: Order[];
  customers: Customer[];
  machines: Machine[];
  payments?: any[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1', '#14B8A6'];

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  customers,
  machines,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'machines' | 'operators' | 'logs'>('overview');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [printLogs, setPrintLogs] = useState<PrintLog[]>([]);

  useEffect(() => {
    const unsub = listenToPrintLogs((logs) => {
      setPrintLogs(logs);
    });
    return () => unsub();
  }, []);

  // Filter logs & orders by period
  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = todayStr.substring(0, 7);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const isMatch = (dateStr?: string) => {
      if (!dateStr) return false;
      const d = dateStr.substring(0, 10);
      if (period === 'today') return d === todayStr;
      if (period === 'week') return d >= weekAgoStr && d <= todayStr;
      if (period === 'month') return d.startsWith(monthStr);
      return true; // 'all'
    };

    const targetLogs = printLogs.filter(l => isMatch(l.printedAt || l.createdAt));
    const targetOrders = orders.filter(o => isMatch(o.orderDate || o.createdAt));

    let totalSqm = 0;
    let totalLinearM = 0;
    let totalPieces = 0;
    let totalWaste = 0;

    targetLogs.forEach(l => {
      totalSqm += l.areaSqm || 0;
      totalLinearM += l.linearMeters || 0;
      totalPieces += l.quantityPrinted || 0;
      totalWaste += l.wasteQuantity || 0;
    });

    const wastePercent = totalPieces + totalWaste > 0
      ? ((totalWaste / (totalPieces + totalWaste)) * 100).toFixed(1)
      : '0';

    // Machine performance stats
    const machineStats: Record<string, {
      name: string;
      logsCount: number;
      sqm: number;
      linearM: number;
      pieces: number;
      waste: number;
    }> = {};

    targetLogs.forEach(l => {
      const mName = l.machineName || 'غير محدد';
      if (!machineStats[mName]) {
        machineStats[mName] = { name: mName, logsCount: 0, sqm: 0, linearM: 0, pieces: 0, waste: 0 };
      }
      machineStats[mName].logsCount += 1;
      machineStats[mName].sqm += l.areaSqm || 0;
      machineStats[mName].linearM += l.linearMeters || 0;
      machineStats[mName].pieces += l.quantityPrinted || 0;
      machineStats[mName].waste += l.wasteQuantity || 0;
    });

    // Operator performance stats
    const operatorStats: Record<string, {
      name: string;
      logsCount: number;
      sqm: number;
      pieces: number;
      waste: number;
    }> = {};

    targetLogs.forEach(l => {
      const op = l.operator || 'فني غير محدد';
      if (!operatorStats[op]) {
        operatorStats[op] = { name: op, logsCount: 0, sqm: 0, pieces: 0, waste: 0 };
      }
      operatorStats[op].logsCount += 1;
      operatorStats[op].sqm += l.areaSqm || 0;
      operatorStats[op].pieces += l.quantityPrinted || 0;
      operatorStats[op].waste += l.wasteQuantity || 0;
    });

    return {
      targetLogs,
      targetOrders,
      totalSqm: Math.round(totalSqm * 100) / 100,
      totalLinearM: Math.round(totalLinearM * 100) / 100,
      totalPieces,
      totalWaste,
      wastePercent,
      machineStats: Object.values(machineStats).map(m => ({
        ...m,
        sqm: Math.round(m.sqm * 100) / 100,
        linearM: Math.round(m.linearM * 100) / 100,
        wastePercent: m.pieces + m.waste > 0 ? ((m.waste / (m.pieces + m.waste)) * 100).toFixed(1) : '0',
      })),
      operatorStats: Object.values(operatorStats).map(o => ({
        ...o,
        sqm: Math.round(o.sqm * 100) / 100,
        wastePercent: o.pieces + o.waste > 0 ? ((o.waste / (o.pieces + o.waste)) * 100).toFixed(1) : '0',
      })),
    };
  }, [printLogs, orders, period]);

  // Export CSV
  const exportPrintLogsCSV = () => {
    const headers = [
      'التاريخ والوقت',
      'رقم أمر الطباعة',
      'العميل',
      'الماكينة',
      'المادة / الخامة',
      'الكمية المطبوعة (قطع)',
      'المساحة (م²)',
      'الطول (م.ط)',
      'الهادر والتالف (قطع)',
      'المشغل',
      'دقة الطباعة',
      'ملاحظات التشغيل'
    ];

    const rows = filteredData.targetLogs.map(l => [
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
    link.setAttribute('download', `Print_Quantities_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              تقارير كميات الإنتاج الفعلي
            </span>
            <span className="text-xs text-slate-400">{filteredData.targetLogs.length} دفعة طباعة منجزة</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">تقارير كميات الطباعة ونسب الهادر</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            إحصائيات تفصيلية للأمتار المربعة (م²)، عدادات الماكينات، نسب التلف، وأداء مشغلي الورشة
          </p>
        </div>

        <button
          onClick={exportPrintLogsCSV}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>تصدير كشف الكميات (CSV)</span>
        </button>
      </div>

      {/* Period Selector Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setPeriod('today')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            period === 'today' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          إنتاج اليوم
        </button>
        <button
          onClick={() => setPeriod('week')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            period === 'week' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          آخر 7 أيام
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            period === 'month' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          الشهر الحالي ({new Date().toLocaleString('ar-JO', { month: 'long' })})
        </button>
        <button
          onClick={() => setPeriod('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            period === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          كافة الفترات
        </button>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-xs text-slate-400 block mb-1">المساحة المطبوعة</span>
          <div className="text-2xl font-black text-blue-400">{filteredData.totalSqm} <span className="text-sm font-normal text-slate-400">م²</span></div>
          <span className="text-[11px] text-slate-500">للفترة المحددة</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-xs text-slate-400 block mb-1">الطول المطبوع (رول)</span>
          <div className="text-2xl font-black text-indigo-400">{filteredData.totalLinearM} <span className="text-sm font-normal text-slate-400">م.ط</span></div>
          <span className="text-[11px] text-slate-500">استهلاك طولي من الرولات</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-xs text-slate-400 block mb-1">القطع السليمة المنجزة</span>
          <div className="text-2xl font-black text-emerald-400">{filteredData.totalPieces} <span className="text-sm font-normal text-slate-400">قطعة</span></div>
          <span className="text-[11px] text-slate-500">حبات وبوسترات</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-xs text-slate-400 block mb-1">الهادر والتالف (سكراب)</span>
          <div className="text-2xl font-black text-rose-400">
            {filteredData.totalWaste} <span className="text-xs font-normal text-slate-400">قطعة ({filteredData.wastePercent}%)</span>
          </div>
          <span className="text-[11px] text-rose-400/80">عيوب طباعة أو تلف خامات</span>
        </div>
      </div>

      {/* Sub-tabs: Overview, Machines, Operators, Logs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveReportTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeReportTab === 'overview'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          نظرة عامة والماكينات
        </button>

        <button
          onClick={() => setActiveReportTab('operators')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeReportTab === 'operators'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          إنتاجية المشغلين والفنيين
        </button>

        <button
          onClick={() => setActiveReportTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeReportTab === 'logs'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          كشف دفعات الطباعة ({filteredData.targetLogs.length})
        </button>
      </div>

      {/* VIEW 1: Overview & Machines Table */}
      {activeReportTab === 'overview' && (
        <div className="space-y-6">
          {/* Machine Production Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-blue-400" />
              إنتاجية ماكينات الطباعة ونسب الهادر
            </h3>

            {filteredData.machineStats.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">لا توجد دفعات طباعة مسجلة لهذه الفترة</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3 font-bold">اسم الماكينة</th>
                      <th className="p-3 font-bold text-center">عدد الدفعات</th>
                      <th className="p-3 font-bold text-center">المساحة (م²)</th>
                      <th className="p-3 font-bold text-center">الطول (م.ط)</th>
                      <th className="p-3 font-bold text-center">القطع السليمة</th>
                      <th className="p-3 font-bold text-center">الهادر والتالف</th>
                      <th className="p-3 font-bold text-center">نسبة التلف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredData.machineStats.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <Printer className="w-3.5 h-3.5 text-blue-400" />
                          <span>{m.name}</span>
                        </td>
                        <td className="p-3 font-mono text-center text-slate-300">{m.logsCount}</td>
                        <td className="p-3 font-mono text-center text-blue-400 font-bold">{m.sqm} م²</td>
                        <td className="p-3 font-mono text-center text-indigo-400 font-bold">{m.linearM} م.ط</td>
                        <td className="p-3 font-mono text-center text-emerald-400 font-bold">{m.pieces}</td>
                        <td className="p-3 font-mono text-center text-rose-400 font-bold">{m.waste}</td>
                        <td className="p-3 font-mono text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            parseFloat(m.wastePercent) > 5 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {m.wastePercent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Operator Performance */}
      {activeReportTab === 'operators' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-emerald-400" />
            إنتاجية الفنيين ومشغلي الماكينات
          </h3>

          {filteredData.operatorStats.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">لا توجد بيانات مسجلة لمشغلي الماكينات</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 font-bold">اسم المشغل / الفني</th>
                    <th className="p-3 font-bold text-center">دفعات التشغيل</th>
                    <th className="p-3 font-bold text-center">المساحة المنجزة (م²)</th>
                    <th className="p-3 font-bold text-center">القطع السليمة</th>
                    <th className="p-3 font-bold text-center">الهادر المسجل</th>
                    <th className="p-3 font-bold text-center">نسبة التلف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredData.operatorStats.map((op, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span>{op.name}</span>
                      </td>
                      <td className="p-3 font-mono text-center text-slate-300">{op.logsCount}</td>
                      <td className="p-3 font-mono text-center text-blue-400 font-bold">{op.sqm} م²</td>
                      <td className="p-3 font-mono text-center text-emerald-400 font-bold">{op.pieces} قطعة</td>
                      <td className="p-3 font-mono text-center text-rose-400 font-bold">{op.waste}</td>
                      <td className="p-3 font-mono text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          parseFloat(op.wastePercent) > 5 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {op.wastePercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: Detailed Logs List */}
      {activeReportTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              كشف سجلات دفعات الطباعة التفصيلي
            </h3>
            <button
              onClick={exportPrintLogsCSV}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              تصدير CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-bold">التاريخ</th>
                  <th className="p-3 font-bold">الأمر</th>
                  <th className="p-3 font-bold">العميل</th>
                  <th className="p-3 font-bold">الماكينة</th>
                  <th className="p-3 font-bold text-center">الكمية (قطع)</th>
                  <th className="p-3 font-bold text-center">المساحة (م²)</th>
                  <th className="p-3 font-bold text-center">الهادر</th>
                  <th className="p-3 font-bold">المشغل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredData.targetLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {l.printedAt?.substring(0, 16) || l.createdAt?.substring(0, 16)}
                    </td>
                    <td className="p-3 font-mono font-bold text-white">{l.orderNumber}</td>
                    <td className="p-3 text-slate-300 truncate max-w-[120px]">{l.customerName}</td>
                    <td className="p-3 text-slate-300 truncate max-w-[120px]">{l.machineName}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400 text-center">{l.quantityPrinted}</td>
                    <td className="p-3 font-mono text-blue-400 text-center">{l.areaSqm || 0}</td>
                    <td className="p-3 font-mono text-rose-400 text-center">{l.wasteQuantity || 0}</td>
                    <td className="p-3 text-slate-400">{l.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
