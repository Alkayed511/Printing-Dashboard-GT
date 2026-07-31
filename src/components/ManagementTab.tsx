import React, { useState } from 'react';
import { ServerConfig, Department, Printer } from '../types';
import { Plus, Edit2, Trash2, Printer as PrinterIcon, LayoutDashboard, Save, X, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface ManagementTabProps {
  config: ServerConfig;
  onSaveConfig: (newConfig: ServerConfig) => void;
  language: 'ar' | 'en';
}

export const ManagementTab: React.FC<ManagementTabProps> = ({ config, onSaveConfig, language }) => {
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

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceDeptId = source.droppableId;
    const destDeptId = destination.droppableId;

    const newPrinters = [...printers];
    const printersByDept: Record<string, Printer[]> = {};
    departments.forEach(d => {
      printersByDept[d.id] = newPrinters.filter(p => p.departmentId === d.id);
    });

    const [removed] = printersByDept[sourceDeptId].splice(source.index, 1);
    removed.departmentId = destDeptId;
    printersByDept[destDeptId].splice(destination.index, 0, removed);

    const finalPrinters: Printer[] = [];
    departments.forEach(d => {
      finalPrinters.push(...printersByDept[d.id]);
    });
    
    const orphans = newPrinters.filter(p => !departments.find(d => d.id === p.departmentId));
    finalPrinters.push(...orphans);

    setPrinters(finalPrinters);
    handleSaveConfig(departments, finalPrinters);
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
          {isAr ? 'إدارة الأقسام والطابعات' : 'Departments & Printers Management'}
        </h2>
        <button
          onClick={handleAddDept}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          {isAr ? 'إضافة قسم جديد' : 'Add New Department'}
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departments.map(dept => {
            const deptPrinters = printers.filter(p => p.departmentId === dept.id);
            return (
              <div key={dept.id} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 flex flex-col gap-4 shadow-sm hover:border-zinc-700 transition-all">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-primary-400">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{dept.name}</h3>
                      <p className="text-xs text-zinc-500">
                        {deptPrinters.length} {isAr ? 'طابعات مسجلة' : 'registered printers'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingDept(dept)} className="p-2 text-zinc-400 hover:text-primary-400 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteDept(dept.id)} className="p-2 text-zinc-400 hover:text-rose-400 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Droppable droppableId={dept.id}>
                  {(provided) => (
                    <div 
                      className="flex-1 space-y-3 min-h-[100px]"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {deptPrinters.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {deptPrinters.map((printer, index) => (
                            <Draggable key={printer.id} draggableId={printer.id} index={index}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`bg-zinc-950 p-3 rounded-xl border ${snapshot.isDragging ? 'border-primary-500 shadow-lg' : 'border-zinc-800'} flex items-center justify-between group hover:border-zinc-700 transition-all`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div 
                                      {...provided.dragHandleProps}
                                      className="p-1 text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing transition-colors"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="p-1.5 bg-zinc-900 rounded-md text-zinc-400 group-hover:text-emerald-400 transition-colors">
                                      <PrinterIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-sm text-zinc-200">{printer.name}</h4>
                                      <span className="text-[10px] text-zinc-500 font-mono">{printer.id}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingPrinter(printer)} className="p-1.5 text-zinc-400 hover:text-primary-400 hover:bg-zinc-900 rounded-md transition-colors">
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDeletePrinter(printer.id)} className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-md transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      ) : (
                        <div className="py-6 h-full flex items-center justify-center text-zinc-600 text-sm bg-zinc-950/50 rounded-xl border border-zinc-800/50 border-dashed">
                          {isAr ? 'لا توجد طابعات في هذا القسم' : 'No printers in this department'}
                          {provided.placeholder}
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>

                <button
                  onClick={() => {
                    setEditingPrinter({ id: `printer-${Date.now()}`, name: '', departmentId: dept.id });
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white px-3 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm group"
                >
                  <Plus className="w-4 h-4 text-zinc-500 group-hover:text-primary-400 transition-colors" />
                  {isAr ? 'إضافة طابعة للقسم' : 'Add Printer to Department'}
                </button>
              </div>
            );
          })}

          {departments.length === 0 && (
            <div className="col-span-full py-16 text-center bg-zinc-900/30 rounded-2xl border border-zinc-800/50 border-dashed flex flex-col items-center gap-3">
              <LayoutDashboard className="w-12 h-12 text-zinc-700" />
              <p className="text-zinc-500 font-medium">
                {isAr ? 'لم يتم إضافة أي أقسام بعد. ابدأ بإضافة قسم جديد.' : 'No departments added yet. Start by adding a new department.'}
              </p>
            </div>
          )}
        </div>
      </DragDropContext>

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
