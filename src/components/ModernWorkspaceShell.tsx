import React, {useEffect, useRef, useState, type ReactNode} from 'react';
import {LayoutDashboard, KanbanSquare, UsersRound, BarChart3, MessageCircle, ClipboardList, Settings2, Printer, Menu, X, ChevronLeft, ChevronRight, RefreshCcw, Download, Bell, BellRing, Search, Monitor, LogOut, Wifi, WifiOff, ArrowUpLeft, Palette, type LucideIcon} from 'lucide-react';
import type {ServerConfig, PrintJob} from '../types';
import WorkspaceSearch from './WorkspaceSearch';
import NotificationCenter from './NotificationCenter';
import {useBranding} from './BrandingProvider';
import BrandMark from './BrandMark';

export type WorkspaceTab = 'home' | 'kanban' | 'customers' | 'intake' | 'ledger' | 'stats' | 'management' | 'settings';
type Props = {
  enabled: boolean; activeTab: WorkspaceTab; onNavigate: (tab: WorkspaceTab) => void;
  config: ServerConfig; jobs: PrintJob[]; pendingAlerts: number; isRefreshing: boolean;
  onRefresh: () => void; onExport: () => void; onChangeDepartment: () => void;
  onSelectJob: (job: PrintJob) => void; myDepartment: string | null;
  children: ReactNode; lastSynced: Date | null; connectionError: string;
  alerts: PrintJob[]; onDismissAlerts: () => void; onOpenAppearance: () => void; onOpenNotificationSettings: () => void;
  onBeforeLogout: () => boolean;
};
type NavItem = {tab: WorkspaceTab; ar: string; en: string; icon: LucideIcon};
const sections: {ar: string; en: string; items: NavItem[]}[] = [
  {ar: 'مساحة العمل', en: 'WORKSPACE', items: [
    {tab: 'home', ar: 'نظرة عامة', en: 'Overview', icon: LayoutDashboard},
    {tab: 'kanban', ar: 'الإنتاج والطباعة', en: 'Production', icon: KanbanSquare},
    {tab: 'intake', ar: 'الطلبات والتصاميم', en: 'Design requests', icon: MessageCircle},
    {tab: 'ledger', ar: 'سجل ملفات الطباعة', en: 'Print file ledger', icon: ClipboardList},
  ]},
  {ar: 'إدارة المطبعة', en: 'MANAGEMENT', items: [
    {tab: 'customers', ar: 'العملاء والحسابات', en: 'Customers & accounts', icon: UsersRound},
    {tab: 'stats', ar: 'التقارير والإحصائيات', en: 'Reports & analytics', icon: BarChart3},
    {tab: 'management', ar: 'الأقسام والطابعات', en: 'Departments & printers', icon: Printer},
    {tab: 'settings', ar: 'الإعدادات', en: 'Settings', icon: Settings2},
  ]},
];
const hints: Record<WorkspaceTab, [string, string]> = {
  home: ['كل ما تحتاجه ليوم عمل منظّم', 'Everything you need for a productive day'],
  kanban: ['ملفاتك، طابعاتك، والخطوة التالية لكل طلب', 'Your files, printers, and next steps'],
  intake: ['من استلام التصميم إلى جاهزيته للإنتاج', 'From the first design to production readiness'],
  ledger: ['سجل واضح للملفات والكميات والمستحقات', 'Files, quantities, and balances in one place'],
  customers: ['علاقات العملاء، عروض الأسعار، والفواتير', 'Customers, quotes, invoices, and payments'],
  stats: ['اقرأ أداء الإنتاج واتخذ خطوتك التالية', 'Understand production and plan your next step'],
  management: ['نظّم الأقسام والطابعات والتواصل الصوتي', 'Organize departments, printers, and voice communication'],
  settings: ['إعدادات واضحة تناسب طريقة عملك', 'Preferences that fit the way you work'],
};

