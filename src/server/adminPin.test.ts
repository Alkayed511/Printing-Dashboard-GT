import {strict as assert} from 'node:assert';
import {isValidAdminPin,isValidSessionSecret} from './adminPin.ts';
assert.equal(isValidAdminPin('0000'),true);
assert.equal(isValidAdminPin('8274'),true);
for(const invalid of ['123','12345','12a4','abcd',' 1234','1234 ',''])assert.equal(isValidAdminPin(invalid),false,invalid);
assert.equal(isValidSessionSecret('x'.repeat(32)),true);
assert.equal(isValidSessionSecret('x'.repeat(31)),false);
console.log('4-digit PIN and session-secret validation tests passed');
