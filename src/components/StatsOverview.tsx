import React, { useState } from 'react';
import { PrintJob, PrinterInfo } from '../types';
import { PRINTERS_LIST } from '../data/printers';
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
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredDonutIndex, setHoveredDonutIndex] = useState<number | null>(null);

  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter((j: PrintJob) => j.status === 'pending').length;
  const doneJobs = jobs.filter((j: PrintJob) => j.status === 'done').length;

  // Unique customers count
  const uniqueCustomers = new Set(
    jobs.map((j: PrintJob) => j.customerName || 'عميل عام').filter(Boolean)
  ).size;

  // Total quantity
  const totalQuantity = jobs.reduce((acc: number, curr: PrintJob) => acc + (curr.quantity || 1), 0);

  // Stacked Bar Chart Data calculation
  const printerBarData = PRINTERS_LIST.map((printer: PrinterInfo) => {
    const pJobs = jobs.filter((j: PrintJob) => j.printer === printer.id);
    const doneCount = pJobs.filter((j: PrintJob) => j.status === 'done').length;
    const pendingCount = pJobs.filter((j: PrintJob) => j.status === 'pending').length;

    let shortName = printer.nameAr.split(' ')[0];
    if (printer.id === 'r2r') shortName = 'رول R2R';
    if (printer.id === 'dtf') shortName = 'DTF قماش';
    if (printer.id === 'flat small') shortName = 'فلات سمول';

    return {
      id: printer.id,
      name: shortName,
      fullName: printer.nameAr,
      done: doneCount,
      pending: pendingCount,
      total: pJobs.length,
      color: printer.accentColor,
    };
  });

  const maxBarTotal = Math.max(...printerBarData.map((d) => d.total), 4);

  // Donut Data
  const donutItems = PRINTERS_LIST.map((printer: PrinterInfo) => {
    const count = jobs.filter((j: PrintJob) => j.printer === printer.id).length;
    return {
      id: printer.id,
      name: printer.nameAr.split(' ')[0],
      fullName: printer.nameAr,
      value: count,
      color: printer.accentColor,
    };
  });

  const donutTotal = donutItems.reduce((acc, curr) => acc + curr.value, 0);

  // Filtered Jobs for Order Log
  const filteredJobs = jobs.filter((job: PrintJob) => {
    if (filterStatus === 'pending') return job.status === 'pending';
    if (filterStatus === 'done') return job.status === 'done';
    return true;
  });

  // SVG Donut Calculations
  const radius = 65;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="space-y-6 dir-rtl text-right">
      
      {/* 1. TOP METRIC CARDS ROW (5 Cards) */}
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
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          
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

          {/* SVG Custom Responsive Stacked Bar Chart */}
          <div className="relative w-full h-64 pt-2">
            
            {/* Grid Y-lines */}
            <div className="absolute inset-x-8 top-2 bottom-8 flex flex-col justify-between pointer-events-none border-b border-zinc-800">
              {[1, 0.75, 0.5, 0.25, 0].map((step, idx) => (
                <div key={idx} className="flex items-center w-full">
                  <span className="w-6 text-[10px] font-mono text-zinc-500 pl-1">
                    {Math.round(maxBarTotal * step)}
                  </span>
                  <div className="flex-1 border-b border-dashed border-zinc-800/80" />
                </div>
              ))}
            </div>

            {/* Bars Container */}
            <div className="absolute inset-x-12 top-2 bottom-8 flex items-end justify-around">
              {printerBarData.map((item, idx) => {
                const totalHeightPct = (item.total / maxBarTotal) * 100;
                const donePct = item.total > 0 ? (item.done / item.total) * 100 : 0;
                const pendingPct = item.total > 0 ? (item.pending / item.total) * 100 : 0;

                const isHovered = hoveredBarIndex === idx;

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className="relative flex flex-col items-center group cursor-pointer h-full justify-end w-12"
                  >
                    {/* Hover Tooltip Popover */}
                    {isHovered && (
                      <div className="absolute -top-16 z-30 bg-zinc-950 border border-zinc-700 px-3 py-2 rounded-xl shadow-2xl text-xs whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                        <div className="font-bold text-white mb-0.5">{item.fullName}</div>
                        <div className="text-emerald-400 text-[11px]">مكتمل: {item.done}</div>
                        <div className="text-amber-400 text-[11px]">معلق: {item.pending}</div>
                      </div>
                    )}

                    {/* Stacked Column Bar */}
                    <div
                      className="w-8 sm:w-10 rounded-t-lg overflow-hidden flex flex-col justify-end transition-all duration-300 shadow-md"
                      style={{
                        height: `${Math.max(totalHeightPct, 6)}%`,
                        opacity: hoveredBarIndex === null || isHovered ? 1 : 0.4,
                      }}
                    >
                      {/* Pending segment (Amber - Top) */}
                      {pendingPct > 0 && (
                        <div
                          className="bg-amber-500 hover:bg-amber-400 transition-colors"
                          style={{ height: `${pendingPct}%` }}
                        />
                      )}
                      {/* Done segment (Emerald - Bottom) */}
                      {donePct > 0 && (
                        <div
                          className="bg-emerald-500 hover:bg-emerald-400 transition-colors"
                          style={{ height: `${donePct}%` }}
                        />
                      )}
                      {/* Empty state bar */}
                      {item.total === 0 && (
                        <div className="h-full bg-zinc-800/50 w-full" />
                      )}
                    </div>

                    {/* X-Axis Label */}
                    <span className="absolute -bottom-6 text-[11px] font-semibold text-zinc-400 group-hover:text-white transition-colors truncate max-w-[70px]">
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* Right Card: Orders By Category / Printer (Donut Chart) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          
          {/* Header */}
          <div className="pb-3 border-b border-zinc-800">
            <h3 className="font-extrabold text-lg text-white tracking-wide uppercase">توزيع الأوامر حسب الطابعة</h3>
            <p className="text-xs text-zinc-400 mt-0.5">النسبة المئوية لكل قسم طابعات</p>
          </div>

          {/* Donut Chart with Center Text */}
          <div className="relative h-52 w-full flex items-center justify-center">
            
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 160 160">
              {/* Background Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#27272a"
                strokeWidth={strokeWidth}
              />

              {/* Slices */}
              {donutItems.map((item, index) => {
                const fraction = donutTotal > 0 ? item.value / donutTotal : 1 / donutItems.length;
                const strokeDasharray = `${fraction * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedPercent * circumference;
                accumulatedPercent += fraction;

                const isHovered = hoveredDonutIndex === index;

                return (
                  <circle
                    key={item.id}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredDonutIndex(index)}
                    onMouseLeave={() => setHoveredDonutIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Center Label inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">الأوامر</span>
              <span className="text-2xl font-black text-white font-mono mt-0.5">{totalJobs}</span>
            </div>
          </div>

          {/* Donut Legend below */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-xs">
            {donutItems.map((item, index) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredDonutIndex(index)}
                onMouseLeave={() => setHoveredDonutIndex(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg border transition-all cursor-pointer ${
                  hoveredDonutIndex === index
                    ? 'bg-zinc-800 border-zinc-600 text-white'
                    : 'bg-zinc-950/50 border-zinc-800/60 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-[11px]">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-zinc-400 text-[11px]">{item.value}</span>
              </div>
            ))}
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
