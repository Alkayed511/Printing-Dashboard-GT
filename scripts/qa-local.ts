/** Local QA fixture. The real .env, customer DBs and printer folders are never loaded. */
import fs from 'node:fs';
import path from 'node:path';
import {startTestServer} from '../src/server/testServer.ts';
const server=await startTestServer();
await server.login();
await server.request('/api/management/customers',{name:'عميل تجريبي',phone:'0791234567'});
fs.writeFileSync(path.join(server.storage,'2026-11-01','eco','QA_25 pcs_150.5x200cm.pdf'),'SYNTHETIC PRINT FILE');
fs.writeFileSync(path.join(server.root,'browser-login.js'),`(async()=>{const r=await fetch('/api/management/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:${JSON.stringify(server.password)}})});if(!r.ok)throw Error('Synthetic login failed');location.reload();return 'Synthetic session ready';})()`);
console.log(JSON.stringify({base:server.base,root:server.root,pid:process.pid,serverPid:server.child.pid}));
const shutdown=async()=>{await server.stop();process.exit(0);};
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
setTimeout(shutdown,60*60*1000);
