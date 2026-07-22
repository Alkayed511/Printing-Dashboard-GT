import React, { useState, useEffect } from 'react';
import { X, Plus, Printer, FileText, Maximize2, Layers, Hash, User, AlertCircle } from 'lucide-react';
import { PrinterType, PrintJob } from '../types';
import { PRINTERS_LIST } from '../data/printers';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPrinter?: PrinterType;
  onAddJob: (newJobData: Partial<PrintJob>) => void;
}

export const NewJobModal: React.FC<NewJobModalProps> = ({
  isOpen,
  onClose,
  defaultPrinter = 'eco',
  onAddJob,
}) => {
  const [printer, setPrinter] = useState<PrinterType>(defaultPrinter);
  const [filename, setFilename] = useState('');
  const [dimensions, setDimensions] = useState('100x50cm');
  const [material, setMaterial] = useState('فينيل لاصق لامع');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (defaultPrinter) setPrinter(defaultPrinter);
  }, [defaultPrinter]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename.trim()) return;

    // Ensure valid filename extension if user didn't write one
    let finalName = filename.trim();
    if (!/\.(pdf|tiff|tif|eps|ai|psd|png|jpg)$/i.test(finalName)) {
      finalName += '.pdf';
    }

    onAddJob({
      filename: finalName,
      printer,
      dimensions,
      material,
      quantity: Number(quantity) || 1,
      customerName: customerName.trim() || 'عميل مباشر',
      notes,
    });

    // Reset and close
    setFilename('');
    onClose();
  };

  const handleQuickPreset = (presetName: string, presetPrinter: PrinterType, presetDims: string, presetMat: string) => {
    setFilename(presetName);
    setPrinter(presetPrinter);
    setDimensions(presetDims);
    setMaterial(presetMat);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-xl w-full shadow-2xl text-zinc-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-100">إرسال ملف للطباعة (إضافة أمر جديد)</h3>
              <p className="text-xs text-zinc-400">محاكاة إيداع الملف في مجلد الطابعة المطلوب</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400">نماذج سريعة للتجربة:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset('لوحة_إعلانية_3x1متر.pdf', 'solvint', '300x100cm', 'فليكس مضاء')}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium"
              >
                + بنر فليكس
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('شعارات_تيشيرت_حراري.png', 'dtf', '29x42cm', 'DTF قماش')}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium"
              >
                + طباعة DTF
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('ستيكرات_قص_تفريغ_100قطعة.eps', 'cutter', '10x10cm', 'فينيل لاصق')}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium"
              >
                + قص كاتر
              </button>
            </div>
          </div>

          {/* Printer Select */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              اختيار الطابعة المستهدفة:
            </label>
            <select
              value={printer}
              onChange={(e) => setPrinter(e.target.value as PrinterType)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              {PRINTERS_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameAr} ({p.id.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Filename Input */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              اسم الملف البرمجي:
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="مثال: A3_Banner_ClientName_100x50cm.pdf"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
              required
            />
          </div>

          {/* Dimensions & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                الأبعاد (العرض × الارتفاع):
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="100x50cm"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-400" />
                الكمية المطلوبة (عدد القطع):
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>
          </div>

          {/* Material & Customer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                نوع الخامة والطباعة:
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="فينيل / فليكس / أكريليك"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                اسم العميل / المشروع:
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="محل / شركة / عميل"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">ملاحظات لفني الطباعة:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: يرجى تنظيف حواف الأكريليك / تركيب الحلقات كل 30 سم..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-500 hover:to-orange-500 text-white font-semibold px-5 py-2 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
            >
              إرسال لقائمة الانتظار 🚀
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
