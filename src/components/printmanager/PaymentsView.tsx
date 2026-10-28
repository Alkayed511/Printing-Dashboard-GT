import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  Filter,
  Calendar,
  DollarSign,
  User,
  ArrowUpRight,
  Printer,
  FileCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Payment, Order, Customer, PAYMENT_METHODS } from '../../types/printManager';
import { formatJOD, roundJOD } from '../../utils/financial';
import { PaymentModal } from './PaymentModal';

interface PaymentsViewProps {
  payments: Payment[];
  orders: Order[];
  customers: Customer[];
  onOpenNewPayment: () => void;
  onSelectOrder: (order: Order) => void;
  onOpenPrintInvoice: (order: Order) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  orders,
  customers,
  onOpenNewPayment,
  onSelectOrder,
  onOpenPrintInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.substring(0, 7), [todayStr]);

  const paymentStats = useMemo(() => {
    let todayTotal = 0;
    let monthTotal = 0;
    let grandTotal = 0;

    payments.forEach(p => {
      const pDate = (p.paymentDate || p.createdAt || '').substring(0, 10);
      const amt = p.amount || 0;
      grandTotal += amt;
      if (pDate === todayStr) todayTotal += amt;
      if (pDate.startsWith(currentMonthStr)) monthTotal += amt;
    });

    return {
      todayTotal: roundJOD(todayTotal),
      monthTotal: roundJOD(monthTotal),
      grandTotal: roundJOD(grandTotal),
    };
  }, [payments, todayStr, currentMonthStr]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesNum = p.paymentNumber?.toLowerCase().includes(term);
        const matchesOrd = p.orderNumber?.toLowerCase().includes(term);
        const matchesCust = p.customerName?.toLowerCase().includes(term);
        const matchesNotes = p.notes?.toLowerCase().includes(term);
        return matchesNum || matchesOrd || matchesCust || matchesNotes;
      }

      return true;
    });
  }, [payments, methodFilter, searchTerm]);

  const getMethodBadge = (method: string) => {
    const found = PAYMENT_METHODS.find(m => m.id === method);
    return found?.label || method;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              {payments.length} سند قبض مسجل
            </span>
            <span className="text-xs text-slate-400">سجل المدفوعات والتحصيلات</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">المدفوعات والمقبوضات النقدية</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            تسجيل الدفعات، متابعة التحصيل، وربط السندات بأوامر الطباعة وحسابات العملاء
          </p>
        </div>

        <button
          onClick={onOpenNewPayment}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل دفعة جديدة</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-xs font-semibold text-slate-400 block mb-1">مقبوضات اليوم</span>
          <div className="text-2xl font-black text-emerald-400">{formatJOD(paymentStats.todayTotal)}</div>
          <span className="text-[11px] text-slate-500">تم تحصيلها بتاريخ اليوم</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-xs font-semibold text-slate-400 block mb-1">مقبوضات الشهر الحالي</span>
          <div className="text-2xl font-black text-white">{formatJOD(paymentStats.monthTotal)}</div>
          <span className="text-[11px] text-slate-500">شهر {new Date().toLocaleString('ar-JO', { month: 'long' })}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-xs font-semibold text-slate-400 block mb-1">إجمالي المقبوضات التاريخي</span>
          <div className="text-2xl font-black text-blue-400">{formatJOD(paymentStats.grandTotal)}</div>
          <span className="text-[11px] text-slate-500">مجموع كل الدفعات المسجلة</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث برقم السند، رقم الطلب، اسم العميل أو الملاحظات..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm text-white placeholder-slate-500 transition-all text-right"
          />
          <Search className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setMethodFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              methodFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            كل الطرق
          </button>
          {PAYMENT_METHODS.map(m => (
            <button
              key={m.id}
              onClick={() => setMethodFilter(m.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                methodFilter === m.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {m.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table / Cards */}
      {filteredPayments.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">لا توجد سندات قبض مسجلة</h3>
          <p className="text-xs text-slate-400">سجل دفعات العملاء عند استلام العربون أو التسليم النهائي</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4 font-bold">رقم السند</th>
                  <th className="p-4 font-bold">أمر الطباعة</th>
                  <th className="p-4 font-bold">العميل</th>
                  <th className="p-4 font-bold">المبلغ المقبوض</th>
                  <th className="p-4 font-bold">طريقة الدفع</th>
                  <th className="p-4 font-bold">تاريخ الدفع</th>
                  <th className="p-4 font-bold">سجل بواسطة</th>
                  <th className="p-4 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredPayments.map(payment => {
                  const linkedOrder = orders.find(o => o.id === payment.orderId);

                  return (
                    <tr key={payment.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-4 font-mono font-bold text-white">
                        {payment.paymentNumber}
                      </td>

                      <td className="p-4">
                        {linkedOrder ? (
                          <button
                            onClick={() => onSelectOrder(linkedOrder)}
                            className="font-mono text-blue-400 hover:underline font-semibold"
                          >
                            {payment.orderNumber}
                          </button>
                        ) : (
                          <span className="font-mono text-slate-400">{payment.orderNumber}</span>
                        )}
                      </td>

                      <td className="p-4 font-semibold text-slate-200">
                        {payment.customerName}
                      </td>

                      <td className="p-4 font-black text-emerald-400 text-sm">
                        +{formatJOD(payment.amount)}
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                          {getMethodBadge(payment.paymentMethod)}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-slate-400">
                        {payment.paymentDate}
                      </td>

                      <td className="p-4 text-slate-400">
                        {payment.recordedBy}
                      </td>

                      <td className="p-4 text-center">
                        {linkedOrder && (
                          <button
                            onClick={() => onOpenPrintInvoice(linkedOrder)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="عرض الفاتورة وسند القبض"
                          >
                            <Printer className="w-4 h-4 text-blue-400" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
