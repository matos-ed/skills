// Partner upload flow + manager panel listing, against one build.
// Usage (from the repo): node <this file> <port> <label>
// Covers: signed upload URL -> PUT to the bucket -> business (logo/cover) -> catalog -> identity document
// -> GET /api/registers/:id/attachments as the panel does -> download of every attachment.
import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const jwt = require('jsonwebtoken');

const [port, label] = process.argv.slice(2);
const BASE = `http://localhost:${port}`;
const BUSINESS_REGISTER = '6af700000000000000000001';
const DOCUMENT_REGISTER = '6af700000000000000000002';
const OUT_DIR = path.join(process.env.LT_HOME ?? path.join(homedir(), '.local/share/local-testing'), 'runs/qd-auto-register-service');
const results = [];

// Values match env.template.
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

async function upload(registerId, extension, content, mime) {
  const { body } = await call(`signed-upload-url ${extension}`, 'GET', `/api/attachments/signed-upload-url?extension=${extension}`, partner(registerId));
  const put = await fetch(body.signedUploadUrl, { method: 'PUT', headers: { 'Content-Type': mime }, body: content });
  results.push({ name: `PUT bucket ${extension}`, status: put.status });
  return body.key;
}

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const pdf = Buffer.from('%PDF-1.4\n%local catalog\n');

const logoKey = await upload(BUSINESS_REGISTER, 'png', png, 'image/png');
const coverKey = await upload(BUSINESS_REGISTER, 'png', png, 'image/png');
await call('PUT business', 'PUT', '/api/v2/self-registration/business', partner(BUSINESS_REGISTER), {
  placeName: 'Lanche Bão Local',
  placePhone: '(79)99999-6327',
  categoryAbbreviation: 'LANCHES',
  instagramNickName: 'lanchebao',
  howWorks: ['DELIVERY'],
  registrationType: 'CPF',
  expectedSalesStartDate: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
  logoKey,
  coverKey,
});

const menuKey = await upload(BUSINESS_REGISTER, 'pdf', pdf, 'application/pdf');
const photoKey = await upload(BUSINESS_REGISTER, 'jpg', png, 'image/jpeg');
await call('PUT catalog', 'PUT', '/api/v2/self-registration/catalog', partner(BUSINESS_REGISTER), {
  externalPlaceLinks: ['https://www.ifood.com.br/delivery/aracaju-se/lanche-bao'],
  catalogFiles: [
    { key: menuKey, name: 'Cardápio Lanche Bão 2026 (final).pdf', extension: 'pdf', sizeFormatted: '20 KB' },
    { key: photoKey, name: 'WhatsApp Image 2026-11-13.jpg', extension: 'jpg' },
  ],
});

const frontKey = await upload(DOCUMENT_REGISTER, 'png', png, 'image/png');
const backKey = await upload(DOCUMENT_REGISTER, 'png', png, 'image/png');
await call('POST document-confirmation', 'POST', '/api/document-confirmation', partner(DOCUMENT_REGISTER), {
  type: 'RG',
  format: 'PHYSICAL',
  files: [
    { key: frontKey, name: 'png-transparent-cachaca-thumbnail.png', extension: 'png' },
    { key: backKey, name: 'png-transparent-cachaca-thumbnail.png', extension: 'png' },
  ],
});

for (const registerId of [BUSINESS_REGISTER, DOCUMENT_REGISTER]) {
  const { body } = await call(`GET attachments ${registerId.slice(-1)}`, 'GET', `/api/registers/${registerId}/attachments`, manager);
  for (const attachment of Array.isArray(body) ? body : []) {
    const download = await fetch(attachment.url);
    results.push({ name: `download ${attachment.name}`, status: download.status });
  }
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(path.join(OUT_DIR, `upload-${label}.json`), JSON.stringify(results, null, 2));
for (const r of results) {
  const detail = Array.isArray(r.body)
    ? r.body.map((a) => `${a.name} [${a.category ?? '-'}/${a.origin ?? '-'}]`).join(', ')
    : r.status >= 400 ? JSON.stringify(r.body) : '';
  console.log(`${String(r.status).padEnd(4)} ${r.name} ${detail}`);
}
