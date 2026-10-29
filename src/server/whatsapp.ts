/** Official WhatsApp Business Cloud API inbound webhook and authenticated design intake API. */
import type { Express, RequestHandler } from 'express';
import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  newId, storeIncoming, assignIncomingCustomer, incomingMessages, listRequests, getRequest, createRequest, updateRequest,
  type IncomingMessage, type IntakeStatus, type Revision
} from './intakeStore';
import {normalizeWhatsApp} from '../utils/whatsapp';
import {validCustomerId} from './management';

const safe=(x:unknown,limit=250)=>typeof x==='string'?x.trim().slice(0,limit):'';
const statuses:IntakeStatus[]=['received','designing','ready','printing','completed'];
const urlRegex=/^[a-zA-Z0-9_-]{3,240}$/;
const configured=()=>Boolean(process.env.WHATSAPP_VERIFY_TOKEN && process.env.WHATSAPP_APP_SECRET);
const time=()=>new Date().toISOString();

export function mountWhatsAppWebhook(app:Express,resolveCustomer:(phone:string,name:string)=>string){
  app.get('/api/whatsapp/webhook',(req,res)=>{
    if(!configured()){res.sendStatus(503);return;}
    const mode=req.query['hub.mode'];
    const verify=req.query['hub.verify_token'];
    const challenge=req.query['hub.challenge'];
    const token=process.env.WHATSAPP_VERIFY_TOKEN||'';
    if(mode==='subscribe' && typeof verify==='string' && typeof challenge==='string'
       && verify.length===token.length
       && timingSafeEqual(Buffer.from(verify),Buffer.from(token))){
      res.type('text/plain').send(challenge);return;
    }
    res.sendStatus(403);
  });

  // Mount before express.json: Meta's X-Hub-Signature-256 must sign the exact raw bytes.
  app.post('/api/whatsapp/webhook',express.raw({type:'application/json',limit:'3mb'}),(req,res)=>{
    if(!configured()){res.sendStatus(503);return;}
    const data=Buffer.isBuffer(req.body)?req.body:Buffer.alloc(0);
    const signature=req.get('x-hub-signature-256')||'';
    const actual=/^sha256=([0-9a-f]{64})$/i.exec(signature)?.[1];
    if(!actual){res.sendStatus(401);return;}
    const expected=createHmac('sha256',process.env.WHATSAPP_APP_SECRET||'').update(data).digest('hex');
    if(!timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(actual,'hex'))){res.sendStatus(401);return;}
    try{
      const payload=JSON.parse(data.toString('utf8'));
      if(payload.object!=='whatsapp_business_account'){res.sendStatus(200);return;}
      for(const entry of payload.entry||[]){
        for(const change of entry.changes||[]){
          if(change.field!=='messages')continue;
          const value=change.value||{};
          const contacts=Array.isArray(value.contacts)?value.contacts:[];
          for(const msg of (Array.isArray(value.messages)?value.messages:[])){
            const sender=normalizeWhatsApp(msg.from);
            const id=safe(msg.id,200);
            if(!sender||!id)continue;
            const name=safe(contacts.find((x:any)=>normalizeWhatsApp(x.wa_id)===sender)?.profile?.name,180);
            const customerId=resolveCustomer(sender,name);
            const kind=safe(msg.type,40);
            const media=['image','document','audio','video','sticker'].includes(kind)?msg[kind]||{}:{};
            const record:IncomingMessage={
              id,customerId,from:sender,name,
              type:kind||'unknown',text:safe(msg.text?.body||media.caption||'',3000),
              mediaId:safe(media.id,240),fileName:safe(media.filename,240),
              mimeType:safe(media.mime_type,150),
              receivedAt: /^\d{10,13}$/.test(String(msg.timestamp))?
                new Date(Number(msg.timestamp)*1000).toISOString():time()
            };
            storeIncoming(record); // primary key makes repeated webhook deliveries idempotent
          }
        }
      }
      res.sendStatus(200);
    }catch(err){
      // Return error so Meta can retry transient failures; do not log private message content.
      console.error('WhatsApp webhook processing failed:',err instanceof Error?err.message:'unknown');
      res.sendStatus(500);
    }
  });
}

