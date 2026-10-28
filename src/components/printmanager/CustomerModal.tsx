import React, { useState } from 'react';
import { X, User, Building, Phone, MessageSquare, MapPin, Mail, FileText, Save, Trash2, Archive, Check } from 'lucide-react';
import { Customer } from '../../types/printManager';
import { addCustomer, updateCustomer, archiveCustomer } from '../../firebase/services';
import { generateCustomerNumber } from '../../utils/financial';

interface CustomerModalProps {
  customer: Customer | null;
  existingCount: number;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  customer,
  existingCount,
  isOpen,
  onClose,
  isAdmin,
}) => {
  const isEditing = !!customer;

  const [customerNumber, setCustomerNumber] = useState(
    customer?.customerNumber || generateCustomerNumber(existingCount)
  );
  const [name, setName] = useState(customer?.name || '');
  const [companyName, setCompanyName] = useState(customer?.companyName || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [whatsapp, setWhatsapp] = useState(customer?.whatsapp || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [notes, setNotes] = useState(customer?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (!whatsapp) {
      setWhatsapp(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم العميل');
      return;
    }
    if (!phone.trim()) {
      setError('يرجى إدخال رقم الهاتف');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditing && customer) {
        await updateCustomer(customer.id, {
          customerNumber,
          name: name.trim(),
          companyName: companyName.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          address: address.trim(),
          email: email.trim(),
          notes: notes.trim(),
        });
      } else {
        await addCustomer({
          customerNumber,
          name: name.trim(),
          companyName: companyName.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          address: address.trim(),
          email: email.trim(),
          notes: notes.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حفظ بيانات العميل');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchive = async () => {
    if (!customer) return;
    try {
      setSaving(true);
      await archiveCustomer(customer.id, !customer.isArchived);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'تعذر أرشفة العميل');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden my-8 text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              {customerNumber}
            </span>
            <h2 className="text-base font-bold text-white">
              {isEditing ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            </h2>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اسم العميل / الشخص المسؤول <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: م. أحمد الخالد"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 transition-all"
                />
                <User className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اسم الشركة أو المؤسسة
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مثال: شركة آفاق للإعلان"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 transition-all"
                />
                <Building className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم الهاتف الأساسي <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="079XXXXXXX"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 transition-all font-mono"
                />
                <Phone className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم الواتساب (WhatsApp)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="079XXXXXXX أو دولي"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 transition-all font-mono"
                />
                <MessageSquare className="absolute right-3 top-3 w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 transition-all text-left font-mono"
                />
                <Mail className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                العنوان والموقع الجغرافي
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="عمان - الجاردنز"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 transition-all"
                />
                <MapPin className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ملاحظات وتفاصيل التعامل (خصومات خاصة، طريقة الدفع المفضلة...)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أي شروط خاصة أو ملاحظات تهم الفريق..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 transition-all resize-none"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {isEditing && isAdmin ? (
              <button
                type="button"
                onClick={handleToggleArchive}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/30 text-xs font-semibold transition-all"
              >
                <Archive className="w-4 h-4" />
                <span>{customer?.isArchived ? 'إلغاء الأرشفة' : 'أرشفة العميل'}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جارٍ الحفظ...' : isEditing ? 'تحديث البيانات' : 'حفظ العميل'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
