import React, { useState } from 'react';
import {
  LayoutDashboard, KanbanSquare, Calculator, UsersRound, BarChart3, Radio,
  Settings2, Printer, Menu, X, ChevronLeft, ChevronRight, RefreshCcw,
  Download, SlidersHorizontal, BellRing, CircleCheck, Clock3, Layers3,
  Sparkles, ArrowUpLeft, Monitor, type LucideIcon
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { ServerConfig, PrintJob } from '../types';

export type WorkspaceTab = 'home' | 'kanban' | 'calculator' | 'customers' | 'stats' | 'management' | 'settings';
type Props = {
  enabled: boolean;
  activeTab: WorkspaceTab;
  onNavigate: (tab: WorkspaceTab) => void;
  config: ServerConfig;
  jobs: PrintJob[];
  pendingAlerts: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onChangeDepartment: () => void;
  myDepartment: string | null;
  advancedTools: ReactNode;
  children: ReactNode;
};

type NavGroup = { key: string; ar: string; en: string; items: Array<{tab:WorkspaceTab;ar:string;en:string;icon:LucideIcon}> };
const sections: NavGroup[] = [
  {key: 'main', ar:'مساحة العمل', en:'WORKSPACE', items:[
    {tab:'home', ar:'الرئيسية', en:'Overview', icon:LayoutDashboard},
    {tab:'kanban', ar:'الإنتاج والطباعة', en:'Production', icon:KanbanSquare},
    {tab:'calculator', ar:'حاسبة الطباعة', en:'Print calculator', icon:Calculator},
    {tab:'customers', ar:'العملاء والحسابات', en:'Customers & accounts', icon:UsersRound},
    {tab:'stats', ar:'التقارير والإحصائيات', en:'Reports & analytics', icon:BarChart3}
  ]},
  {key:'system', ar:'النظام', en:'SYSTEM', items:[
    {tab:'management', ar:'إدارة البث الصوتي', en:'Voice management', icon:Radio},
    {tab:'settings', ar:'الإعدادات', en:'Settings', icon:Settings2}
  ]}
];

const hints: Record<WorkspaceTab, {ar:string;en:string}> = {
  home:{ar:'كل ما تحتاجه لإدارة يوم العمل من مكان واحد',en:'Your print shop at a glance'},
  kanban:{ar:'تابع المهام والطابعات وحالة الطلبات مباشرة',en:'Track jobs, printers and order status'},
  calculator:{ar:'احسب الكميات والتكلفة وأنشئ عرض السعر',en:'Calculate, price and prepare a quotation'},
  customers:{ar:'العملاء والفواتير والدفعات في مكان واحد',en:'Customers, invoices and collections'},
  stats:{ar:'تعرّف على حجم العمل وأداء الإنتاج',en:'Understand production performance'},
  management:{ar:'التواصل الصوتي بين أقسام المطبعة',en:'Voice communication between departments'},
  settings:{ar:'خصّص المسارات والطابعات وإعدادات النظام',en:'Customize paths, printers and preferences'}
};

export default function ModernWorkspaceShell({
  enabled, activeTab, onNavigate, config, jobs, pendingAlerts,
  isRefreshing, onRefresh, onExport, onChangeDepartment, myDepartment,
  advancedTools, children
}: Props) {
  const [mobileOpen,setMobileOpen] = useState(false);
  const [toolsOpen,setToolsOpen] = useState(false);
  const isAr = config.language !== 'en';
  const tx = (ar:string,en:string) => isAr ? ar : en;
  if (!enabled) return <>{children}</>;

  const current = sections.flatMap(s=>s.items).find(x=>x.tab===activeTab);
  const total = jobs.length;
  const pending = jobs.filter(j=>j.status==='pending').length;
  const completed = total-pending;
  const progress = total ? Math.round(completed/total*100) : 0;
  const deptName = myDepartment === 'all'
    ? tx('كل الأقسام','All departments')
    : (config.departments||[]).find(d=>d.id===myDepartment)?.name || myDepartment || tx('اختر القسم','Select department');

  const navigate = (tab:WorkspaceTab) => {onNavigate(tab);setMobileOpen(false);setToolsOpen(false);};

  return (
    <div className="gt-shell" dir={isAr?'rtl':'ltr'}>
      {mobileOpen && <button type="button" className="gt-sidebar-scrim" aria-label={tx('إغلاق القائمة','Close menu')} onClick={()=>setMobileOpen(false)} />}
      <aside className={'gt-sidebar'+(mobileOpen?' gt-sidebar-open':'')} aria-label={tx('قائمة التنقل الرئيسية','Main navigation')}>
        <div className="gt-brand">
          <div className="gt-brand-icon"><Printer size={24} strokeWidth={2.2}/></div>
          <div className="gt-brand-copy"><strong>Golden Target</strong><span>{tx('إدارة المطبعة','PRINT MANAGEMENT')}</span></div>
          <button type="button" className="gt-sidebar-close" aria-label={tx('إغلاق القائمة','Close menu')} onClick={()=>setMobileOpen(false)}><X size={20}/></button>
        </div>
        <div className="gt-site-label"><span className="gt-status-dot"/>{tx('لوحة العمل','PRINT STUDIO')}<span className="gt-label-pill">GT</span></div>
        <div className="gt-sidebar-scroll">
          {sections.map(section=>(
            <div className="gt-nav-section" key={section.key}>
              <p className="gt-nav-label">{tx(section.ar,section.en)}</p>
              {section.items.map(({tab,ar,en,icon:Icon})=>(
                <button key={tab} type="button" className={'gt-nav-item'+(tab===activeTab?' gt-nav-active':'')}
                  aria-current={tab===activeTab?'page':undefined} onClick={()=>navigate(tab)}>
                  <Icon size={19} strokeWidth={1.9}/>
                  <span>{tx(ar,en)}</span>
                  {tab==='kanban' && pending>0 && <span className="gt-nav-count">{pending}</span>}
                </button>
              ))}
            </div>
          ))}
          <div className="gt-nav-bottom-card">
            <span className="gt-nav-bottom-icon"><Sparkles size={17}/></span>
            <strong>{tx('أنشئ تسعيرة أسرع','Quote faster')}</strong>
            <p>{tx('من المقاسات إلى عرض السعر بخطوات قليلة','From measurements to quotation in a few steps')}</p>
            <button type="button" onClick={()=>navigate('calculator')}>{tx('ابدأ الحساب','Start calculation')} <ArrowUpLeft size={14}/></button>
          </div>
        </div>
        <button type="button" className="gt-department-button" onClick={onChangeDepartment} title={tx('تغيير القسم','Change department')}>
          <Monitor size={18}/><span className="gt-department-copy"><small>{tx('القسم النشط','ACTIVE DEPARTMENT')}</small><strong>{deptName}</strong></span>
          {isAr?<ChevronLeft size={16}/>:<ChevronRight size={16}/>}
        </button>
      </aside>

      <div className="gt-frame">
        <header className="gt-topbar">
          <div className="gt-heading">
            <button type="button" className="gt-icon-button gt-mobile-menu" aria-label={tx('فتح القائمة','Open menu')} aria-expanded={mobileOpen} onClick={()=>setMobileOpen(true)}><Menu size={22}/></button>
            <div>
              <div className="gt-breadcrumb">{tx('Golden Target / مساحة العمل','Golden Target / Workspace')} <span>/</span> {tx(current?.ar||'الرئيسية',current?.en||'Overview')}</div>
              <h1>{tx(current?.ar||'الرئيسية',current?.en||'Overview')}</h1>
              <p>{tx(hints[activeTab].ar,hints[activeTab].en)}</p>
            </div>
          </div>
          <div className="gt-header-actions">
            <div className="gt-workdate" title={tx('تاريخ مجلد الإنتاج','Production folder date')}><Clock3 size={16}/><span>{config.currentDate}</span></div>
            <button type="button" className="gt-icon-button" onClick={onRefresh} disabled={isRefreshing} title={tx('تحديث البيانات','Refresh')} aria-label={tx('تحديث البيانات','Refresh')}>
              <RefreshCcw size={18} className={isRefreshing?'animate-spin':''}/></button>
            <button type="button" className="gt-icon-button gt-header-export" onClick={onExport} title={tx('تصدير تقرير','Export report')} aria-label={tx('تصدير تقرير','Export report')}><Download size={18}/></button>
            <button type="button" className={'gt-icon-button gt-tools-toggle'+(toolsOpen?' gt-tools-active':'')} onClick={()=>setToolsOpen(v=>!v)} aria-expanded={toolsOpen} title={tx('أدوات إضافية وتنبيهات','Advanced tools & notifications')} aria-label={tx('أدوات إضافية وتنبيهات','Advanced tools & notifications')}>
              {pendingAlerts>0?<BellRing size={18}/>:<SlidersHorizontal size={18}/>}
              {pendingAlerts>0&&<span className="gt-alert-count">{pendingAlerts}</span>}
            </button>
            <button type="button" className="gt-main-action" onClick={()=>navigate('calculator')}><Calculator size={17}/><span>{tx('حساب جديد','New quote')}</span></button>
          </div>
        </header>

        {toolsOpen && <section className="gt-advanced-tools" aria-label={tx('أدوات متقدمة','Advanced tools')}>
          <div className="gt-advanced-heading"><strong><SlidersHorizontal size={16}/>{tx('أدوات الإنتاج والتنبيهات','Production tools & notifications')}</strong><button type="button" onClick={()=>setToolsOpen(false)} aria-label={tx('إغلاق','Close')}><X size={18}/></button></div>
          <div className="gt-legacy-nav">{advancedTools}</div>
        </section>}

        <div className="gt-insight-strip">
          <div className="gt-insight"><span className="gt-insight-icon gt-blue"><Layers3 size={18}/></span><div><small>{tx('إجمالي الأوامر','Total jobs')}</small><strong>{total}</strong></div></div>
          <div className="gt-insight"><span className="gt-insight-icon gt-amber"><Clock3 size={18}/></span><div><small>{tx('بانتظار الإنجاز','In progress')}</small><strong>{pending}</strong></div></div>
          <div className="gt-insight"><span className="gt-insight-icon gt-green"><CircleCheck size={18}/></span><div><small>{tx('مكتملة','Completed')}</small><strong>{completed}</strong></div></div>
          <div className="gt-insight gt-progress-insight"><div><small>{tx('نسبة الإنجاز','Completion')}</small><strong>{progress}%</strong></div><div className="gt-mini-progress"><span style={{width:progress+'%'}}/></div></div>
        </div>
        <div className="gt-page">{children}</div>
      </div>
    </div>
  );
}
