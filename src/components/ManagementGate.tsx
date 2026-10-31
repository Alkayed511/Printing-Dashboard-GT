import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Printer, ShieldCheck, Layers3, Calculator, UsersRound, AlertCircle } from 'lucide-react';

/** The entire legacy and management app stays protected behind the server session. */
export default function ManagementGate({children}:{children:React.ReactNode}) {
  const [state,setState]=useState<'checking'|'login'|'ready'|'unconfigured'>('checking');
  const [password,setPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    fetch('/api/management/auth',{credentials:'same-origin',cache:'no-store'})
      .then(r=>r.json())
      .then(x=>setState(!x.configured?'unconfigured':x.authenticated?'ready':'login'))
      .catch(()=>{setState('login');setError('تعذّر الاتصال بالخادم');});
  },[]);

  const login=async (e:React.FormEvent)=>{
    e.preventDefault();
    setBusy(true);setError('');
    try {
      const r=await fetch('/api/management/login',{
        method:'POST', credentials:'same-origin',
        headers:{'Content-Type':'application/json'}, body:JSON.stringify({password})
      });
      const x=await r.json();
      if(!r.ok)throw new Error(x.error||'خطأ في تسجيل الدخول');
      setPassword('');setState('ready');
    }catch(e){setError(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  };

  if(state==='ready')return <>{children}</>;

  return <div className="gt-auth-screen" dir="rtl">
    <div className="gt-auth-grid">
      <aside className="gt-auth-story">
        <div className="gt-auth-brand"><span className="gt-auth-brand-icon"><Printer size={27}/></span><span><strong>Golden Target</strong><small>PRINT MANAGEMENT PLATFORM</small></span></div>
        <div className="gt-auth-story-body">
          <span className="gt-auth-kicker"><span/> نظام إدارة متكامل للمطبعة</span>
          <h1>مطبعتك،<br/><em>تحت السيطرة.</em></h1>
          <p>إدارة الإنتاج والطلبات والعملاء والحسابات من منصة واحدة سريعة ومنظمة.</p>
          <div className="gt-auth-feature"><span><Layers3 size={19}/></span><div><b>إدارة الإنتاج</b><small>متابعة مراحل الطباعة والملفات والطابعات</small></div></div>
          <div className="gt-auth-feature"><span><Calculator size={19}/></span><div><b>التسعير الذكي</b><small>حساب الكميات والتكاليف وعروض الأسعار</small></div></div>
          <div className="gt-auth-feature"><span><UsersRound size={19}/></span><div><b>العملاء والحسابات</b><small>الفواتير والدفعات وكشوفات الحساب</small></div></div>
        </div>
        <span className="gt-auth-story-footer">GOLDEN TARGET · PRINT OPERATIONS</span>
      </aside>
      <main className="gt-auth-main">
        <div className="gt-auth-form-wrap">
          <div className="gt-auth-mobile-brand"><Printer size={21}/> Golden Target</div>
          <span className="gt-auth-greeting"><ShieldCheck size={17}/> مساحة عمل آمنة</span>
          <h2>{state==='unconfigured'?'إعداد الدخول مطلوب':'مرحباً بعودتك'}</h2>
          <p className="gt-auth-subtitle">{state==='unconfigured'?'لم يكتمل إعداد بيانات الدخول بعد.':'أدخل رمز PIN المكوّن من 4 أرقام للدخول إلى المطبعة.'}</p>

          {state==='checking'? <div className="gt-auth-loading" role="status"><div className="gt-auth-spinner"/> جارٍ التحقق من جلسة الدخول...</div> :
            state==='unconfigured'?
              <div className="gt-auth-warning" role="alert"><AlertCircle size={19}/><div><b>الإعدادات غير مكتملة</b><p>أنشئ ملف <code>.env</code> بجانب <code>package.json</code>، وأضف رمز PIN للمسؤول (4 أرقام بالضبط) وسر جلسة عشوائياً (32 حرفاً على الأقل)، ثم أعد تشغيل الخادم.</p></div></div>:
              <form onSubmit={login} className="gt-auth-form">
                <label htmlFor="gt-password">رمز PIN — أربعة أرقام</label>
                <div className="gt-auth-password">
                  <LockKeyhole size={19}/>
                  <input id="gt-password" required autoFocus type={showPassword?'text':'password'} inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} autoComplete="off" dir="ltr" value={password} placeholder="0000" onChange={e=>setPassword(e.target.value.replace(/[^0-9]/g,'').slice(0,4))}/>
                  <button type="button" onClick={()=>setShowPassword(x=>!x)} aria-label={showPassword?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{showPassword?<EyeOff size={20}/>:<Eye size={20}/>}</button>
                </div>
                {error&&<p role="alert" className="gt-auth-error">{error}</p>}
                <button className="gt-auth-submit" type="submit" disabled={busy||password.length!==4}>{busy?'جارٍ تسجيل الدخول...':'دخول إلى لوحة الإدارة'}<ArrowLeft size={19}/></button>
              </form>
          }
          {state==='unconfigured'&&error&&<p role="alert" className="gt-auth-error">{error}</p>}
          <div className="gt-auth-advice"><ShieldCheck size={17}/><span>استخدم HTTPS عند إتاحة النظام خارج جهازك، ولا تشارك بيانات الدخول أو ملف .env.</span></div>
        </div>
      </main>
    </div>
  </div>;
}
