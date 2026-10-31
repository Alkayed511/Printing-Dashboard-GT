import {strict as assert} from 'node:assert';
import {parseContactsCsv} from './contactCsv.ts';
assert.deepEqual(parseContactsCsv('\uFEFFName,Phone 1 - Value\n"شركة ""الهدف""","+962791234567"\n'),
  [{name:'شركة "الهدف"',phone:'+962791234567'}]);
assert.deepEqual(parseContactsCsv('Given Name,Family Name,Phone\nأحمد,الخطيب,0791234567'),
  [{name:'أحمد الخطيب',phone:'0791234567'}]);
assert.throws(()=>parseContactsCsv('Name,Address\nA,Amman'),/Phone/);
console.log('Contact CSV parsing tests passed');
