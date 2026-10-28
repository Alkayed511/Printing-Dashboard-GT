import React, { useState, useMemo } from 'react';
import { X, CreditCard, DollarSign, Calendar, FileText, CheckCircle2, User, AlertCircle, Save } from 'lucide-react';
import { Payment, Order, Customer, PaymentMethod, PAYMENT_METHODS } from '../../types/printManager';
import { addPayment } from '../../firebase/services';
import { generatePaymentNumber, formatJOD, roundJOD } from '../../utils/financial';
import { auth } from '../../firebase/config';

interface PaymentModalProps {
  initialOrder?: Order | null;
  initialCustomer?: Customer | null;
  orders: Order[];
  customers: Customer[];
  existingPaymentsCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  initialOrder,
  initialCustomer,
  orders,
  customers,
  existingPaymentsCount,
  isOpen,
  onClose,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    initialOrder?.id || (orders.find(o => o.remainingBalance > 0)?.id || orders[0]?.id || '')
  );

  const targetOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId);
  }, [orders, selectedOrderId]);

  const [paymentNumber, setPaymentNumber] = useState(
    generatePaymentNumber(existingPaymentsCount)
  );
  const [amount, setAmount] = useState<number>(() => {
    if (targetOrder) {
      return targetOrder.remainingBalance > 0 ? targetOrder.remainingBalance : 0;
    }
    return 0;
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When selected order changes, auto-adjust amount default to remaining balance
  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find(o => o.id === orderId);
    if (ord && ord.remainingBalance > 0) {
      setAmount(ord.remainingBalance);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOrder) {
      setError('يرجى اختيار أمر الطباعة');
      return;
    }

    const payVal = roundJOD(amount);
    if (payVal <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    if (payVal > targetOrder.remainingBalance + 0.001) {
      setError(`المبلغ المدخل (${formatJOD(payVal)}) يتجاوز الرصيد المتبقي على الطلب (${formatJOD(targetOrder.remainingBalance)})`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await addPayment({
        paymentNumber,
        orderId: targetOrder.id,
        orderNumber: targetOrder.orderNumber,
        customerId: targetOrder.customerId,
        customerName: targetOrder.customerName,
        amount: payVal,
        paymentMethod,
        paymentDate,
        notes: notes.trim(),
        recordedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'أمين الصندوق',
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'فشل تسجيل الدفعة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden my-8 text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
              {paymentNumber}
            </span>
            <h2 className="text-base font-bold text-white">تسجيل دفعة / سند قبض جديد</h2>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Order selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              أمر الطباعة المرتبط <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={selectedOrderId}
              onChange={(e) => handleOrderChange(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-blue-500"
            >
              <option value="">-- اختر أمر الطباعة --</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} - {o.customerName} (المتبقي: {formatJOD(o.remainingBalance)})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Order Summary Card */}
          {targetOrder && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">إجمالي الطلب</span>
                <span className="font-bold text-white">{formatJOD(targetOrder.totalAmount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">المدفوع سابقاً</span>
                <span className="font-bold text-emerald-400">{formatJOD(targetOrder.paidAmount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">المتبقي المطلوب</span>
                <span className="font-bold text-rose-400">{formatJOD(targetOrder.remainingBalance)}</span>
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300">
                المبلغ المدفوع (دينار أردني JOD) <span className="text-rose-400">*</span>
              </span>
              {targetOrder && targetOrder.remainingBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(targetOrder.remainingBalance)}
                  className="text-[11px] text-blue-400 hover:underline font-semibold"
                >
                  سداد كامل المتبقي ({formatJOD(targetOrder.remainingBalance)})
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.000"
                className="w-full pr-10 pl-16 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-lg font-black text-emerald-400 placeholder-slate-500 font-mono text-center"
              />
              <DollarSign className="absolute right-3 top-3 w-5 h-5 text-slate-500" />
              <span className="absolute left-3 top-3 text-xs font-bold text-slate-400">د.أ</span>
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                طريقة الدفع <span className="text-rose-400">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-blue-500"
              >
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm.id} value={pm.id}>{pm.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                تاريخ الدفع
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ملاحظات أو رقم المرجع / الشيك
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تحويل كليك بالرقم المرجعي #98234 أو رقم الشيك..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جارٍ تسجيل الدفعة...' : 'تأكيد وقبض المبلغ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
