import React, { useState } from 'react';
import { X, Building, Phone, Mail, MapPin, FileText, Save, Check } from 'lucide-react';
import { PrintShopCompanySettings } from '../../types/printManager';
import { updateCompanySettings } from '../../firebase/services';

interface CompanySettingsModalProps {
  settings: PrintShopCompanySettings;
  isOpen: boolean;
  onClose: () => void;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
}) => {
  const [companyName, setCompanyName] = useState(settings.companyName || '');
  const [companyNameEn, setCompanyNameEn] = useState(settings.companyNameEn || '');
  const [companyPhone, setCompanyPhone] = useState(settings.companyPhone || '');
  const [companyWhatsapp, setCompanyWhatsapp] = useState(settings.companyWhatsapp || '');
  const [companyEmail, setCompanyEmail] = useState(settings.companyEmail || '');
  const [companyAddress, setCompanyAddress] = useState(settings.companyAddress || '');
  const [taxNumber, setTaxNumber] = useState(settings.taxNumber || '');
  const [invoiceFooter, setInvoiceFooter] = useState(settings.invoiceFooter || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCompanySettings({
        companyName,
        companyNameEn,
        companyPhone,
        companyWhatsapp,
        companyEmail,
        companyAddress,
        taxNumber,
        invoiceFooter,
      });
      onClose();
    } catch (e) {
      console.error('Update company settings error:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden my-8 text-right">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">بيانات وترويسة المطبعة للفواتير</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">اسم المطبعة / المؤسسة (بالعربية)</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">اسم المطبعة (بالإنجليزية)</label>
            <input
              type="text"
              value={companyNameEn}
              onChange={(e) => setCompanyNameEn(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono text-left"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف</label>
              <input
                type="text"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">رقم الواتساب</label>
              <input
                type="text"
                value={companyWhatsapp}
                onChange={(e) => setCompanyWhatsapp(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">الرقم الضريبي / السجل التجاري</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-left"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">العنوان والموقع الجغرافي للمطبعة</label>
            <input
              type="text"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">شروط وتذييل الفاتورة وسندات التسليم</label>
            <textarea
              rows={3}
              value={invoiceFooter}
              onChange={(e) => setInvoiceFooter(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
