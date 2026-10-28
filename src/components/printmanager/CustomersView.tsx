import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageSquare,
  Building,
  DollarSign,
  AlertCircle,
  Eye,
  Edit,
  ExternalLink,
  Filter,
  CheckCircle2,
  Archive
} from 'lucide-react';
import { Customer, Order, Payment } from '../../types/printManager';
import { formatJOD } from '../../utils/financial';
import { CustomerModal } from './CustomerModal';
import { CustomerDetailsDrawer } from './CustomerDetailsDrawer';

interface CustomersViewProps {
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  isAdmin: boolean;
  onOpenNewOrderForCustomer: (customer: Customer) => void;
  onOpenNewPaymentForCustomer: (customer: Customer) => void;
  onSelectOrder: (order: Order) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders,
  payments,
  isAdmin,
  onOpenNewOrderForCustomer,
  onOpenNewPaymentForCustomer,
  onSelectOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_balance' | 'settled' | 'archived'>('all');
  const [modalCustomer, setModalCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerForDrawer, setSelectedCustomerForDrawer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Archive filter
      if (filterType === 'archived') {
        if (!c.isArchived) return false;
      } else {
        if (c.isArchived) return false;
      }

      // Balance filter
      if (filterType === 'with_balance' && (c.balance || 0) <= 0) return false;
      if (filterType === 'settled' && (c.balance || 0) > 0) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = c.name?.toLowerCase().includes(term);
        const matchesCompany = c.companyName?.toLowerCase().includes(term);
        const matchesPhone = c.phone?.includes(term) || c.whatsapp?.includes(term);
        const matchesNumber = c.customerNumber?.toLowerCase().includes(term);
        return matchesName || matchesCompany || matchesPhone || matchesNumber;
      }

      return true;
    });
  }, [customers, searchTerm, filterType]);

  const totalOutstanding = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  }, [customers]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              {customers.length} عميل مسجل
            </span>
            <span className="text-xs text-slate-400">
              إجمالي الذمم المستحقة: <strong className="text-rose-400">{formatJOD(totalOutstanding)}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">قاعدة بيانات العملاء والشركات</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            إدارة سجلات العملاء، حسابات الدفع، الأرصدة، ومتابعة جميع الأوامر السابقة
          </p>
        </div>

        <button
          onClick={() => {
            setModalCustomer(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث بالاسم، اسم الشركة، رقم الهاتف أو كود العميل..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 transition-all text-right"
          />
          <Search className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            الكل ({customers.filter(c => !c.isArchived).length})
          </button>
          <button
            onClick={() => setFilterType('with_balance')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterType === 'with_balance'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            عليهم ذمم ({customers.filter(c => !c.isArchived && (c.balance || 0) > 0).length})
          </button>
          <button
            onClick={() => setFilterType('settled')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterType === 'settled'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            حسابات مسددة
          </button>
          <button
            onClick={() => setFilterType('archived')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterType === 'archived'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            الأرشيف
          </button>
        </div>
      </div>

      {/* Customers Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">لا توجد نتائج مطابقة</h3>
          <p className="text-xs text-slate-400">تأكد من عبارة البحث أو قم بإضافة عميل جديد إلى النظام</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
            const cleanPhone = (customer.whatsapp || customer.phone || '').replace(/[^0-9]/g, '');
            const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '962' + cleanPhone.substring(1) : cleanPhone}` : null;

            return (
              <div
                key={customer.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                      {customer.customerNumber}
                    </span>

                    {customer.balance > 0 ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold">
                        مستحق: {formatJOD(customer.balance)}
                      </span>
                    ) : (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        مسدد
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    {customer.name}
                  </h3>
                  {customer.companyName && (
                    <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-blue-400" />
                      {customer.companyName}
                    </p>
                  )}

                  <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الهاتف:</span>
                      <a href={`tel:${customer.phone}`} className="font-mono text-slate-200 hover:text-blue-400">
                        {customer.phone}
                      </a>
                    </div>
                    {customer.address && (
                      <div className="flex items-center justify-between truncate">
                        <span className="text-slate-500">العنوان:</span>
                        <span className="text-slate-300 truncate max-w-[180px]">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Stats Bar */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-[11px]">
                    <div className="bg-slate-950/60 p-2 rounded-xl text-center border border-slate-800/80">
                      <span className="text-slate-500 block">إجمالي المبيعات</span>
                      <span className="font-bold text-white">{formatJOD(customer.totalInvoiced)}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl text-center border border-slate-800/80">
                      <span className="text-slate-500 block">المقبوضات</span>
                      <span className="font-bold text-emerald-400">{formatJOD(customer.totalPaid)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
                        title="مراسلة عبر واتساب"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setModalCustomer(customer);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="تعديل بيانات العميل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedCustomerForDrawer(customer)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>الملف والأوامر</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Edit/Add Modal */}
      <CustomerModal
        customer={modalCustomer}
        existingCount={customers.length}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalCustomer(null);
        }}
        isAdmin={isAdmin}
      />

      {/* Customer Profile Drawer */}
      <CustomerDetailsDrawer
        customer={selectedCustomerForDrawer}
        orders={orders}
        payments={payments}
        isOpen={!!selectedCustomerForDrawer}
        onClose={() => setSelectedCustomerForDrawer(null)}
        onEdit={(cust) => {
          setSelectedCustomerForDrawer(null);
          setModalCustomer(cust);
          setIsModalOpen(true);
        }}
        onSelectOrder={(order) => {
          setSelectedCustomerForDrawer(null);
          onSelectOrder(order);
        }}
        onNewOrderForCustomer={(cust) => {
          setSelectedCustomerForDrawer(null);
          onOpenNewOrderForCustomer(cust);
        }}
        onNewPaymentForCustomer={(cust) => {
          setSelectedCustomerForDrawer(null);
          onOpenNewPaymentForCustomer(cust);
        }}
      />
    </div>
  );
};
