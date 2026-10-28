import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Printer,
  FileText,
  User,
  Clock,
  Link as LinkIcon,
  Save,
  CheckCircle2,
  Cpu,
  Box,
  Activity
} from 'lucide-react';
import {
  Order,
  OrderItem,
  Customer,
  Machine,
  Material,
  OrderStatus,
  PRINTING_TYPES,
  ORDER_STATUS_DETAILS
} from '../../types/printManager';
import { createOrder, updateOrder } from '../../firebase/services';
import {
  generateOrderNumber,
  calculateAreaSqm,
  calculateLinearMeters
} from '../../utils/financial';
import { auth } from '../../firebase/config';

interface OrderModalProps {
  order: Order | null;
  initialCustomer?: Customer | null;
  existingCount: number;
  customers: Customer[];
  machines: Machine[];
  materials: Material[];
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (order: Order) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  order,
  initialCustomer,
  existingCount,
  customers,
  machines,
  materials,
  isOpen,
  onClose,
}) => {
  const isEditing = !!order;

  const [orderNumber, setOrderNumber] = useState(
    order?.orderNumber || generateOrderNumber(existingCount)
  );
  const [customerId, setCustomerId] = useState(
    order?.customerId || initialCustomer?.id || (customers[0]?.id || '')
  );
  const [description, setDescription] = useState(order?.description || '');
  const [printingType, setPrintingType] = useState(
    order?.printingType || PRINTING_TYPES[0]
  );
  const [machineId, setMachineId] = useState(order?.machineId || (machines[0]?.id || ''));
  const [materialId, setMaterialId] = useState(order?.materialId || (materials[0]?.id || ''));
  const [deliveryDate, setDeliveryDate] = useState(
    order?.deliveryDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [orderDate, setOrderDate] = useState(
    order?.orderDate || new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<OrderStatus>(order?.status || 'new');
  const [assignedEmployee, setAssignedEmployee] = useState(
    order?.assignedEmployee || auth.currentUser?.displayName || 'فني الإنتاج'
  );
  const [fileAttachment, setFileAttachment] = useState(order?.fileAttachment || '');
  const [productionNotes, setProductionNotes] = useState(order?.productionNotes || '');

  // Multi-line items for technical print specifications
  const [items, setItems] = useState<OrderItem[]>(() => {
    if (order?.items && order.items.length > 0) {
      return order.items;
    }
    return [
      {
        id: 'item-1',
        description: order?.description || 'بند طباعة أساسي',
        printingType: order?.printingType || PRINTING_TYPES[0],
        machineId: order?.machineId || (machines[0]?.id || ''),
        materialId: order?.materialId || (materials[0]?.id || ''),
        widthCm: order?.widthCm || 100,
        heightCm: order?.heightCm || 100,
        quantity: order?.quantity || 1,
        printedQuantity: order?.printedQuantity || 0,
        wasteQuantity: order?.wasteQuantity || 0,
        pricingMode: 'sqm',
        unitPrice: 0,
        additionalFees: 0,
        total: 0,
      },
    ];
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When customerId changes, snapshot info
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === customerId);
  }, [customers, customerId]);

  // Recalculate item line
  const handleItemChange = (index: number, updates: Partial<OrderItem>) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleAddItem = () => {
    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      description: `بند إضافي #${items.length + 1}`,
      printingType: printingType,
      machineId: machineId,
      materialId: materialId,
      widthCm: 100,
      heightCm: 100,
      quantity: 1,
      printedQuantity: 0,
      wasteQuantity: 0,
      pricingMode: 'sqm',
      unitPrice: 0,
      additionalFees: 0,
      total: 0,
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Aggregated technical metrics
  const totals = useMemo(() => {
    let pieces = 0;
    let sqm = 0;
    let linear = 0;

    items.forEach(it => {
      const q = it.quantity || 1;
      pieces += q;
      sqm += calculateAreaSqm(it.widthCm, it.heightCm, q);
      linear += calculateLinearMeters(it.widthCm, it.heightCm, q);
    });

    return {
      pieces,
      sqm: Math.round(sqm * 100) / 100,
      linear: Math.round(linear * 100) / 100,
    };
  }, [items]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('يرجى اختيار العميل أو الجهة الطالبة');
      return;
    }
    if (items.length === 0) {
      setError('يجب إضافة بند واحد على الأقل للطلب');
      return;
    }

    setSaving(true);
    setError(null);

    const firstItem = items[0];
    const machine = machines.find(m => m.id === (firstItem.machineId || machineId));
    const material = materials.find(m => m.id === (firstItem.materialId || materialId));

    try {
      const processedItems = items.map(it => {
        const area = calculateAreaSqm(it.widthCm, it.heightCm, it.quantity);
        const lin = calculateLinearMeters(it.widthCm, it.heightCm, it.quantity);
        const m = machines.find(x => x.id === it.machineId);
        const mat = materials.find(x => x.id === it.materialId);
        return {
          ...it,
          machineName: m?.name || it.machineName || machine?.name,
          materialName: mat?.name || it.materialName || material?.name,
          totalAreaSqm: area,
          totalLinearMeters: lin,
          pricingMode: 'sqm' as const,
          unitPrice: 0,
          additionalFees: 0,
          total: 0,
        };
      });

      const orderPayload = {
        orderNumber,
        customerId,
        customerName: selectedCustomer?.name || 'عميل نقدي / مباشر',
        customerPhone: selectedCustomer?.phone || '',
        orderDate,
        deliveryDate,
        description: description || firstItem.description || 'أمر تشغيل وطباعة',
        printingType: firstItem.printingType || printingType,
        machineId: firstItem.machineId || machineId,
        machineName: machine?.name || 'غير محدد',
        materialId: firstItem.materialId || materialId,
        materialName: material?.name || 'غير محدد',
        widthCm: firstItem.widthCm,
        heightCm: firstItem.heightCm,
        quantity: totals.pieces,
        totalAreaSqm: totals.sqm,
        totalLinearMeters: totals.linear,
        pricingMode: 'sqm' as const,
        unitPrice: 0,
        additionalFees: 0,
        discount: 0,
        totalAmount: 0,
        paidAmount: 0,
        remainingBalance: 0,
        paymentStatus: 'paid' as const,
        status,
        productionNotes,
        assignedEmployee,
        fileAttachment,
        items: processedItems,
      };

      if (isEditing && order) {
        await updateOrder(order.id, orderPayload);
      } else {
        await createOrder(orderPayload);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'فشل حفظ أمر الطباعة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden my-6 text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold">
              {orderNumber}
            </span>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-400" />
              {isEditing ? 'تعديل مواصفات أمر الإنتاج' : 'إنشاء أمر طباعة وتشغيل جديد'}
            </h2>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Top Row: Customer & Order Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                العميل / الجهة الطالبة <span className="text-rose-400">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-sm text-white font-semibold transition"
              >
                <option value="">-- اختر العميل --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                بيان ومسمى العمل / الوصف العام <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: لوحات إعلانية خارجية، ستيكر سيارات، رول أب..."
                required
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-sm text-white transition"
              />
            </div>
          </div>

          {/* Second Row: Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                تاريخ الطلب
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                موعد التسليم المطلوب
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                حالة الإنتاج الحالية
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-semibold"
              >
                {Object.entries(ORDER_STATUS_DETAILS).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Multi-Line Items (Dimensions & Quantities) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة بند ومقاس آخر للطلب</span>
              </button>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                مقاسات وبنود أمر الطباعة ({items.length})
              </h3>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => {
                const itemArea = calculateAreaSqm(item.widthCm, item.heightCm, item.quantity);
                const itemLinear = calculateLinearMeters(item.widthCm, item.heightCm, item.quantity);

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                          title="حذف هذا البند"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <span className="text-xs font-bold text-slate-300">
                        بند ومواصفة #{idx + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          بيان البند
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, { description: e.target.value })}
                          placeholder="مثال: وجه فليكس أمامي، ملصق سيارة..."
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          نوع وتقنية الطباعة
                        </label>
                        <select
                          value={item.printingType}
                          onChange={(e) => handleItemChange(idx, { printingType: e.target.value })}
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                        >
                          {PRINTING_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          ماكينة الطباعة المخصصة
                        </label>
                        <select
                          value={item.machineId}
                          onChange={(e) => {
                            const m = machines.find(x => x.id === e.target.value);
                            handleItemChange(idx, { machineId: e.target.value, machineName: m?.name });
                          }}
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                        >
                          <option value="">-- اختر الماكينة --</option>
                          {machines.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Dimensions & Quantities Inputs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      {/* Width */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          العرض (سم)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={item.widthCm}
                          onChange={(e) => handleItemChange(idx, { widthCm: parseFloat(e.target.value) || 0 })}
                          className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono text-center font-bold"
                        />
                      </div>

                      {/* Height */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          الارتفاع (سم)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={item.heightCm}
                          onChange={(e) => handleItemChange(idx, { heightCm: parseFloat(e.target.value) || 0 })}
                          className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono text-center font-bold"
                        />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          الكمية المطلوبة (قطع)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, { quantity: parseInt(e.target.value) || 1 })}
                          className="w-full p-2 rounded-xl bg-slate-950 border border-emerald-500/50 text-xs text-emerald-400 font-mono text-center font-black"
                        />
                      </div>

                      {/* Material */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          الخامة المستهلكة
                        </label>
                        <select
                          value={item.materialId}
                          onChange={(e) => {
                            const mat = materials.find(x => x.id === e.target.value);
                            handleItemChange(idx, { materialId: e.target.value, materialName: mat?.name });
                          }}
                          className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                        >
                          <option value="">-- اختر المادة --</option>
                          {materials.map(mat => (
                            <option key={mat.id} value={mat.id}>{mat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Calculated Metrics for this item */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1">
                      <div className="flex items-center gap-3">
                        <span>
                          المساحة الإجمالية: <b className="text-blue-400">{itemArea} م²</b>
                        </span>
                        <span>•</span>
                        <span>
                          الأمتار الطولية: <b className="text-indigo-400">{itemLinear} م.ط</b>
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500">
                        مقاس القطعة: {item.widthCm} × {item.heightCm} سم
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grand Production Summary Box (Physical Quantities Only, No Sales/Prices) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              إجمالي كميات الإنتاج المطلوب تجهيزها في هذا الأمر
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">إجمالي عدد القطع المطلوبة</span>
                <span className="text-xl font-black text-emerald-400 font-mono">{totals.pieces} <span className="text-xs font-normal text-slate-400">قطعة / نسخة</span></span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">إجمالي المساحة بالمتر المربع</span>
                <span className="text-xl font-black text-blue-400 font-mono">{totals.sqm} <span className="text-xs font-normal text-slate-400">م²</span></span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">الأمتار الطولية من الرول</span>
                <span className="text-xl font-black text-indigo-400 font-mono">{totals.linear} <span className="text-xs font-normal text-slate-400">م.ط</span></span>
              </div>
            </div>
          </div>

          {/* Operator, File Link & Production Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الموظف / الفني أو المشغل المسؤول
              </label>
              <input
                type="text"
                value={assignedEmployee}
                onChange={(e) => setAssignedEmployee(e.target.value)}
                placeholder="اسم الفني أو المشغل"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رابط ملف التصميم (Google Drive / OneDrive / رابط السيرفر)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fileAttachment}
                  onChange={(e) => setFileAttachment(e.target.value)}
                  placeholder="https://..."
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono text-left"
                />
                <LinkIcon className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ملاحظات التشغيل والتشطيب (تخريم، تركيب، ريلف، تغليف...)
            </label>
            <textarea
              rows={2}
              value={productionNotes}
              onChange={(e) => setProductionNotes(e.target.value)}
              placeholder="أي تعليمات تشغيل فنية خاصة بالماكينة أو طاولات التجميع والقص..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <span>جاري الحفظ...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'تحديث أمر الإنتاج' : 'حفظ وتثبيت أمر الطباعة'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
