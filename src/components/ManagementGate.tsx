import React, { useEffect, useState } from 'react';

/** Protect the whole legacy application and every API, not just the CRM screen. */
export default function ManagementGate({children}:{children:React.ReactNode}) {
  const [state,setState]=useState<'checking'|'login'|'ready'|'unconfigured'>('checking');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    fetch('/api/management/auth',{credentials:'same-origin',cache:'no-store'})
      .then(r=>r.json()).then(x=>setState(!x.configured?'unconfigured':x.authenticated?'ready':'login'))
      .catch(()=>{setState('login');setError('تعذّر الاتصال بالخادم');});
  },[]);
  if(state==='ready')return <>{children}</>;
  if(state==='checking')return <div className="min-h-screen bg-zinc-950 text-zinc-200 grid place-items-center">جارٍ التحقق من الدخول...</div>;
  const login=async (e:React.FormEvent)=>{
    e.preventDefault();setBusy(true);setError('');
    try {const r=await fetch('/api/management/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
      const x=await r.json();if(!r.ok)throw new Error(x.error||'خطأ في تسجيل الدخول');setPassword('');setState('ready');
    }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
  };
  return <div dir="rtl" className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
    <form onSubmit={login} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 sm:p-8 w-full max-w-md space-y-5 shadow-2xl">
      <h1 className="text-2xl font-black">Golden Target</h1><h2 className="text-zinc-300">نظام إدارة المطبعة — دخول الإدارة</h2>
      {state==='unconfigured'?<p role="alert" className="text-amber-300 text-sm">لم يتم إعداد كلمة مرور المسؤول وسر الجلسة في ملف .env. راجع دليل التثبيت.</p>:<>
        <label className="block text-sm">كلمة المرور</label>
        <input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-zinc-950 rounded-lg p-3 border border-zinc-700 text-white" />
        <button disabled={busy} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-lg p-3 font-bold">{busy?'جارٍ الدخول...':'تسجيل الدخول'}</button>
      </>}
      {error&&<p role="alert" className="text-rose-400 text-sm">{error}</p>}
      <p className="text-zinc-500 text-xs">لا تضع بيانات العملاء على خادم عام دون تفعيل HTTPS وتحديد صلاحيات الوصول.</p>
    </form>
  </div>;
}
