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
  if (fs.existsSync(target)) throw new Error('يوجد ملف بالاسم نفسه في الوجهة؛ لم يتم استبداله');
  if (!fs.existsSync(path.join(dateRoot, targetPrinter))) throw new Error('مجلد الطابعة الهدف غير موجود');
  if (status === 'done') fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.renameSync(source, target);
  return {moved: true};
}
