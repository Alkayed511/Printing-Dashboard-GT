import {strict as assert} from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {randomBytes} from 'node:crypto';

const folder = fs.mkdtempSync(path.join(os.tmpdir(),'gt-production-api-'));
const reservation = createServer();
await new Promise<void>(resolve => reservation.listen(0,'127.0.0.1',resolve));
const port = (reservation.address() as {port:number}).port;
await new Promise<void>(resolve => reservation.close(() => resolve()));
const password = randomBytes(24).toString('hex');
const processServer = spawn(process.execPath,['--import','tsx','server.ts'],{cwd:process.cwd(),env:{...process.env,NODE_ENV:'production',PORT:String(port),PRINT_DATA_DIR:path.join(folder,'database'),PRINT_ADMIN_PASSWORD:password,PRINT_SESSION_SECRET:randomBytes(48).toString('hex'),PRINT_ENABLE_LEGACY_FIRESTORE:'false',PRINT_SECURE_COOKIES:'false'},stdio:'ignore',windowsHide:true});
const base = `http://127.0.0.1:${port}`;
let cookie = '';
const request = (endpoint:string,body?:unknown,method=body?'POST':'GET') => fetch(base+endpoint,{method,headers:{'Content-Type':'application/json',Cookie:cookie},body:body ? JSON.stringify(body) : undefined});
try {
  let ready = false;
  for(let attempt=0;attempt<100;attempt++) {try {const response=await request('/api/management/auth'); if(response.ok){ready=true;break;}} catch {} await new Promise(resolve=>setTimeout(resolve,100));}
  assert.ok(ready,'Isolated test server must start');
  const publicBrand=await request('/api/branding');assert.equal(publicBrand.status,200);assert.deepEqual(Object.keys(await publicBrand.json()),['branding']);
  const login=await request('/api/management/login',{password}); assert.equal(login.status,200); cookie=login.headers.get('set-cookie')!.split(';')[0];
  const storage=path.join(folder,'storage');const date='30-10';const printer=path.join(storage,date,'eco');
  fs.mkdirSync(printer,{recursive:true}); fs.writeFileSync(path.join(printer,'fixture.pdf'),'TEST ONLY');
  const printers=[{id:'eco',name:'Test printer',departmentId:'test'},{id:'flat small',name:'Flat Small',departmentId:'test'}];
  const saved=await request('/api/config',{basePath:storage,currentDate:date,departments:[{id:'test',name:'Test'}],printers,production:{jobSort:'priority',confirmFileMoves:true,allowFileDeletion:false}});
  assert.equal(saved.status,200);assert.equal(fs.statSync(path.join(printer,'done')).isDirectory(),true);
  assert.equal(fs.statSync(path.join(storage,date,'flat small','done')).isDirectory(),true);
  assert.equal(fs.readFileSync(path.join(printer,'fixture.pdf'),'utf8'),'TEST ONLY');
  fs.rmdirSync(path.join(storage,date,'flat small','done'));
  const diagnostic=await request('/api/production/storage/check',{basePath:storage,currentDate:date});assert.equal(diagnostic.status,200);assert.equal((await diagnostic.json()).printers[1].done,'missing');assert.equal(fs.existsSync(path.join(storage,date,'flat small','done')),false,'Checking is read-only');
  const cosmetic=await request('/api/config',{branding:{name:'Test print shop'}});assert.equal(cosmetic.status,200);assert.equal(fs.existsSync(path.join(storage,date,'flat small','done')),false,'Appearance saves do not touch production folders');
  const prepared=await request('/api/config',{initializeProductionFolders:true});assert.equal(prepared.status,200);assert.equal((await prepared.json()).createdFolders,1);
  const repeated=await request('/api/config',{initializeProductionFolders:true});assert.equal(repeated.status,200);assert.equal((await repeated.json()).createdFolders,0);
  const nextDay=await request('/api/config',{currentDate:'31-10'});assert.equal(nextDay.status,200);assert.equal(fs.statSync(path.join(storage,'31-10','eco','done')).isDirectory(),true);assert.equal((await request('/api/config',{currentDate:date})).status,200);
  const added=await request('/api/config',{printers:[...printers,{id:'r2r',name:'R2R',departmentId:'test'}]});assert.equal(added.status,200);assert.equal(fs.statSync(path.join(storage,date,'r2r','done')).isDirectory(),true);
  assert.equal((await request('/api/config',{printers})).status,200);assert.equal(fs.existsSync(path.join(storage,date,'r2r','done')),true,'Removing a mapping never removes folders');
  const conflictPath=path.join(folder,'path-is-a-file');fs.writeFileSync(conflictPath,'KEEP');const failedSetup=await request('/api/config',{basePath:conflictPath});assert.equal(failedSetup.status,409);assert.equal((await(await request('/api/config')).json()).basePath,storage);assert.equal(fs.readFileSync(conflictPath,'utf8'),'KEEP');
  const invalid=await request('/api/config',{currentDate:'../outside',autoRefreshInterval:1});assert.equal(invalid.status,400);assert.equal((await(await request('/api/config')).json()).currentDate,date,'Rejected saves must leave active settings intact');
  const files=await(await request('/api/files')).json();assert.equal(files.jobs.length,1);const id=files.jobs[0].id;
  const moved=await request('/api/files/move',{id,targetStatus:'done'});assert.equal(moved.status,200);assert.equal((await moved.json()).fileMovedOnDisk,true);assert.equal(fs.readFileSync(path.join(printer,'done','fixture.pdf'),'utf8'),'TEST ONLY');
  const restored=await request('/api/files/move',{id,targetStatus:'pending'});assert.equal(restored.status,200);
  fs.writeFileSync(path.join(printer,'done','fixture.pdf'),'KEEP THIS TARGET');
  const conflict=await request('/api/files/move',{id,targetStatus:'done'});assert.equal(conflict.status,409);assert.equal(fs.readFileSync(path.join(printer,'done','fixture.pdf'),'utf8'),'KEEP THIS TARGET');assert.equal(fs.readFileSync(path.join(printer,'fixture.pdf'),'utf8'),'TEST ONLY');
  const deleted=await request('/api/files/'+id,undefined,'DELETE');assert.equal(deleted.status,403);
  const badPrinter=await request('/api/files/move',{id,targetStatus:'done',printer:'../outside'});assert.equal(badPrinter.status,400);
  const logo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBmcAAAAASUVORK5CYII=';
  const branded=await request('/api/config',{branding:{name:'QA Print Studio',themeMode:'light',fontSize:18,accentColor:'#325dce',logo}});assert.equal(branded.status,200);
  const rejectedBrand=await request('/api/config',{branding:{name:'',fontSize:100}});assert.equal(rejectedBrand.status,400);
  const publicSaved=await fetch(base+'/api/branding');const identity=await publicSaved.json();assert.deepEqual(Object.keys(identity),['branding']);assert.equal(identity.branding.name,'QA Print Studio');assert.equal(identity.branding.themeMode,'light');assert.equal(identity.branding.logo,logo);
  console.log('Isolated production API: automatic printer/done folders, repeat saves, safe failures, read-only checks, moves and branding passed');
} finally {
  if(processServer.exitCode===null){const exited=once(processServer,'exit');processServer.kill();await exited;}
  assert.equal(path.dirname(path.resolve(folder)),path.resolve(os.tmpdir()));assert.ok(path.basename(folder).startsWith('gt-production-api-'));
  fs.rmSync(folder,{recursive:true,force:true});
}