export default function ModernWorkspaceShell({enabled, activeTab, onNavigate, config, jobs, pendingAlerts, isRefreshing, onRefresh, onExport, onChangeDepartment, onSelectJob, myDepartment, children, lastSynced, connectionError, onBeforeLogout, alerts, onDismissAlerts, onOpenAppearance, onOpenNotificationSettings}: Props) {
  const {branding} = useBranding();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const isAr = config.language !== 'en';
  const tx = (ar: string, en: string) => isAr ? ar : en;
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const update = () => {setIsMobile(media.matches); if (!media.matches) setMobileOpen(false);};
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {if (mobileOpen) closeButton.current?.focus();}, [mobileOpen]);
  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && enabled) {event.preventDefault(); setSearchOpen(value => !value);}
      if (event.key === 'Escape') {setMobileOpen(false); setToolsOpen(false); menuButton.current?.focus();}
    };
    window.addEventListener('online', updateOnline); window.addEventListener('offline', updateOnline); window.addEventListener('keydown', onKey);
    return () => {window.removeEventListener('online', updateOnline); window.removeEventListener('offline', updateOnline); window.removeEventListener('keydown', onKey);};
  }, [enabled]);
  if (!enabled) return <>{children}</>;
  const current = sections.flatMap(section => section.items).find(item => item.tab === activeTab)!;
  const pending = jobs.filter(job => job.status === 'pending').length;
  const connected = online && !connectionError;
  const department = myDepartment === 'all' ? tx('جميع الأقسام', 'All departments') : config.departments?.find(item => item.id === myDepartment)?.name || tx('اختر القسم', 'Select department');
  const navigate = (tab: WorkspaceTab) => {onNavigate(tab); setMobileOpen(false); setToolsOpen(false);};
  const logout = async () => {
    if (loggingOut) return;
    if (!onBeforeLogout()) return;
    setLoggingOut(true); setLogoutError('');
    try {
      const response = await fetch('/api/management/logout', {method: 'POST', credentials: 'same-origin'});
      if (!response.ok) throw new Error();
      window.location.reload();
    } catch {setLoggingOut(false); setLogoutError(tx('تعذّر تسجيل الخروج. حاول مجددًا.', 'Unable to sign out. Try again.'));}
  };
  return <div className="gt-shell gt-workspace-v2" dir={isAr ? 'rtl' : 'ltr'}>
    <a href="#gt-workspace-content" className="gt-skip-link">{tx('انتقل إلى المحتوى', 'Skip to content')}</a>
    {mobileOpen && <button type="button" className="gt-sidebar-scrim" aria-label={tx('إغلاق القائمة', 'Close menu')} onClick={() => setMobileOpen(false)}/>}
    <aside id="gt-sidebar" inert={isMobile && !mobileOpen} role={isMobile && mobileOpen ? 'dialog' : undefined} aria-modal={isMobile && mobileOpen ? true : undefined} className={'gt-sidebar' + (mobileOpen ? ' gt-sidebar-open' : '')} aria-label={tx('التنقل الرئيسي', 'Main navigation')}>
      <button type="button" className="gt-brand" onClick={() => navigate('home')} aria-label={branding.name}><BrandMark branding={branding}/><span className="gt-brand-copy"><strong>{branding.name}</strong><span>{branding.tagline}</span></span></button>
      <button ref={closeButton} type="button" className="gt-sidebar-close" aria-label={tx('إغلاق القائمة', 'Close menu')} onClick={() => {setMobileOpen(false); menuButton.current?.focus();}}><X size={20}/></button>
      <button type="button" className="gt-sidebar-search" onClick={() => {setMobileOpen(false); setSearchOpen(true);}}><Search size={17}/><span>{tx('بحث سريع', 'Quick search')}</span><kbd>Ctrl K</kbd></button>
      <nav className="gt-sidebar-scroll">{sections.map(section => <div className="gt-nav-section" key={section.en}><p className="gt-nav-label">{tx(section.ar, section.en)}</p>{section.items.map(({tab, ar, en, icon: Icon}) => <button type="button" key={tab} className={'gt-nav-item' + (tab === activeTab ? ' gt-nav-active' : '')} aria-current={tab === activeTab ? 'page' : undefined} onClick={() => navigate(tab)}><Icon size={19} strokeWidth={1.7}/><span>{tx(ar, en)}</span>{tab === 'kanban' && pending > 0 && <span className="gt-nav-count">{pending}</span>}</button>)}</div>)}<div className="gt-sidebar-note"><span className="gt-status-dot"/><strong>{tx('مساحة واحدة. عمل أوضح.', 'One workspace. Clearer work.')}</strong><p>{tx('من أول تصميم إلى آخر ملف مطبوع.', 'From the first design to the final print.')}</p><button type="button" onClick={() => navigate('intake')}>{tx('افتح الطلبات', 'Open requests')}<ArrowUpLeft size={15}/></button></div></nav>
      <button type="button" className="gt-department-button" onClick={onChangeDepartment}><Monitor size={19}/><span className="gt-department-copy"><small>{tx('مساحة هذا الجهاز', 'THIS DEVICE')}</small><strong>{department}</strong></span>{isAr ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}</button>
      <div className="gt-account"><span className="gt-account-avatar">{branding.name.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase()}</span><span><strong>{tx('مدير المطبعة', 'Print administrator')}</strong><small>{tx('جلسة آمنة', 'Secure session')}</small></span><button type="button" onClick={logout} disabled={loggingOut} aria-label={tx('تسجيل الخروج', 'Sign out')} title={tx('تسجيل الخروج', 'Sign out')}><LogOut size={18}/></button></div>{logoutError && <p className="gt-inline-error" role="alert">{logoutError}</p>}
    </aside>
    <div className="gt-frame" inert={isMobile && mobileOpen}>
      <header className="gt-topbar"><div className="gt-heading"><button ref={menuButton} type="button" className="gt-icon-button gt-mobile-menu" aria-label={tx('فتح القائمة', 'Open menu')} aria-controls="gt-sidebar" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={21}/></button><div><div className="gt-breadcrumb">{tx('مساحة العمل', 'Workspace')}<span>/</span>{tx(current.ar, current.en)}</div><h1>{tx(current.ar, current.en)}</h1><p>{tx(...hints[activeTab])}</p></div></div>
        <div className="gt-header-actions"><button type="button" className="gt-icon-button" onClick={() => setSearchOpen(true)} aria-label={tx('البحث', 'Search')} title={tx('بحث سريع · Ctrl K', 'Quick search · Ctrl K')}><Search size={18}/></button><button type="button" className="gt-icon-button" onClick={onRefresh} disabled={isRefreshing} title={tx('تحديث البيانات', 'Refresh data')} aria-label={tx('تحديث البيانات', 'Refresh data')}><RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''}/></button><button type="button" className="gt-icon-button gt-header-export" onClick={onExport} aria-label={tx('تصدير تقرير', 'Export report')} title={tx('تصدير تقرير', 'Export report')}><Download size={18}/></button><button type="button" className={'gt-icon-button' + (toolsOpen ? ' gt-tools-active' : '')} aria-expanded={toolsOpen} onClick={() => setToolsOpen(value => !value)} title={tx('التنبيهات', 'Notifications')} aria-label={tx('التنبيهات', 'Notifications')}>{pendingAlerts ? <BellRing size={18}/> : <Bell size={18}/>} {pendingAlerts > 0 && <span className="gt-alert-count">{pendingAlerts}</span>}</button><button type="button" className="gt-icon-button gt-appearance-shortcut" onClick={onOpenAppearance} aria-label={tx('تخصيص المظهر','Customize appearance')} title={tx('تخصيص المظهر','Customize appearance')}><Palette size={18}/></button><button type="button" className="gt-main-action" onClick={() => navigate('intake')}><MessageCircle size={17}/><span>{tx('طلبات التصميم', 'Design requests')}</span></button></div>
      </header>
      <div className="gt-workspace-status"><div className={connected ? 'gt-connection gt-connected' : 'gt-connection gt-disconnected'} role="status">{connected ? <Wifi size={14}/> : <WifiOff size={14}/>}<span>{connected ? tx('متصل بالخادم', 'Connected to server') : tx('الاتصال يحتاج متابعة', 'Connection needs attention')}</span>{lastSynced && <small>{tx('آخر تحديث', 'Last updated')} {lastSynced.toLocaleTimeString(isAr ? 'ar-JO' : 'en-GB', {hour: '2-digit', minute: '2-digit'})}</small>}</div><button type="button" className="gt-date-chip" onClick={() => navigate('settings')}>{tx('تاريخ العمل', 'Work date')}<strong dir="ltr">{config.currentDate}</strong></button></div>
      {connectionError && <div className="gt-connection-banner" role="alert"><WifiOff size={17}/><span>{connectionError}</span><button type="button" onClick={onRefresh}>{tx('إعادة المحاولة', 'Retry')}</button></div>}
      <NotificationCenter open={toolsOpen} onClose={()=>setToolsOpen(false)} alerts={alerts} onReadAll={onDismissAlerts} onSelect={onSelectJob} onSettings={onOpenNotificationSettings} isAr={isAr}/>
      <div className="gt-page" id="gt-workspace-content" tabIndex={-1}>{children}</div><nav className="gt-mobile-bottom" aria-label={tx('تنقل سريع', 'Quick navigation')}>{[sections[0].items[0], sections[0].items[1], sections[1].items[0], sections[1].items[3]].map(({tab, ar, en, icon: Icon}) => <button type="button" key={tab} aria-current={tab === activeTab ? 'page' : undefined} onClick={() => navigate(tab)}><Icon size={19}/><span>{tx(ar, en)}</span></button>)}</nav>
    </div>
    <WorkspaceSearch open={searchOpen} onClose={() => setSearchOpen(false)} jobs={jobs} destinations={sections.flatMap(section => section.items).map(item => ({tab: item.tab, label: tx(item.ar, item.en)}))} onNavigate={navigate} onSelectJob={onSelectJob} isAr={isAr}/>
  </div>;
}
