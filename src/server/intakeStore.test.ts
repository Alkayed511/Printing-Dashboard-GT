import {strict as assert} from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {storeIncoming,incomingMessages,createRequest,getRequest,updateRequest,listRequests,newId} from './intakeStore.ts';
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'gt-intake-test-'));
process.env.PRINT_DATA_DIR=folder;
try {
  const sample={id:'wamid-test-1',customerId:'customer-1',from:'962791234567',name:'Test',
    type:'document',text:'New artwork',mediaId:'12345',fileName:'first.pdf',mimeType:'application/pdf',receivedAt:new Date().toISOString()};
  assert.equal(storeIncoming(sample),true);
  assert.equal(storeIncoming(sample),false,'Meta webhook retries must not duplicate messages');
  assert.equal(incomingMessages().length,1);
  const request=createRequest({customerId:'customer-1',title:'Customer order',notes:'',source:'whatsapp',sourceMessageId:sample.id});
  const id=request.id;
  assert.ok(id.startsWith('GT-'));
  assert.equal(getRequest(id)?.customerId,'customer-1');
  updateRequest(id,o=>o.revisions.push({id:newId(),fileName:'original.pdf',dimensions:'100×200',printer:'eco',notes:'',createdAt:new Date().toISOString()}));
  updateRequest(id,o=>o.revisions.push({id:newId(),fileName:'final-renamed.pdf',dimensions:'150×240',printer:'eco',notes:'revised',createdAt:new Date().toISOString()}));
  updateRequest(id,o=>{o.status='printing';o.linkedJobId='machine-file-id-123';});
  const changed=getRequest(id)!;
  assert.equal(changed.id,id,'Stable order id must not change after file rename or dimensions change');
  assert.deepEqual(changed.revisions.map(r=>r.fileName),['original.pdf','final-renamed.pdf']);
  assert.equal(changed.linkedJobId,'machine-file-id-123');
  assert.equal(listRequests().length,1);
  console.log('WhatsApp intake persistence & revision tests passed');
} finally { fs.rmSync(folder,{recursive:true,force:true}); }
