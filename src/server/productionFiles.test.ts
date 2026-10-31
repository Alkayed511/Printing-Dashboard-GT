// Regression: non-overwriting printer moves, including an external concurrent writer.
import {strict as assert} from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {moveProductionFile} from './productionFiles.ts';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'gt-move-audit-'));
try{
  fs.mkdirSync(path.join(root,'eco','done'),{recursive:true});
  const source=path.join(root,'eco','test.pdf'),target=path.join(root,'eco','done','test.pdf');
  const job={id:'test',filename:'test.pdf',printer:'eco',status:'pending' as const,sizeBytes:4,createdAt:'',updatedAt:''};
  fs.writeFileSync(source,'SOURCE');
  const originalExists=fs.existsSync;
  // Force the external writer exactly after the old check and before the actual move.
  fs.existsSync=((file:fs.PathLike)=>{
    const exists=originalExists(file);
    if(String(file)===target&&!exists)fs.writeFileSync(target,'EXTERNAL FILE');
    return exists;
  }) as typeof fs.existsSync;
  try{assert.throws(()=>moveProductionFile(root,job,'done','eco'));}
  finally{fs.existsSync=originalExists;}
  assert.equal(fs.readFileSync(source,'utf8'),'SOURCE');
  assert.equal(fs.readFileSync(target,'utf8'),'EXTERNAL FILE');
  fs.unlinkSync(target);
  const before=fs.statSync(source);moveProductionFile(root,job,'done','eco');
  assert.equal(fs.existsSync(source),false);assert.equal(fs.readFileSync(target,'utf8'),'SOURCE');
  assert.equal(fs.statSync(target).ino,before.ino,'Move preserves filesystem identity');
  fs.unlinkSync(target);fs.writeFileSync(source,'ORIGINAL');
  const originalLink=fs.linkSync;
  fs.linkSync=((from:fs.PathLike,to:fs.PathLike)=>{
    originalLink(from,to);
    if(String(to)===target)fs.writeFileSync(source,'COMPETING SOURCE');
  }) as typeof fs.linkSync;
  try{moveProductionFile(root,job,'done','eco');}finally{fs.linkSync=originalLink;}
  assert.equal(fs.readFileSync(source,'utf8'),'COMPETING SOURCE','Never delete a source created after the claim');
  assert.equal(fs.readFileSync(target,'utf8'),'ORIGINAL');
  console.log('Atomic destination conflict and identity-preserving move tests passed');
}finally{
  if(path.dirname(path.resolve(root))!==path.resolve(os.tmpdir())||!path.basename(root).startsWith('gt-move-audit-'))throw Error('Unsafe cleanup');
  fs.rmSync(root,{recursive:true,force:true});
}
