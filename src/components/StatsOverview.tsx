import React, { useState } from 'react';
import { PrintJob, PrinterInfo } from '../types';
import { PRINTERS_LIST } from '../data/printers';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Activity,
  Clock,
  CheckCircle2,
  Users,
  Hash,
  Printer
} from 'lucide-react';

interface StatsOverviewProps {
  jobs: PrintJob[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ jobs }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'done'>('all');

  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter((j: PrintJob) => j.status === 'pending').length;
  const doneJobs = jobs.filter((j: PrintJob) => j.status === 'done').length;

  // Unique customers count
  const uniqueCustomers = new Set(
    jobs.map((j: PrintJob) => j.customerName || 'عميل عام').filter(Boolean)
  ).size;

  // Total quantity
  const totalQuantity = jobs.reduce((acc: number, curr: PrintJob) => acc + (curr.quantity || 1), 0);

  // Data for Stacked Bar Chart (Printer Performance)
  const barChartData = PRINTERS_LIST.map((printer: PrinterInfo) => {
    const pJobs = jobs.filter((j: PrintJob) => j.printer === printer.id);
    const doneCount = pJobs.filter((j: PrintJob) => j.status === 'done').length;
    const pendingCount = pJobs.filter((j: PrintJob) => j.status === 'pending').length;

    // Short name for X-Axis
    let shortName = printer.nameAr.split(' ')[0];
    if (printer.id === 'r2r') shortName = 'رول R2R';
    if (printer.id === 'dtf') shortName = 'DTF قماش';
    if (printer.id === 'flat small') shortName = 'فلات سمول';

    return {
      name: shortName,
      fullName: printer.nameAr,
      done: doneCount,
      pending: pendingCount,
      total: pJobs.length,
      color: printer.accentColor,
    };
  });

  // Data for Donut Chart (Orders by Category / Printer)
  const donutData = PRINTERS_LIST.map((printer: PrinterInfo) => {
    const count = jobs.filter((j: PrintJob) => j.printer === printer.id).length;
    return {
      name: printer.nameAr.split(' ')[0],
      fullName: printer.nameAr,
      value: count,
      color: printer.accentColor,
    };
  }).filter((item) => item.value > 0 || totalJobs === 0);

  // If no jobs at all, display mock slices for pleasant preview visualization
  const displayDonutData =
    donutData.length > 0 && totalJobs > 0
      ? donutData
      : PRINTERS_LIST.map((p: PrinterInfo) => ({
          name: p.nameAr.split(' ')[0],
          fullName: p.nameAr,
          value: 1,
          color: p.accentColor,
        }));

  // Filtered Jobs for Order Log Table
  const filteredJobs = jobs.filter((job: PrintJob) => {
    if (filterStatus === 'pending') return job.status === 'pending';
    if (filterStatus === 'done') return job.status === 'done';
    return true;
  });

