/** Stable associations for production files whose filename-based scanner IDs may change. */
export type FileSnapshot = {jobId:string; filename:string; printer:string};
export type PreviousFile = FileSnapshot & {replacedAt:string};
export type LinkedProductionFile = FileSnapshot & {
  id:string; linkedAt:string; note:string; previousFiles?:PreviousFile[];
};
export type FileLinkRecord = {linkedJobId:string; linkedFiles?:LinkedProductionFile[]};
export function getLinkedFiles(record:FileLinkRecord):LinkedProductionFile[] {
  if(Array.isArray(record.linkedFiles))return record.linkedFiles;
  // Older versions stored only one id, without a filename snapshot.
  if(!record.linkedJobId)return [];
  return [{id:'legacy-'+record.linkedJobId,jobId:record.linkedJobId,
    filename:record.linkedJobId,printer:'',linkedAt:'',note:''}];
}
function setLinks(record:FileLinkRecord,items:LinkedProductionFile[]){
  record.linkedFiles=items;
  record.linkedJobId=items[0]?.jobId||'';
}
export function addLinkedFiles(
  record:FileLinkRecord,files:FileSnapshot[],makeId:()=>string,now:string
):LinkedProductionFile[]{
  const links=[...getLinkedFiles(record)];
  if(links.length+files.length>100)throw Error('الحد الأقصى 100 ملف للطلب');
  const newIds=new Set<string>();
  for(const f of files){
    if(!f.jobId||!f.filename)throw Error('بيانات ملف الطباعة ناقصة');
    if(links.some(x=>x.jobId===f.jobId)||newIds.has(f.jobId))
      throw Error('الملف مربوط بهذا الطلب بالفعل');
    newIds.add(f.jobId);
  }
  const added=files.map(f=>({...f,id:makeId(),linkedAt:now,note:''}));
  setLinks(record,[...links,...added]);
  return added;
}
export function editLinkedFile(
  record:FileLinkRecord,linkId:string,file:FileSnapshot,note:string,now:string
):{previousJobId:string;current:LinkedProductionFile}{
  const links=[...getLinkedFiles(record)];
  const index=links.findIndex(x=>x.id===linkId);
  if(index<0)throw Error('الربط غير موجود');
  if(links.some((x,i)=>i!==index&&x.jobId===file.jobId))throw Error('الملف مربوط بهذا الطلب بالفعل');
  const prior=links[index];
  const replaced=prior.jobId!==file.jobId;
  const previousFiles=replaced
    ?[...(prior.previousFiles||[]),{jobId:prior.jobId,filename:prior.filename,printer:prior.printer,replacedAt:now}]
    :prior.previousFiles;
  const current={...prior,...file,note,previousFiles};
  links[index]=current;
  setLinks(record,links);
  return {previousJobId:replaced?prior.jobId:'',current};
}
export function removeLinkedFile(record:FileLinkRecord,linkId:string):LinkedProductionFile{
  const links=[...getLinkedFiles(record)];
  const match=links.find(l=>l.id===linkId);
  if(!match)throw Error('الربط غير موجود');
  setLinks(record,links.filter(l=>l.id!==linkId));
  return match;
}
