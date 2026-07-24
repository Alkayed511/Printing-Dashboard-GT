import React from 'react';
import { PrintJob, PrinterType } from '../types';
import { PRINTERS_LIST } from '../data/printers';
import { BarChart3, CheckCircle2, Clock, Printer, TrendingUp, Award, Activity } from 'lucide-react';

interface StatsOverviewProps {
  jobs: PrintJob[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ jobs }) => {
  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter((j) => j.status === 'pending').length;
  const doneJobs = jobs.filter((j) => j.status === 'done').length;
  const completionRate = totalJobs > 0 ? Math.round((doneJobs / totalJobs) * 100) : 0;

  // Calculate total volume in MB
  const totalVolumeBytes = jobs.reduce((acc, curr) => acc + curr.sizeBytes, 0);
  const totalVolumeMB = (totalVolumeBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Orders */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-secondary-500/10 border border-secondary-500/20 rounded-xl text-secondary-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">إجمالي أوامر اليوم</p>
            <h3 className="text-2xl font-bold text-zinc-100 mt-0.5">{totalJobs} أمر</h3>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">قيد الانتظار والطباعة</p>
            <h3 className="text-2xl font-bold text-amber-300 mt-0.5">{pendingJobs} أمر</h3>
          </div>
        </div>

        {/* Done Orders */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">تمت طباعته بنجاح</p>
            <h3 className="text-2xl font-bold text-emerald-300 mt-0.5">{doneJobs} أمر</h3>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">نسبة الإنجاز اليومي</p>
            <h3 className="text-2xl font-bold text-purple-300 mt-0.5">{completionRate}%</h3>
          </div>
        </div>

      </div>

      {/* Breakdown By Printer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-500/10 rounded-xl text-secondary-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-100">توزيع أحمال العمل وحالة كل طابعة</h3>
              <p className="text-xs text-zinc-400">متابعة دقيقة لنسب إنجاز كل قسم في المطبعة</p>
            </div>
          </div>
          <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
            حجم البيانات: {totalVolumeMB} MB
          </span>
        </div>

        <div className="space-y-4">
          {PRINTERS_LIST.map((printer) => {
            const pJobs = jobs.filter((j) => j.printer === printer.id);
            const pPending = pJobs.filter((j) => j.status === 'pending').length;
            const pDone = pJobs.filter((j) => j.status === 'done').length;
            const pTotal = pJobs.length;
            const pct = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;

            return (
              <div key={printer.id} className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: printer.accentColor }}
                    />
                    <strong className="text-zinc-200">{printer.nameAr}</strong>
                    <span className="text-xs font-mono text-zinc-500">({printer.id.toUpperCase()})</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-amber-300 font-semibold">{pPending} معلق</span>
                    <span className="text-emerald-400 font-semibold">{pDone} مكتمل</span>
                    <span className="text-zinc-300 font-bold font-mono">الإجمالي: {pTotal}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                    title={`مكتمل: ${pct}%`}
                  />
                  <div
                    className="h-full bg-amber-500/80 transition-all duration-300"
                    style={{ width: `${100 - pct}%` }}
                    title={`معلق: ${100 - pct}%`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
