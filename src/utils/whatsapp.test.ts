import {strict as assert} from 'node:assert';
import {normalizeWhatsApp,whatsappUrl} from './whatsapp.ts';
assert.equal(normalizeWhatsApp('079 123 4567'),'962791234567');
assert.equal(normalizeWhatsApp('+962 79 123 4567'),'962791234567');
assert.equal(normalizeWhatsApp('00962791234567'),'962791234567');
assert.equal(normalizeWhatsApp('966501234567'),'966501234567');
assert.equal(normalizeWhatsApp('abc'),'');
assert.equal(whatsappUrl('0791234567'),'https://wa.me/962791234567');
console.log('WhatsApp phone normalization tests passed');
