import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, Download, Check, Share2, Building, Layers, Cpu, Box, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';
import { Order, Customer, PrintShopCompanySettings } from '../../types/printManager';
import { calculateAreaSqm, calculateLinearMeters, calculateProgressPercent } from '../../utils/financial';

interface DocumentModalProps {
  type?: 'invoice' | 'ticket';
  order: Order | null;
  customer?: Customer | null;
  settings: PrintShopCompanySettings;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  order,
  customer,
  settings,
  isOpen,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (order) {
      const qrPayload = JSON.stringify({
        orderNumber: order.orderNumber,
        customer: order.customerName,
        quantity: order.quantity,
        status: order.status,
        delivery: order.deliveryDate,
      });
      QRCode.toDataURL(qrPayload, { width: 160, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const printed = order.printedQuantity || 0;
  const totalReq = order.quantity || 1;
  const remaining = Math.max(0, totalReq - printed);
  const waste = order.wasteQuantity || 0;
  const pct = calculateProgressPercent(printed, totalReq);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden my-6 text-right">
        {/* Header Toolbar (Hidden when printing) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة أمر التشغيل / حفظ PDF</span>
            </button>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
              {order.orderNumber}
            </span>
          </div>
        </div>

        {/* Printable Paper Area (Styled for white paper + black text when printed) */}
        <div className="p-4 sm:p-8 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:m-0">
          <div
            ref={printContentRef}
            className="bg-white text-slate-900 p-8 rounded-2xl shadow-xl print:shadow-none print:border-none print:rounded-none font-sans"
            style={{ direction: 'rtl' }}
          >
            {/* Header: Company Info + Document Title */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {settings.companyName}
                </h1>
                {settings.companyNameEn && (
                  <p className="text-xs font-semibold text-slate-500 font-mono">
                    {settings.companyNameEn}
                  </p>
                )}
                <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                  <p>{settings.companyAddress}</p>
                  <p>هاتف: {settings.companyPhone} • واتساب: {settings.companyWhatsapp}</p>
                </div>
              </div>

              <div className="text-left flex flex-col items-end">
                <div className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-black mb-2">
                  سند تشغيل وتذكرة إنتاج فني
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>رقم أمر التشغيل: <strong className="font-mono text-slate-900">{order.orderNumber}</strong></p>
                  <p>تاريخ الإنشاء: <span className="font-mono">{order.orderDate || new Date().toISOString().split('T')[0]}</span></p>
                  <p>موعد التسليم: <strong className="font-mono text-blue-700">{order.deliveryDate}</strong></p>
                </div>
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="QR Code" className="w-16 h-16 mt-2 border border-slate-300 rounded" />
                )}
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">السادة / العميل:</span>
                <strong className="text-sm font-bold text-slate-900 block mt-0.5">{order.customerName}</strong>
                {customer?.companyName && <p className="text-slate-600">{customer.companyName}</p>}
              </div>

              <div className="text-left">
                <span className="text-slate-500 block">معلومات الاتصال:</span>
                <strong className="font-mono text-slate-900 block mt-0.5">{order.customerPhone || customer?.phone || 'غير مسجل'}</strong>
                {customer?.address && <p className="text-slate-600">{customer.address}</p>}
              </div>
            </div>

            {/* Description if any */}
            {order.description && (
              <div className="mb-4 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900">بيان ومسمى العمل: </span>
                {order.description}
              </div>
            )}

            {/* Technical Specifications Table */}
            <table className="w-full text-right text-xs border border-slate-300 rounded-lg overflow-hidden mb-6">
              <thead className="bg-slate-100 text-slate-800 border-b border-slate-300">
                <tr>
                  <th className="p-3 font-bold border-l border-slate-300 w-12 text-center">#</th>
                  <th className="p-3 font-bold border-l border-slate-300">البيان والتقنية</th>
                  <th className="p-3 font-bold border-l border-slate-300 text-center">الأبعاد (سم)</th>
                  <th className="p-3 font-bold border-l border-slate-300 text-center">المساحة (م²)</th>
                  <th className="p-3 font-bold border-l border-slate-300 text-center">الماكينة</th>
                  <th className="p-3 font-bold border-l border-slate-300 text-center">الخامة</th>
                  <th className="p-3 font-bold text-center">الكمية المطلوبة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(order.items && order.items.length > 0 ? order.items : [order]).map((item: any, idx: number) => {
                  const width = item.widthCm || order.widthCm;
                  const height = item.heightCm || order.heightCm;
                  const qty = item.quantity || order.quantity;
                  const area = calculateAreaSqm(width, height, qty);

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-center border-l border-slate-200">{idx + 1}</td>
                      <td className="p-3 border-l border-slate-200">
                        <strong className="block text-slate-900">{item.description || order.description}</strong>
                        <span className="text-[11px] text-blue-700 font-semibold">
                          {item.printingType || order.printingType}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-center border-l border-slate-200">
                        {width} × {height} سم
                      </td>
                      <td className="p-3 font-mono text-center border-l border-slate-200">
                        {area} م²
                      </td>
                      <td className="p-3 text-center border-l border-slate-200">
                        {item.machineName || order.machineName || 'غير محدد'}
                      </td>
                      <td className="p-3 text-center border-l border-slate-200">
                        {item.materialName || order.materialName || 'غير محدد'}
                      </td>
                      <td className="p-3 font-mono font-black text-center text-slate-900 bg-slate-50">
                        {qty} قطعة
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Production Progress Box for Tickets */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <strong className="text-xs font-bold text-blue-900">متابعة كميات الطباعة الفعلية في الورشة:</strong>
                <span className="text-xs font-bold text-blue-700">
                  نسبة الإنجاز: {pct}%
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block text-[11px]">الكمية المطلوبة</span>
                  <strong className="text-sm font-bold text-slate-900">{order.quantity} قطعة</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block text-[11px]">الكمية المنجزة</span>
                  <strong className="text-sm font-bold text-emerald-600">{printed} قطعة</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block text-[11px]">المتبقي للطباعة</span>
                  <strong className="text-sm font-bold text-amber-600">
                    {remaining} قطعة
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block text-[11px]">الهادر / التالف (سكراب)</span>
                  <strong className="text-sm font-bold text-rose-600">{waste} قطعة</strong>
                </div>
              </div>

              {/* Batch Signoff Grid for Operators */}
              <div className="mt-3 pt-3 border-t border-blue-200">
                <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  سجل توقيع دفعات الطباعة المباشرة (تعبئة فني وماكينة الطباعة):
                </span>
                <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-600">
                  <div className="border border-dashed border-slate-300 bg-white p-2 rounded text-center">
                    <span className="block font-bold text-slate-700">دفعة 1: ___ قطعة</span>
                    <span className="block text-slate-400 mt-1">المشغل: ________</span>
                  </div>
                  <div className="border border-dashed border-slate-300 bg-white p-2 rounded text-center">
                    <span className="block font-bold text-slate-700">دفعة 2: ___ قطعة</span>
                    <span className="block text-slate-400 mt-1">المشغل: ________</span>
                  </div>
                  <div className="border border-dashed border-slate-300 bg-white p-2 rounded text-center">
                    <span className="block font-bold text-slate-700">دفعة 3: ___ قطعة</span>
                    <span className="block text-slate-400 mt-1">المشغل: ________</span>
                  </div>
                  <div className="border border-dashed border-slate-300 bg-white p-2 rounded text-center">
                    <span className="block font-bold text-slate-700">فحص الجودة والتسليم</span>
                    <span className="block text-slate-400 mt-1">اعتماد: ________</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Production/Finishing Notes & Staff */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-6">
              <strong className="text-slate-900 block mb-1 font-bold">تعليمات الإنتاج والتشطيب والتجميع:</strong>
              <p className="text-slate-700 whitespace-pre-wrap">
                {order.productionNotes || 'لا توجد ملاحظات إضافية. يرجى الفحص والمعاينة ومطابقة الألوان قبل التسليم النهائي.'}
              </p>
              {order.assignedEmployee && (
                <p className="mt-2 text-slate-600">الفني / المشغل المسند إليه: <strong className="text-slate-900">{order.assignedEmployee}</strong></p>
              )}
            </div>

            {/* Footer Notice & Signatures */}
            <div className="border-t border-slate-300 pt-6 mt-6">
              <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-700 pt-2">
                <div>
                  <span className="block mb-8 text-slate-500 font-semibold">توقيع واستلام العميل</span>
                  <div className="w-44 border-b border-dashed border-slate-400 mx-auto" />
                </div>
                <div>
                  <span className="block mb-8 text-slate-500 font-semibold">اعتماد مسؤول تشغيل الورشة</span>
                  <div className="w-44 border-b border-dashed border-slate-400 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
