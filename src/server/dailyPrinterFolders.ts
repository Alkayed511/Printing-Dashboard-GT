/** Ensure today's print-folder tree exists, preserving previous days and files. */
import fs from 'node:fs';
import path from 'node:path';

export function localPrintDate(date=new Date()):string {
  const pad=(n:number)=>String(n).padStart(2,'0');
  return [pad(date.getDate()),pad(date.getMonth()+1),date.getFullYear()].join('-');
}
export function ensureDailyPrinterFolders(basePath:string,date:string,printerIds:string[]):string{
  if(!path.isAbsolute(basePath)||!fs.existsSync(basePath)||!fs.statSync(basePath).isDirectory())
    throw Error('المسار الأساسي للطباعة غير موجود أو غير متاح. اضبط مجلد الطباعة الصحيح أولاً.');
  if(!/^\d{2}-\d{2}-\d{4}$/.test(date))throw Error('تاريخ مجلد الطباعة غير صالح');
  const [d,m,y]=date.split('-').map(Number);
  const verify=new Date(y,m-1,d);
  if(verify.getDate()!==d||verify.getMonth()!==m-1||verify.getFullYear()!==y)throw Error('تاريخ غير صالح');
  const cleanIds=[...new Set(printerIds)];
  if(cleanIds.some(x=>!x||x==='.'||x==='..'||x==='done'||/[\\/:*?"<>|\x00-\x1f]/.test(x)))
    throw Error('أحد معرفات الطابعات غير صالح لمسار المجلد');
  const target=path.join(basePath,date);
  fs.mkdirSync(target,{recursive:true});
  for(const id of cleanIds)fs.mkdirSync(path.join(target,id,'done'),{recursive:true});
  return target;
}
