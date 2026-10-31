// Regression: Golden Target audit, 2026-11-01. All databases/files are synthetic.
import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {startTestServer} from './testServer.ts';
import {defaultLine,calculateLine,type PrintLine} from '../utils/printMath.ts';

async function fixture(fn:(s:Awaited<ReturnType<typeof startTestServer>>)=>Promise<void>,pin?:string){
  const s=await startTestServer(pin);try{await fn(s);}finally{await s.stop();}
}
async function json(s:Awaited<ReturnType<typeof startTestServer>>,url:string,body?:unknown,method?:string){
  const r=await s.request(url,body,method);assert.ok(r.ok,`${url}: ${r.status} ${r.ok?'':await r.text()}`);return r.json();
}
async function invoice(s:Awaited<ReturnType<typeof startTestServer>>,lines:PrintLine[]=[{...defaultLine(),mode:'pieces',quantity:1,materialCostRate:10,printingCostRate:0,wastePercent:0,profitPercent:0}]){
  const c=await json(s,'/api/management/customers',{name:'QA Customer',phone:'0791234567'});
  const e=await json(s,'/api/management/estimates',{customerId:c.id,lines});
  const q=await json(s,'/api/management/quotes',{estimateId:e.id});
  await json(s,`/api/management/quotes/${q.id}/approve`,{});
  const i=await json(s,'/api/management/invoices',{quoteId:q.id});
  return {c,e,q,i};
}
test('PIN login accepts a configured numeric PIN, rejects wrong PIN and guards APIs',()=>fixture(async s=>{
  assert.equal((await s.request('/api/files')).status,401);
  assert.equal((await s.request('/api/management/login',{password:'9999'})).status,401);
  assert.equal((await s.login()).status,200);
  assert.equal((await s.request('/api/files')).status,200);
  const malformed=await fetch(s.base+'/api/management/auth',{headers:{Cookie:'gt_session=%ZZ'},signal:AbortSignal.timeout(5000)});
  assert.equal((await malformed.json()).authenticated,false);
  for(let n=0;n<8;n++)assert.equal((await s.request('/api/management/login',{password:'wrong-pin'})).status,401);
  assert.equal((await s.request('/api/management/login',{password:'wrong-pin'})).status,429);
},'7319'));
test('rejected customer edit cannot change live or durable data; both phones remain unique',()=>fixture(async s=>{
  await s.login();const a=await json(s,'/api/management/customers',{name:'Original',phone:'0791234567'});
  const b=await json(s,'/api/management/customers',{name:'Other',phone:'0797654321'});
  assert.equal((await s.request('/api/management/customers/'+a.id,{name:'Wrong',creditLimit:-1},'PUT')).status,400);
  assert.equal((await json(s,'/api/management/data')).customers.find((x:any)=>x.id===a.id).name,'Original');
  assert.equal((await s.request('/api/management/customers',{name:'Duplicate',whatsapp:'0791111111',phone:'+962791234567'})).status,400);
  assert.equal((await s.request('/api/management/customers/'+b.id,{whatsapp:'00962791234567'},'PUT')).status,400);
}));
test('failed payment transaction cannot create a phantom payment or change balance',()=>fixture(async s=>{
  await s.login();const {i}=await invoice(s);
  const db=new DatabaseSync(path.join(s.data,'printing-management.sqlite'));
  try{
    db.exec("CREATE TRIGGER fail_payment BEFORE INSERT ON payments BEGIN SELECT RAISE(ABORT,'SYNTHETIC_WRITE_FAILURE'); END");
    assert.equal((await s.request('/api/management/payments',{invoiceId:i.id,amount:5})).status,400);
    const data=await json(s,'/api/management/data');assert.equal(data.payments.length,0);assert.equal(data.invoices[0].balance,10);
    db.exec('DROP TRIGGER fail_payment');
    await json(s,'/api/management/payments',{invoiceId:i.id,amount:5});
    assert.equal((await json(s,'/api/management/data')).invoices[0].balance,5);
  }finally{db.close();}
}));
test('payments and refunds never exceed the invoice balance by even one fils',()=>fixture(async s=>{
  await s.login();const {i}=await invoice(s);
  await json(s,'/api/management/payments',{invoiceId:i.id,amount:10});
  assert.equal((await s.request('/api/management/payments',{invoiceId:i.id,amount:.001})).status,400);
  assert.equal((await s.request('/api/management/payments',{invoiceId:i.id,amount:10.001,kind:'refund'})).status,400);
}));
test('approval preserves every production line and is idempotent',()=>fixture(async s=>{
  await s.login();const a={...defaultLine(),printerId:'eco',quantity:5,material:'vinyl'};
  const b={...defaultLine(),printerId:'flat',quantity:10,widthCm:20,material:'acrylic'};
  const {q}=await invoice(s,[a,b]);await json(s,`/api/management/quotes/${q.id}/approve`,{});
  const data=await json(s,'/api/management/data');assert.equal(data.orders.length,2);
  assert.deepEqual(data.orders.map((o:any)=>[o.printer,o.quantity,o.material]),[['eco',5,'vinyl'],['flat',10,'acrylic']]);
}));
test('file identity, customer links, money and metadata survive rename and printer move',()=>fixture(async s=>{
  await s.login();const c=await json(s,'/api/management/customers',{name:'First'});
  const b=await json(s,'/api/management/customers',{name:'Second'});
  const old=path.join(s.storage,'2026-11-01','eco','QA_25 pcs_150.5x200cm.pdf');fs.writeFileSync(old,'TEST FILE');
  let files=await json(s,'/api/files');const job=files.jobs[0];assert.equal(job.quantity,25);assert.equal(job.dimensions,'150.5x200cm');
  await json(s,'/api/management/jobs/link',{jobId:job.id,customerId:c.id});
  let ledger=await json(s,'/api/management/ledger');const row=ledger.rows[0];
  await json(s,'/api/management/ledger/'+row.id,{priceJod:100,paidJod:20},'PATCH');
  await json(s,'/api/files/'+job.id,{notes:'Must survive restart',quantity:7},'PUT');
  const persisted=new DatabaseSync(path.join(s.data,'printing-management.sqlite'));
  try{const saved=persisted.prepare('SELECT payload FROM app_settings WHERE id=?').get('jobOverrides') as {payload:string};assert.equal(JSON.parse(saved.payload)[job.id].notes,'Must survive restart');}finally{persisted.close();}
  const renamed=path.join(path.dirname(old),'renamed.pdf');fs.renameSync(old,renamed);
  files=await json(s,'/api/files');assert.equal(files.jobs[0].id,job.id);assert.equal(files.jobs[0].customerId,c.id);
  await json(s,'/api/files/move',{id:job.id,targetStatus:'done',printer:'flat'});
  ledger=await json(s,'/api/management/ledger');assert.equal(ledger.rows.length,1);assert.equal(ledger.rows[0].paidJod,20);assert.equal(ledger.rows[0].printer,'flat');
  await json(s,'/api/management/jobs/link',{jobId:job.id,customerId:b.id});
  ledger=await json(s,'/api/management/ledger');assert.equal(ledger.rows[0].customerId,b.id);
  await json(s,'/api/management/jobs/link',{jobId:job.id,customerId:''});
  ledger=await json(s,'/api/management/ledger');assert.equal(ledger.rows[0].customerId,'');
  fs.writeFileSync(old,'A DIFFERENT FILE');await json(s,'/api/files');
  ledger=await json(s,'/api/management/ledger');assert.equal(ledger.rows.length,2);assert.equal(ledger.rows.find((x:any)=>x.jobId!==job.id).priceJod,null);
}));
test('printer junctions cannot expose their external done folder through scanning',()=>fixture(async s=>{
  await s.login();const printer=path.join(s.storage,'2026-11-01','eco');
  const foreign=path.join(s.root,'outside-production');fs.mkdirSync(path.join(foreign,'done'),{recursive:true});
  fs.writeFileSync(path.join(foreign,'done','MUST-NOT-SCAN.pdf'),'OUTSIDE SCOPE');
  fs.renameSync(printer,path.join(s.root,'saved-printer'));
  fs.symlinkSync(foreign,printer,'junction');
  const files=await json(s,'/api/files');assert.equal(files.jobs.length,0);assert.ok(files.warnings.length>0);
  assert.equal((await s.request('/api/files?date=../outside')).status,400);
}));
test('background observation records done files without a dashboard request',()=>fixture(async s=>{
  await s.login();await json(s,'/api/config',{autoRefreshInterval:5});
  fs.writeFileSync(path.join(s.storage,'2026-11-01','eco','done','background_10pcs.pdf'),'TEST');
  const ledgerFile=path.join(s.data,'print-ledger.sqlite');let observed=false;
  const deadline=Date.now()+12000;
  while(Date.now()<deadline&&!observed){
    if(fs.existsSync(ledgerFile)){
      const db=new DatabaseSync(ledgerFile,{readOnly:true});
      try{const row=db.prepare('SELECT payload FROM ledger').get() as {payload:string}|undefined;observed=!!row&&JSON.parse(row.payload).quantity===10;}finally{db.close();}
    }
    if(!observed)await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.equal(observed,true,'The background observer must write the file without GET /files or /ledger');
}));
test('report HTML escapes fields and the backup includes the print ledger',()=>fixture(async s=>{
  await s.login();fs.writeFileSync(path.join(s.storage,'2026-11-01','eco','done','QA.pdf'),'TEST');
  const job=(await json(s,'/api/files')).jobs[0];
  await json(s,'/api/files/'+job.id,{customerName:'<b>QA</b>'},'PUT');
  const report=await s.request('/api/reports/export/pdf?type=daily&startDate=2026-11-01');
  const html=await report.text();assert.ok(!html.includes('<b>QA</b>'));assert.ok(html.includes('&lt;b&gt;QA&lt;/b&gt;'));
  const backup=await json(s,'/api/management/export');assert.equal(backup.ledger.length,1);
}));
test('ledger and CRM customer changes roll back together when either store rejects a write',()=>fixture(async s=>{
  await s.login();const c=await json(s,'/api/management/customers',{name:'QA'});
  fs.writeFileSync(path.join(s.storage,'2026-11-01','eco','test.pdf'),'TEST');
  const row=(await json(s,'/api/management/ledger')).rows[0];
  const db=new DatabaseSync(path.join(s.data,'print-ledger.sqlite'));
  try{
    db.exec("CREATE TRIGGER fail_ledger BEFORE UPDATE ON ledger BEGIN SELECT RAISE(ABORT,'SYNTHETIC_WRITE_FAILURE'); END");
    assert.equal((await s.request('/api/management/ledger/'+row.id,{customerId:c.id,priceJod:25},'PATCH')).status,400);
    assert.equal((await json(s,'/api/management/data')).jobLinks[row.jobId],undefined);
    assert.equal((await json(s,'/api/management/ledger')).rows[0].priceJod,null);
    db.exec('DROP TRIGGER fail_ledger');
    await json(s,'/api/management/ledger/'+row.id,{customerId:c.id,priceJod:25},'PATCH');
    assert.equal((await json(s,'/api/management/data')).jobLinks[row.jobId],c.id);
  }finally{db.close();}
}));
test('stale ledger forms cannot overwrite a newer price or payment',()=>fixture(async s=>{
  await s.login();fs.writeFileSync(path.join(s.storage,'2026-11-01','eco','test.pdf'),'TEST');
  const row=(await json(s,'/api/management/ledger')).rows[0];
  await json(s,'/api/management/ledger/'+row.id,{priceJod:100,paidJod:20,expectedUpdatedAt:row.updatedAt},'PATCH');
  assert.equal((await s.request('/api/management/ledger/'+row.id,{priceJod:50,paidJod:0,expectedUpdatedAt:row.updatedAt},'PATCH')).status,400);
  const current=(await json(s,'/api/management/ledger')).rows[0];assert.equal(current.priceJod,100);assert.equal(current.paidJod,20);
}));
test('archived customers retain their names and can settle existing ledger debts',()=>fixture(async s=>{
  await s.login();const c=await json(s,'/api/management/customers',{name:'Archived customer'});
  fs.writeFileSync(path.join(s.storage,'2026-11-01','eco','test.pdf'),'TEST');
  const row=(await json(s,'/api/management/ledger')).rows[0];
  await json(s,'/api/management/ledger/'+row.id,{customerId:c.id,priceJod:25},'PATCH');
  await json(s,'/api/management/customers/'+c.id,undefined,'DELETE');
  const saved=await json(s,'/api/management/ledger/'+row.id,{customerId:c.id,paidJod:10},'PATCH');
  assert.equal(saved.balanceJod,15);
}));
test('pricing keeps markup above 100%, converts material units and rejects invalid percentages',()=>{
  const line={...defaultLine(),mode:'pieces' as const,quantity:1,wastePercent:0,materialCostRate:10,printingCostRate:0,profitPercent:150};
  assert.equal(calculateLine(line).sellingPrice,25);
  assert.throws(()=>calculateLine({...line,wastePercent:101}));
  const roll:PrintLine={...line,mode:'roll',widthCm:160,heightCm:100,rollWidthCm:160,profitPercent:0,materialUnit:'m2'};
  assert.equal(calculateLine(roll).productionCost,16);
});
