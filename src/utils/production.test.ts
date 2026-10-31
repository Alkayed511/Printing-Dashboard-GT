import {strict as assert} from 'node:assert';
import {productionDefaults, productionSettings, sortProductionJobs, filterProductionJobs} from './production.ts';
import type {PrintJob} from '../types.ts';

const job = (id: string, priority: PrintJob['priority'], date: string, status: PrintJob['status'] = 'pending'): PrintJob => ({id, filename: id + '.pdf', printer: 'eco', priority, status, createdAt: date, updatedAt: date, sizeBytes: 0});
const rows = [job('normal-old','medium','2026-10-01'), job('urgent-new','urgent','2026-10-29'), job('urgent-old','urgent','2026-10-02'), job('completed','high','2026-10-03','done')];
assert.deepEqual(sortProductionJobs(rows,'priority').map(item => item.id), ['urgent-old','urgent-new','completed','normal-old']);
assert.equal(rows[0].id,'normal-old','Sorting must not mutate the server snapshot');
assert.equal(sortProductionJobs(rows,'oldest')[0].id,'normal-old');
assert.equal(sortProductionJobs(rows,'newest')[0].id,'urgent-new');
assert.equal(filterProductionJobs(rows,'pending','').length,3);
assert.equal(filterProductionJobs(rows,'done','').length,1);
assert.equal(filterProductionJobs(rows,'all',' ECO ').length,4);
assert.equal(filterProductionJobs([{...rows[0],customerName:'مَطبَعة الهدف'}],'all','مطبعة').length,1);
assert.deepEqual(productionSettings(),productionDefaults);
assert.equal(productionSettings({cardDensity:'compact'}).confirmFileMoves,true);
assert.equal(productionDefaults.allowFileDeletion,false);
console.log('Production priority, status, search, immutability and safe defaults tests passed');
