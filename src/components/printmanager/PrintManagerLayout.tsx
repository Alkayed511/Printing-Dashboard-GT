import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Users,
  CreditCard,
  Printer,
  BarChart3,
  Kanban,
  ShieldCheck,
  Building,
  LogOut,
  LogIn,
  Menu,
  X,
  Smartphone,
  ChevronDown,
  UserCheck,
  User as UserIcon,
  Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { OfflineIndicator } from '../pwa/OfflineIndicator';

export type MainTabType =
  | 'dashboard'
  | 'orders'
  | 'print_logs'
  | 'machines'
  | 'customers'
  | 'reports'
  | 'kanban'
  | 'settings';

interface PrintManagerLayoutProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  pendingOrdersCount?: number;
  openStaffModal: () => void;
  openCompanySettingsModal: () => void;
  children: React.ReactNode;
}

export const PrintManagerLayout: React.FC<PrintManagerLayoutProps> = ({
  activeTab,
  onTabChange,
  pendingOrdersCount = 0,
  openStaffModal,
  openCompanySettingsModal,
  children,
}) => {
  const { currentUser, userProfile, isAdmin, role, signInWithGoogle, signOut, simulationRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as MainTabType, label: 'لوحة التحكم والتشغيل', icon: LayoutDashboard },
    { id: 'orders' as MainTabType, label: 'أوامر الطباعة والإنتاج', icon: Layers, badge: pendingOrdersCount },
    { id: 'print_logs' as MainTabType, label: 'سجل كميات الطباعة', icon: Printer },
    { id: 'machines' as MainTabType, label: 'الماكينات والمواد', icon: Cpu },
    { id: 'customers' as MainTabType, label: 'العملاء والجهات', icon: Users },
    { id: 'reports' as MainTabType, label: 'تقارير الكميات والهادر', icon: BarChart3 },
    { id: 'kanban' as MainTabType, label: 'شاشة الإنتاج (الكانبان)', icon: Kanban },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased" style={{ direction: 'rtl' }}>
      <OfflineIndicator />

      {/* Role simulation warning banner if active */}
      {simulationRole && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-purple-600 text-white text-xs font-bold py-1 px-4 text-center shadow-md flex items-center justify-center gap-2">
          <span>وضع محاكاة الصلاحيات مفعّل: تصفح كـ {simulationRole === 'admin' ? 'مدير (Admin)' : 'موظف (Employee)'}</span>
          <button onClick={openStaffModal} className="underline text-purple-200 hover:text-white">تغيير</button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 bg-slate-900 border-l border-slate-800 flex-shrink-0 min-h-screen ${simulationRole ? 'pt-7' : ''}`}>
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">Print Manager</h2>
              <span className="text-[11px] text-blue-400 font-semibold block">تسجيل ومتابعة كميات الطباعة</span>
            </div>
          </div>
        </div>

        {/* User Account / Sign In Widget */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs">
          {currentUser ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {userProfile?.displayName?.[0] || 'U'}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-200 block truncate">{userProfile?.displayName}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{userProfile?.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  role === 'admin'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {role === 'admin' ? 'مدير نظام (Admin)' : 'موظف مطبعة (Employee)'}
                </span>

                <button
                  onClick={signOut}
                  className="text-slate-400 hover:text-rose-400 p-1 rounded-lg transition"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-slate-400 text-[11px]">مرحباً بك! سجل الدخول لمزامنة البيانات السحابية</p>
              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل الدخول بحساب Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && item.badge > 0 ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* System Settings & Staff Buttons */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {isAdmin && (
            <button
              onClick={openStaffModal}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>إدارة الموظفين والأدوار</span>
            </button>
          )}

          <button
            onClick={openCompanySettingsModal}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <Building className="w-4 h-4 text-blue-400" />
            <span>بيانات وترويسة المطبعة</span>
          </button>

          <div className="pt-2">
            <PWAInstallButton />
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className={`md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-40 ${simulationRole ? 'mt-6' : ''}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-tight">Print Manager</h1>
            <span className="text-[10px] text-blue-400 font-medium">مدير المطبعة</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />

          {!currentUser ? (
            <button
              onClick={signInWithGoogle}
              className="p-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>دخول</span>
            </button>
          ) : (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile Dropdown Menu for Settings / Staff */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">{userProfile?.displayName}</span>
              <span className="text-[10px] text-slate-400">{userProfile?.email}</span>
            </div>
            <button onClick={signOut} className="text-rose-400 font-semibold">خروج</button>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openStaffModal();
              }}
              className="w-full text-right py-2 px-3 rounded-lg bg-slate-800/80 text-purple-300 font-semibold flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>إدارة الموظفين والصلاحيات</span>
            </button>
          )}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              openCompanySettingsModal();
            }}
            className="w-full text-right py-2 px-3 rounded-lg bg-slate-800/80 text-blue-300 font-semibold flex items-center gap-2"
          >
            <Building className="w-4 h-4" />
            <span>بيانات وترويسة المطبعة وأمر الإنتاج</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-1 px-2 flex items-center justify-around shadow-2xl">
        {navItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all relative ${
                isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-blue-400 scale-110' : 'text-slate-400'}`} />
              <span className="truncate max-w-[60px]">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              ) : null}
            </button>
          );
        })}

        {/* More Tab for remaining options */}
        <button
          onClick={() => onTabChange(activeTab === 'reports' ? 'kanban' : 'reports')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all ${
            activeTab === 'reports' || activeTab === 'kanban' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span>المزيد</span>
        </button>
      </nav>
    </div>
  );
};
