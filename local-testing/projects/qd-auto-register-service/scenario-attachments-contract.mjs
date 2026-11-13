// Routes that return attachments or the register, with legacy and new attachments, against one build.
// Usage (from the repo, after seed.ts): node <this file> <port> <label> <db>
// Legacy register (raw driver, shape before 2026-11-13): manager attachment without origin, identity document
// with the original name and no category, catalog with the original name. Then the partner sends catalog and
// document again, and every read route the panel and the front use is called.
import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const [port, label, dbName] = process.argv.slice(2);
const BASE = `http://localhost:${port}`;
const LEGACY = '6af700000000000000000003';
const OUT_DIR = path.join(process.env.LT_HOME ?? path.join(homedir(), '.local/share/local-testing'), 'runs/qd-auto-register-service');
const results = [];

const partner = (registerId) => ({
  Authorization: `Bearer ${jwt.sign({ data: { registerId } }, 'local-secret', { expiresIn: 3600 })}`,
});
const managerAuth = JSON.stringify({ id: 'm1', name: 'Manager Local', email: 'm@local', ip: '127.0.0.1', isRoot: true, cityIds: [] });
const manager = {
  Authorization: 'Basic local-basic',
  managerauth: managerAuth,
  'managerauth-signature': createHmac('sha256', 'local-hmac').update(managerAuth).digest('hex'),
};

async function call(name, method, route, headers, body) {
  const response = await fetch(`${BASE}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body && JSON.stringify(body),
  });
  const text = await response.text();
  let parsed;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  results.push({ name, status: response.status, body: parsed });
  return { status: response.status, body: parsed };
}

async function upload(registerId, extension) {
  const { body } = await call(`signed-upload-url ${extension}`, 'GET', `/api/attachments/signed-upload-url?extension=${extension}`, partner(registerId));
  const put = await fetch(body.signedUploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: Buffer.from('local') });
  results.push({ name: `PUT bucket ${extension}`, status: put.status });
  return body.key;
}

const attachmentNames = (body) => (Array.isArray(body) ? body : []).map((a) => `${a.name} [${a.category ?? '-'}/${a.origin ?? '-'}]`).sort();

// Legacy register, written like production data from before the change.
const client = await MongoClient.connect('mongodb://localhost:27027/?directConnection=true');
const registers = client.db(dbName).collection('register');
const template = await registers.findOne({ _id: new ObjectId('6af700000000000000000002') });
const legacyKey = (id, ext) => `registers/${LEGACY}/${id}.${ext}`;
const attachment = (id, ext, name, extra = {}) => ({
  _id: new ObjectId(id), key: legacyKey(id, ext), url: 'https://expired.example', name, extension: ext,
  createdAt: new Date('2026-11-01T10:00:00Z'), accessExpireAt: new Date('2026-11-01T18:00:00Z'), ...extra,
});
const oldDocument = [attachment('6af7000000000000000000a1', 'png', 'png-transparent-cachaca-thumbnail.png'), attachment('6af7000000000000000000a2', 'png', 'png-transparent-cachaca-thumbnail.png')];
await registers.deleteOne({ _id: new ObjectId(LEGACY) });
await registers.insertOne({
  ...template,
  _id: new ObjectId(LEGACY),
  placeName: 'Lanche Bão Legado',
  step: 'DADOS_PINO_LOCALIZACAO',
  status: 'INCOMPLETO',
  documentConfirmation: { type: 'RG', format: 'PHYSICAL', files: oldDocument.map(({ key, name, extension }) => ({ key, name, extension })) },
  attachments: [
    attachment('6af7000000000000000000a0', 'pdf', 'contrato_social.pdf'),
    ...oldDocument,
    attachment('6af7000000000000000000a3', 'pdf', 'cardapio antigo.pdf', { origin: 'PARCEIRO', category: 'CATALOGO' }),
  ],
});
await client.close();

const legacyRead = await call('GET attachments legado (antes)', 'GET', `/api/registers/${LEGACY}/attachments`, manager);
results.push({ name: '  nomes', status: '', names: attachmentNames(legacyRead.body) });
await call('GET v2/registers/:id legado', 'GET', `/api/v2/registers/${LEGACY}`, manager);
await call('GET v2/self-registration legado', 'GET', '/api/v2/self-registration', partner(LEGACY));

const catalogKey = await upload(LEGACY, 'pdf');
await call('PUT catalog legado', 'PUT', '/api/v2/self-registration/catalog', partner(LEGACY), {
  catalogFiles: [{ key: catalogKey, name: 'novo cardapio.pdf', extension: 'pdf' }],
});
const [front, back] = [await upload(LEGACY, 'png'), await upload(LEGACY, 'png')];
await call('POST document-confirmation legado', 'POST', '/api/document-confirmation', partner(LEGACY), {
  type: 'RG', format: 'PHYSICAL',
  files: [{ key: front, name: 'IMG_1.png', extension: 'png' }, { key: back, name: 'IMG_2.png', extension: 'png' }],
});

const after = await call('GET attachments legado (depois)', 'GET', `/api/registers/${LEGACY}/attachments`, manager);
results.push({ name: '  nomes', status: '', names: attachmentNames(after.body) });
const draft = await call('GET v2/self-registration legado (depois)', 'GET', '/api/v2/self-registration', partner(LEGACY));
results.push({ name: '  rascunho', status: '', names: (draft.body?.catalog?.files ?? []).map((f) => f.name) });
const register = await call('GET v2/registers/:id legado (depois)', 'GET', `/api/v2/registers/${LEGACY}`, manager);
results.push({ name: '  documentConfirmation', status: '', names: (register.body?.documentConfirmation?.files ?? []).map((f) => f.name) });

for (const registerId of ['6af700000000000000000001', '6af700000000000000000002']) {
  await call(`GET v2/registers/:id ${registerId.slice(-1)}`, 'GET', `/api/v2/registers/${registerId}`, manager);
  await call(`GET v2/self-registration ${registerId.slice(-1)}`, 'GET', '/api/v2/self-registration', partner(registerId));
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(path.join(OUT_DIR, `contract-${label}.json`), JSON.stringify(results, null, 2));
for (const r of results) {
  if (r.names) { console.log(`     ${r.name}: ${r.names.join(', ')}`); continue; }
  const error = r.status >= 400 ? ` ${JSON.stringify(r.body).slice(0, 220)}` : '';
  console.log(`${String(r.status).padEnd(4)} ${r.name}${error}`);
}
