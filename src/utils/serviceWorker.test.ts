import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createContext, runInContext} from 'node:vm';

const handlers: Record<string, (event: any) => void> = {};
const deleted: string[] = [];
let failNetwork = false;
const live = {source: 'live'};
const cached = {source: 'cached'};
const context = createContext({
  URL,
  self: {location: {origin: 'http://localhost:3000'}, addEventListener: (name: string, fn: (event: any) => void) => handlers[name] = fn, skipWaiting() {}, clients: {claim() {}}},
  caches: {match: async () => cached, keys: async () => ['printshop-kanban-v1', 'printshop-kanban-v2', 'printshop-kanban-v3', 'another-app-cache'], delete: async (key: string) => deleted.push(key)},
  fetch: async () => {if (failNetwork) throw new Error('OFFLINE'); return live;},
});
runInContext(readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8'), context);

function request(path: string, mode = 'cors', method = 'GET') {
  let result: Promise<unknown> | undefined;
  handlers.fetch({request: {url: new URL(path, 'http://localhost:3000').href, mode, method}, respondWith: (value: Promise<unknown>) => {result = value;}});
  return result;
}
assert.equal(request('/api/management/auth'), undefined, 'Auth must bypass the worker cache');
assert.equal(request('/api/files'), undefined, 'Production polling must bypass the worker cache');
assert.equal(request('/api/management/login', 'cors', 'POST'), undefined);
assert.equal(request('https://example.com/image.png'), undefined);
assert.equal(await request('/', 'navigate'), live, 'Online navigation must use the current HTML');
failNetwork = true;
assert.equal(await request('/', 'navigate'), cached, 'Offline navigation may use the cached shell');
let activation: Promise<unknown> | undefined;
handlers.activate({waitUntil: (value: Promise<unknown>) => {activation = value;}});
await activation;
assert.deepEqual(deleted, ['printshop-kanban-v1', 'printshop-kanban-v2'], 'Only obsolete caches owned by this app are removed');
console.log('Service worker live auth, fresh navigation, and offline fallback tests passed');