  return (
    <div className="space-y-6 dir-rtl text-right">
      
      {/* 1. TOP METRIC CARDS ROW (5 Cards matching reference layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* TOTAL ORDERS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5 hover:border-zinc-700 transition-colors">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">إجمالي الأوامر</p>
            <h3 className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">{totalJobs}</h3>
          </div>
        </div>

        {/* PENDING ORDERS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5 hover:border-zinc-700 transition-colors">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">قيد الانتظار</p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-0.5">{pendingJobs}</h3>
          </div>
        </div>

        {/* COMPLETED ORDERS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5 hover:border-zinc-700 transition-colors">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">المكتملة</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-300 font-mono mt-0.5">{doneJobs}</h3>
          </div>
        </div>

        {/* CUSTOMERS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5 hover:border-zinc-700 transition-colors">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">العملاء</p>
            <h3 className="text-xl sm:text-2xl font-black text-purple-300 font-mono mt-0.5">{uniqueCustomers}</h3>
          </div>
        </div>

        {/* TOTAL QUANTITY */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5 hover:border-zinc-700 transition-colors">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 shrink-0">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">إجمالي القطع</p>
            <h3 className="text-xl sm:text-2xl font-black text-rose-300 font-mono mt-0.5">{totalQuantity}</h3>
          </div>
        </div>

      </div>

      {/* 2. MIDDLE SECTION (Stacked Bar Chart + Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Printer Performance (Stacked Bar) - Spans 2 cols */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4 min-h-[360px]">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="font-extrabold text-lg text-white tracking-wide uppercase">أداء العمليات والطباعة</h3>
              <p className="text-xs text-zinc-400 mt-0.5">مقارنة أوامر الطباعة المكتملة والمعلقة لكل قسم</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-400 font-mono font-semibold bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                حسب الطابعة
              </span>
              <div className="flex items-center gap-2 mr-2">
                <span className="flex items-center gap-1.5 text-zinc-300 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  مكتمل
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  معلق
                </span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      const doneVal = payload[0]?.value || 0;
                      const pendingVal = payload[1]?.value || 0;
                      const totalVal = Number(doneVal) + Number(pendingVal);
                      return (
                        <div className="bg-zinc-950 border border-zinc-700 p-3 rounded-xl shadow-2xl dir-rtl text-right text-xs">
                          <div className="font-bold text-white mb-1.5 border-b border-zinc-800 pb-1">{label}</div>
                          <div className="text-emerald-400 font-semibold">مكتمل: {doneVal} أمر</div>
                          <div className="text-amber-400 font-semibold">قيد الانتظار: {pendingVal} أمر</div>
                          <div className="text-zinc-300 font-bold mt-1 pt-1 border-t border-zinc-800">
                            الإجمالي: {totalVal} أمر
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="done" name="مكتمل" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={28} />
                <Bar dataKey="pending" name="معلق" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Right Card: Orders By Category / Printer (Donut Chart) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4 min-h-[360px]">
          
          {/* Header */}
          <div className="pb-3 border-b border-zinc-800">
            <h3 className="font-extrabold text-lg text-white tracking-wide uppercase">توزيع الأوامر حسب الطابعة</h3>
            <p className="text-xs text-zinc-400 mt-0.5">النسبة المئوية لكل قسم طابعات</p>
          </div>

          {/* Donut Chart with Center Text */}
          <div className="relative h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={displayDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {displayDonutData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#18181b" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-zinc-700 p-2.5 rounded-xl text-xs dir-rtl text-right">
                          <div className="font-bold text-white">{data.fullName}</div>
                          <div className="text-amber-300 font-mono mt-0.5">{data.value} أمر</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">الأوامر</span>
              <span className="text-2xl font-black text-white font-mono mt-0.5">{totalJobs}</span>
            </div>
          </div>

          {/* Donut Legend below */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-xs">
            {PRINTERS_LIST.map((printer: PrinterInfo) => {
              const pCount = jobs.filter((j: PrintJob) => j.printer === printer.id).length;
              return (
                <div key={printer.id} className="flex items-center justify-between text-zinc-300 bg-zinc-950/50 p-1.5 rounded-lg border border-zinc-800/60">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: printer.accentColor }} />
                    <span className="truncate text-[11px]">{printer.nameAr.split(' ')[0]}</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-400 text-[11px]">{pCount}</span>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* 3. BOTTOM SECTION: ORDER LOG */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        
        {/* Table Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="font-extrabold text-lg text-white tracking-wide uppercase">سجل أوامر الطباعة</h3>
            <p className="text-xs text-zinc-400 mt-0.5">قائمة تفصيلية بالأوامر المجدولة لليوم المحدد</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filterStatus === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              الكل ({totalJobs})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              قيد الانتظار ({pendingJobs})
            </button>
            <button
              onClick={() => setFilterStatus('done')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filterStatus === 'done'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              مكتمل ({doneJobs})
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-right text-xs dir-rtl">
            <thead className="bg-zinc-950 text-zinc-400 uppercase font-mono border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4 text-right">رقم / اسم الملف</th>
                <th className="py-3 px-4 text-right">الطابعة</th>
                <th className="py-3 px-4 text-right">اسم العميل</th>
                <th className="py-3 px-4 text-right">المواصفات والقياس</th>
                <th className="py-3 px-4 text-center">الكمية</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-left">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/50">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    لا توجد أوامر طباعة مطابقة للفلاتر المختارة
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job: PrintJob) => {
                  const printerObj = PRINTERS_LIST.find((p: PrinterInfo) => p.id === job.printer);

                  return (
                    <tr key={job.id} className="hover:bg-zinc-800/40 transition-colors">
                      {/* Filename */}
                      <td className="py-3 px-4 font-mono font-semibold text-zinc-200 dir-ltr text-right max-w-[200px] truncate">
                        {job.filename}
                      </td>

                      {/* Printer */}
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border"
                          style={{
                            backgroundColor: `${printerObj?.accentColor}15`,
                            borderColor: `${printerObj?.accentColor}40`,
                            color: printerObj?.accentColor || '#ffffff',
                          }}
                        >
                          <Printer className="w-3 h-3 shrink-0" />
                          {printerObj?.nameAr.split(' ')[0]}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4 text-zinc-300 font-medium">
                        {job.customerName || 'عميل طباعة'}
                      </td>

                      {/* Spec */}
                      <td className="py-3 px-4 text-zinc-400 font-mono">
                        {job.dimensions || 'مواصفات قياسية'}
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-zinc-200">
                        {job.quantity || 1}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {job.status === 'done' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            مكتمل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            قيد الانتظار
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-left font-mono text-[11px] text-zinc-500 dir-ltr">
                        {new Date(job.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