export function mountIntakeRoutes(app:Express,guard:RequestHandler,linkJob:(jobId:string,customerId:string)=>void){
  const r=express.Router();
  r.use(guard);
  r.get('/data',(_req,res)=>{res.set('Cache-Control','no-store');res.json({
    messages:incomingMessages(),requests:listRequests(),
    whatsappConfigured:configured()&&Boolean(process.env.WHATSAPP_ACCESS_TOKEN)
  });});
  r.post('/requests',(req,res)=>{
    const customerId=safe(req.body?.customerId,150);
    if(!validCustomerId(customerId)){res.status(400).json({error:'اختر عميلاً مسجلاً أولاً'});return;}
    const sourceMessageId=safe(req.body?.sourceMessageId,200);
    let source:'whatsapp'|'manual'='manual';
    if(sourceMessageId){
      const msg=incomingMessages().find(m=>m.id===sourceMessageId&&m.customerId===customerId);
      if(!msg){res.status(400).json({error:'هذه الرسالة غير مرتبطة بالعميل المختار'});return;}
      if(listRequests().some(r=>r.sourceMessageId===sourceMessageId)){res.status(409).json({error:'تم تحويل هذه الرسالة إلى طلب سابقاً'});return;}
      source='whatsapp';
    }
    const title=safe(req.body?.title,250);
    if(!title){res.status(400).json({error:'اسم الطلب مطلوب'});return;}
    const record=createRequest({customerId,source,sourceMessageId,title,notes:safe(req.body?.notes,2000)});
    res.status(201).json(record);
  });
  r.patch('/requests/:id',(req,res)=>{
    try{
      const status=safe(req.body?.status,40) as IntakeStatus;
      if(req.body?.status!==undefined&&!statuses.includes(status)){res.status(400).json({error:'حالة غير صحيحة'});return;}
      const record=updateRequest(req.params.id,record=>{
        if(req.body?.title!==undefined){
          const title=safe(req.body.title,250);
          if(!title)throw Error('اسم الطلب مطلوب');
          record.title=title;
        }
        if(req.body?.notes!==undefined)record.notes=safe(req.body.notes,2000);
        if(req.body?.status!==undefined)record.status=status;
      });
      res.json(record);
    }catch(e){res.status(400).json({error:e instanceof Error?e.message:'تعذّر تحديث الطلب'});}
  });
  r.post('/requests/:id/revisions',(req,res)=>{
    try {
      const fileName=safe(req.body?.fileName,250);
      if(!fileName)throw Error('اسم الملف مطلوب');
      const dimensions=safe(req.body?.dimensions,120);
      const printer=safe(req.body?.printer,100);
      const notes=safe(req.body?.notes,1000);
      const revision:Revision={id:newId(),fileName,dimensions,printer,notes,createdAt:time()};
      const record=updateRequest(req.params.id,item=>{if(item.revisions.length>=250)throw Error('تم تجاوز عدد النسخ المتاح');item.revisions.push(revision);});
      res.status(201).json(record);
    }catch(e){res.status(400).json({error:e instanceof Error?e.message:'تعذّر حفظ النسخة'});}
  });
  r.post('/requests/:id/link-job',(req,res)=>{
    try{
      const jobId=safe(req.body?.jobId,230);
      const record=getRequest(req.params.id);
      if(!record)throw Error('الطلب غير موجود');
      if(!validCustomerId(record.customerId))throw Error('العميل غير موجود');
      // Explicitly select a scanned/managed production job; never auto-match filenames.
      if(jobId)linkJob(jobId,record.customerId);
      const result=updateRequest(record.id,item=>{item.linkedJobId=jobId;if(jobId&&item.status==='ready')item.status='printing';});
      res.json(result);
    }catch(e){res.status(400).json({error:e instanceof Error?e.message:'فشل الربط'});}
  });
  r.post('/messages/:id/assign',(req,res)=>{
    const customerId=safe(req.body?.customerId,150);
    if(!validCustomerId(customerId)){res.status(400).json({error:'اختر عميلاً صالحاً'});return;}
    const item=incomingMessages().find(x=>x.id===req.params.id);
    if(!item){res.sendStatus(404);return;}
    // Assignment updates a separate message's customer through a prepared SQLite statement.
    try { assignIncomingCustomer(item.id,customerId);res.json({success:true}); }
    catch(e){res.status(400).json({error:e instanceof Error?e.message:'تعذّر ربط الرسالة'});}
  });
  r.get('/media/:messageId',async(req,res)=>{
    const item=incomingMessages().find(x=>x.id===req.params.messageId);
    if(!item?.mediaId || !urlRegex.test(item.mediaId)){res.sendStatus(404);return;}
    const token=process.env.WHATSAPP_ACCESS_TOKEN||'';
    if(!token){res.status(503).json({error:'يجب إعداد WHATSAPP_ACCESS_TOKEN لتنزيل مرفقات واتساب'});return;}
    try{
      const graphVersion=process.env.WHATSAPP_GRAPH_VERSION||'v24.0';
      if(!/^v\d{1,2}\.\d{1,2}$/.test(graphVersion))throw Error('Invalid Graph version');
      const meta=await fetch('https://graph.facebook.com/'+graphVersion+'/'+encodeURIComponent(item.mediaId),{
        headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(15000)
      });
      if(!meta.ok)throw Error('تعذر جلب رابط المرفق من واتساب');
      const info=await meta.json() as {url?:string};
      if(!info.url)throw Error('لم يعد المرفق متاحاً');
      const dest=new URL(info.url);
      if(dest.protocol!=='https:'||!(['lookaside.fbsbx.com','lookaside.facebook.com','graph.facebook.com'].includes(dest.hostname))){
        throw Error('رابط المرفق غير موثوق');
      }
      const response=await fetch(dest,{headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw Error('تعذر تنزيل المرفق');
      const max=40*1024*1024;
      if(Number(response.headers.get('content-length')||0)>max)throw Error('المرفق أكبر من 40 MB؛ نزّله مباشرة من واتساب');
      const bytes=Buffer.from(await response.arrayBuffer());
      if(bytes.length>max)throw Error('المرفق أكبر من 40 MB؛ نزّله مباشرة من واتساب');
      const filename=(item.fileName||'whatsapp-design-'+item.id).replace(/[^a-zA-Z0-9_.-]/g,'_').slice(0,120);
      res.setHeader('Content-Type','application/octet-stream');
      res.setHeader('X-Content-Type-Options','nosniff');
      res.setHeader('Content-Disposition','attachment; filename="'+filename+'"');
      res.setHeader('Cache-Control','private, no-store');
      res.send(bytes);
    }catch(e){res.status(502).json({error:e instanceof Error?e.message:'تعذّر تنزيل المرفق'});}
  });
  r.get('/export',(_req,res)=>{
    res.set('Cache-Control','no-store');
    res.set('Content-Disposition','attachment; filename="gt-design-intake-backup.json"');
    res.json({messages:incomingMessages(),requests:listRequests()});
  });
  app.use('/api/management/intake',r);
}
