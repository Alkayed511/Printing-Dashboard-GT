/** Store WhatsApp inbox and design revisions independently of renamed production files. */
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type IncomingMessage = {
  id: string; customerId: string; from: string; name: string;
  type: string; text: string; mediaId: string; fileName: string; mimeType: string;
  receivedAt: string;
};
export type Revision = { id: string; fileName: string; dimensions: string; printer: string; notes: string; createdAt: string };
export type IntakeStatus = 'received' | 'designing' | 'ready' | 'printing' | 'completed';
export type IntakeRequest = {
  id: string; customerId: string; source: 'whatsapp' | 'manual'; sourceMessageId: string;
  title: string; notes: string; status: IntakeStatus; linkedJobId: string;
  revisions: Revision[]; createdAt: string; updatedAt: string;
};
let db: DatabaseSync | undefined;
function open() {
  if (db) return db;
  const folder = path.resolve(process.env.PRINT_DATA_DIR || '.data');
  fs.mkdirSync(folder, {recursive:true,mode:0o700});
  const con = new DatabaseSync(path.join(folder,'print-intake.sqlite'));
  con.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000');
  con.exec('CREATE TABLE IF NOT EXISTS inbox (id TEXT PRIMARY KEY, payload TEXT NOT NULL, received_at TEXT NOT NULL)');
  con.exec('CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL)');
  db=con;return con;
}
const clock=()=>new Date().toISOString();
export const newId=()=>randomUUID();
export const requestId=()=> 'GT-' + Date.now().toString(36).toUpperCase() + '-' + randomUUID().slice(0,5).toUpperCase();
export function storeIncoming(message:IncomingMessage) {
  const result=open().prepare('INSERT OR IGNORE INTO inbox(id,payload,received_at) VALUES(?,?,?)')
    .run(message.id,JSON.stringify(message),message.receivedAt);
  return result.changes===1;
}
export function assignIncomingCustomer(id:string,customerId:string):void {
  const row=open().prepare('SELECT payload FROM inbox WHERE id=?').get(id) as {payload:string}|undefined;
  if(!row)throw new Error('الرسالة غير موجودة');
  const record=JSON.parse(row.payload) as IncomingMessage;
  record.customerId=customerId;
  open().prepare('UPDATE inbox SET payload=? WHERE id=?').run(JSON.stringify(record),id);
}

export function incomingMessages():IncomingMessage[] {
  return (open().prepare('SELECT payload FROM inbox ORDER BY received_at DESC LIMIT 1000').all() as {payload:string}[])
    .map(r=>JSON.parse(r.payload) as IncomingMessage);
}
export function listRequests():IntakeRequest[]{
  return (open().prepare('SELECT payload FROM requests ORDER BY updated_at DESC').all() as {payload:string}[])
    .map(r=>JSON.parse(r.payload) as IntakeRequest);
}
export function getRequest(id:string):IntakeRequest|undefined{
  const row=open().prepare('SELECT payload FROM requests WHERE id=?').get(id) as {payload:string}|undefined;
  return row?JSON.parse(row.payload) as IntakeRequest:undefined;
}
export function insertRequest(record:IntakeRequest){
  open().prepare('INSERT INTO requests(id,payload,updated_at) VALUES(?,?,?)')
    .run(record.id,JSON.stringify(record),record.updatedAt);
}
export function updateRequest(id:string,patch:(record:IntakeRequest)=>void):IntakeRequest {
  const item=getRequest(id);
  if(!item)throw new Error('طلب غير موجود');
  patch(item);item.updatedAt=clock();
  open().prepare('UPDATE requests SET payload=?,updated_at=? WHERE id=?')
    .run(JSON.stringify(item),item.updatedAt,id);
  return item;
}
export function createRequest(options:Pick<IntakeRequest,'customerId'|'source'|'sourceMessageId'|'title'|'notes'>):IntakeRequest{
  const timestamp=clock();
  const item:IntakeRequest={...options,id:requestId(),status:'received',linkedJobId:'',revisions:[],createdAt:timestamp,updatedAt:timestamp};
  insertRequest(item);
  return item;
}
