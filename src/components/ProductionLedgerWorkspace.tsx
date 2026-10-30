import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {RefreshCw,Search,Printer,CheckCircle2,Pencil,Save,Wallet,Users,Info} from 'lucide-react';
import type {Customer,ManagementData} from '../types/management';
type LedgerRow={
  id:string;jobId:string;filename:string;previousNames:string[];printer:string;dateFolder:string;
  status:'pending'|'done';firstSeenAt:string;doneObservedAt:string|null;
  customerId:string;dimensions:string;material:string;quantity:number|null;quantitySource:'filename'|'manual'|'unknown';
  priceJod:number|null;paidJod:number|null;balanceJod:number|null;notes:string;
};
type Form={customerId:string;quantity:string;dimensions:string;material:string;priceJod:string;paidJod:string;notes:string};
const input='w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500';
const button='inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-blue-600 hover:bg-blue-500 font-semibold text-sm disabled:opacity-50';
const formOf=(x:LedgerRow):Form=>({
  customerId:x.customerId,quantity:x.quantity===null?'':String(x.quantity),
  dimensions:x.dimensions,material:x.material,priceJod:x.priceJod===null?'':String(x.priceJod),
  paidJod:x.paidJod===null?'':String(x.paidJod),notes:x.notes
});
async function getJson<T>(url:string,method='GET',body?:unknown):Promise<T>{
  const r=await fetch(url,{method,cache:'no-store',credentials:'same-origin',
    headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(data.error||'تعذّر تحميل البيانات');
  return data as T;
}
const money=(v:number|null)=>v===null?'—':v.toFixed(3)+' د.أ';
const date=(v:string|null)=>v?new Date(v).toLocaleString('ar-JO'):'—';
export default function ProductionLedgerWorkspace(){
  const [rows,setRows]=useState<LedgerRow[]>([]);
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [selected,setSelected]=useState('');
  const [filter,setFilter]=useState<'all'|'done'|'pending'>('done');
  const [search,setSearch]=useState('');
  const [form,setForm]=useState<Form|null>(null);
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const refresh=useCallback(async()=>{
    const [ledger,management]=await Promise.all([
      getJson<{rows:LedgerRow[]}>('/api/management/ledger'),
      getJson<ManagementData>('/api/management/data')
    ]);
    setRows(ledger.rows);setCustomers(management.customers.filter(c=>!c.archived));
  },[]);
  useEffect(()=>{refresh().catch(e=>setError(String(e)));const timer=setInterval(()=>refresh().catch(()=>{}),15000);return()=>clearInterval(timer);},[refresh]);
  const customerName=(id:string)=>customers.find(c=>c.id===id)?.name||'لم يتم تحديد العميل';
  const filtered=useMemo(()=>rows.filter(r=>(filter==='all'||r.status===filter)&&
    [r.filename,r.printer,r.dateFolder,customerName(r.customerId),...(r.previousNames||[])]
      .some(v=>v.toLowerCase().includes(search.toLowerCase().trim()))),[rows,filter,search,customers]);
  const current=rows.find(r=>r.id===selected);
  const printed=rows.filter(r=>r.status==='done');
  const priced=printed.filter(r=>r.priceJod!==null);
  const totalDebt=priced.reduce((sum,r)=>sum+Math.max(0,r.balanceJod||0),0);
  async function save(){
    if(!current||!form)return;
    setBusy(true);setError('');setMessage('');
    try{
      await getJson('/api/management/ledger/'+encodeURIComponent(current.id),'PATCH',{
        ...form,quantity:form.quantity===''?null:Number(form.quantity),
        priceJod:form.priceJod===''?null:Number(form.priceJod),
        paidJod:form.paidJod===''?null:Number(form.paidJod)
      });
      await refresh();setMessage('تم حفظ التعديل');setForm(null);
    }catch(e){setError(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  }
  const select=(r:LedgerRow)=>{setSelected(r.id);setForm(formOf(r));setMessage('');};
  return <div className="p-3 sm:p-5 space-y-4 overflow-y-auto h-full text-slate-100" dir="rtl">
    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4 flex flex-wrap gap-3 items-center justify-between">
      <div><h2 className="text-xl font-black">سجل ملفات الطباعة</h2>
        <p className="text-xs mt-2 text-slate-400">يُسجّل الملف تلقائياً عند رصده داخل مجلد done الخاص بالطابعة؛ السعر والذمم اختيارية.</p></div>
      <button className={button} disabled={busy} onClick={()=>refresh().catch(e=>setError(String(e)))}><RefreshCw size={16}/> تحديث المجلدات</button>
    </div>
    <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-3 text-amber-200 text-xs flex gap-2"><Info size={18} className="shrink-0"/>
      «done» يعني أن الموظف وضع الملف في مجلد المنجز. تاريخ التسجيل هو وقت أول رصد للملف، وليس وقت تشغيل الطابعة الفعلي. والكمية تُقرأ من اسم الملف فقط إذا كانت مذكورة صراحة، وإلا تُترك فارغة.</div>
    {error&&<div role="alert" className="text-rose-200 bg-rose-950/40 p-3 rounded-xl">{error}</div>}
    {message&&<div role="status" className="text-emerald-200 bg-emerald-950/40 p-3 rounded-xl">{message}</div>}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[['ملفات مرصودة',rows.length],['داخل done الآن',printed.length],['ملفات بسعر مسجّل',priced.length],['الذمم بالدينار',money(totalDebt)]].map(([label,v])=><div key={label} className="rounded-xl bg-slate-900 border border-slate-700 p-4"><span className="text-slate-400 text-xs">{label}</span><strong className="block mt-2 text-xl">{v}</strong></div>)}
    </div>
    <div className="flex flex-wrap gap-2 items-center">
      {(['done','pending','all'] as const).map(v=><button key={v} onClick={()=>setFilter(v)} className={'rounded-xl py-2 px-4 text-sm '+(filter===v?'bg-blue-600':'bg-slate-800')}>{v==='done'?'المنجزة':v==='pending'?'بانتظار النقل':'الكل'}</button>)}
      <div className="flex flex-1 min-w-44 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3"><Search size={16}/><input className="min-w-0 w-full bg-transparent outline-none py-2 text-sm" placeholder="اسم الملف / العميل / الطابعة" value={search} onChange={e=>setSearch(e.target.value)}/></div>
    </div>
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(330px,430px)] gap-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
        {filtered.length===0?<p className="text-center text-sm p-8 text-slate-400">لا توجد ملفات مرصودة حالياً. تأكد من اتصال مجلدات الشبكة ثم اضغط تحديث.</p>:filtered.map(r=>
          <button type="button" key={r.id} className={'text-right w-full p-4 border-b border-slate-800 hover:bg-slate-800 '+(selected===r.id?'bg-slate-800':'')} onClick={()=>select(r)}>
            <div className="flex items-start justify-between gap-3"><div className="min-w-0">
              <b className="break-all">{r.filename}</b><p className="text-slate-400 mt-1 text-xs">{customerName(r.customerId)} · {r.printer} · {r.dateFolder}</p>
              <p className="text-xs mt-1">العدد: {r.quantity??'غير معروف'} · المقاس: {r.dimensions||'غير معروف'} · السعر: {money(r.priceJod)}</p>
              {!!r.previousNames?.length&&<p className="text-xs text-blue-300 mt-1">الاسم السابق: {r.previousNames.join('، ')}</p>}
            </div><span className={'shrink-0 text-xs rounded-lg px-2 py-1 '+(r.status==='done'?'bg-emerald-950 text-emerald-200':'bg-amber-950 text-amber-200')}>
              {r.status==='done'?'داخل done':'قيد التحضير'}</span></div>
            <p className="text-xs text-slate-500 mt-2">تم رصده في done: {date(r.doneObservedAt)}</p>
          </button>)}
      </div>
      <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4 space-y-3">
        {!current||!form?<div className="text-center text-slate-400 py-8"><Printer size={30} className="mx-auto mb-3"/>اختر ملفاً من القائمة لعرض تفاصيله وتعديلها.</div>:<>
          <div className="flex items-center gap-2 text-blue-300 font-bold"><Pencil size={18}/> تعديل بيانات ملف الطباعة</div>
          <p className="text-sm break-all">{current.filename}</p>
          <label className="block text-xs text-slate-400">العميل
            <select className={input+' mt-1'} value={form.customerId} onChange={e=>setForm({...form,customerId:e.target.value})}>
              <option value="">غير مرتبط</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name} {c.whatsapp&&'— '+c.whatsapp}</option>)}
            </select></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-400">الكمية / عدد النسخ<input className={input+' mt-1'} type="number" min={1} step={1} value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></label>
            <label className="text-xs text-slate-400">المقاسات<input className={input+' mt-1'} value={form.dimensions} placeholder="200×100 cm" onChange={e=>setForm({...form,dimensions:e.target.value})}/></label>
          </div>
          <label className="block text-xs text-slate-400">المادة<input className={input+' mt-1'} value={form.material} onChange={e=>setForm({...form,material:e.target.value})}/></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-400">السعر بالدينار (اختياري)<input className={input+' mt-1'} type="number" min={0} step=".001" value={form.priceJod} onChange={e=>setForm({...form,priceJod:e.target.value})}/></label>
            <label className="text-xs text-slate-400">المدفوع بالدينار (اختياري)<input className={input+' mt-1'} type="number" min={0} step=".001" value={form.paidJod} onChange={e=>setForm({...form,paidJod:e.target.value})}/></label>
          </div>
          <p className="rounded-lg bg-slate-800 p-3 text-sm">المتبقي: <b>{form.priceJod===''?'—':money(Math.round((Number(form.priceJod)-Number(form.paidJod||0))*1000)/1000)}</b></p>
          <label className="block text-xs text-slate-400">ملاحظات<textarea className={input+' mt-1'} rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
          <button className={button+' w-full'} disabled={busy} onClick={save}><Save size={17}/> حفظ التعديلات</button>
          <p className="text-xs text-slate-500">هذه الذمم تخص سجل الطباعة؛ لا تُنشئ فاتورة أو قيد محاسبة تلقائياً حتى لا تُحتسب الإيرادات مرتين.</p>
        </>}
      </div>
    </div>
  </div>;
}
