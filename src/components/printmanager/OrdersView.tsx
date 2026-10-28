import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  Filter,
  Calendar,
  Clock,
  Printer,
  FileText,
  User,
  ArrowUpRight,
  CheckCircle2,
  Trash2,
  Edit,
  Eye,
  Cpu,
  Box,
  AlertTriangle
} from 'lucide-react';
import {
  Order,
  Customer,
  Machine,
  Material,
  OrderStatus,
  ORDER_STATUS_DETAILS
} from '../../types/printManager';
import { calculateProgressPercent, calculateAreaSqm } from '../../utils/financial';
import { updateOrderStatus, deleteOrder } from '../../firebase/services';
import { OrderModal } from './OrderModal';
import { LogPrintQuantityModal } from './LogPrintQuantityModal';

interface OrdersViewProps {
  orders: Order[];
  customers: Customer[];
  machines: Machine[];
  materials: Material[];
  isAdmin: boolean;
  onSelectOrder: (order: Order) => void;
  onOpenNewOrder: () => void;
  onOpenPrintTicket: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  customers,
  machines,
  materials,
  isAdmin,
  onSelectOrder,
  onOpenNewOrder,
  onOpenPrintTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [machineFilter, setMachineFilter] = useState<string>('all');
  const [printProgressFilter, setPrintProgressFilter] = useState<string>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [activeLogOrderId, setActiveLogOrderId] = useState<string | undefined>(undefined);

  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      // Status filter
      if (statusFilter !== 'all' && ord.status !== statusFilter) return false;

      // Machine filter
      if (machineFilter !== 'all' && ord.machineId !== machineFilter) return false;

      // Print progress filter
      if (printProgressFilter === 'completed') {
        const isDone = (ord.printedQuantity || 0) >= (ord.quantity || 1);
        if (!isDone) return false;
      } else if (printProgressFilter === 'in_progress') {
        const isDone = (ord.printedQuantity || 0) >= (ord.quantity || 1);
        if (isDone) return false;
      } else if (printProgressFilter === 'has_waste') {
        if (!(ord.wasteQuantity && ord.wasteQuantity > 0)) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesNum = ord.orderNumber?.toLowerCase().includes(term);
        const matchesCust = ord.customerName?.toLowerCase().includes(term);
        const matchesDesc = ord.description?.toLowerCase().includes(term);
        const matchesType = ord.printingType?.toLowerCase().includes(term);
        const matchesMachine = ord.machineName?.toLowerCase().includes(term);
        return matchesNum || matchesCust || matchesDesc || matchesType || matchesMachine;
      }

