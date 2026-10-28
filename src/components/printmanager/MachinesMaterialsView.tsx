import React, { useState, useMemo } from 'react';
import {
  Printer,
  Package,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Wrench,
  Archive,
  Save,
  X,
  Search
} from 'lucide-react';
import { Machine, Material, Order } from '../../types/printManager';
import {
  addMachine,
  updateMachine,
  deleteMachine,
  addMaterial,
  updateMaterial,
  deleteMaterial
} from '../../firebase/services';
import { formatJOD } from '../../utils/financial';

interface MachinesMaterialsViewProps {
  machines: Machine[];
  materials: Material[];
  orders: Order[];
  isAdmin: boolean;
  onFilterOrdersByMachine: (machineId: string) => void;
}

export const MachinesMaterialsView: React.FC<MachinesMaterialsViewProps> = ({
  machines,
  materials,
  orders,
  isAdmin,
  onFilterOrdersByMachine,
}) => {
  const [activeTab, setActiveTab] = useState<'machines' | 'materials'>('machines');

  // Machine Modal State
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [mName, setMName] = useState('');
  const [mCode, setMCode] = useState('');
  const [mType, setMType] = useState('UV Flatbed');
  const [mWidth, setMWidth] = useState<number>(160);
  const [mStatus, setMStatus] = useState<'active' | 'maintenance' | 'idle' | 'archived'>('active');

  // Material Modal State
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [matName, setMatName] = useState('');
  const [matCat, setMatCat] = useState('بانر وفليكس');
  const [matUnit, setMatUnit] = useState('متر مربع (م²)');
  const [matCost, setMatCost] = useState<number>(1.0);
  const [matSell, setMatSell] = useState<number>(3.0);
  const [matStock, setMatStock] = useState<number>(100);
  const [matMin, setMatMin] = useState<number>(20);

  // Machine workload calculation
  const machineWorkload = useMemo(() => {
    const map: Record<string, { activeCount: number; readyCount: number; totalAreaSqm: number }> = {};
    machines.forEach(m => {
      map[m.id] = { activeCount: 0, readyCount: 0, totalAreaSqm: 0 };
    });

    orders.forEach(o => {
      if (o.status === 'cancelled' || o.status === 'delivered') return;
      if (!o.machineId || !map[o.machineId]) return;

      if (o.status === 'printing' || o.status === 'finishing' || o.status === 'approved') {
        map[o.machineId].activeCount++;
        const area = (((o.widthCm || 0) * (o.heightCm || 0)) / 10000) * (o.quantity || 1);
        map[o.machineId].totalAreaSqm += area;
      } else if (o.status === 'ready') {
        map[o.machineId].readyCount++;
      }
    });

    return map;
  }, [machines, orders]);

  // Open Machine Modal
  const openMachineModal = (machine?: Machine) => {
    if (machine) {
      setEditingMachine(machine);
      setMName(machine.name);
      setMCode(machine.code || '');
      setMType(machine.type);
      setMWidth(machine.maxPrintWidthCm || 160);
      setMStatus(machine.status);
    } else {
      setEditingMachine(null);
      setMName('');
      setMCode(`M-0${machines.length + 1}`);
      setMType('Eco-Solvent');
      setMWidth(160);
      setMStatus('active');
    }
    setIsMachineModalOpen(true);
  };

  const handleSaveMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) return;
    try {
      if (editingMachine) {
        await updateMachine(editingMachine.id, {
          name: mName.trim(),
          code: mCode.trim(),
          type: mType,
          maxPrintWidthCm: mWidth,
          status: mStatus,
        });
      } else {
        await addMachine({
          name: mName.trim(),
          code: mCode.trim(),
          type: mType,
          maxPrintWidthCm: mWidth,
          status: mStatus,
        });
      }
      setIsMachineModalOpen(false);
    } catch (e) {
      console.error('Save machine error:', e);
    }
  };

  // Open Material Modal
  const openMaterialModal = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setMatName(material.name);
      setMatCat(material.category || 'عام');
      setMatUnit(material.unit);
      setMatCost(material.costPerUnit || 0);
      setMatSell(material.sellPricePerUnit || 0);
      setMatStock(material.stockQuantity || 0);
      setMatMin(material.minStockThreshold || 10);
    } else {
      setEditingMaterial(null);
      setMatName('');
      setMatCat('بانر وفليكس');
      setMatUnit('متر مربع (م²)');
      setMatCost(1.2);
      setMatSell(3.5);
      setMatStock(150);
      setMatMin(30);
    }
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName.trim()) return;
    try {
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, {
          name: matName.trim(),
          category: matCat.trim(),
          unit: matUnit,
          costPerUnit: matCost,
          sellPricePerUnit: matSell,
          stockQuantity: matStock,
          minStockThreshold: matMin,
        });
      } else {
        await addMaterial({
          name: matName.trim(),
          category: matCat.trim(),
          unit: matUnit,
          costPerUnit: matCost,
          sellPricePerUnit: matSell,
          stockQuantity: matStock,
          minStockThreshold: matMin,
        });
      }
      setIsMaterialModalOpen(false);
    } catch (e) {
      console.error('Save material error:', e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
              {machines.length} ماكينة • {materials.length} مادة خام
            </span>
            <span className="text-xs text-slate-400">إدارة التجهيزات والمخزون</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">الآلات والمواد الخام</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            متابعة ضغط العمل والتشغيل لكل ماكينة، ومراقبة كميات المواد وتنبيهات النواقص
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'machines' ? (
            <button
              onClick={() => openMachineModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة ماكينة</span>
            </button>
          ) : (
            <button
              onClick={() => openMaterialModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مادة خام</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('machines')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'machines'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>ماكينات الطباعة ومعدات الورشة ({machines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'materials'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>المواد الخام والأرصدة ({materials.length})</span>
        </button>
      </div>

      {/* Tab 1: Machines */}
      {activeTab === 'machines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map(machine => {
            const load = machineWorkload[machine.id] || { activeCount: 0, readyCount: 0, totalAreaSqm: 0 };

            return (
              <div
                key={machine.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-950 font-mono text-slate-400 font-bold border border-slate-800">
                      {machine.code || 'M-01'}
                    </span>

                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                      machine.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : machine.status === 'maintenance'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {machine.status === 'active' ? 'تعمل بكفاءة' : machine.status === 'maintenance' ? 'صيانة دورية' : 'متوقفة مؤقتاً'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{machine.name}</h3>
                  <p className="text-xs text-blue-400 font-semibold">{machine.type}</p>

                  <div className="mt-3 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">أقصى عرض طباعة:</span>
                      <span className="font-bold text-white">{machine.maxPrintWidthCm} سم</span>
                    </div>
                  </div>

                  {/* Workload Box */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        طلبات قيد التشغيل:
                      </span>
                      <span className="font-bold text-white">{load.activeCount} أمر</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        المساحة قيد الانتظار:
                      </span>
                      <span className="font-bold text-blue-400">{load.totalAreaSqm.toFixed(1)} م²</span>
                    </div>
                  </div>

                  {/* Cumulative Machine Odometer */}
                  <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-slate-950 to-blue-950/30 border border-blue-500/20">
                    <span className="text-[11px] font-bold text-blue-300 block mb-1.5 flex items-center justify-between">
                      <span>عداد التشغيل التراكمي للماكينة:</span>
                      <span className="text-[10px] text-slate-500 font-mono">ODOMETER</span>
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">المساحة</span>
                        <span className="text-xs font-bold text-emerald-400">{(machine.totalPrintedSqm || 0).toFixed(1)} م²</span>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">الطول</span>
                        <span className="text-xs font-bold text-sky-400">{(machine.totalPrintedLinearM || 0).toFixed(1)} م.ط</span>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">القطع</span>
                        <span className="text-xs font-bold text-indigo-400">{machine.totalPrintedPieces || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => onFilterOrdersByMachine(machine.id)}
                    className="text-xs text-blue-400 hover:underline font-semibold"
                  >
                    عرض أوامر هذه الماكينة
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openMachineModal(machine)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="تعديل الماكينة"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={async () => {
                          if (window.confirm('هل تريد حذف هذه الماكينة؟')) {
                            await deleteMachine(machine.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition"
                        title="حذف"
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

      {/* Tab 2: Materials */}
      {activeTab === 'materials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map(mat => {
            const isLowStock = (mat.stockQuantity || 0) <= (mat.minStockThreshold || 10);

            return (
              <div
                key={mat.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-950 text-purple-400 font-semibold border border-purple-500/20">
                      {mat.category || 'مواد خام'}
                    </span>

                    {isLowStock ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        نقص مخزون
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                        متوفر
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{mat.name}</h3>
                  <p className="text-xs text-slate-400">وحدة القياس: {mat.unit}</p>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-slate-500 block mb-0.5">تكلفة الشراء</span>
                      <span className="font-bold text-slate-200">{formatJOD(mat.costPerUnit)}</span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-slate-500 block mb-0.5">سعر البيع الافتراضي</span>
                      <span className="font-bold text-emerald-400">{formatJOD(mat.sellPricePerUnit)}</span>
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">الرصيد المتبقي بالمستودع:</span>
                    <span className={`text-base font-black ${isLowStock ? 'text-rose-400' : 'text-white'}`}>
                      {mat.stockQuantity} {mat.unit.split(' ')[0]}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => openMaterialModal(mat)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="تعديل المادة أو الكمية"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={async () => {
                        if (window.confirm('هل تريد حذف هذه المادة الخام؟')) {
                          await deleteMaterial(mat.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Machine Modal */}
      {isMachineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <button onClick={() => setIsMachineModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-white">
                {editingMachine ? 'تعديل بيانات الماكينة' : 'إضافة ماكينة طباعة جديدة'}
              </h3>
            </div>

            <form onSubmit={handleSaveMachine} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم الماكينة</label>
                <input
                  type="text"
                  required
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  placeholder="مثال: Roland Eco-Solvent 160"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">كود الماكينة</label>
                  <input
                    type="text"
                    value={mCode}
                    onChange={(e) => setMCode(e.target.value)}
                    placeholder="M-01"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">التقنية</label>
                  <input
                    type="text"
                    value={mType}
                    onChange={(e) => setMType(e.target.value)}
                    placeholder="UV Flatbed, Eco-Solvent..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">أقصى عرض (سم)</label>
                  <input
                    type="number"
                    value={mWidth}
                    onChange={(e) => setMWidth(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الحالة التشغيلية</label>
                  <select
                    value={mStatus}
                    onChange={(e) => setMStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                  >
                    <option value="active">تعمل بكفاءة</option>
                    <option value="maintenance">صيانة دورية</option>
                    <option value="idle">متوقفة مؤقتاً</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMachineModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Material Modal */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <button onClick={() => setIsMaterialModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-white">
                {editingMaterial ? 'تعديل المادة الخام' : 'إضافة مادة خام جديدة'}
              </h3>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم المادة الخام</label>
                <input
                  type="text"
                  required
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  placeholder="مثال: فليكس كوري 440g أو فينيل أبيض لامع"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">التصنيف</label>
                  <input
                    type="text"
                    value={matCat}
                    onChange={(e) => setMatCat(e.target.value)}
                    placeholder="بانر، لاصق، ألواح..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">وحدة القياس</label>
                  <select
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="متر مربع (م²)">متر مربع (م²)</option>
                    <option value="متر طولي (م.ط)">متر طولي (م.ط)</option>
                    <option value="قطعة / حبة">قطعة / حبة</option>
                    <option value="لوح (244*122)">لوح (244*122)</option>
                    <option value="رول كامل">رول كامل</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">سعر التكلفة (د.أ)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={matCost}
                    onChange={(e) => setMatCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">سعر البيع الأساسي (د.أ)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={matSell}
                    onChange={(e) => setMatSell(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الرصيد المتاح بالمستودع</label>
                  <input
                    type="number"
                    value={matStock}
                    onChange={(e) => setMatStock(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">حد تنبيه النقص</label>
                  <input
                    type="number"
                    value={matMin}
                    onChange={(e) => setMatMin(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
