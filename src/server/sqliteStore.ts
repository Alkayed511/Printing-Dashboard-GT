/** Durable SQLite store for the print shop. Node.js >=22.13 is required. */
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type RecordName = 'customers' | 'estimates' | 'quotes' | 'invoices' | 'payments' | 'materials' | 'orders';
const tableNames: RecordName[] = ['customers','estimates','quotes','invoices','payments','materials','orders'];
let database: DatabaseSync | undefined;

function openDb() {
  if (database) return database;
  const folder = path.resolve(process.env.PRINT_DATA_DIR || '.data');
  fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path.join(folder,'printing-management.sqlite'));
  db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
  for (const table of tableNames) {
    db.exec(`CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL);`);
  }
  db.exec('CREATE TABLE IF NOT EXISTS job_links (job_id TEXT PRIMARY KEY NOT NULL, customer_id TEXT NOT NULL);');
  db.exec('CREATE TABLE IF NOT EXISTS app_settings (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL);');
  database = db;
  return db;
}

export function readRecords<T>(table: RecordName): T[] {
  return (openDb().prepare(`SELECT payload FROM ${table}`).all() as Array<{payload:string}>).map(row=>JSON.parse(row.payload) as T);
}
export function readJobLinks(): Record<string,string> {
  const rows = openDb().prepare('SELECT job_id,customer_id FROM job_links').all() as Array<{job_id:string;customer_id:string}>;
  return Object.fromEntries(rows.map(r=>[r.job_id,r.customer_id]));
}
/** Atomically flush the in-memory snapshot. No partial financial writes. */
export function writeSnapshot(data: {jobLinks: Record<string,string>} & Record<RecordName,Array<{id:string}>>) {
  const db = openDb();
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const table of tableNames) {
      const statement = db.prepare(`INSERT INTO ${table} (id,payload) VALUES (?,?)`);
      db.prepare(`DELETE FROM ${table}`).run();
      for (const entry of data[table]) statement.run(entry.id,JSON.stringify(entry));
    }
    db.prepare('DELETE FROM job_links').run();
    const insert = db.prepare('INSERT INTO job_links (job_id,customer_id) VALUES (?,?)');
    for(const [jobId,cId] of Object.entries(data.jobLinks)) insert.run(jobId,cId);
    db.exec('COMMIT');
  } catch(error) { db.exec('ROLLBACK'); throw error; }
}

export function readSnapshot() {
  return {
    customers:readRecords('customers'), estimates:readRecords('estimates'), quotes:readRecords('quotes'),
    invoices:readRecords('invoices'), payments:readRecords('payments'), materials:readRecords('materials'),
    orders:readRecords('orders'), jobLinks:readJobLinks(),
  };
}

/** Legacy dashboard settings remain durable even when insecure Firestore sync is disabled. */
export function readServerSettings(): Record<string,unknown> {
  const row=openDb().prepare('SELECT payload FROM app_settings WHERE id=?').get('global') as {payload:string}|undefined;
  if(!row)return {};
  try {return JSON.parse(row.payload)}catch{return {}};
}
export function writeServerSettings(settings: Record<string,unknown>) {
  openDb().prepare('INSERT INTO app_settings(id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run('global', JSON.stringify(settings));
}

export function readLocalState<T>(id:string, fallback:T):T {
  const row=openDb().prepare('SELECT payload FROM app_settings WHERE id=?').get(id) as {payload:string}|undefined;
  if(!row)return fallback;
  try{return JSON.parse(row.payload) as T}catch{return fallback}
}
export function writeLocalState<T>(id:string, data:T) {
  openDb().prepare('INSERT INTO app_settings(id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(id, JSON.stringify(data));
}
