import {strict as assert} from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ensureDailyPrinterFolders,localPrintDate} from './dailyPrinterFolders.ts';
assert.equal(localPrintDate(new Date(2026,10,2,9,0)),'02-11-2026');
assert.equal(localPrintDate(new Date(2026,11,31,23,59)),'31-12-2026');
const base=fs.mkdtempSync(path.join(os.tmpdir(),'gt-daily-folders-'));
try{
  assert.throws(()=>ensureDailyPrinterFolders(path.join(base,'missing'),'02-11-2026',['eco']),/غير موجود/);
  assert.throws(()=>ensureDailyPrinterFolders(base, '02-11-2026', ["../sneak"]), /غير صالح/);
  assert.throws(()=>ensureDailyPrinterFolders(base,'31-02-2026',['eco']),/تاريخ غير صالح/);
  const dir=ensureDailyPrinterFolders(base,'02-11-2026',['eco','dtf']);
  assert.equal(fs.existsSync(path.join(dir,'eco','done')),true);
  assert.equal(fs.existsSync(path.join(dir,'dtf','done')),true);
  const existing=path.join(dir,'eco','done','printed.pdf');
  fs.writeFileSync(existing,'sample');
  ensureDailyPrinterFolders(base,'02-11-2026',['eco','dtf']);
  ensureDailyPrinterFolders(base,'03-11-2026',['eco']);
  assert.equal(fs.readFileSync(existing,'utf8'),'sample','Existing print files must remain unchanged');
  assert.equal(fs.existsSync(path.join(base,'03-11-2026','eco','done')),true);
  assert.equal(fs.existsSync(path.join(base,'02-11-2026','eco','done')),true);
  console.log('Daily printer folder rollover and non-destructive tests passed');
}finally{fs.rmSync(base,{force:true,recursive:true});}
