import React, { useState, useEffect } from 'react';
import {
  Order,
  OrderItem,
  Machine,
  Material,
  PrintLog
} from '../../types/printManager';
import { recordPrintQuantity } from '../../firebase/services';
import { calculateAreaSqm, calculateLinearMeters, calculateProgressPercent } from '../../utils/financial';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Loader2,
  Box,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

interface LogPrintQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  machines: Machine[];
  materials: Material[];
  initialOrderId?: string;
  onSuccess?: () => void;
}

export const LogPrintQuantityModal: React.FC<LogPrintQuantityModalProps> = ({
  isOpen,
  onClose,
  orders,
  machines,
  materials,
  initialOrderId,
  onSuccess
}) => {
  const { userProfile } = useAuth();

  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantityPrinted, setQuantityPrinted] = useState<number>(1);
  const [wasteQuantity, setWasteQuantity] = useState<number>(0);
  const [machineId, setMachineId] = useState<string>('');
  const [materialId, setMaterialId] = useState<string>('');
  const [printSpeed, setPrintSpeed] = useState<string>('Standard 4-Pass (قياسي)');
  const [operator, setOperator] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [deductInventory, setDeductInventory] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active orders that can receive print logs
  const activeOrders = orders.filter(o => o.status !== 'cancelled');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setOperator(userProfile?.displayName || userProfile?.email?.split('@')[0] || 'فني الطباعة');

      const targetId = initialOrderId || (activeOrders.length > 0 ? activeOrders[0].id : '');
      setSelectedOrderId(targetId);
    }
  }, [isOpen, initialOrderId, orders]);

  // When selected order changes, initialize item, machine, material defaults
  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedItemId('');
      return;
    }
    const order = orders.find(o => o.id === selectedOrderId);
    if (order) {
      if (order.items && order.items.length > 0) {
        // pick first item with remaining quantity or first item
        const pendingItem = order.items.find(i => (i.printedQuantity || 0) < i.quantity) || order.items[0];
        setSelectedItemId(pendingItem.id);
        const rem = Math.max(1, pendingItem.quantity - (pendingItem.printedQuantity || 0));
        setQuantityPrinted(rem);
        if (pendingItem.machineId) setMachineId(pendingItem.machineId);
        else if (order.machineId) setMachineId(order.machineId);
        else if (machines.length > 0) setMachineId(machines[0].id);

        if (pendingItem.materialId) setMaterialId(pendingItem.materialId);
        else if (order.materialId) setMaterialId(order.materialId);
      } else {
        setSelectedItemId('');
        const rem = Math.max(1, (order.quantity || 1) - (order.printedQuantity || 0));
        setQuantityPrinted(rem);
        if (order.machineId) setMachineId(order.machineId);
        else if (machines.length > 0) setMachineId(machines[0].id);

        if (order.materialId) setMaterialId(order.materialId);
      }
      setWasteQuantity(0);
    }
  }, [selectedOrderId, orders, machines]);

  if (!isOpen) return null;

  const currentOrder = orders.find(o => o.id === selectedOrderId);
  const currentItem = currentOrder?.items?.find(i => i.id === selectedItemId);

  // Target item dimensions and quantities
  const targetWidth = currentItem ? currentItem.widthCm : (currentOrder?.widthCm || 0);
  const targetHeight = currentItem ? currentItem.heightCm : (currentOrder?.heightCm || 0);
  const targetRequiredQty = currentItem ? currentItem.quantity : (currentOrder?.quantity || 1);
  const targetAlreadyPrinted = currentItem ? (currentItem.printedQuantity || 0) : (currentOrder?.printedQuantity || 0);
  const targetAlreadyWaste = currentItem ? (currentItem.wasteQuantity || 0) : (currentOrder?.wasteQuantity || 0);
  const targetRemaining = Math.max(0, targetRequiredQty - targetAlreadyPrinted);

  // Calculated Area & Linear Meters for this specific batch
  const batchAreaSqm = calculateAreaSqm(targetWidth, targetHeight, quantityPrinted);
  const batchLinearMeters = calculateLinearMeters(targetWidth, targetHeight, quantityPrinted);

  // Projection after this batch
  const projectedPrinted = targetAlreadyPrinted + quantityPrinted;
  const projectedPercent = calculateProgressPercent(projectedPrinted, targetRequiredQty);

  const selectedMachineObj = machines.find(m => m.id === machineId);
  const selectedMaterialObj = materials.find(m => m.id === materialId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) {
      setErrorMsg('يرجى اختيار أمر الطباعة');
      return;
    }
    if (quantityPrinted <= 0 && wasteQuantity <= 0) {
      setErrorMsg('يرجى إدخال كمية مطبوعة أو كمية تالفة أكبر من صفر');
      return;
    }
    if (!machineId) {
      setErrorMsg('يرجى تحديد ماكينة الطباعة المستخدمة');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const now = new Date().toISOString();
      await recordPrintQuantity({
        orderId: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        itemId: currentItem?.id,
        itemDescription: currentItem?.description || currentOrder.description,
        customerId: currentOrder.customerId,
        customerName: currentOrder.customerName,
        machineId: selectedMachineObj?.id || machineId,
        machineName: selectedMachineObj?.name || 'ماكينة عامة',
        materialId: deductInventory ? selectedMaterialObj?.id : undefined,
        materialName: deductInventory ? selectedMaterialObj?.name : undefined,
        quantityPrinted: Number(quantityPrinted),
        wasteQuantity: Number(wasteQuantity),
        areaSqm: batchAreaSqm,
        linearMeters: batchLinearMeters,
        operator: operator.trim() || 'فني الإنتاج',
        printSpeed,
        notes: notes.trim(),
        printedAt: now,
      });

      setSuccessMsg(`تم تسجيل دفعة الطباعة بنجاح (${quantityPrinted} قطعة - ${batchAreaSqm} م²)`);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'حدث خطأ أثناء حفظ كميات الطباعة');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/40 via-slate-800 to-indigo-900/40 border-b border-slate-700/60 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">تسجيل كميات الطباعة والإنتاج</h3>
              <p className="text-xs text-slate-400">توثيق الكميات المنجزة وتحديث العدادات والمخزون لحظياً</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="m-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="m-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {/* 1. Order Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              أمر الطباعة المستهدف *
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">-- اختر أمر الطباعة --</option>
              {activeOrders.map(ord => (
                <option key={ord.id} value={ord.id}>
                  {ord.orderNumber} - {ord.customerName} ({ord.description || ord.printingType})
                </option>
              ))}
            </select>
          </div>

          {/* If order has multiple items, show line item selector */}
          {currentOrder && currentOrder.items && currentOrder.items.length > 1 && (
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                بند الطباعة داخل الأمر *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {currentOrder.items.map((item, idx) => (
                  <option key={item.id} value={item.id}>
                    بند #{idx + 1}: {item.description} ({item.widthCm}×{item.heightCm} سم) - المطلوب: {item.quantity} | أنجز: {item.printedQuantity || 0}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Current Order Progress Card */}
          {currentOrder && (
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  الأبعاد:{' '}
                  <strong className="text-white">
                    {targetWidth} × {targetHeight} سم
                  </strong>
                </span>
                <span className="text-slate-400">
                  الحالة الحالية: <strong className="text-blue-400">{currentOrder.status}</strong>
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-medium">
                    الكمية المنجزة حالياً:{' '}
                    <span className="text-emerald-400 font-bold">{targetAlreadyPrinted}</span> من{' '}
                    <span className="text-white font-bold">{targetRequiredQty}</span> قطعة
                  </span>
                  <span className="text-blue-400 font-bold">
                    {calculateProgressPercent(targetAlreadyPrinted, targetRequiredQty)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${calculateProgressPercent(targetAlreadyPrinted, targetRequiredQty)}%`
                    }}
                  />
                </div>
                {targetAlreadyWaste > 0 && (
                  <p className="text-[11px] text-rose-400 mt-1">
                    إجمالي التالف المسجل سابقاً: {targetAlreadyWaste} قطعة
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 2. Quantities Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Batch Printed Quantity */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  الكمية المطبوعة السليمة (الدفعة) *
                </label>
                <span className="text-[11px] text-slate-400">
                  المتبقي: <b className="text-amber-300">{targetRemaining}</b>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantityPrinted(prev => Math.max(0, prev - 1))}
                  className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={quantityPrinted}
                  onChange={(e) => setQuantityPrinted(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setQuantityPrinted(prev => prev + 1)}
                  className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 mt-2.5">
                <button
                  type="button"
                  onClick={() => setQuantityPrinted(targetRemaining)}
                  className="flex-1 py-1 px-1.5 text-[11px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded font-semibold text-center"
                >
                  كامل المتبقي ({targetRemaining})
                </button>
                <button
                  type="button"
                  onClick={() => setQuantityPrinted(prev => prev + 5)}
                  className="py-1 px-2 text-[11px] bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => setQuantityPrinted(prev => prev + 10)}
                  className="py-1 px-2 text-[11px] bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  +10
                </button>
              </div>
            </div>

            {/* Waste / Scrap Quantity */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  كمية الهادر والتالف (سكراب)
                </label>
                <span className="text-[11px] text-rose-300">قطع معطوبة</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWasteQuantity(prev => Math.max(0, prev - 1))}
                  className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={wasteQuantity}
                  onChange={(e) => setWasteQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setWasteQuantity(prev => prev + 1)}
                  className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2.5">
                تسجيل التالف يساعد في تقييم دقة الماكينة وجودة الخامات.
              </p>
            </div>
          </div>

          {/* Area & Meter Metrics Preview Banner */}
          <div className="bg-gradient-to-r from-blue-950/60 to-slate-850 p-3.5 rounded-xl border border-blue-500/20 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <div className="p-2 bg-slate-900/60 rounded-lg">
              <span className="text-[11px] text-slate-400 block">المساحة المطبوعة بهذه الدفعة</span>
              <span className="text-base font-bold text-blue-400">{batchAreaSqm} م²</span>
            </div>
            <div className="p-2 bg-slate-900/60 rounded-lg">
              <span className="text-[11px] text-slate-400 block">الطول بالمتر الطولي</span>
              <span className="text-base font-bold text-sky-400">{batchLinearMeters} م.ط</span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-2 bg-slate-900/60 rounded-lg">
              <span className="text-[11px] text-slate-400 block">نسبة الإنجاز بعد الحفظ</span>
              <span className="text-base font-bold text-emerald-400">{projectedPercent}%</span>
            </div>
          </div>

          {/* 3. Machine & Material Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-400" />
                ماكينة الطباعة *
              </label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">-- اختر الماكينة --</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Box className="w-4 h-4 text-amber-400" />
                المادة الخام المستخدمة
              </label>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- بدون خصم مخزون --</option>
                {materials.map(mat => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name} (المتوفر: {mat.stockQuantity} {mat.unit})
                  </option>
                ))}
              </select>
              {materialId && (
                <label className="flex items-center gap-2 mt-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deductInventory}
                    onChange={(e) => setDeductInventory(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-500 bg-slate-800 border-slate-700 focus:ring-0"
                  />
                  <span>خصم الاستهلاك تلقائياً من رصيد المستودع</span>
                </label>
              )}
            </div>
          </div>

          {/* 4. Operator, Speed & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اسم فني / مشغل الماكينة *
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="اسم المشغل المسؤول عن الدفعة"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                نمط / دقة الطباعة (Pass)
              </label>
              <select
                value={printSpeed}
                onChange={(e) => setPrintSpeed(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Production 2-Pass (سريع جداً)">Production 2-Pass (سريع جداً)</option>
                <option value="Standard 4-Pass (قياسي)">Standard 4-Pass (قياسي متوازن)</option>
                <option value="Quality 6-Pass (عالي الجودة)">Quality 6-Pass (عالي الجودة)</option>
                <option value="Fine Art 8-Pass (فوتوغرافي فائق)">Fine Art 8-Pass (فوتوغرافي فائق)</option>
                <option value="White + Color UV (طباعة طبقتين)">White + Color UV (طباعة طبقتين)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ملاحظات فنية عن التشغيل أو أسباب التالف (اختياري)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم استخدام حبر أصلي، توقف مؤقت لتنظيف رأس الطباعة، جفاف فوري ممتاز..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل الكمية...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>تأكيد تسجيل الكمية ({quantityPrinted})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
