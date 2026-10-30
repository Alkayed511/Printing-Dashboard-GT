/** Persist observed printer/done files independently of transient Kanban scans. */
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

export type PrinterScan = {
  jobId:string; filename:string; printer:string; dateFolder:string;
  status:'pending'|'done'; signature:string; createdAt:string;
  customerId?:string; dimensions?:string; material?:string; quantity?:number|null;
};
export type PrintLedgerRow = {
  id:string; jobId:string; filename:string; displayName?:string; previousNames:string[]; printer:string; dateFolder:string;
  status:'pending'|'done'; firstSeenAt:string; doneObservedAt:string|null;
  signature:string; customerId:string; dimensions:string; material:string;
  quantity:number|null; quantitySource:'filename'|'manual'|'unknown';
  priceJod:number|null; paidJod:number|null; notes:string; updatedAt:string;
};
let connection:DatabaseSync|undefined;
function db(){
  if(connection)return connection;
  const folder=path.resolve(process.env.PRINT_DATA_DIR||'.data');
  fs.mkdirSync(folder,{recursive:true,mode:0o700});
  connection=new DatabaseSync(path.join(folder,'print-ledger.sqlite'));
  connection.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000');
  connection.exec('CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,payload TEXT NOT NULL,updated_at TEXT NOT NULL)');
  return connection;
}
export function listLedger():PrintLedgerRow[]{
  return (db().prepare('SELECT payload FROM ledger ORDER BY updated_at DESC').all() as {payload:string}[])
    .map(x=>JSON.parse(x.payload) as PrintLedgerRow);
}
export function ledgerBalance(row:PrintLedgerRow):number|null{
  if(row.priceJod===null)return null;
  return Math.round((row.priceJod-(row.paidJod||0))*1000)/1000;
}
const roundMoney=(value:unknown):number=>{
  const number=Number(value);
  if(!Number.isFinite(number)||number<0||number>1e8||Math.abs(number*1000-Math.round(number*1000))>1e-6)
    throw Error('القيمة المالية يجب أن تكون موجبة وبحد أقصى 3 منازل عشرية');
  return Math.round(number*1000)/1000;
};
const count=(x:unknown):number=>{
  const n=Number(x);
  if(!Number.isInteger(n)||n<=0||n>1_000_000)throw Error('الكمية يجب أن تكون عدداً صحيحاً موجباً');
  return n;
};
/** First observation in done is NOT the actual machine printing timestamp. */
export function reconcileLedger(scans:PrinterScan[], timestamp=new Date().toISOString()):number{
  if(scans.length===0)return 0;
  const all=listLedger();
  const byJobId=new Map(all.map(x=>[x.jobId,x]));
  const currentSignatures=new Map<string,number>();
  for(const s of scans)if(s.signature)currentSignatures.set(s.signature,(currentSignatures.get(s.signature)||0)+1);
  const historicalSignatures=new Map<string,PrintLedgerRow[]>();
  for(const x of all)if(x.signature){
    historicalSignatures.set(x.signature,[...(historicalSignatures.get(x.signature)||[]),x]);
  }
  const modified=new Map<string,PrintLedgerRow>();
  const visited=new Set<string>();
  for(const scan of scans){
    if(!scan.jobId||!scan.filename)continue;
    let row=byJobId.get(scan.jobId);
    // A uniquely matching filesystem signature can reconnect a renamed/moved file.
    if(!row&&scan.signature&&currentSignatures.get(scan.signature)===1&&historicalSignatures.get(scan.signature)?.length===1){
      const previous=historicalSignatures.get(scan.signature)![0];
      if(!visited.has(previous.id))row=previous;
    }
    const original=row?JSON.stringify(row):'';
    if(!row){
      const qty=scan.quantity!==null&&scan.quantity!==undefined&&Number.isInteger(scan.quantity)&&scan.quantity>0?scan.quantity:null;
      row={id:randomUUID(),jobId:scan.jobId,filename:scan.filename,displayName:'',previousNames:[],printer:scan.printer,
        dateFolder:scan.dateFolder,status:scan.status,firstSeenAt:timestamp,
        doneObservedAt:scan.status==='done'?timestamp:null,signature:scan.signature,
        customerId:scan.customerId||'',dimensions:scan.dimensions||'',material:scan.material||'',
        quantity:qty,quantitySource:qty!==null?'filename':'unknown',
        priceJod:null,paidJod:null,notes:'',updatedAt:timestamp};
    }else{
      if(row.filename!==scan.filename){
        if(!row.previousNames.includes(row.filename))row.previousNames.push(row.filename);
        row.filename=scan.filename;
      }
      row.jobId=scan.jobId;
      row.printer=scan.printer;
      row.status=scan.status;
      row.signature=scan.signature||row.signature;
      if(!row.doneObservedAt&&scan.status==='done')row.doneObservedAt=timestamp;
      if(!row.customerId&&scan.customerId)row.customerId=scan.customerId;
      if(!row.dimensions&&scan.dimensions)row.dimensions=scan.dimensions;
      if(!row.material&&scan.material)row.material=scan.material;
      if(row.quantitySource==='unknown'&&scan.quantity&&scan.quantity>0){
        row.quantity=scan.quantity;row.quantitySource='filename';
      }
    }
    if(original!==JSON.stringify(row)){
      row.updatedAt=timestamp;
      modified.set(row.id,row);
      byJobId.set(row.jobId,row);
    }
    visited.add(row.id);
  }
  if(!modified.size)return 0;
  const conn=db();conn.exec('BEGIN IMMEDIATE');
  try{
    const upsert=conn.prepare('INSERT INTO ledger(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at');
    for(const row of modified.values())upsert.run(row.id,JSON.stringify(row),row.updatedAt);
    conn.exec('COMMIT');
  }catch(e){conn.exec('ROLLBACK');throw e;}
  return modified.size;
}
export function updateLedgerRow(id:string,patch:Record<string,unknown>):PrintLedgerRow{
  const row=listLedger().find(x=>x.id===id);
  if(!row)throw Error('سجل الطباعة غير موجود');
  if(Object.prototype.hasOwnProperty.call(patch,'customerId'))row.customerId=String(patch.customerId||'').slice(0,150);
  if(Object.prototype.hasOwnProperty.call(patch,'displayName'))row.displayName=String(patch.displayName||'').trim().slice(0,250);
  if(Object.prototype.hasOwnProperty.call(patch,'quantity')){
    if(patch.quantity===null||patch.quantity===''){row.quantity=null;row.quantitySource='unknown';}
    else {row.quantity=count(patch.quantity);row.quantitySource='manual';}
  }
  for(const key of ['dimensions','material','notes'] as const){
    if(Object.prototype.hasOwnProperty.call(patch,key))row[key]=String(patch[key]||'').trim().slice(0,key==='notes'?1500:250);
  }
  if(Object.prototype.hasOwnProperty.call(patch,'priceJod'))
    row.priceJod=patch.priceJod===null||patch.priceJod===''?null:roundMoney(patch.priceJod);
  if(Object.prototype.hasOwnProperty.call(patch,'paidJod'))
    row.paidJod=patch.paidJod===null||patch.paidJod===''?null:roundMoney(patch.paidJod);
  if(row.priceJod!==null&&row.paidJod!==null&&row.paidJod>row.priceJod)throw Error('المدفوع أكبر من السعر');
  row.updatedAt=new Date().toISOString();
  db().prepare('UPDATE ledger SET payload=?,updated_at=? WHERE id=?').run(JSON.stringify(row),row.updatedAt,id);
  return row;
}