      return true;
    });
  }, [orders, statusFilter, machineFilter, printProgressFilter, searchTerm]);

  const handleQuickStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (e) {
      console.error('Status change error:', e);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) {
      try {
        await deleteOrder(orderId);
      } catch (e) {
        console.error('Delete order error:', e);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              {orders.length} أمر إنتاج
            </span>
            <span className="text-xs text-slate-400">
              قيد التنفيذ:{' '}
              <strong className="text-blue-400">
                {orders.filter(o => o.status === 'printing' || o.status === 'finishing').length}
              </strong>
            </span>
            <span className="text-xs text-emerald-400 mr-2">
              مكتملة الطباعة:{' '}
              <strong>
                {orders.filter(o => (o.printedQuantity || 0) >= (o.quantity || 1)).length}
              </strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">أوامر الطباعة والإنتاج الفني</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            متابعة دقيقة لكميات الطباعة، الأبعاد (سم)، استهلاك الخامات، العدادات، والتسليمات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveLogOrderId(undefined);
              setLogModalOpen(true);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>تسجيل كمية مطبوعة 🖨️</span>
          </button>

          <button
            onClick={onOpenNewOrder}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>أمر طباعة جديد</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث برقم الأمر، اسم العميل، البيان، الماكينة، أو نوع الطباعة..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-sm text-white placeholder-slate-500 transition-all text-right"
            />
            <Search className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Print Progress Filter */}
            <select
              value={printProgressFilter}
              onChange={(e) => setPrintProgressFilter(e.target.value)}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-blue-500 font-semibold"
            >
              <option value="all">كل حالات إنجاز الطباعة</option>
              <option value="in_progress">قيد الطباعة (غير مكتمل)</option>
              <option value="completed">مكتمل الطباعة 100%</option>
              <option value="has_waste">يحتوي على تالف / هادر ⚠️</option>
            </select>

            {/* Machine Filter */}
            <select
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-blue-500 font-semibold"
            >
              <option value="all">كل الماكينات</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-800/60">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            الكل ({orders.length})
          </button>
          {Object.entries(ORDER_STATUS_DETAILS).map(([key, info]) => {
            const count = orders.filter(o => o.status === key).length;
            const isSelected = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <span>{info.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">لا توجد أوامر مطابقة للفلتر</h3>
          <p className="text-xs text-slate-400">جرب تغيير حالة الفلتر أو أضف أمر إنتاج جديد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const statusInfo = ORDER_STATUS_DETAILS[order.status] || ORDER_STATUS_DETAILS.new;
            const itemsCount = order.items?.length || 1;
            const printed = order.printedQuantity || 0;
            const totalReq = order.quantity || 1;
            const remaining = Math.max(0, totalReq - printed);
            const isComplete = printed >= totalReq;
            const pct = calculateProgressPercent(printed, totalReq);

            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition group"
              >
                {/* Left/Main Column: Order Info & Technical Specs */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-white bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                      {order.orderNumber}
                    </span>

                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} border`}>
                      {statusInfo.label}
                    </span>

                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      isComplete
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : printed > 0
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {isComplete ? '✅ مكتمل الطباعة' : printed > 0 ? `🔄 تم طباعة ${pct}%` : '⏳ لم تبدأ الطباعة'}
                    </span>

                    <span className="text-xs text-slate-400 flex items-center gap-1 mr-auto sm:mr-0">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      موعد التسليم: <strong className="text-slate-200">{order.deliveryDate || 'فوري'}</strong>
                    </span>
                  </div>

                  {/* Customer and description */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                        {order.customerName}
                      </h3>
                      {order.customerPhone && (
                        <span className="text-xs text-slate-400 font-mono">({order.customerPhone})</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {order.description || order.printingType}
                    </p>
                  </div>

                  {/* Technical Specs Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-1 text-slate-300">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      <span>الماكينة: <strong className="text-white">{order.machineName || 'غير محدد'}</strong></span>
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-1 text-slate-300">
                      <Box className="w-3.5 h-3.5 text-emerald-400" />
                      <span>التقنية: <strong className="text-white">{order.printingType}</strong></span>
                    </span>

                    {order.materialName && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300">
                        الخامة: <strong className="text-white">{order.materialName}</strong>
                      </span>
                    )}

                    {itemsCount > 1 ? (
                      <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                        {itemsCount} بنود في الطلب
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800/80">
                        المقاس: <strong className="text-slate-200">{order.widthCm}×{order.heightCm} سم</strong>
                      </span>
                    )}

                    {order.totalAreaSqm ? (
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                        المساحة: {order.totalAreaSqm} م²
                      </span>
                    ) : null}

                    {order.assignedEmployee && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-400">
                        المسؤول: {order.assignedEmployee}
                      </span>
                    )}
                  </div>

                  {/* Print Quantity Progress & Scrap Stats */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 my-1.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">متابعة الكميات:</span>
                        <span className="font-bold text-white">
                          المطلوب: <strong className="text-white font-mono">{order.quantity}</strong> قطعة
                        </span>
                        <span>•</span>
                        <span>
                          المنجز: <strong className="text-emerald-400 font-mono">{printed}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          المتبقي: <strong className="text-amber-400 font-mono">{remaining}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        {order.wasteQuantity && order.wasteQuantity > 0 ? (
                          <span className="text-rose-400 bg-rose-950/60 border border-rose-800/40 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            هادر/تالف: {order.wasteQuantity} قطعة
                          </span>
                        ) : null}

                        <span className="text-blue-400 font-bold font-mono">
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          isComplete
                            ? 'bg-emerald-400'
                            : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                        }`}
                        style={{
                          width: `${pct}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Production Quantity Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  {/* Status Dropdown */}
                  <div className="w-full sm:w-auto">
                    <select
                      value={order.status}
                      onChange={(e) => handleQuickStatusChange(order.id, e.target.value as OrderStatus)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:border-blue-500 font-semibold"
                    >
                      {Object.entries(ORDER_STATUS_DETAILS).map(([key, sInfo]) => (
                        <option key={key} value={key}>{sInfo.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Primary & Secondary Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                    {/* Log Print Quantity Button */}
                    <button
                      onClick={() => {
                        setActiveLogOrderId(order.id);
                        setLogModalOpen(true);
                      }}
                      className="flex-1 sm:flex-initial p-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
                      title="تسجيل دفعة كميات مطبوعة لهذا الطلب"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>تسجيل كمية</span>
                    </button>

                    {/* Print Production Ticket */}
                    <button
                      onClick={() => onOpenPrintTicket(order)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white transition flex items-center gap-1 text-xs font-bold"
                      title="طباعة تذكرة تشغيل وأمر إنتاج فني"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">أمر الإنتاج</span>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setEditingOrder(order);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="تعديل مواصفات أمر الطباعة"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete button (Admin only) */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white transition"
                        title="حذف الطلب نهائياً"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Order Modal */}
      {isModalOpen && (
        <OrderModal
          order={editingOrder}
          existingCount={orders.length}
          customers={customers}
          machines={machines}
          materials={materials}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingOrder(null);
          }}
        />
      )}

      {/* Log Print Quantity Modal */}
      {logModalOpen && (
        <LogPrintQuantityModal
          isOpen={logModalOpen}
          onClose={() => {
            setLogModalOpen(false);
            setActiveLogOrderId(undefined);
          }}
          orders={orders}
          machines={machines}
          materials={materials}
          initialOrderId={activeLogOrderId}
        />
      )}
    </div>
  );
};
