import React, {useEffect,useState} from 'react';
import type {PrintJob} from '../types';
import type {Customer,ManagementData} from '../types/management';
export default function JobCustomerLink({job,onLinked}:{job:PrintJob;onLinked:()=>void}){
  const [customers,setCustomers]=useState<Customer[]>([]); const [selected,setSelected]=useState(job.customerId||'');
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  useEffect(()=>{setSelected(job.customerId||'');fetch('/api/management/data',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('لا يمكن تحميل العملاء'))).then((x:ManagementData)=>setCustomers(x.customers.filter(c=>!c.archived))).catch(e=>setError(String(e)));},[job.id,job.customerId]);
  const save=async()=>{setBusy(true);setError('');try{const r=await fetch('/api/management/jobs/link',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jobId:job.id,customerId:selected})});const x=await r.json();if(!r.ok)throw new Error(x.error||'تعذر الربط');onLinked();}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}};
  return <div className="px-4 py-2 bg-zinc-950/90 border-b border-zinc-800 text-sm flex flex-wrap gap-2 items-center">
    <span className="text-zinc-300">العميل المسجل:</span>
    <select className="border border-zinc-700 bg-zinc-900 rounded p-2 min-w-[130px] flex-1" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">بدون ربط</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
    <button disabled={busy||selected===(job.customerId||'')} onClick={save} className="bg-blue-600 rounded px-3 py-2 disabled:opacity-50">ربط</button>
    {error&&<span role="alert" className="text-red-300">{error}</span>}
  </div>;
}
