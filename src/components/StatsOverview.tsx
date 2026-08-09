import React from 'react';
import { PrintJob, ServerConfig } from '../types';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Award, 
  Activity, 
  Layers,
  PieChart as PieIcon,
  Printer
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

interface StatsOverviewProps {
  jobs: PrintJob[];
  config: ServerConfig;
}

const COLORS = [
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // purple-500
  '#ec4899', // pink-500
  '#3b82f6', // blue-500
  '#f97316'  // orange-500
];

export const StatsOverview: React.FC<StatsOverviewProps> = ({ jobs, config }) => {
  const isAr = (config.language || 'ar') === 'ar';

  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter((j) => j.status === 'pending').length;
  const doneJobs = jobs.filter((j) => j.status === 'done').length;
  const completionRate = totalJobs > 0 ? Math.round((doneJobs / totalJobs) * 100) : 0;

  // Calculate total print count (copies) across all jobs
  const totalPrintCopies = jobs.reduce((acc, j) => acc + (j.quantity || 1), 0);
  const donePrintCopies = jobs.filter(j => j.status === 'done').reduce((acc, j) => acc + (j.quantity || 1), 0);
  const pendingPrintCopies = jobs.filter(j => j.status === 'pending').reduce((acc, j) => acc + (j.quantity || 1), 0);

  // Calculate total volume in MB
  const totalVolumeBytes = jobs.reduce((acc, curr) => acc + curr.sizeBytes, 0);
  const totalVolumeMB = (totalVolumeBytes / (1024 * 1024)).toFixed(1);

  // Prepare chart data for department/printer distribution
  const chartData = (config.printers || []).map((printer) => {
    const pJobs = jobs.filter((j) => j.printer === printer.id);
    const pPending = pJobs.filter((j) => j.status === 'pending').length;
    const pDone = pJobs.filter((j) => j.status === 'done').length;
    const pTotalCopies = pJobs.reduce((acc, j) => acc + (j.quantity || 1), 0);
    const pDoneCopies = pJobs.filter(j => j.status === 'done').reduce((acc, j) => acc + (j.quantity || 1), 0);

    return {
      name: printer.name,
      id: printer.id.toUpperCase(),
      [isAr ? 'مكتمل' : 'Done']: pDone,
      [isAr ? 'معلق' : 'Pending']: pPending,
      [isAr ? 'إجمالي الأوامر' : 'Total Jobs']: pJobs.length,
      [isAr ? 'نسخ الطباعة' : 'Print Copies']: pTotalCopies,
      [isAr ? 'النسخ المكتملة' : 'Completed Copies']: pDoneCopies,
      totalJobsCount: pJobs.length,
    };
  });

  // Data for Pie Chart (Distribution by printer)
  const pieData = (config.printers || []).map((printer) => {
    const pJobsCount = jobs.filter((j) => j.printer === printer.id).length;
    return {
      name: printer.name,
      value: pJobsCount,
    };
  }).filter(d => d.value > 0);

  return (
    <div className="space-y-6 pb-6">
      
      {/* Daily Summary Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>{isAr ? 'تقرير ملخص الطباعة اليومي' : 'Daily Print Summary Report'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">
            {isAr ? 'إحصائيات وتوزيع أقسام المطبعة' : 'Printshop Department Analytics'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isAr 
              ? 'متابعة رسم بياني دقيق لأعداد الطباعة اليومية ونسب توزيع الأوامر عبر الأقسام'
              : 'Graphical tracking of daily print counts and job distribution across departments'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 block">{isAr ? 'إجمالي النسخ المطبوعة' : 'Total Copies'}</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{totalPrintCopies} {isAr ? 'نسخة' : 'pcs'}</span>
          </div>
          <div className="bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 block">{isAr ? 'حجم الملفات' : 'Data Size'}</span>
            <span className="text-lg font-bold font-mono text-cyan-400">{totalVolumeMB} MB</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Orders & Copies */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
          <div className="p-3 bg-secondary-500/10 border border-secondary-500/20 rounded-xl text-secondary-400 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">{isAr ? 'إجمالي أوامر اليوم' : 'Total Daily Jobs'}</p>
            <h3 className="text-2xl font-bold text-zinc-100 mt-0.5">{totalJobs} {isAr ? 'أمر' : 'jobs'}</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">({totalPrintCopies} {isAr ? 'نسخة مطلوبة' : 'copies'})</p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">{isAr ? 'قيد الانتظار والطباعة' : 'Pending Jobs'}</p>
            <h3 className="text-2xl font-bold text-amber-300 mt-0.5">{pendingJobs} {isAr ? 'أمر' : 'jobs'}</h3>
            <p className="text-[10px] text-amber-500/80 mt-0.5">({pendingPrintCopies} {isAr ? 'نسخة معلقة' : 'pending copies'})</p>
          </div>
        </div>

        {/* Done Orders */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">{isAr ? 'تمت طباعته بنجاح' : 'Completed Jobs'}</p>
            <h3 className="text-2xl font-bold text-emerald-300 mt-0.5">{doneJobs} {isAr ? 'أمر' : 'jobs'}</h3>
            <p className="text-[10px] text-emerald-500/80 mt-0.5">({donePrintCopies} {isAr ? 'نسخة مكتملة' : 'done copies'})</p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center gap-3.5">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">{isAr ? 'نسبة الإنجاز اليومي' : 'Completion Rate'}</p>
            <h3 className="text-2xl font-bold text-purple-300 mt-0.5">{completionRate}%</h3>
            <p className="text-[10px] text-purple-400/80 mt-0.5">{isAr ? 'من إجمالي خطة اليوم' : 'of daily workflow'}</p>
          </div>
        </div>

      </div>

      {/* Recharts Graphical Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Bar Chart: Job Status per Printer */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-100">
                  {isAr ? 'توزيع الأوامر حسب الأقسام والتطبيقات' : 'Jobs Breakdown by Department'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {isAr ? 'مقارنة بين الأوامر المعلقة والمكتملة لجميع الطابعات' : 'Pending vs Completed jobs per printer'}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    borderColor: '#3f3f46',
                    borderRadius: '0.75rem',
                    color: '#f4f4f5',
                    fontSize: '12px'
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Bar dataKey={isAr ? 'مكتمل' : 'Done'} fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey={isAr ? 'معلق' : 'Pending'} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Share of Workload */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                <PieIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-100">
                  {isAr ? 'حصة الأقسام من إجمالي الأوامر' : 'Department Workload Share'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {isAr ? 'نسبة الضغط اليومي لكل قسم' : 'Daily load proportion'}
                </p>
              </div>
            </div>
          </div>

          {pieData.length > 0 ? (
            <div className="w-full h-64 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#3f3f46',
                      borderRadius: '0.75rem',
                      color: '#f4f4f5',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-500 text-xs italic">
              <Printer className="w-8 h-8 mb-2 opacity-40" />
              <span>{isAr ? 'لا توجد أوامر طباعة مسجلة اليوم' : 'No print jobs today yet'}</span>
            </div>
          )}

          {/* Pie Custom Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[11px]">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 truncate">
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                />
                <span className="text-zinc-300 truncate">{entry.name}:</span>
                <span className="font-bold font-mono text-zinc-100">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Detailed Department Progress Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">
                {isAr ? 'جدول المتابعة التفصيلي لأقسام المطبعة' : 'Detailed Department Workload Matrix'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isAr ? 'متابعة شاملة لنسب الإنجاز وأعداد النسخ المطلوبة لكل قسم' : 'Comprehensive breakdown of print copies and status per department'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {(config.printers || []).map((printer) => {
            const pJobs = jobs.filter((j) => j.printer === printer.id);
            const pPending = pJobs.filter((j) => j.status === 'pending').length;
            const pDone = pJobs.filter((j) => j.status === 'done').length;
            const pTotal = pJobs.length;
            const pct = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
            const pTotalCopies = pJobs.reduce((acc, j) => acc + (j.quantity || 1), 0);

            return (
              <div key={printer.id} className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-500 shrink-0" />
                    <strong className="text-zinc-100 font-bold">{printer.name}</strong>
                    <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {printer.id.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-amber-300 font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                      {pPending} {isAr ? 'معلق' : 'pending'}
                    </span>
                    <span className="text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                      {pDone} {isAr ? 'مكتمل' : 'done'}
                    </span>
                    <span className="text-zinc-300 font-bold font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {pTotalCopies} {isAr ? 'نسخة' : 'copies'} ({pTotal} {isAr ? 'أمر' : 'jobs'})
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                    <span>{isAr ? 'نسبة إنجاز القسم:' : 'Completion Progress:'}</span>
                    <span className="font-bold text-emerald-400">{pct}%</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 flex p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${pct}%` }}
                      title={`مكتمل: ${pct}%`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
