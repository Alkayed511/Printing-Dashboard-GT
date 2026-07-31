import React from 'react';
import { ServerConfig, Department } from '../types';
import { LayoutDashboard, LogIn, MonitorSmartphone, Printer as PrinterIcon } from 'lucide-react';

interface DepartmentSelectorProps {
  onSelect: (deptId: string | 'all') => void;
  language: 'ar' | 'en';
  config: ServerConfig;
}

export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({ onSelect, language, config }) => {
  const departments = config.departments || [];
  
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8">
        
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-full mb-2">
            <MonitorSmartphone className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {language === 'ar' ? 'حدد قسمك للبدء' : 'Select Your Department'}
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto leading-relaxed text-sm">
            {language === 'ar' 
              ? 'سيتم تخصيص واجهة التطبيق لتلائم هذا الجهاز ولن يظهر لك سوى الملفات المخصصة لقسمك.' 
              : 'The interface will be customized for this device. You will only see files assigned to your department.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Admin / All Departments Option */}
          <button
            onClick={() => onSelect('all')}
            className="group relative bg-zinc-900 border border-zinc-800 hover:border-emerald-500 rounded-2xl p-6 text-center transition-all hover:bg-zinc-800/80 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 group-hover:opacity-100 opacity-0 transition-opacity" />
            <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <LayoutDashboard className="w-6 h-6 text-zinc-300 group-hover:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-1">
              {language === 'ar' ? 'الإدارة (جميع الأقسام)' : 'Management (All)'}
            </h3>
            <p className="text-xs text-zinc-500">
              {language === 'ar' ? 'عرض كل الملفات' : 'View all files'}
            </p>
          </button>

          {/* Individual Departments */}
          {departments.map((dept) => {
            const deptPrinters = (config.printers || []).filter(p => p.departmentId === dept.id);
            return (
              <button
                key={dept.id}
                onClick={() => onSelect(dept.id)}
                className="group relative bg-zinc-900 border border-zinc-800 hover:border-emerald-500 rounded-2xl p-6 text-center transition-all hover:bg-zinc-800/80 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 group-hover:opacity-100 opacity-0 transition-opacity" />
                <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <PrinterIcon className="w-6 h-6 text-zinc-300 group-hover:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-1">
                  {dept.name}
                </h3>
                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                  {deptPrinters.length > 0 ? deptPrinters.map(p => p.name).join(' • ') : (language === 'ar' ? 'لا يوجد طابعات' : 'No printers')}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
