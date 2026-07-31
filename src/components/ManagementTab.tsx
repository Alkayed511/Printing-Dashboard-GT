import React, { useState } from 'react';
import { ServerConfig, Department, Printer } from '../types';
import { Plus, Edit2, Trash2, Printer as PrinterIcon, LayoutDashboard, Save, X } from 'lucide-react';

interface ManagementTabProps {
  config: ServerConfig;
  onSaveConfig: (newConfig: ServerConfig) => void;
  language: 'ar' | 'en';
}

export const ManagementTab: React.FC<ManagementTabProps> = ({ config, onSaveConfig, language }) => {
  const [activeView, setActiveView] = useState<'departments' | 'printers'>('departments');
  const [departments, setDepartments] = useState<Department[]>(config.departments || []);
  const [printers, setPrinters] = useState<Printer[]>(config.printers || []);

  React.useEffect(() => {
    setDepartments(config.departments || []);
    setPrinters(config.printers || []);
  }, [config.departments, config.printers]);

  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'dept' | 'printer', id: string} | null>(null);

  const isAr = language === 'ar';

  const handleSaveConfig = (newDepts: Department[], newPrinters: Printer[]) => {
    onSaveConfig({ ...config, departments: newDepts, printers: newPrinters });
  };

  // Departments Handlers
  const handleAddDept = () => {
    setEditingDept({ id: `dept-${Date.now()}`, name: '' });
  };

  const handleSaveDept = () => {
    if (!editingDept || !editingDept.name.trim()) return;
    let newDepts;
    if (departments.some(d => d.id === editingDept.id)) {
      newDepts = departments.map(d => d.id === editingDept.id ? editingDept : d);
    } else {
      newDepts = [...departments, editingDept];
    }
    setDepartments(newDepts);
    handleSaveConfig(newDepts, printers);
    setEditingDept(null);
  };

  const handleDeleteDept = (id: string) => {
    setDeleteConfirm({ type: 'dept', id });
  };

  // Printers Handlers
  const handleAddPrinter = () => {
    setEditingPrinter({ id: `printer-${Date.now()}`, name: '', departmentId: departments[0]?.id || '' });
  };

  const handleSavePrinter = () => {
    if (!editingPrinter || !editingPrinter.name.trim() || !editingPrinter.departmentId) return;
    let newPrinters;
    if (printers.some(p => p.id === editingPrinter.id)) {
      newPrinters = printers.map(p => p.id === editingPrinter.id ? editingPrinter : p);
    } else {
      newPrinters = [...printers, editingPrinter];
    }
    setPrinters(newPrinters);
    handleSaveConfig(departments, newPrinters);
    setEditingPrinter(null);
  };

  const handleDeletePrinter = (id: string) => {
    setDeleteConfirm({ type: 'printer', id });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    
    if (deleteConfirm.type === 'dept') {
      const newDepts = departments.filter(d => d.id !== deleteConfirm.id);
      const newPrinters = printers.filter(p => p.departmentId !== deleteConfirm.id);
      setDepartments(newDepts);
      setPrinters(newPrinters);
      handleSaveConfig(newDepts, newPrinters);
    } else {
      const newPrinters = printers.filter(p => p.id !== deleteConfirm.id);
      setPrinters(newPrinters);
      handleSaveConfig(departments, newPrinters);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className={`max-w-5xl mx-auto p-4 sm:p-6 space-y-6 ${isAr ? 'dir-rtl' : 'dir-ltr'}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <LayoutDashboard className="w-7 h-7 text-secondary-400" />
          {isAr ? 'الإدارة' : 'Management'}
        </h2>
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveView('departments')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeView === 'departments' 
                ? 'bg-zinc-800 text-primary-300 shadow-sm border border-zinc-700' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            {isAr ? 'إدارة الأقسام' : 'Departments'}
          </button>
          <button
            onClick={() => setActiveView('printers')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeView === 'printers' 
                ? 'bg-zinc-800 text-primary-300 shadow-sm border border-zinc-700' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            {isAr ? 'إدارة الطابعات' : 'Printers'}
          </button>
        </div>
      </div>

      {activeView === 'departments' && (
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-100">{isAr ? 'الأقسام' : 'Departments'}</h3>
            <button
              onClick={handleAddDept}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {isAr ? 'إضافة قسم' : 'Add Department'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(dept => (
              <div key={dept.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-primary-400 transition-colors">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-100">{dept.name}</h4>
                    <span className="text-xs text-zinc-500">
                      {printers.filter(p => p.departmentId === dept.id).length} {isAr ? 'طابعات' : 'printers'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingDept(dept)} className="p-1.5 text-zinc-400 hover:text-primary-400 bg-zinc-900 hover:bg-zinc-800 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteDept(dept.id)} className="p-1.5 text-zinc-400 hover:text-rose-400 bg-zinc-900 hover:bg-zinc-800 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {departments.length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-500 text-sm">
                {isAr ? 'لا يوجد أقسام مضافة' : 'No departments added'}
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'printers' && (
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-100">{isAr ? 'الطابعات' : 'Printers'}</h3>
            <button
              onClick={handleAddPrinter}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm"
              disabled={departments.length === 0}
            >
              <Plus className="w-4 h-4" />
              {isAr ? 'إضافة طابعة' : 'Add Printer'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {printers.map(printer => {
              const dept = departments.find(d => d.id === printer.departmentId);
              return (
                <div key={printer.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col gap-3 group hover:border-zinc-700 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-emerald-400 transition-colors">
                        <PrinterIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-100">{printer.name}</h4>
                        <span className="text-xs text-zinc-500 font-mono">{printer.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingPrinter(printer)} className="p-1.5 text-zinc-400 hover:text-primary-400 bg-zinc-900 hover:bg-zinc-800 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeletePrinter(printer.id)} className="p-1.5 text-zinc-400 hover:text-rose-400 bg-zinc-900 hover:bg-zinc-800 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-zinc-900 py-1.5 px-3 rounded text-xs text-zinc-400 flex items-center justify-between">
                    <span>{isAr ? 'القسم المرتبط:' : 'Linked Dept:'}</span>
                    <span className="font-bold text-zinc-200">{dept?.name || 'غير محدد'}</span>
                  </div>
                </div>
              );
            })}
            {printers.length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-500 text-sm">
                {isAr ? 'لا يوجد طابعات مضافة' : 'No printers added'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editing Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="text-lg font-bold text-white">{isAr ? 'تفاصيل القسم' : 'Department Details'}</h3>
              <button onClick={() => setEditingDept(null)} className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">{isAr ? 'اسم القسم' : 'Department Name'}</label>
                <input
                  type="text"
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder={isAr ? 'مثال: قسم الطباعة الرقمية' : 'e.g. Digital Printing'}
                />
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-2">
              <button
                onClick={() => setEditingDept(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveDept}
                disabled={!editingDept.name.trim()}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Printer Modal */}
      {editingPrinter && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="text-lg font-bold text-white">{isAr ? 'تفاصيل الطابعة' : 'Printer Details'}</h3>
              <button onClick={() => setEditingPrinter(null)} className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">{isAr ? 'مُعرف الطابعة (مجلد الإدخال)' : 'Printer ID (Folder Name)'}</label>
                <input
                  type="text"
                  value={editingPrinter.id}
                  onChange={(e) => setEditingPrinter({ ...editingPrinter, id: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })}
                  disabled={printers.some(p => p.id === editingPrinter.id) && editingPrinter.id !== `printer-${Date.now()}`}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-60 dir-ltr font-mono text-left"
                  placeholder="e.g. eco1"
                />
                <p className="text-[10px] text-zinc-500">{isAr ? 'يستخدم لإنشاء المجلدات. أحرف إنجليزية وأرقام فقط.' : 'Used for folder creation. English letters and numbers only.'}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">{isAr ? 'اسم الطابعة المعروض' : 'Display Name'}</label>
                <input
                  type="text"
                  value={editingPrinter.name}
                  onChange={(e) => setEditingPrinter({ ...editingPrinter, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder={isAr ? 'مثال: طابعة إيكوسولفنت' : 'e.g. Eco Solvent'}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">{isAr ? 'القسم' : 'Department'}</label>
                <select
                  value={editingPrinter.departmentId}
                  onChange={(e) => setEditingPrinter({ ...editingPrinter, departmentId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="" disabled>{isAr ? 'اختر القسم' : 'Select Department'}</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-2">
              <button
                onClick={() => setEditingPrinter(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSavePrinter}
                disabled={!editingPrinter.name.trim() || !editingPrinter.departmentId || !editingPrinter.id.trim()}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="text-lg font-bold text-rose-500">{isAr ? 'تأكيد الحذف' : 'Confirm Deletion'}</h3>
              <button onClick={() => setDeleteConfirm(null)} className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <div className="mx-auto w-12 h-12 bg-rose-500/10 text-rose-500 flex items-center justify-center rounded-full mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <p className="text-sm text-zinc-300">
                {deleteConfirm.type === 'dept' 
                  ? (isAr ? 'هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع الطابعات المرتبطة به.' : 'Are you sure you want to delete this department? All linked printers will be deleted.')
                  : (isAr ? 'هل أنت متأكد من حذف هذه الطابعة؟' : 'Are you sure you want to delete this printer?')
                }
              </p>
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={confirmDelete}
                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
              >
                {isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
