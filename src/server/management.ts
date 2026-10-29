import 'dotenv/config';
import type { Express, Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { readSnapshot, writeSnapshot } from './sqliteStore';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { PrintJob } from '../types';
import { calculateEstimate, type PrintLine, type EstimateTotals } from '../utils/printMath';
import { normalizeWhatsApp } from '../utils/whatsapp';

type CRMCustomer = {
  id: string; name: string; contact: string; phone: string; whatsapp: string; email: string;
  address: string; taxNumber: string; category: string; paymentTerms: string;
  creditLimit: number; notes: string; archived: boolean; createdAt: string; updatedAt: string;
};
type Estimate = { id: string; customerId: string; title: string; lines: PrintLine[];
  discountPercent: number; taxPercent: number; totals: EstimateTotals; createdAt: string; updatedAt: string };
type Quote = { id: string; customerId: string; estimateId: string; title: string; total: number;
  lines: PrintLine[]; totals: EstimateTotals; status: 'draft' | 'approved'; orderId?: string; createdAt: string };
type Invoice = { id: string; customerId: string; quoteId: string; total: number; title: string;
  createdAt: string; dueDate: string };
type Payment = { id: string; invoiceId: string; customerId: string; amount: number;
  kind: 'payment' | 'refund'; method: string; note: string; createdAt: string };
type Material = { id: string; name: string; unit: string; costRate: number; updatedAt: string };
type Store = { version: number; customers: CRMCustomer[]; estimates: Estimate[]; quotes: Quote[];
  invoices: Invoice[]; payments: Payment[]; materials: Material[]; orders: PrintJob[];
  jobLinks: Record<string, string> };
const initial = (): Store => ({ version: 1, customers: [], estimates: [], quotes: [],
  invoices: [], payments: [], materials: [], orders: [], jobLinks: {} });
const now = () => new Date().toISOString();
const uid = () => randomUUID();
const str = (x: unknown, max = 200) => typeof x === 'string' ? x.trim().slice(0,max) : '';
const nonnegative = (x: unknown, max = 1_000_000) => {
  const n = Number(x);
  if (!Number.isFinite(n) || n < 0 || n > max) throw new Error('قيمة رقمية غير صالحة');
  return n;
};
const authPass = process.env.PRINT_ADMIN_PASSWORD || '';
const secret = process.env.PRINT_SESSION_SECRET || '';
const configured = authPass.length >= 12 && secret.length >= 32;
let db: Store | null = null;
function readDb(): Store {
  return db ||= { ...initial(), ...readSnapshot() } as Store;
}
function saveDb() { writeSnapshot(readDb()); }
const sign = (data: string) => createHmac('sha256', secret).update(data).digest('hex');
function authenticated(req: Request) {
  if (!configured) return false;
  const raw = (req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('gt_session='));
  if (!raw) return false;
  const token = decodeURIComponent(raw.slice('gt_session='.length));
  const match = /^([0-9]{10,15})\.([a-f0-9]{64})$/.exec(token);
  if (!match || Number(match[1]) < Date.now()) return false;
  const expected = Buffer.from(sign(match[1]), 'hex');
  const provided = Buffer.from(match[2], 'hex');
  return expected.length === provided.length && timingSafeEqual(expected,provided);
}
function sameOrigin(req: Request) {
  const origin = req.headers.origin;
  if (!origin) return true; // Browsers send Origin on cross-origin writes; same-host scripts may omit it.
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}
const attempts = new Map<string, { n: number; until: number }>();
function guard(req: Request, res: Response, next: NextFunction) {
  if (!configured) { res.status(503).json({error:'Set PRINT_ADMIN_PASSWORD and PRINT_SESSION_SECRET in .env'}); return; }
  if (!authenticated(req)) { res.status(401).json({error:'LOGIN_REQUIRED'}); return; }
  if (!['GET','HEAD','OPTIONS'].includes(req.method) && !sameOrigin(req)) {
    res.status(403).json({error:'INVALID_ORIGIN'}); return;
  }
  next();
}
function handleError(res: Response, e: unknown) {
  res.status(400).json({ error: e instanceof Error ? e.message : 'Invalid request' });
}
function customerOf(id: string) {
  const customer = readDb().customers.find(c=>c.id===id && !c.archived);
  if (!customer) throw new Error('يرجى اختيار عميل موجود');
  return customer;
}
function invoiceBalance(id: string) {
  const invoice = readDb().invoices.find(i=>i.id===id);
  if (!invoice) throw new Error('الفاتورة غير موجودة');
  const paid = readDb().payments.filter(p=>p.invoiceId===id).reduce((s,p)=>s+(p.kind==='refund'?-p.amount:p.amount),0);
  return Math.round((invoice.total-paid)*1000)/1000;
}
/** Called only by an HMAC-verified official WhatsApp webhook. Does not overwrite user-edited names. */
export function resolveWhatsappCustomer(phoneInput:string, profileName:string):string {
  const phone=normalizeWhatsApp(phoneInput);
  if(!phone) throw new Error('Invalid WhatsApp sender');
  const store=readDb();
  const matches=store.customers.filter(c=>!c.archived && (normalizeWhatsApp(c.whatsapp)===phone || normalizeWhatsApp(c.phone)===phone));
  // Never silently merge duplicate customer records that share a phone.
  if(matches.length>1)return '';
  if(matches.length===1){
    const item=matches[0];
    if(!item.whatsapp){item.whatsapp='+'+phone;item.updatedAt=now();saveDb();}
    return item.id;
  }
  const newCustomer:CRMCustomer={
    id:uid(),name:str(profileName)||('واتساب +' + phone),
    contact:'',phone:'',whatsapp:'+'+phone,email:'',address:'',
    taxNumber:'',category:'واتساب',paymentTerms:'',creditLimit:0,notes:'',
    archived:false,createdAt:now(),updatedAt:now()
  };
  store.customers.push(newCustomer);
  saveDb();
  return newCustomer.id;
}
export function validCustomerId(id:string):boolean {
  return !!readDb().customers.find(c=>c.id===id && !c.archived);
}

export function attachManagementRoutes(app: Express) {
  const router = Router();
  router.get('/auth', (req,res)=>res.json({ configured, authenticated: authenticated(req) }));
  router.post('/login', (req,res)=>{
    if (!configured) { res.status(503).json({error:'Configure admin password and session secret on server'}); return; }
    if (!sameOrigin(req)) { res.sendStatus(403); return; }
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const attempt = attempts.get(ip) || {n:0,until:0};
    if (attempt.until > Date.now()) { res.status(429).json({error:'Too many attempts. Try later.'}); return; }
    const actual = Buffer.from(String(req.body?.password || '').slice(0,512));
    const expected = Buffer.from(authPass);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      attempt.n++;
      if (attempt.n >= 8) { attempt.n = 0; attempt.until = Date.now()+15*60_000; }
      attempts.set(ip,attempt);
      res.status(401).json({error:'كلمة المرور غير صحيحة'}); return;
    }
    attempts.delete(ip);
    const exp = String(Date.now() + 8*60*60_000);
    const token = exp + '.' + sign(exp);
    const secure = process.env.PRINT_SECURE_COOKIES === 'true' || req.secure;
    res.cookie('gt_session', token, { httpOnly:true, sameSite:'strict', secure, path:'/', maxAge:8*60*60_000 });
    res.json({ authenticated:true });
  });
  router.post('/logout',(req,res)=>{res.clearCookie('gt_session',{path:'/',httpOnly:true,sameSite:'strict'});res.json({authenticated:false});});
  router.use(guard);
  router.get('/data', (_req,res)=>{
    const data = readDb();
    res.set('Cache-Control','no-store');
    res.json({...data, invoices:data.invoices.map(i=>({...i,balance:invoiceBalance(i.id)}))});
  });
  router.post('/customers',(req,res)=>{
    try {
      const name = str(req.body.name);
      if (!name) throw new Error('اسم العميل مطلوب');
      const customer: CRMCustomer = { id:uid(), name, contact:str(req.body.contact), phone:str(req.body.phone,80),
        whatsapp:str(req.body.whatsapp,80), email:str(req.body.email), address:str(req.body.address,400),
        taxNumber:str(req.body.taxNumber,100), category:str(req.body.category), paymentTerms:str(req.body.paymentTerms),
        creditLimit:nonnegative(req.body.creditLimit || 0), notes:str(req.body.notes,2000), archived:false,
        createdAt:now(), updatedAt:now() };
      readDb().customers.push(customer); saveDb(); res.status(201).json(customer);
    } catch(e){ handleError(res,e); }
  });
  router.put('/customers/:id',(req,res)=>{
    try {
      const customer = customerOf(req.params.id);
      const keys = ['name','contact','phone','whatsapp','email','address','taxNumber','category','paymentTerms','notes'] as const;
      for (const key of keys) if (req.body[key] !== undefined) customer[key] = str(req.body[key], key==='notes'?2000:400);
      if (!customer.name) throw new Error('اسم العميل مطلوب');
      if (req.body.creditLimit !== undefined) customer.creditLimit = nonnegative(req.body.creditLimit);
      customer.updatedAt = now(); saveDb(); res.json(customer);
    } catch(e){handleError(res,e);}
  });
  router.delete('/customers/:id',(req,res)=>{
    try { const customer=customerOf(req.params.id);customer.archived=true;customer.updatedAt=now();saveDb();res.json({success:true}); }
    catch(e){handleError(res,e);}
  });
  router.post('/materials',(req,res)=>{
    try {
      const name=str(req.body.name); if (!name) throw new Error('اسم المادة مطلوب');
      const material:Material={id:uid(),name,unit:str(req.body.unit)||'m2',costRate:nonnegative(req.body.costRate),updatedAt:now()};
      readDb().materials.push(material); saveDb();res.status(201).json(material);
    }catch(e){handleError(res,e);}
  });
  router.put('/materials/:id',(req,res)=>{
    try {const material=readDb().materials.find(m=>m.id===req.params.id);if(!material)throw new Error('المادة غير موجودة');
      if(req.body.name!==undefined)material.name=str(req.body.name);
      if(req.body.unit!==undefined)material.unit=str(req.body.unit);
      if(req.body.costRate!==undefined)material.costRate=nonnegative(req.body.costRate);
      material.updatedAt=now();saveDb();res.json(material);
    }catch(e){handleError(res,e);}
  });
  router.post('/estimates',(req,res)=>{
    try {
      const c=customerOf(str(req.body.customerId));
      const lines=req.body.lines as PrintLine[];
      if (!Array.isArray(lines) || !lines.length || lines.length>100) throw new Error('أضف بند طباعة واحد على الأقل');
      for (const l of lines) {
        if (!['area','linear','roll','sheet','pieces'].includes(l.mode)) throw new Error('نوع الطباعة غير صالح');
        if (!Number.isInteger(Number(l.quantity)) || Number(l.quantity)<1) throw new Error('الكمية يجب أن تكون عدداً صحيحاً موجباً');
        if (Number(l.widthCm)<=0 || Number(l.heightCm)<=0) throw new Error('الأبعاد يجب أن تكون أكبر من صفر');
        for(const k of ['widthCm','heightCm','quantity','rollWidthCm','sheetWidthCm','sheetHeightCm','wastePercent','materialCostRate','printingCostRate','finishingCostPerPiece','profitPercent'] as const) nonnegative(l[k]);
      }
      const discountPercent=nonnegative(req.body.discountPercent || 0,100);
      const taxPercent=nonnegative(req.body.taxPercent || 0,100);
      const safeLines=lines.map(l=>({id:uid(),label:str(l.label),mode:l.mode,printerId:str(l.printerId),material:str(l.material),
        widthCm:Number(l.widthCm),heightCm:Number(l.heightCm),quantity:Number(l.quantity),rollWidthCm:Number(l.rollWidthCm),
        sheetWidthCm:Number(l.sheetWidthCm),sheetHeightCm:Number(l.sheetHeightCm),wastePercent:Number(l.wastePercent),
        materialCostRate:Number(l.materialCostRate),printingCostRate:Number(l.printingCostRate),
        finishingCostPerPiece:Number(l.finishingCostPerPiece),profitPercent:Number(l.profitPercent),
        profitMethod:l.profitMethod==='margin'?'margin' as const:'markup' as const}));
      const totals=calculateEstimate(safeLines,discountPercent,taxPercent);
      const estimate:Estimate={id:uid(),customerId:c.id,title:str(req.body.title)||'حساب طباعة',lines:safeLines,
        discountPercent,taxPercent,totals,createdAt:now(),updatedAt:now()};
      readDb().estimates.push(estimate);saveDb();res.status(201).json(estimate);
    }catch(e){handleError(res,e);}
  });
  router.post('/quotes',(req,res)=>{
    try {
      const estimate=readDb().estimates.find(e=>e.id===req.body.estimateId);
      if(!estimate) throw new Error('احفظ الحساب أولاً');
      customerOf(estimate.customerId);
      const quote:Quote={id:uid(),customerId:estimate.customerId,estimateId:estimate.id,title:estimate.title,
        total:estimate.totals.total,lines:structuredClone(estimate.lines),totals:structuredClone(estimate.totals),
        status:'draft',createdAt:now()};
      readDb().quotes.push(quote);saveDb();res.status(201).json(quote);
    }catch(e){handleError(res,e);}
  });
  router.post('/quotes/:id/approve',(req,res)=>{
    try {
      const quote=readDb().quotes.find(q=>q.id===req.params.id);
      if(!quote)throw new Error('عرض السعر غير موجود');
      if(quote.status==='approved') {res.json(quote);return;}
      const customer=customerOf(quote.customerId);
      const first=quote.lines[0];
      const order:PrintJob={id:'crm-'+uid(),filename:quote.title||'Print Order',printer:first.printerId||'eco',
        status:'pending',sizeBytes:0,createdAt:now(),updatedAt:now(),
        material:first.material,quantity:quote.lines.reduce((a,l)=>a+Number(l.quantity),0),
        dimensions:first.widthCm+' × '+first.heightCm+' سم',customerName:customer.name,customerId:customer.id,
        notes:'CRM quotation #'+quote.id};
      quote.status='approved';quote.orderId=order.id;
      readDb().orders.push(order);saveDb();res.json(quote);
    }catch(e){handleError(res,e);}
  });
  router.post('/invoices',(req,res)=>{
    try {
      const quote=readDb().quotes.find(q=>q.id===req.body.quoteId);
      if(!quote || quote.status!=='approved')throw new Error('اعتمد عرض السعر أولاً');
      if(readDb().invoices.some(i=>i.quoteId===quote.id))throw new Error('تم إصدار فاتورة لهذا العرض سابقاً');
      const invoice:Invoice={id:uid(),customerId:quote.customerId,quoteId:quote.id,title:quote.title,
        total:quote.total,createdAt:now(),dueDate:str(req.body.dueDate,10)};
      readDb().invoices.push(invoice);saveDb();res.status(201).json({...invoice,balance:invoice.total});
    }catch(e){handleError(res,e);}
  });
  router.post('/payments',(req,res)=>{
    try {
      const invoice=readDb().invoices.find(i=>i.id===req.body.invoiceId);
      if(!invoice)throw new Error('الفاتورة غير موجودة');
      const amount=nonnegative(req.body.amount);if(amount<=0||Math.abs(amount*1000-Math.round(amount*1000))>0.00001)throw new Error('المبلغ يجب أن يكون أكبر من صفر وبحد أقصى ثلاث منازل عشرية');
      const kind=req.body.kind==='refund'?'refund':'payment';
      const balance=invoiceBalance(invoice.id);
      if(kind==='payment' && amount>Math.max(0,balance)+0.001)throw new Error('الدفعة أكبر من الرصيد المستحق');
      if(kind==='refund' && amount>invoice.total-balance+0.001)throw new Error('المبلغ المسترد يتجاوز الدفعات المسجلة');
      const payment:Payment={id:uid(),invoiceId:invoice.id,customerId:invoice.customerId,amount,
        kind,method:str(req.body.method)||'cash',note:str(req.body.note,500),createdAt:now()};
      readDb().payments.push(payment);saveDb();res.status(201).json(payment);
    }catch(e){handleError(res,e);}
  });
  const linkJob=(id:string, customerId:string)=>{
    if(customerId)customerOf(customerId);
    if(customerId) readDb().jobLinks[id]=customerId; else delete readDb().jobLinks[id];
    const order=readDb().orders.find(o=>o.id===id);
    if(order){order.customerId=customerId;order.customerName=customerId?customerOf(customerId).name:'';}
    saveDb();
  };
  router.post('/jobs/link',(req,res)=>{
    try {
      const id=str(req.body.jobId,200),customerId=str(req.body.customerId,200);
      if(!id)throw new Error('معرّف أمر الطباعة مطلوب');
      linkJob(id,customerId);res.json({jobId:id,customerId});
    }catch(e){handleError(res,e);}
  });
  router.get('/export',(req,res)=>{
    res.set('Content-Type','application/json; charset=utf-8');
    res.set('Content-Disposition','attachment; filename="print-management-backup.json"');
    res.set('Cache-Control','no-store');
    res.json(readDb());
  });
  app.use('/api/management',router);
  return {
    authenticated,
    guard,
    linkJob,
    getOrders: (req:Request) => authenticated(req) ? readDb().orders : [],
    decorate: (job:PrintJob):PrintJob => {
      const id=readDb().jobLinks[job.id];
      const c=id&&readDb().customers.find(c=>c.id===id);
      return c?{...job,customerId:c.id,customerName:c.name}:job;
    },
    isManagedOrder: (id:string) => readDb().orders.some(o=>o.id===id),
    updateOrder: (id:string,changes:Partial<PrintJob>) => {
      const order=readDb().orders.find(o=>o.id===id);if(!order)return false;
      const allowed: (keyof PrintJob)[]=['status','printer','customerId','customerName','material','quantity','notes','dimensions','priority'];
      for(const key of allowed) if(changes[key]!==undefined) (order as any)[key]=changes[key];
      order.updatedAt=now();saveDb();return true;
    },
    removeOrder: (id:string) => {
      const d=readDb();const before=d.orders.length;d.orders=d.orders.filter(o=>o.id!==id);
      if(before!==d.orders.length){saveDb();return true;}return false;
    },
  };
}
