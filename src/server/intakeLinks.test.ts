import {strict as assert} from 'node:assert';
import {addLinkedFiles,editLinkedFile,getLinkedFiles,removeLinkedFile} from './intakeLinks.ts';
const request={linkedJobId:'',linkedFiles:[] as ReturnType<typeof getLinkedFiles>};
let seq=0;
const id=()=>String(++seq);
const original=[
  {jobId:'job-a',filename:'banner-old.pdf',printer:'eco'},
  {jobId:'job-b',filename:'poster.pdf',printer:'uv'}
];
addLinkedFiles(request,original,id,'2026-10-29T09:00:00Z');
assert.equal(getLinkedFiles(request).length,2,'Multiple files under one order');
assert.equal(request.linkedJobId,'job-a','Legacy first-file reference kept in sync');
assert.throws(()=>addLinkedFiles(request,[original[0]],id,'2026-10-29T09:00:00Z'),/مربوط/);
const first=getLinkedFiles(request)[0];
// File renamed on printer: old reference and name must survive even if current scanner no longer sees it.
assert.equal(first.filename,'banner-old.pdf');
const renamed=editLinkedFile(request,first.id,{jobId:'job-renamed',filename:'banner-final.pdf',printer:'eco'},'approved','2026-10-29T10:00:00Z');
assert.equal(renamed.previousJobId,'job-a');
assert.equal(getLinkedFiles(request)[0].filename,'banner-final.pdf');
assert.equal(getLinkedFiles(request)[0].previousFiles?.[0].filename,'banner-old.pdf');
assert.equal(getLinkedFiles(request)[1].filename,'poster.pdf','Editing one does not affect others');
assert.throws(()=>editLinkedFile(request,first.id,original[1],'','2026-10-29T11:00:00Z'),/مربوط/);
const deleted=removeLinkedFile(request,first.id);
assert.equal(deleted.jobId,'job-renamed');
assert.equal(getLinkedFiles(request).length,1,'Unlink removes only selected association');
assert.equal(request.linkedJobId,'job-b');
assert.equal(getLinkedFiles({linkedJobId:'old-legacy-id'})[0].jobId,'old-legacy-id','Legacy records migrate');
assert.equal(getLinkedFiles({linkedJobId:'',linkedFiles:[]}).length,0);
console.log('Multi-file links, rename retention, replacement and unlink tests passed');
