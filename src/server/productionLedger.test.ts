import {strict as assert} from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {listLedger,reconcileLedger,updateLedgerRow} from './productionLedger.ts';
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'gt-print-ledger-'));
process.env.PRINT_DATA_DIR=folder;
try{
  const first={jobId:'old-name',filename:'banner-old.pdf',dateFolder:'30-10',
    printer:'eco',status:'pending' as const,signature:'stable-file-key',createdAt:'2026-10-30T08:00:00Z',
    quantity:null,customerId:'customer-1',dimensions:'200x100cm',material:'بنر'};
  assert.equal(reconcileLedger([first],'2026-10-30T08:01:00Z'),1);
  assert.equal(reconcileLedger([first],'2026-10-30T08:02:00Z'),0,'Repeated refresh does not duplicate');
  assert.equal(listLedger().length,1);
  const printed={...first,jobId:'new-name',filename:'banner-final.pdf',status:'done' as const};
  assert.equal(reconcileLedger([printed],'2026-10-30T09:00:00Z'),1);
  const row=listLedger()[0];
  assert.equal(row.id,listLedger()[0].id);
  assert.equal(row.filename,'banner-final.pdf');
  assert.deepEqual(row.previousNames,['banner-old.pdf']);
  assert.equal(row.doneObservedAt,'2026-10-30T09:00:00Z');
  assert.equal(row.quantity,null,'Do not invent copies from filename with no count');
  assert.equal(reconcileLedger([printed],'2026-10-30T09:10:00Z'),0);
  assert.equal(listLedger().length,1);
  const edited=updateLedgerRow(row.id,{quantity:3,priceJod:15.5,paidJod:5,displayName:'Customer banner',notes:'Customer approved'});
  assert.equal(edited.displayName,'Customer banner');
  assert.equal(edited.quantity,3);assert.equal(edited.quantitySource,'manual');
  assert.equal(edited.priceJod,15.5);assert.equal(edited.paidJod,5);
  assert.throws(()=>updateLedgerRow(row.id,{paidJod:20}),/المدفوع/);
  reconcileLedger([{...printed,jobId:'after-second-rename',filename:'updated-file.pdf'}],'2026-10-30T10:00:00Z');
  assert.equal(listLedger().length,1);
  assert.equal(listLedger()[0].quantity,3,'Manual quantity retained across renames');
  assert.equal(listLedger()[0].paidJod,5);
  console.log('Print ledger monitoring, rename retention and financial fields tests passed');
}finally{fs.rmSync(folder,{force:true,recursive:true});}
