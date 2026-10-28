import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, User, ShieldAlert, Key, Check, Users } from 'lucide-react';
import { UserProfile, UserRole } from '../../types/printManager';
import { listenToUsers, updateUserRole } from '../../firebase/services';
import { useAuth } from '../../context/AuthContext';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { userProfile, isAdmin, simulationRole, setSimulationRole } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = listenToUsers((list) => {
      setUsers(list);
      setLoading(false);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRoleToggle = async (targetUid: string, currentRole: UserRole) => {
    if (!isAdmin) return;
    const nextRole: UserRole = currentRole === 'admin' ? 'employee' : 'admin';
    try {
      await updateUserRole(targetUid, nextRole);
    } catch (e) {
      console.error('Update role error:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden my-8 text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">إدارة الموظفين والصلاحيات (RBAC)</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Role Simulation Switch for Testing */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-200 block">محاكاة واختبار الصلاحيات للمعاينة:</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                يمكنك التبديل مؤقتاً بين وضع المدير (Admin) والموظف (Employee) لمعاينة واجهات النظام
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSimulationRole(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  simulationRole === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                الافتراضي ({userProfile?.role || 'employee'})
              </button>
              <button
                onClick={() => setSimulationRole('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  simulationRole === 'admin'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                مدير (Admin)
              </button>
              <button
                onClick={() => setSimulationRole('employee')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  simulationRole === 'employee'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                موظف (Employee)
              </button>
            </div>
          </div>

          {/* Staff Accounts List */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              المستخدمين المسجلين في النظام ({users.length})
            </h3>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">جارٍ تحميل قائمة الموظفين...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                لا يوجد موظفين مسجلين حالياً. سيظهر أي مستخدم يسجل دخوله بحساب Google هنا تلقائياً.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {users.map(u => (
                  <div
                    key={u.uid}
                    className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                        {u.displayName?.[0] || u.email?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{u.displayName}</span>
                          {u.uid === userProfile?.uid && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300">أنت</span>
                          )}
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">{u.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        u.role === 'admin'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role === 'admin' ? 'مدير نظام (Admin)' : 'موظف مطبعة (Employee)'}
                      </span>

                      {isAdmin && (
                        <button
                          onClick={() => handleRoleToggle(u.uid, u.role)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                        >
                          تغيير إلى {u.role === 'admin' ? 'موظف' : 'مدير'}
                        </button>
                      )}
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
