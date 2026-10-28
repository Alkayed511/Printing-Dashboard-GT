import React, { useMemo } from 'react';
import {
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Activity,
  Plus,
  Calendar,
  ArrowUpRight,
  UserCheck,
  Cpu,
  FileSpreadsheet,
  Box,
  TrendingUp,
  Percent
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import { Customer, Order, Machine, PrintLog, ORDER_STATUS_DETAILS } from '../../types/printManager';
import { calculateProgressPercent } from '../../utils/financial';

interface DashboardViewProps {
  orders: Order[];
  customers: Customer[];
  machines: Machine[];
  printLogs?: PrintLog[];
  onOpenNewOrder: () => void;
  onOpenNewCustomer: () => void;
  onSelectOrder: (order: Order) => void;
  onNavigateTab: (tab: any) => void;
  onOpenLogPrintQuantity: (orderId?: string) => void;
}

const MACHINE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1', '#14B8A6'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  customers,
  machines,
  printLogs = [],
  onOpenNewOrder,
  onOpenNewCustomer,
  onSelectOrder,
  onNavigateTab,
  onOpenLogPrintQuantity,
}) => {
  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.substring(0, 7), [todayStr]);

  // Production statistics calculations
  const stats = useMemo(() => {
    let pendingCount = 0;
    let printingCount = 0;
    let readyCount = 0;
    let deliveredCount = 0;

    let totalPrintedPieces = 0;
    let totalOrderedPieces = 0;
    let totalWastePieces = 0;
    let totalPrintedSqm = 0;

    let todayPrintedSqm = 0;
    let todayPrintedPieces = 0;
    let todayWastePieces = 0;

    const upcomingOrders: Order[] = [];
    const inProgressOrders: Order[] = [];

    // Order-level aggregation
    orders.forEach(ord => {
      if (ord.status !== 'cancelled') {
        totalPrintedPieces += ord.printedQuantity || 0;
        totalOrderedPieces += ord.quantity || 1;
        totalWastePieces += ord.wasteQuantity || 0;

        if (ord.totalAreaSqm) {
          const ratio = Math.min(1, (ord.printedQuantity || 0) / (ord.quantity || 1));
          totalPrintedSqm += ord.totalAreaSqm * ratio;
        }

        if (ord.status === 'printing' || (ord.status === 'approved' && (ord.printedQuantity || 0) < (ord.quantity || 1))) {
          inProgressOrders.push(ord);
        }
      }

      if (ord.status === 'new' || ord.status === 'designing' || ord.status === 'approved') {
        pendingCount++;
      } else if (ord.status === 'printing' || ord.status === 'finishing') {
        printingCount++;
      } else if (ord.status === 'ready') {
        readyCount++;
      } else if (ord.status === 'delivered') {
        deliveredCount++;
      }

      // Check upcoming deadline
      if (ord.deliveryDate && ord.status !== 'delivered' && ord.status !== 'cancelled') {
        upcomingOrders.push(ord);
      }
    });

    // Logs-level aggregation for Today's output
    printLogs.forEach(l => {
      const d = (l.printedAt || l.createdAt || '').substring(0, 10);
      if (d === todayStr) {
        todayPrintedSqm += l.areaSqm || 0;
        todayPrintedPieces += l.quantityPrinted || 0;
        todayWastePieces += l.wasteQuantity || 0;
      }
    });

    // Sort upcoming orders by delivery date ascending
    upcomingOrders.sort((a, b) => (a.deliveryDate || '').localeCompare(b.deliveryDate || ''));

    const overallWastePercent = totalPrintedPieces + totalWastePieces > 0
      ? ((totalWastePieces / (totalPrintedPieces + totalWastePieces)) * 100).toFixed(1)
      : '0';

    return {
      totalOrders: orders.length,
      pendingCount,
      printingCount,
      readyCount,
      deliveredCount,
      totalPrintedPieces,
      totalOrderedPieces,
      totalWastePieces,
      overallWastePercent,
      totalPrintedSqm: Math.round(totalPrintedSqm * 100) / 100,
      todayPrintedSqm: Math.round(todayPrintedSqm * 100) / 100,
      todayPrintedPieces,
      todayWastePieces,
      inProgressOrders: inProgressOrders.slice(0, 6),
      upcomingOrders: upcomingOrders.slice(0, 5),
    };
  }, [orders, printLogs, todayStr, currentMonthStr]);

  // Daily production output chart for last 7 days (m² and pieces)
  const productionChartData = useMemo(() => {
    const map = new Map<string, { date: string; sqm: number; pieces: number; waste: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      map.set(dateKey, { date: label, sqm: 0, pieces: 0, waste: 0 });
    }

    if (printLogs && printLogs.length > 0) {
      printLogs.forEach(l => {
        const d = (l.printedAt || l.createdAt || '').substring(0, 10);
        if (map.has(d)) {
          const entry = map.get(d)!;
          entry.sqm += l.areaSqm || 0;
          entry.pieces += l.quantityPrinted || 0;
          entry.waste += l.wasteQuantity || 0;
        }
      });
    } else {
      // Fallback from order dates if logs not yet populated
      orders.forEach(o => {
        if (o.status === 'cancelled') return;
        const d = (o.orderDate || o.createdAt || '').substring(0, 10);
        if (map.has(d)) {
          const entry = map.get(d)!;
          entry.sqm += o.totalAreaSqm || 0;
          entry.pieces += o.printedQuantity || 0;
        }
      });
    }

    return Array.from(map.values()).map(item => ({
      ...item,
      sqm: Math.round(item.sqm * 10) / 10,
    }));
  }, [printLogs, orders]);

  // Machine workload distribution
  const machineDistribution = useMemo(() => {
    const counts: Record<string, { orders: number; pieces: number }> = {};
    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      const mName = o.machineName || 'غير محدد';
      if (!counts[mName]) counts[mName] = { orders: 0, pieces: 0 };
      counts[mName].orders += 1;
      counts[mName].pieces += (o.printedQuantity || 0);
    });

    return Object.entries(counts).map(([name, data]) => ({
      name,
      value: data.orders,
      pieces: data.pieces,
    }));
  }, [orders]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Primary Production Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-l from-slate-900 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              تسجيل ومتابعة كميات الطباعة الفعلية
            </span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString('ar-JO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">لوحة متابعة تشغيل وكميات الطباعة</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            متابعة الإنتاج الفعلي، عدادات الأمتار المربعة (م²)، إنجاز الماكينات، وحساب الهادر والتالف لحظة بلحظة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => onOpenLogPrintQuantity()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Printer className="w-5 h-5" />
            <span>تسجيل كمية مطبوعة 🖨️</span>
          </button>

          <button
            onClick={onOpenNewOrder}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>أمر إنتاج جديد</span>
          </button>

          <button
            onClick={() => onNavigateTab('print_logs')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>سجل الدفعات</span>
          </button>
        </div>
      </div>

      {/* Production KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Printed Area */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-300">مساحة الطباعة اليوم</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400">
            {stats.todayPrintedSqm} <span className="text-sm font-normal text-slate-400">م²</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            الإجمالي التراكمي: <strong className="text-white">{stats.totalPrintedSqm} م²</strong>
          </div>
        </div>

        {/* Today's Printed Pieces */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-300">القطع المطبوعة اليوم</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats.todayPrintedPieces} <span className="text-sm font-normal text-slate-400">قطعة</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            المنجز الكلي: <strong className="text-white">{stats.totalPrintedPieces}</strong> من {stats.totalOrderedPieces} قطعة
          </div>
        </div>

        {/* Orders In Printing */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-300">أوامر قيد التشغيل والطباعة</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Printer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {stats.printingCount} <span className="text-sm font-normal text-slate-400">أمر</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="text-blue-400 font-semibold">{stats.pendingCount} بانتظار البدء</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">{stats.readyCount} جاهز</span>
          </div>
        </div>

        {/* Waste / Scrap Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-300">إجمالي الهادر والتالف</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400">
            {stats.totalWastePieces} <span className="text-sm font-normal text-slate-400">قطعة</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-400/90">
            نسبة الهادر العامة: <strong>{stats.overallWastePercent}%</strong>
          </div>
        </div>
      </div>

      {/* Production Pipeline Status Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          مراحل تشغيل أوامر الطباعة في الورشة
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => onNavigateTab('orders')}
            className="cursor-pointer bg-slate-950/60 p-3.5 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-300 font-semibold">بانتظار البدء والاعتماد</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">{stats.pendingCount}</span>
            </div>
            <div className="mt-2 text-2xl font-black text-white">{stats.pendingCount}</div>
            <span className="text-[10px] text-slate-400">أوامر جديدة ومجهزة للتجهيز</span>
          </div>

          <div
            onClick={() => onNavigateTab('orders')}
            className="cursor-pointer bg-slate-950/60 p-3.5 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-300 font-semibold">قيد الطباعة والتشطيب</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">{stats.printingCount}</span>
            </div>
            <div className="mt-2 text-2xl font-black text-white">{stats.printingCount}</div>
            <span className="text-[10px] text-slate-400">على الماكينات وطاولات التجميع</span>
          </div>

          <div
            onClick={() => onNavigateTab('orders')}
            className="cursor-pointer bg-slate-950/60 p-3.5 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-300 font-semibold">جاهز للتسليم</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">{stats.readyCount}</span>
            </div>
            <div className="mt-2 text-2xl font-black text-white">{stats.readyCount}</div>
            <span className="text-[10px] text-slate-400">مكتمل الطباعة بانتظار الاستلام</span>
          </div>

          <div
            onClick={() => onNavigateTab('orders')}
            className="cursor-pointer bg-slate-950/60 p-3.5 rounded-xl border border-teal-500/20 hover:border-teal-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-teal-300 font-semibold">تم التسليم</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold">{stats.deliveredCount}</span>
            </div>
            <div className="mt-2 text-2xl font-black text-white">{stats.deliveredCount}</div>
            <span className="text-[10px] text-slate-400">أوامر مسلمة للعملاء</span>
          </div>
        </div>
      </div>

      {/* Live In-Progress Orders: Progress & Direct Batch Logging */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-400" />
              أوامر جارية على خطوط الطباعة (متابعة الكميات والإنجاز)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة القطع المنجزة مقابل الكمية المطلوبة مع زر فوري لتسجيل دفعات الطباعة
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            <span>عرض كل الأوامر ({orders.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.inProgressOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            لا توجد أوامر قيد الطباعة حالياً. يمكنك بدء تشغيل أمر من قائمة الأوامر.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {stats.inProgressOrders.map(order => {
              const printed = order.printedQuantity || 0;
              const totalReq = order.quantity || 1;
              const pct = calculateProgressPercent(printed, totalReq);

              return (
                <div
                  key={order.id}
                  className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-3 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[140px]">
                          {order.customerName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 truncate max-w-[200px]">
                        {order.description || order.printingType}
                      </p>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        الماكينة: <strong className="text-slate-300">{order.machineName || 'غير محدد'}</strong>
                        {order.totalAreaSqm ? ` • ${order.totalAreaSqm} م²` : ''}
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenLogPrintQuantity(order.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1 shrink-0 active:scale-95 shadow-sm"
                      title="تسجيل كمية مطبوعة لهذا الطلب"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>تسجيل كمية</span>
                    </button>
                  </div>

                  {/* Progress Bar & Numbers */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-400">
                        المنجز: <b className="text-emerald-400">{printed}</b> من <b className="text-white">{totalReq}</b> قطعة
                      </span>
                      <span className="text-blue-400 font-bold">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Production Analytics Section: Daily Volume Chart & Machine Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Production Volume Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                حجم الإنتاج اليومي خلال آخر 7 أيام (متر مربع وقطع)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">مقارنة يومية لكميات الطباعة الفعلية المنجزة في الورشة</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', textAlign: 'right' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="sqm" name="المساحة المطبوعة (م²)" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pieces" name="عدد القطع المنجزة" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Production Distribution (1 Column) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-purple-400" />
              توزيع العمل حسب الماكينة
            </h3>
            <p className="text-xs text-slate-400 mb-4">عدد الأوامر المحولة لكل ماكينة</p>

            <div className="h-52 w-full">
              {machineDistribution.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  لا توجد أوامر مسجلة حتى الآن
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={machineDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                      paddingAngle={3}
                    >
                      {machineDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={MACHINE_COLORS[index % MACHINE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', textAlign: 'right' }}
                      formatter={(val: any) => [`${val} طلب`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="mt-2 space-y-1 max-h-28 overflow-y-auto text-xs text-slate-300">
            {machineDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-0.5 border-b border-slate-800/60 last:border-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: MACHINE_COLORS[idx % MACHINE_COLORS.length] }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="font-bold text-slate-200">{item.value} طلب</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Delivery Deadlines & Active Machines Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadlines */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              المواعيد النهائية القادمة للتسليم
            </h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
            >
              <span>عرض كل الأوامر</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.upcomingOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              لا توجد مواعيد تسليم ملحة حالياً
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.upcomingOrders.map(ord => {
                const statusInfo = ORDER_STATUS_DETAILS[ord.status] || ORDER_STATUS_DETAILS.new;
                return (
                  <div
                    key={ord.id}
                    onClick={() => onSelectOrder(ord)}
                    className="p-3 bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{ord.orderNumber}</span>
                          <span className="text-xs text-slate-400 font-medium truncate max-w-[140px]">{ord.customerName}</span>
                        </div>
                        <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">{ord.description || ord.printingType}</p>
                      </div>
                    </div>

                    <div className="text-left flex-shrink-0">
                      <div className="text-xs font-bold text-amber-400">{ord.deliveryDate || 'غير محدد'}</div>
                      <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} border`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Machine Odometers & Health Quick View */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              عدادات ماكينات الطباعة التراكمية
            </h3>
            <button
              onClick={() => onNavigateTab('machines')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
            >
              <span>إدارة الماكينات</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {machines.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              لا توجد ماكينات مسجلة
            </div>
          ) : (
            <div className="space-y-2.5">
              {machines.slice(0, 5).map(m => (
                <div
                  key={m.id}
                  onClick={() => onNavigateTab('machines')}
                  className="p-3 bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{m.name}</div>
                      <div className="text-xs text-slate-400">{m.type} {m.maxPrintWidthCm ? `• عرض ${m.maxPrintWidthCm} سم` : ''}</div>
                    </div>
                  </div>

                  <div className="text-left flex-shrink-0">
                    <div className="text-sm font-black text-emerald-400">
                      {m.totalPrintedSqm || 0} <span className="text-[10px] font-normal text-slate-400">م²</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {m.totalPrintedPieces || 0} قطعة منجزة
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
