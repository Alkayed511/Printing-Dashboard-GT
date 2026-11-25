import {strict as assert} from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {inspectProductionStorage, updateServerConfig} from './serverConfig.ts';
import {ensureProductionFolders, productionFoldersRequested} from './productionFolders.ts';
import type {ServerConfig} from '../types.ts';

const folder = fs.mkdtempSync(path.join(os.tmpdir(),'gt-config-test-'));
try {
  const current: ServerConfig = {basePath: folder, currentDate:'30-10', autoRefreshInterval:5, isRealStorageAvailable:false, activePath:'', departments:[{id:'d',name:'Production'}], printers:[{id:'eco',name:'Eco',departmentId:'d'}]};
  const updated = updateServerConfig(current,{production:{jobSort:'oldest'},notificationDuration:10});
  assert.equal(updated.production?.jobSort,'oldest');
  assert.equal(updated.production?.allowFileDeletion,false);
  assert.equal(current.notificationDuration,undefined,'Validation must not mutate live config');
  for (const patch of [{autoRefreshInterval:1},{autoRefreshInterval:-1},{autoRefreshInterval:'5'},{autoRefreshInterval:Infinity},{production:{jobSort:'wrong'}},{production:{allowFileDeletion:'false'}},{currentDate:'../outside'},{printers:[{id:'../outside',name:'Bad',departmentId:'d'}]},{printers:[{id:'ECO',name:'A',departmentId:'d'},{id:'eco',name:'B',departmentId:'d'}]}]) assert.throws(() => updateServerConfig(current,patch));
  const inspected = inspectProductionStorage(folder,'30-10',current.printers!);
  assert.equal(inspected.basePath,'available'); assert.equal(inspected.dateFolder,'missing');
  assert.equal(fs.existsSync(path.join(folder,'30-10')),false,'Storage checking must never create missing folders');
  fs.mkdirSync(path.join(folder,'30-10','eco'),{recursive:true});
  const ready = inspectProductionStorage(folder,'30-10',current.printers!);
  assert.equal(ready.printers[0].pending,'available'); assert.equal(ready.printers[0].done,'missing');
  assert.equal(fs.existsSync(path.join(folder,'30-10','eco','done')),false);
  fs.writeFileSync(path.join(folder,'30-10','eco','existing.pdf'),'PRESERVE EXISTING FILE');
  const existingTime=fs.statSync(path.join(folder,'30-10','eco','existing.pdf')).mtimeMs;
  const setup={...current,printers:[...current.printers!,{id:'flat small',name:'Flat Small',departmentId:'d'}]};
  assert.ok(ensureProductionFolders(setup).createdCount>0);
  for(const printer of setup.printers)assert.equal(fs.statSync(path.join(folder,'30-10',printer.id,'done')).isDirectory(),true);
  assert.equal(ensureProductionFolders(setup).createdCount,0,'Repeating setup must be safe');
  assert.equal(fs.readFileSync(path.join(folder,'30-10','eco','existing.pdf'),'utf8'),'PRESERVE EXISTING FILE');
  assert.equal(fs.statSync(path.join(folder,'30-10','eco','existing.pdf')).mtimeMs,existingTime);
  const fresh={...setup,basePath:path.join(folder,'new-root')};
  ensureProductionFolders(fresh);assert.equal(fs.statSync(path.join(fresh.basePath,'30-10','flat small','done')).isDirectory(),true);
  assert.equal(productionFoldersRequested(current,{...current,branding:undefined}),false);
  assert.equal(productionFoldersRequested(current,current,true),true);
  assert.equal(productionFoldersRequested(current,setup),true);
  assert.equal(productionFoldersRequested(setup,{...setup,printers:[...setup.printers].reverse()}),false);
  assert.equal(productionFoldersRequested(current,{...current,currentDate:'31-10'}),true);
  const blocked={...setup,basePath:path.join(folder,'blocked')};fs.mkdirSync(path.join(blocked.basePath,'30-10'),{recursive:true});
  fs.writeFileSync(path.join(blocked.basePath,'30-10','flat small'),'DO NOT REPLACE');
  assert.throws(()=>ensureProductionFolders(blocked));
  assert.equal(fs.existsSync(path.join(blocked.basePath,'30-10','eco')),false,'Conflicts should be checked before creating other printer folders');
  assert.equal(fs.readFileSync(path.join(blocked.basePath,'30-10','flat small'),'utf8'),'DO NOT REPLACE');
  console.log('Production validation, read-only checks, automatic folders, repeat saves and file preservation tests passed');
} finally {
  assert.equal(path.dirname(path.resolve(folder)),path.resolve(os.tmpdir()));
  assert.ok(path.basename(folder).startsWith('gt-config-test-'));
  fs.rmSync(folder,{recursive:true,force:true});
}
