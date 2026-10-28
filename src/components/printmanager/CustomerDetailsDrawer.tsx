import React from 'react';
import {
  X,
  User,
  Building,
  Phone,
  MessageSquare,
  MapPin,
  Mail,
  DollarSign,
  Layers,
  CreditCard,
  Calendar,
  ExternalLink,
  Edit,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { Customer, Order, Payment, ORDER_STATUS_DETAILS } from '../../types/printManager';
import { formatJOD } from '../../utils/financial';

interface CustomerDetailsDrawerProps {
  customer: Customer | null;
  orders: Order[];
  payments: Payment[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onSelectOrder: (order: Order) => void;
  onNewOrderForCustomer: (customer: Customer) => void;
  onNewPaymentForCustomer: (customer: Customer) => void;
}

export const CustomerDetailsDrawer: React.FC<CustomerDetailsDrawerProps> = ({
  customer,
  orders,
  payments,
  isOpen,
  onClose,
  onEdit,
  onSelectOrder,
  onNewOrderForCustomer,
  onNewPaymentForCustomer,
}) => {
  if (!isOpen || !customer) return null;

  const customerOrders = orders.filter(o => o.customerId === customer.id);
  const customerPayments = payments.filter(p => p.customerId === customer.id);

  // Clean WhatsApp number
  const cleanPhone = (customer.whatsapp || customer.phone || '').replace(/[^0-9]/g, '');
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '962' + cleanPhone.substring(1) : cleanPhone}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl h-full bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col text-right overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(customer)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              <Edit className="w-3.5 h-3.5 text-blue-400" />
              <span>تعديل العميل</span>
            </button>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              {customer.customerNumber}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main info card */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-white">{customer.name}</h2>
                {customer.companyName && (
                  <p className="text-sm font-semibold text-blue-400 flex items-center gap-1.5 mt-0.5">
                    <Building className="w-4 h-4" />
                    {customer.companyName}
                  </p>
                )}
              </div>

              {customer.balance > 0 ? (
                <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                  ذمة مستحقة
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  الحساب مسدد
                </span>
              )}
            </div>

            {/* Quick Contact Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-2 text-slate-300 hover:text-white bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono"
              >
                <Phone className="w-4 h-4 text-blue-400" />
                <span>{customer.phone}</span>
              </a>

              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30 font-mono font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>مراسلة واتساب</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}

              {customer.email && (
                <div className="flex items-center gap-2 text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 truncate font-mono">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}

              {customer.address && (
                <div className="flex items-center gap-2 text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 truncate">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{customer.address}</span>
                </div>
              )}
            </div>

            {customer.notes && (
              <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800/60 text-xs text-slate-300">
                <span className="font-bold text-slate-400 block mb-1">ملاحظات العميل:</span>
                {customer.notes}
              </div>
            )}
          </div>

          {/* Financial summary banner */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">إجمالي المبيعات</span>
              <span className="text-base sm:text-lg font-black text-white">{formatJOD(customer.totalInvoiced)}</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">المقبوضات</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">{formatJOD(customer.totalPaid)}</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">الرصيد المستحق</span>
              <span className={`text-base sm:text-lg font-black ${customer.balance > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {formatJOD(customer.balance)}
              </span>
            </div>
          </div>

          {/* Quick Actions for this customer */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNewOrderForCustomer(customer)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
            >
              <FileCheck className="w-4 h-4" />
              <span>إنشاء أمر طباعة جديد</span>
            </button>
            <button
              onClick={() => onNewPaymentForCustomer(customer)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>تسجيل دفعة نقدية</span>
            </button>
          </div>

          {/* Orders History Tab */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              سجل أوامر الطباعة ({customerOrders.length})
            </h3>

            {customerOrders.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                لا توجد أوامر مسجلة لهذا العميل حتى الآن
              </div>
            ) : (
              <div className="space-y-2">
                {customerOrders.map(order => {
                  const sInfo = ORDER_STATUS_DETAILS[order.status] || ORDER_STATUS_DETAILS.new;
                  return (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 cursor-pointer flex items-center justify-between gap-3 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{order.orderNumber}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sInfo.bg} ${sInfo.color} ${sInfo.border} border`}>
                            {sInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 truncate max-w-xs">{order.description || order.printingType}</p>
                      </div>

                      <div className="text-left flex-shrink-0">
                        <div className="text-sm font-bold text-white">{formatJOD(order.totalAmount)}</div>
                        <span className={`text-[11px] font-semibold ${order.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {order.paymentStatus === 'paid' ? 'مدفوع' : `متبقي: ${formatJOD(order.remainingBalance)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payments History Tab */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              سجل الدفعات والمقبوضات ({customerPayments.length})
            </h3>

            {customerPayments.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                لا توجد دفعات مسجلة لهذا العميل
              </div>
            ) : (
              <div className="space-y-2">
                {customerPayments.map(payment => (
                  <div
                    key={payment.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{payment.paymentNumber}</span>
                        <span className="text-slate-400 font-mono">({payment.orderNumber})</span>
                      </div>
                      <div className="text-slate-400 mt-0.5 flex items-center gap-2 text-[11px]">
                        <span>{payment.paymentDate}</span>
                        <span>•</span>
                        <span>بواسطة: {payment.recordedBy}</span>
                      </div>
                    </div>

                    <div className="text-left font-black text-emerald-400 text-sm">
                      +{formatJOD(payment.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
