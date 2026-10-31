import fs from 'node:fs';
import path from 'node:path';
import type {PrintJob, FileStatus} from '../types.ts';
import {validFolderName} from './serverConfig.ts';

/** Called only for an explicit, authenticated move of a file found by the server scan. */
export function moveProductionFile(dateRoot: string, job: PrintJob, status: FileStatus, targetPrinter: string) {
  if (!validFolderName(job.filename, 255) || !validFolderName(job.printer) || !validFolderName(targetPrinter) || !['pending','done'].includes(status)) throw new Error('ملف أو وجهة غير صالحة');
  const source = path.resolve(dateRoot, job.printer, ...(job.status === 'done' ? ['done'] : []), job.filename);
  const target = path.resolve(dateRoot, targetPrinter, ...(status === 'done' ? ['done'] : []), job.filename);
  const root = path.resolve(dateRoot) + path.sep;
  if (!source.startsWith(root) || !target.startsWith(root)) throw new Error('المسار خارج مجلد الإنتاج');
  if (source === target) return {moved: false};
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) throw new Error('الملف لم يعد موجودًا؛ حدّث اللوحة');
  const identity=fs.statSync(source,{bigint:true});
  if(!identity.ino||identity.birthtimeMs<=0)throw new Error('التخزين لا يوفر هوية ملف ثابتة؛ لم يتم النقل حفاظاً على ربط العميل والسجل');
  if (fs.existsSync(target)) throw new Error('يوجد ملف بالاسم نفسه في الوجهة؛ لم يتم استبداله');
  if (!fs.existsSync(path.join(dateRoot, targetPrinter))) throw new Error('مجلد الطابعة الهدف غير موجود');
  for(const folder of [dateRoot,path.join(dateRoot,job.printer),path.join(dateRoot,targetPrinter),...(job.status==='done'?[path.dirname(source)]:[])]){
    if(fs.lstatSync(folder).isSymbolicLink())throw new Error('مجلد الإنتاج رابط إلى مسار آخر؛ لم يتم النقل');
  }
  if (status === 'done') fs.mkdirSync(path.dirname(target), {recursive: true});
  if(fs.lstatSync(source).isSymbolicLink()||fs.lstatSync(path.dirname(target)).isSymbolicLink())throw new Error('مسار الإنتاج رابط غير مسموح');
  // link is exclusive: unlike rename it can never replace a competing writer's target.
  // No copy fallback: unsupported shares fail safely and keep the source intact.
  const staging=fs.mkdtempSync(path.join(path.dirname(source),'.gt-move-'));
  const staged=path.join(staging,job.filename);
  let claimed=false;
  try {
    // Probe support before moving the user's source. A share without hardlinks fails here.
    const probe=path.join(staging,'link-check');fs.linkSync(source,probe);fs.unlinkSync(probe);
    fs.renameSync(source,staged);claimed=true;
    const captured=fs.statSync(staged,{bigint:true});
    if(captured.dev!==identity.dev||captured.ino!==identity.ino||captured.birthtimeNs!==identity.birthtimeNs)throw new Error('تغيّر الملف أثناء النقل؛ لم تُنشر الوجهة');
    fs.linkSync(staged,target);
    // Only remove a path exclusively owned by this operation, never the public source name.
    fs.unlinkSync(staged);fs.rmdirSync(staging);
  }catch(error){
    if(claimed&&fs.existsSync(staged)){
      try {fs.linkSync(staged,source);fs.unlinkSync(staged);fs.rmdirSync(staging);}
      catch {throw new Error('تعذّر النقل أو الاسترجاع دون استبدال ملف. النسخة محفوظة داخل مجلد الطابعة: '+path.basename(staging));}
    }else{try{fs.rmdirSync(staging);}catch{/* Keep owned recovery files if cleanup is unavailable. */}}
    throw error;
  }
  return {moved: true};
}
