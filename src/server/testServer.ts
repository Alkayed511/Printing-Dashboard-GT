/** Test-only server: never loads the workstation .env or production databases. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {randomBytes} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

export async function startTestServer(password = randomBytes(24).toString('hex')) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-audit-'));
  const data = path.join(root, 'database');
  const storage = path.join(root, 'printers');
  fs.mkdirSync(data, {recursive:true});
  for (const printer of ['eco','flat']) fs.mkdirSync(path.join(storage,'2026-11-01',printer,'done'), {recursive:true});
  const db = new DatabaseSync(path.join(data,'printing-management.sqlite'));
  db.exec('CREATE TABLE app_settings(id TEXT PRIMARY KEY,payload TEXT NOT NULL)');
  db.prepare('INSERT INTO app_settings VALUES(?,?)').run('global', JSON.stringify({
    basePath:storage,currentDate:'2026-11-01',autoRefreshInterval:0,
    departments:[{id:'test',name:'قسم تجريبي'}],
    printers:[{id:'eco',name:'Eco Test',departmentId:'test'},{id:'flat',name:'Flat Test',departmentId:'test'}]
  }));
  db.close();
  const reservation = createServer();
  await new Promise<void>(resolve=>reservation.listen(0,'127.0.0.1',resolve));
  const port = (reservation.address() as {port:number}).port;
  await new Promise<void>(resolve=>reservation.close(()=>resolve()));
  const child = spawn(process.execPath,['--import','tsx','server.ts'], {
    cwd:process.cwd(),windowsHide:true,stdio:['ignore','pipe','pipe'],
    env:{...process.env,DOTENV_CONFIG_PATH:path.join(root,'no-dotenv'),DOTENV_CONFIG_QUIET:'true',
      NODE_ENV:'production',PORT:String(port),HOST:'127.0.0.1',PRINT_DATA_DIR:data,
      PRINT_UPLOAD_DIR:path.join(root,'uploads'),PRINT_ADMIN_PASSWORD:password,
      PRINT_SESSION_SECRET:randomBytes(48).toString('hex'),PRINT_ENABLE_LEGACY_FIRESTORE:'false',
      PRINT_SECURE_COOKIES:'false',WHATSAPP_VERIFY_TOKEN:'',WHATSAPP_APP_SECRET:'',WHATSAPP_ACCESS_TOKEN:''}
  });
  let log='';
  child.stdout.on('data',chunk=>{log+=chunk;});child.stderr.on('data',chunk=>{log+=chunk;});
  const base = `http://127.0.0.1:${port}`;
  let cookie='';
  const request = async(endpoint:string,body?:unknown,method=body===undefined?'GET':'POST')=>fetch(base+endpoint,{
    method,headers:{'Content-Type':'application/json',Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)
  });
  const stop = async()=>{
    if(child.exitCode===null){const ended=once(child,'exit');child.kill();await ended;}
    if(path.dirname(path.resolve(root))!==path.resolve(os.tmpdir())||!path.basename(root).startsWith('gt-audit-'))throw Error('Unsafe test cleanup');
    fs.rmSync(root,{recursive:true,force:true});
  };
  try {
    let ready=false;
    for(let n=0;n<100;n++){
      if(child.exitCode!==null)throw Error('Isolated server exited: '+log);
      try {if((await request('/api/management/auth')).ok){ready=true;break;}}catch{}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    if(!ready)throw Error('Isolated server failed to start: '+log);
    return {root,data,storage,base,password,request,stop,child,
      async login(){const response=await request('/api/management/login',{password});cookie=response.headers.get('set-cookie')?.split(';')[0]||'';return response;}}
  } catch(error){await stop();throw error;}
}
