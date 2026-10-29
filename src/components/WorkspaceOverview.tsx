import React, {useMemo} from 'react';
import { Activity, ArrowUpLeft, BarChart3, Calculator, CheckCheck, Clock3, FileClock, Printer, UsersRound } from 'lucide-react';
import type {PrintJob, ServerConfig} from '../types';
import type {WorkspaceTab} from './ModernWorkspaceShell';

type Props = {
  jobs: PrintJob[];
  config: ServerConfig;
  onNavigate: (tab: WorkspaceTab) => void;
  onSelectJob: (job: PrintJob) => void;
};

const dayLabel = (iso:string,lang:string) => {
  const d=new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(lang==='ar'?'ar-JO':'en-GB',{day:'numeric',month:'short'});
};

export default function WorkspaceOverview({jobs,config,onNavigate,onSelectJob}:Props){
  const isAr=config.language!=='en';
  const tx=(ar:string,en:string)=>isAr?ar:en;
  const pending=jobs.filter(j=>j.status==='pending');
  const done=jobs.filter(j=>j.status==='done');
  const completion=jobs.length?Math.round(done.length/jobs.length*100):0;
  const recent=useMemo(()=>[...jobs].sort((a,b)=>new Date(b.updatedAt||b.createdAt).getTime()-new Date(a.updatedAt||a.createdAt).getTime()).slice(0,7),[jobs]);
  const printers=useMemo(()=> {
    const counts=new Map<string,{total:number;pending:number;done:number}>();
    (config.printers||[]).forEach(p=>counts.set(p.id,{total:0,pending:0,done:0}));
    jobs.forEach(j=>{const curr=counts.get(j.printer)||{total:0,pending:0,done:0};curr.total++;curr[j.status==='done'?'done':'pending']++;counts.set(j.printer,curr);});
    return [...counts.entries()].sort((a,b)=>b[1].pending-a[1].pending).slice(0,6);
  },[jobs,config.printers]);
  return <div className="gt-overview" dir={isAr?'rtl':'ltr'}>
    <section className="gt-overview-hero">
      <div className="gt-hero-copy">
        <span className="gt-hero-eyebrow"><Activity size={14}/>{tx('ملخّص يوم العمل','YOUR DAILY WORKSPACE')}</span>
        <h2>{tx('كل أعمال المطبعة، أمامك بوضوح.','Your print shop, all in one place.')}</h2>
        <p>{tx('ابدأ تسعيرة جديدة، تابع الإنتاج، أو افتح ملف أي عميل دون البحث بين الشاشات.','Create quotes, follow production and open customer accounts without jumping between screens.')}</p>
        <div className="gt-hero-actions">
          <button className="gt-hero-primary" onClick={()=>onNavigate('calculator')}><Calculator size={17}/>{tx('حساب طباعة جديد','New print calculation')}<ArrowUpLeft size={15}/></button>
          <button className="gt-hero-secondary" onClick={()=>onNavigate('customers')}><UsersRound size={17}/>{tx('إدارة العملاء','Manage customers')}</button>
        </div>
      </div>
      <div className="gt-hero-visual" aria-hidden="true">
        <div className="gt-hero-ring gt-ring-one"/><div className="gt-hero-ring gt-ring-two"/>
        <div className="gt-hero-visual-center"><Printer size={49} strokeWidth={1.55}/><span>GT</span></div>
      </div>
    </section>

    <section className="gt-overview-stat-grid" aria-label={tx('مؤشرات الإنتاج','Production metrics')}>
      <div className="gt-overview-stat"><span className="gt-stat-symbol gt-stat-blue"><FileClock size={20}/></span><p>{tx('طلبات اليوم','Total jobs')}</p><strong>{jobs.length}</strong><span className="gt-stat-caption">{tx('في تاريخ العمل المحدد','For the selected work date')}</span></div>
      <div className="gt-overview-stat"><span className="gt-stat-symbol gt-stat-yellow"><Clock3 size={20}/></span><p>{tx('قيد التنفيذ','Pending jobs')}</p><strong>{pending.length}</strong><span className="gt-stat-caption">{tx('بحاجة إلى متابعة','Need your attention')}</span></div>
      <div className="gt-overview-stat"><span className="gt-stat-symbol gt-stat-green"><CheckCheck size={20}/></span><p>{tx('تم الإنجاز','Completed')}</p><strong>{done.length}</strong><span className="gt-stat-caption">{tx('طلبات مكتملة','Finished orders')}</span></div>
      <div className="gt-overview-stat"><span className="gt-stat-symbol gt-stat-purple"><BarChart3 size={20}/></span><p>{tx('معدل الإنجاز','Completion rate')}</p><strong>{completion}%</strong><span className="gt-stat-progress"><span style={{width:completion+'%'}}/></span></div>
    </section>

    <div className="gt-overview-columns">
      <section className="gt-overview-panel">
        <header className="gt-panel-heading"><div><h3>{tx('آخر أوامر الطباعة','Recent print jobs')}</h3><p>{tx('تابع حالة الملفات في جميع الطابعات','Latest activity across your printers')}</p></div><button onClick={()=>onNavigate('kanban')}>{tx('كل الأوامر','All jobs')} <ArrowUpLeft size={15}/></button></header>
        <div className="gt-recent-list">
          {recent.length===0?<div className="gt-empty-state"><Printer size={28}/><strong>{tx('لا توجد طلبات في هذا التاريخ','No jobs for this date')}</strong><p>{tx('ستظهر هنا أوامر الإنتاج عند إضافتها','Jobs will appear here as they are added.')}</p></div>:recent.map(j=><button className="gt-recent-row" onClick={()=>onSelectJob(j)} key={j.id}>
            <span className="gt-recent-icon"><Printer size={19}/></span>
            <span className="gt-recent-title"><strong title={j.filename}>{j.filename}</strong><small>{j.customerName||tx('عميل غير محدد','Unassigned customer')} · {j.printer}</small></span>
            <span className={'gt-status-badge '+(j.status==='done'?'gt-status-done':'gt-status-pending')}>{j.status==='done'?tx('مكتمل','Done'):tx('قيد العمل','Pending')}</span>
            <time className="gt-row-date">{dayLabel(j.updatedAt||j.createdAt,isAr?'ar':'en')}</time>
            <ArrowUpLeft className="gt-row-arrow" size={16}/>
          </button>)}
        </div>
      </section>
      <section className="gt-overview-panel">
        <header className="gt-panel-heading"><div><h3>{tx('نشاط الطابعات','Printer activity')}</h3><p>{tx('الأوامر المفتوحة والمكتملة حسب الطابعة','Open and completed jobs by printer')}</p></div></header>
        <div className="gt-printer-list">{printers.length===0?<div className="gt-empty-state"><Printer size={27}/><strong>{tx('لا توجد طابعات معرفة','No printers configured')}</strong></div>:printers.map(([id,counts])=><div className="gt-printer-row" key={id}>
          <div className="gt-printer-top"><strong>{config.printers?.find(p=>p.id===id)?.name||id}</strong><span>{counts.pending} {tx('قيد العمل','pending')} / {counts.total}</span></div>
          <div className="gt-printer-progress"><span style={{width:(counts.total?counts.done/counts.total*100:0)+'%'}}/></div>
        </div>)}</div>
        <button className="gt-printer-link" onClick={()=>onNavigate('stats')}><BarChart3 size={16}/>{tx('استعراض تقارير الإنتاج','View production analytics')}<ArrowUpLeft size={16}/></button>
      </section>
    </div>
  </div>;
}
