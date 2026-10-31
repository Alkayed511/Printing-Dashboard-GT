import {createHash} from 'node:crypto';
import path from 'node:path';
import type {Stats,BigIntStats} from 'node:fs';

/** A rename/move on the same volume does not change filesystem identity.
 * Unsupported network identities split conservatively instead of joining financial history.
 */
export function productionFileId(root:string,filename:string,stats:Pick<Stats,'dev'|'ino'|'birthtimeMs'|'ctimeMs'|'size'> | Pick<BigIntStats,'dev'|'ino'|'birthtimeMs'|'ctimeMs'|'size'>){
  const identity=stats.ino>0&&stats.birthtimeMs>0
    ? [path.resolve(root),String(stats.dev),String(stats.ino),String('birthtimeNs' in stats?stats.birthtimeNs:stats.birthtimeMs)]
    : [path.resolve(root),path.resolve(filename),String(stats.ctimeMs),String(stats.size)];
  return 'file-'+createHash('sha256').update(JSON.stringify(identity)).digest('hex').slice(0,24);
}
export function filenameQuantity(name:string):number|null{
  const match=name.match(/(?:^|[^\d.])(\d+)\s*(?:قطعة|قطع|pcs|copies)(?=$|[^a-z])/i);
  return match&&Number(match[1])>0&&Number(match[1])<=1_000_000?Number(match[1]):null;
}
export function filenameDimensions(name:string):string{
  const match=name.match(/(?:^|[^\d.])(\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?\s*(?:cm|mm|متر|سم|ملم|m))(?![a-z])/i);
  return match?match[1]:'مواصفات قياسية';
}
export function escapeHtml(value:unknown):string{
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
}
export function csvCell(value:unknown):string{
  const text=String(value??'');
  return '"'+(/^[=+@\-\t\r]/.test(text)?"'":'')+text.replace(/"/g,'""')+'"';
}
