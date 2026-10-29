import React,{useCallback,useEffect,useMemo,useState} from 'react';
import { MessageCircle, UsersRound, Plus, Download, ArrowUpLeft, Search, RefreshCw, FilePlus2,
  Printer, PencilLine, Link2, Clock3, CheckCircle2, FolderOpen, Save, UserRoundPlus } from 'lucide-react';
import {whatsappUrl} from '../utils/whatsapp';
import type {PrintJob,ServerConfig} from '../types';
import type {Customer,ManagementData} from '../types/management';
import type {IncomingMessage,IntakeRequest,IntakeStatus} from '../server/intakeStore';
import type {LinkedProductionFile} from '../server/intakeLinks';

type Props={jobs:PrintJob[];config:ServerConfig;onRefreshJobs:()=>void};
type IntakeData={messages:IncomingMessage[];requests:IntakeRequest[];whatsappConfigured:boolean};
const stages:{id:IntakeStatus;title:string}[]=[
  {id:'received',title:'تم الاستلام'}, {id:'designing',title:'تعديل التصميم'}, {id:'ready',title:'جاهز للطباعة'},
  {id:'printing',title:'قيد الطباعة'}, {id:'completed',title:'مكتمل'}
];
const control='w-full min-w-0 rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2.5 text-sm text-slate-100 focus:border-blue-400 outline-none';
const btn='inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border border-slate-600 bg-slate-800 hover:bg-slate-700 disabled:opacity-50';
const primary='inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50';
async function request<T>(url:string,method='GET',body?:unknown):Promise<T>{
  const response=await fetch(url,{method,credentials:'same-origin',cache:'no-store',
    headers:body?{'Content-Type':'application/json'}:undefined,
    body:body?JSON.stringify(body):undefined});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(payload.error||'تعذّر تنفيذ الطلب');
  return payload as T;
}
const stamp=(iso:string)=>iso?new Date(iso).toLocaleString('ar-JO'):'—';
export default function WhatsAppIntake({jobs,config,onRefreshJobs}:Props){
  const [intake,setIntake]=useState<IntakeData>({messages:[],requests:[],whatsappConfigured:false});
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [mode,setMode]=useState<'inbox'|'requests'>('inbox');
  const [filter,setFilter]=useState('');
  const [selectedMessage,setSelectedMessage]=useState('');
  const [selectedRequest,setSelectedRequest]=useState('');
  const [newCustomer,setNewCustomer]=useState({name:'',phone:''});
  const [newOrder,setNewOrder]=useState({customerId:'',title:'',notes:'',sourceMessageId:''});
  const [revision,setRevision]=useState({fileName:'',dimensions:'',printer:'',notes:''});
  const [linkSelection,setLinkSelection]=useState<string[]>([]);
  const [fileSearch,setFileSearch]=useState('');
  const [editingLinkId,setEditingLinkId]=useState('');
  const [replacementJobId,setReplacementJobId]=useState('');
  const [linkNote,setLinkNote]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  const refresh=useCallback(async()=>{
    const [incoming,account]=await Promise.all([
      request<IntakeData>('/api/management/intake/data'),
      request<ManagementData>('/api/management/data')
    ]);
    setIntake(incoming);setCustomers(account.customers.filter(c=>!c.archived));
  },[]);
  useEffect(()=>{refresh().catch(e=>setError(String(e)));},[refresh]);

  async function action(fn:()=>Promise<void>,success='تم الحفظ'){
    setBusy(true);setError('');setNotice('');
    try{await fn();await refresh();setNotice(success);}
    catch(e){setError(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  }
  const customerName=(id:string)=>customers.find(c=>c.id===id)?.name||'عميل غير مرتبط';
  const customerPhone=(id:string)=>customers.find(c=>c.id===id)?.whatsapp||customers.find(c=>c.id===id)?.phone||'';
  const selectedMsg=intake.messages.find(m=>m.id===selectedMessage);
  const current=intake.requests.find(r=>r.id===selectedRequest);
  const activeLinks=current?.linkedFiles||[];
  const linkedTo=(r:IntakeRequest):'done'|'pending'|undefined=>{
    const active=(r.linkedFiles||[]).map(l=>jobs.find(j=>j.id===l.jobId)).filter((j):j is PrintJob=>Boolean(j));
    if(!active.length)return undefined;
    return active.every(j=>j.status==='done')?'done':'pending';
  };
  const selectableJobs=useMemo(()=>jobs.filter(j=>
    [j.filename,j.printer,j.customerName||''].some(x=>x.toLowerCase().includes(fileSearch.trim().toLowerCase()))
  ),[jobs,fileSearch]);
  const filteredMessages=useMemo(()=>intake.messages.filter(m=>
    [m.text,m.fileName,m.name,m.from,customerName(m.customerId)]
      .some(v=>v.toLowerCase().includes(filter.trim().toLowerCase()))),[intake.messages,filter,customers]);
  const filteredRequests=useMemo(()=>intake.requests.filter(r=>
    [r.id,r.title,r.notes,customerName(r.customerId),...r.revisions.map(x=>x.fileName)]
      .some(v=>v.toLowerCase().includes(filter.trim().toLowerCase()))),[intake.requests,filter,customers]);
  function startFromMessage(msg:IncomingMessage){
    setSelectedMessage(msg.id);
    setNewOrder({customerId:msg.customerId,title:msg.fileName||msg.text.slice(0,70)||'طلب تصميم من واتساب',notes:msg.text,sourceMessageId:msg.id});
  }
  function startManual(){
    setMode('requests');setSelectedRequest('');
    setNewOrder({customerId:'',title:'',notes:'',sourceMessageId:''});
  }
  const isAr=config.language!=='en';

  return <div dir={isAr?'rtl':'ltr'} className="h-full overflow-y-auto text-slate-100 pb-8 space-y-5">
    <header className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div><div className="text-blue-300 text-xs font-bold flex items-center gap-2 mb-1"><MessageCircle size={16}/> WhatsApp & Production</div>
        <h2 className="font-black text-xl sm:text-2xl">استلام الطلبات والتصاميم</h2>
        <p className="text-slate-400 text-sm mt-2">من رسالة العميل إلى ملف الطباعة — مع رقم طلب ثابت مهما تغيّر اسم الملف.</p></div>
      <div className="flex gap-2 flex-wrap"><button className={btn} onClick={()=>action(refresh,'تم تحديث الرسائل')} disabled={busy}><RefreshCw size={15}/> تحديث</button>
        <button className={primary} onClick={startManual}><Plus size={16}/> طلب يدوي جديد</button></div>
    </header>

    {!intake.whatsappConfigured&&<div className="rounded-xl border border-amber-700/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
      الربط التلقائي مع واتساب غير مفعّل بعد. يمكن إضافة العملاء والطلبات يدوياً وفتح محادثاتهم فوراً. لتلقي الرسائل داخل البرنامج يجب إعداد WhatsApp Business Platform وWebhook عبر HTTPS.
    </div>}
    {error&&<div role="alert" className="rounded-xl border border-red-700 bg-red-950/40 p-3 text-red-200 text-sm">{error}</div>}
    {notice&&<div role="status" className="rounded-xl border border-emerald-700 bg-emerald-950/30 p-3 text-emerald-200 text-sm">{notice}</div>}

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        ['رسائل واردة',intake.messages.length],['طلبات مفتوحة',intake.requests.filter(r=>r.status!=='completed').length],
        ['جاهزة للطباعة',intake.requests.filter(r=>r.status==='ready').length],['طلبات مكتملة',intake.requests.filter(r=>r.status==='completed').length]
      ].map(([label,value])=><div key={label} className="rounded-xl border border-slate-700 bg-slate-900 p-4"><p className="text-xs text-slate-400">{label}</p><strong className="text-2xl font-black mt-1 block">{value}</strong></div>)}
    </div>

    <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
      <div className="flex items-center gap-2 mb-3"><UserRoundPlus size={18} className="text-blue-300"/><h3 className="font-bold">إضافة عميل يدوياً</h3><span className="text-xs text-slate-400">أو تلقائياً من رسالة واتساب</span></div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input className={control} aria-label="اسم العميل" placeholder="اسم العميل أو الشركة" value={newCustomer.name} onChange={e=>setNewCustomer(s=>({...s,name:e.target.value}))}/>
        <input className={control} dir="ltr" aria-label="رقم واتساب" placeholder="+96279..." value={newCustomer.phone} onChange={e=>setNewCustomer(s=>({...s,phone:e.target.value}))}/>
        <button disabled={busy||!newCustomer.name.trim()} className={primary+' whitespace-nowrap'} onClick={()=>action(async()=>{
          const saved=await request<Customer>('/api/management/customers','POST',{name:newCustomer.name,phone:newCustomer.phone,whatsapp:newCustomer.phone,contact:'',email:'',address:'',taxNumber:'',category:'',paymentTerms:'',creditLimit:0,notes:''});
          setNewCustomer({name:'',phone:''});setNewOrder(s=>({...s,customerId:saved.id}));
        },'تمت إضافة العميل')}>حفظ العميل</button>
      </div>
    </section>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex rounded-xl bg-slate-900 border border-slate-700 p-1">
        <button className={'rounded-lg px-4 py-2 text-sm font-bold '+(mode==='inbox'?'bg-blue-600 text-white':'text-slate-300')} onClick={()=>setMode('inbox')}>الرسائل ({intake.messages.length})</button>
        <button className={'rounded-lg px-4 py-2 text-sm font-bold '+(mode==='requests'?'bg-blue-600 text-white':'text-slate-300')} onClick={()=>setMode('requests')}>طلبات التصميم ({intake.requests.length})</button>
      </div>
      <div className="relative w-full sm:w-72"><Search size={16} className="absolute top-3 right-3 text-slate-400"/>
        <input className={control+' pr-10'} placeholder="بحث بالعميل أو الملف أو الرقم..." value={filter} onChange={e=>setFilter(e.target.value)}/></div>
    </div>

    {mode==='inbox'&&<div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] gap-4">
      <section className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
        <header className="px-4 py-3 border-b border-slate-700 font-bold">رسائل العملاء</header>
        {filteredMessages.length===0?<p className="p-8 text-center text-slate-400 text-sm">لا توجد رسائل. افتح محادثة العميل من واتساب أو أكمل طلباً يدوياً.</p>:
          filteredMessages.map(m=><button key={m.id} className={'w-full text-right border-b border-slate-800 p-4 hover:bg-slate-800/70 '+(selectedMessage===m.id?'bg-slate-800':'')} onClick={()=>startFromMessage(m)}>
            <div className="flex flex-wrap justify-between gap-2"><strong>{customerName(m.customerId)}</strong><span className="text-xs text-slate-400">{stamp(m.receivedAt)}</span></div>
            <p className="text-xs text-blue-300 mt-1" dir="ltr">{m.from}</p>
            <p className="text-sm text-slate-300 mt-2 line-clamp-2">{m.text||m.fileName||('مرفق '+m.type)}</p>
            {m.mediaId&&<span className="inline-flex gap-1 items-center text-xs text-indigo-300 mt-2"><FolderOpen size={14}/> {m.fileName||m.type}</span>}
          </button>)}
      </section>
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-4 space-y-4">
        <h3 className="font-bold flex gap-2 items-center"><FilePlus2 size={17}/> تحويل الرسالة إلى طلب</h3>
        {!selectedMsg?<p className="text-slate-400 text-sm">اختر رسالة من القائمة، أو أضف طلباً يدوياً.</p>:<>
          <p className="text-xs text-slate-400">المرسل: {selectedMsg.name||selectedMsg.from}</p>
          {selectedMsg.mediaId&&<a className={btn} href={'/api/management/intake/media/'+encodeURIComponent(selectedMsg.id)} target="_blank" rel="noreferrer"><Download size={15}/> تنزيل التصميم (عند تفعيل API)</a>}
          {!selectedMsg.customerId&&<div className="space-y-2"><p className="text-amber-300 text-xs">يرجى تحديد العميل للرسالة</p>
            <select className={control} value={newOrder.customerId} onChange={e=>setNewOrder(s=>({...s,customerId:e.target.value}))}><option value="">اختر العميل</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <button className={btn} disabled={!newOrder.customerId||busy} onClick={()=>action(async()=>{await request('/api/management/intake/messages/'+encodeURIComponent(selectedMsg.id)+'/assign','POST',{customerId:newOrder.customerId});},'تم ربط الرسالة بالعميل')}>ربط الرسالة</button></div>}
          <label className="block text-xs text-slate-400">عنوان الطلب<input className={control+' mt-1'} value={newOrder.title} onChange={e=>setNewOrder(s=>({...s,title:e.target.value}))}/></label>
          <label className="block text-xs text-slate-400">ملاحظات<textarea rows={3} className={control+' mt-1'} value={newOrder.notes} onChange={e=>setNewOrder(s=>({...s,notes:e.target.value}))}/></label>
          <button className={primary+' w-full'} disabled={busy||!newOrder.customerId||!newOrder.title.trim()} onClick={()=>action(async()=>{
            const record=await request<IntakeRequest>('/api/management/intake/requests','POST',newOrder);
            setSelectedRequest(record.id);setMode('requests');
          },'تم إنشاء طلب التصميم برقم ثابت')}>إنشاء طلب من الرسالة <ArrowUpLeft size={15}/></button>
        </>}
      </section>
    </div>}

    {mode==='requests'&&<div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,450px)] gap-4">
      <section className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
        <header className="p-4 border-b border-slate-700 flex justify-between font-bold"><span>طلبات التصميم</span><span className="text-slate-400 text-xs">{filteredRequests.length} طلب</span></header>
        {filteredRequests.length===0?<p className="p-8 text-center text-slate-400 text-sm">ابدأ بإضافة طلب يدوي أو حوّل رسالة واردة إلى طلب.</p>:
          filteredRequests.map(o=><button key={o.id} className={'w-full text-right border-b border-slate-800 p-4 hover:bg-slate-800/70 '+(selectedRequest===o.id?'bg-slate-800':'')} onClick={()=>{setSelectedRequest(o.id);setLinkSelection([]);setEditingLinkId('');setReplacementJobId('');setLinkNote('');}}>
            <div className="flex justify-between items-start gap-3"><div><strong className="block text-sm">{o.title}</strong><span className="text-blue-300 text-xs font-mono">{o.id}</span></div>
              <span className="text-xs rounded-lg bg-slate-700 px-2 py-1">{stages.find(x=>x.id===o.status)?.title}</span></div>
            <p className="mt-2 text-sm text-slate-300">{customerName(o.customerId)} · {o.source==='whatsapp'?'واتساب':'يدوي'}</p>
            <p className="mt-1 text-xs text-slate-400">النسخ: {o.revisions.length} · {(o.linkedFiles||[]).length?((o.linkedFiles||[]).length+' ملفات مرتبطة'):'غير مرتبط بالطابعة'} {linkedTo(o)?'· '+(linkedTo(o)==='done'?'تمت الطباعة':'بانتظار الطباعة'):''}</p>
          </button>)}
      </section>
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-4 space-y-4">
        {current?<><h3 className="font-bold">تفاصيل الطلب <span className="text-blue-300 font-mono text-xs">{current.id}</span></h3>
          <p className="text-sm text-slate-300">{customerName(current.customerId)}</p>
          {whatsappUrl(customerPhone(current.customerId))&&<a target="_blank" rel="noreferrer" className={btn} href={whatsappUrl(customerPhone(current.customerId))}><MessageCircle size={16}/> فتح محادثة العميل</a>}
          <div><label className="text-xs text-slate-400">مرحلة الطلب</label>
            <select className={control+' mt-1'} value={current.status} disabled={busy} onChange={e=>action(async()=>{await request('/api/management/intake/requests/'+encodeURIComponent(current.id),'PATCH',{status:e.target.value});},'تم تحديث حالة الطلب')}>
              {stages.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
          <div className="space-y-2"><h4 className="font-bold flex gap-2 items-center"><PencilLine size={16}/> توثيق نسخة تصميم جديدة</h4>
            <input className={control} placeholder="اسم الملف بعد التعديل (مثال: banner-final.pdf)" value={revision.fileName} onChange={e=>setRevision(v=>({...v,fileName:e.target.value}))}/>
            <div className="grid grid-cols-2 gap-2"><input className={control} placeholder="المقاس: 200×150 سم" value={revision.dimensions} onChange={e=>setRevision(v=>({...v,dimensions:e.target.value}))}/>
            <select className={control} value={revision.printer} onChange={e=>setRevision(v=>({...v,printer:e.target.value}))}><option value="">اختر الطابعة</option>{(config.printers||[]).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <textarea className={control} rows={2} placeholder="التعديلات وملاحظات المصمم" value={revision.notes} onChange={e=>setRevision(v=>({...v,notes:e.target.value}))}/>
            <button disabled={busy||!revision.fileName.trim()} className={primary} onClick={()=>action(async()=>{
              await request('/api/management/intake/requests/'+encodeURIComponent(current.id)+'/revisions','POST',revision);
              setRevision({fileName:'',dimensions:'',printer:'',notes:''});
            },'تم حفظ نسخة التصميم الجديدة')}><Save size={15}/> حفظ النسخة</button>
          </div>
          <div className="space-y-1 border-t border-slate-700 pt-3"><h4 className="font-bold text-sm">سجل أسماء الملفات والمقاسات</h4>
            {current.revisions.length===0?<p className="text-xs text-slate-400">لم يتم توثيق نسخ التصميم بعد.</p>:current.revisions.map((v,i)=><div className="rounded-lg bg-slate-800/70 p-3 text-xs space-y-1" key={v.id}><b>النسخة {i+1} — {v.fileName}</b><p>{v.dimensions||'مقاس غير محدد'} · {v.printer||'طابعة غير محددة'}</p><p className="text-slate-400">{v.notes||stamp(v.createdAt)}</p></div>)}
          </div>
          <div className="border-t border-slate-700 pt-3 space-y-3">
            <h4 className="font-bold flex gap-2 items-center"><Link2 size={16}/> ملفات الطباعة المرتبطة ({activeLinks.length})</h4>
            <p className="text-xs text-slate-400">يمكن ربط عدة ملفات بطلب واحد. تبقى الأسماء القديمة محفوظة حتى لو تغيّرت أو اختفت من مجلد الطابعة.</p>

            <div className="space-y-2">
              {activeLinks.length===0&&<p className="rounded-xl border border-dashed border-slate-600 p-4 text-center text-xs text-slate-400">لم تُربط ملفات إنتاج بهذا الطلب بعد.</p>}
              {activeLinks.map((link:LinkedProductionFile)=>{
                const job=jobs.find(j=>j.id===link.jobId);
                const available=!!job;
                return <div key={link.id} className="rounded-xl border border-slate-700 bg-slate-950/40 p-3 space-y-2">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm break-all">{job?.filename||link.filename||link.jobId}</p>
                      <p className="text-xs text-slate-400 mt-1">الطابعة: {job?.printer||link.printer||'غير محددة'}</p>
                      <p className={'text-xs mt-1 '+(available?'text-emerald-300':'text-amber-300')}>
                        {available?(job.status==='done'?'تمت الطباعة':'ظاهر في الإنتاج / قيد الطباعة')
                          :'غير ظاهر حالياً — ربما تغيّر اسمه أو تاريخ مجلده؛ اختر الملف الجديد عبر «تعديل»'}
                      </p>
                      {link.note&&<p className="mt-1 text-xs text-slate-300">ملاحظة: {link.note}</p>}
                      {!!link.previousFiles?.length&&<details className="text-xs mt-2 text-slate-400">
                        <summary className="cursor-pointer">تاريخ استبدال الملف ({link.previousFiles.length})</summary>
                        {link.previousFiles.map((p,i)=><p key={i} className="mt-1 break-all">• {p.filename} — {p.printer||'غير محددة'}</p>)}
                      </details>}
                    </div>
                    <div className="flex gap-2 items-start">
                      <button type="button" className={btn+' text-xs'} disabled={busy} onClick={()=>{
                        setEditingLinkId(link.id);setReplacementJobId('');setLinkNote(link.note||'');
                      }}>تعديل</button>
                      <button type="button" className={btn+' text-xs !border-rose-800 !text-rose-300'} disabled={busy} onClick={()=>{
                        if(window.confirm('إلغاء ربط الملف بالطلب؟ لن يُحذف ملف التصميم أو ملف الطباعة من الجهاز.')){
                          action(async()=>{
                            await request('/api/management/intake/requests/'+encodeURIComponent(current.id)+'/files/'+encodeURIComponent(link.id),'DELETE');
                            setEditingLinkId('');
                            onRefreshJobs();
                          },'تم حذف الربط فقط دون حذف الملف من جهاز الطابعة');
                        }
                      }}>حذف الربط</button>
                    </div>
                  </div>
                  {editingLinkId===link.id&&<div className="space-y-2 rounded-xl border border-blue-700/50 bg-blue-950/20 p-3">
                    <p className="text-xs text-blue-200 font-bold">تعديل الربط / اختيار الملف بعد تغيير اسمه</p>
                    <select className={control} value={replacementJobId} onChange={e=>setReplacementJobId(e.target.value)}>
                      <option value="">الإبقاء على الملف الحالي (تعديل الملاحظة فقط)</option>
                      {jobs.filter(j=>j.id===link.jobId||!activeLinks.some(l=>l.jobId===j.id)).map(j=>
                        <option key={j.id} value={j.id}>{j.filename} — {j.printer}</option>)}
                    </select>
                    <input className={control} value={linkNote} placeholder="ملاحظة خاصة بهذا الملف (اختياري)" maxLength={500} onChange={e=>setLinkNote(e.target.value)}/>
                    <div className="flex gap-2 flex-wrap">
                      <button disabled={busy} className={primary} onClick={()=>action(async()=>{
                        await request('/api/management/intake/requests/'+encodeURIComponent(current.id)+'/files/'+encodeURIComponent(link.id),'PUT',{
                          jobId:replacementJobId||link.jobId,note:linkNote
                        });
                        setEditingLinkId('');setReplacementJobId('');onRefreshJobs();
                      },'تم تحديث الملف المرتبط وحفظ اسم الملف السابق')}>حفظ التعديل</button>
                      <button type="button" className={btn} onClick={()=>setEditingLinkId('')}>إلغاء</button>
                    </div>
                  </div>}
                </div>;
              })}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-3 space-y-2">
              <h5 className="font-bold text-sm">إضافة ملفات أخرى إلى الطلب</h5>
              <p className="text-xs text-slate-400">حدد أكثر من ملف دفعة واحدة. كل ملف سيحتفظ باسمه ومعرفه وقت الربط.</p>
              <input className={control} value={fileSearch} onChange={e=>setFileSearch(e.target.value)} placeholder="ابحث عن اسم ملف أو طابعة" aria-label="البحث عن ملفات الطباعة"/>
              <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-700 p-1 space-y-1">
                {selectableJobs.length===0&&<p className="text-xs text-slate-400 p-3">لا توجد ملفات مطابقة في تاريخ الإنتاج الحالي.</p>}
                {selectableJobs.map(j=>{
                  const linked=activeLinks.some(l=>l.jobId===j.id);
                  const otherCustomer=!!j.customerId&&j.customerId!==current.customerId;
                  return <label key={j.id} className={'flex gap-3 items-center text-sm rounded-lg p-2 '+(linked||otherCustomer?'opacity-50':'hover:bg-slate-800 cursor-pointer')}>
                    <input type="checkbox" className="accent-blue-500 w-4 h-4" disabled={linked||otherCustomer||busy} checked={linked||linkSelection.includes(j.id)}
                      onChange={e=>setLinkSelection(prev=>e.target.checked?[...prev,j.id]:prev.filter(x=>x!==j.id))}/>
                    <span className="flex-1 break-all">{j.filename}<small className="block text-slate-400">{j.printer}{otherCustomer?' — مرتبط بعميل آخر':linked?' — مرتبط مسبقاً':''}</small></span>
                  </label>;
                })}
              </div>
              <button className={primary+' w-full'} disabled={busy||linkSelection.length===0} onClick={()=>action(async()=>{
                await request('/api/management/intake/requests/'+encodeURIComponent(current.id)+'/files','POST',{jobIds:linkSelection});
                setLinkSelection([]);onRefreshJobs();
              },'تم ربط '+linkSelection.length+' ملفات بالطلب')}>
                <Plus size={15}/> ربط الملفات المحددة ({linkSelection.length})
              </button>
            </div>
          </div>
        </>:<><h3 className="font-bold">إنشاء طلب يدوي</h3><label className="block text-xs text-slate-400">اختر العميل
          <select className={control+' mt-1'} value={newOrder.customerId} onChange={e=>setNewOrder(s=>({...s,customerId:e.target.value,sourceMessageId:''}))}><option value="">اختر العميل</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="block text-xs text-slate-400">اسم الطلب<input className={control+' mt-1'} value={newOrder.title} placeholder="مثال: بنر إعلاني 2×3 متر" onChange={e=>setNewOrder(s=>({...s,title:e.target.value}))}/></label>
          <label className="block text-xs text-slate-400">ملاحظات<textarea className={control+' mt-1'} rows={3} value={newOrder.notes} onChange={e=>setNewOrder(s=>({...s,notes:e.target.value}))}/></label>
          <button disabled={busy||!newOrder.customerId||!newOrder.title.trim()} className={primary+' w-full'} onClick={()=>action(async()=>{
            const record=await request<IntakeRequest>('/api/management/intake/requests','POST',{...newOrder,sourceMessageId:''});
            setSelectedRequest(record.id);
          },'تم تسجيل الطلب اليدوي')}><Plus size={16}/> حفظ الطلب الجديد</button>
        </>}
      </section>
    </div>}
    <footer className="text-xs text-slate-500 flex items-center gap-2"><Clock3 size={14}/> لا يتغير رقم الطلب بتغيير اسم الملف أو المقاس. استخدم نسخ التصميم لتوثيق التعديلات واربِط الملف النهائي يدوياً عند ظهوره في الإنتاج.</footer>
  </div>;
}
