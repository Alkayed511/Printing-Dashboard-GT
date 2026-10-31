import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createContext, runInContext} from 'node:vm';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(source => source.includes('var origFetch'));
assert.ok(script, 'The fetch proxy script must be present');

const calls: Array<{input: unknown; init: unknown}> = [];
const response = {status: 200};
const window = {
  location: {host: 'localhost:3000'},
  fetch(input: unknown, init?: unknown) {
    calls.push({input, init});
    return Promise.resolve(response);
  },
};
const context = createContext({window});
runInContext(script, context);

// Instrumentation commonly captures fetch, then assigns its own wrapper.
// The old accessor redirected its delegate to that wrapper and recursed forever.
runInContext(`
  const capturedFetch = window.fetch;
  window.fetch = function(input, init) { return capturedFetch(input, init); };
`, context);
const loginOptions = {method: 'POST', credentials: 'same-origin', body: '{}'};
assert.equal(await window.fetch('/api/management/login', loginOptions), response);
assert.equal(calls.length, 1);
assert.equal(calls[0].input, '/api/management/login');
assert.equal(calls[0].init, loginOptions);

await window.fetch('http://localhost:3000/api/management/auth');
assert.equal(calls.at(-1)?.input, 'http://localhost:3000/api/management/auth');

await window.fetch('http://192.168.1.25/preview.png');
assert.equal(calls.at(-1)?.input, '/api/proxy?url=http%3A%2F%2F192.168.1.25%2Fpreview.png');

const request = {url: 'https://example.com/image.png'};
await window.fetch(request);
assert.equal(calls.at(-1)?.input, request);
assert.equal(calls.length, 4);

console.log('Fetch proxy login, instrumentation, and routing regression tests passed');
