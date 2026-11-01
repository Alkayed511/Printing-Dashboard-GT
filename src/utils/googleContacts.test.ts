import {strict as assert} from 'node:assert';
import {extractGoogleContacts} from './googleContacts.ts';
assert.deepEqual(extractGoogleContacts([
  {names:[{displayName:'عميل أول'}],phoneNumbers:[{value:'+962 79 123 4567'},{value:'+962791234567'}]},
  {names:[{displayName:'عميل ثان'}],phoneNumbers:[{value:'079 888 7777'}]},
  {names:[{displayName:'بدون هاتف'}]},
  {phoneNumbers:[{value:'0799999999'}]}
]),[{name:'عميل أول',phone:'+962 79 123 4567'},{name:'عميل ثان',phone:'079 888 7777'}]);
assert.deepEqual(extractGoogleContacts([]),[]);
console.log('Google People API contact extraction tests passed');
