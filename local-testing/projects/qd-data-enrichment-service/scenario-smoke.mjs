// Main routes against one build, synthetic CPF/CNPJ (providers off or stubbed). Usage: node <this file> <port>
const [port] = process.argv.slice(2);
const BASE = `http://localhost:${port}`;
const auth = { Authorization: 'Basic local-enrichment-token', 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const show = (body) => (body.length > 180 ? `${body.slice(0, 180)}…` : body);

async function call(name, method, route, body, headers = auth) {
  const response = await fetch(`${BASE}${route}`, { method, headers, body: body && JSON.stringify(body) });
  const text = await response.text();
  console.log(`${String(response.status).padEnd(4)} ${name}  ${show(text)}`);
  try { return JSON.parse(text); } catch { return null; }
}

await call('GET health', 'GET', '/public/health', undefined, {});
const cpf = await call('POST cpf/enrich', 'POST', '/api/cpf/enrich', { cpf: '52998224725' });
const cnpj = await call('POST cnpj/enrich', 'POST', '/api/cnpj/enrich', { cnpj: '11222333000181' });
await sleep(4000);
if (cpf?.requestId) { await call('GET cpf-enrichments/:id', 'GET', `/api/cpf-enrichments/${cpf.requestId}`); }
if (cnpj?.requestId) { await call('GET cnpj-enrichments/:id', 'GET', `/api/cnpj-enrichments/${cnpj.requestId}`); }
await call('GET cpf/:cpf', 'GET', '/api/cpf/52998224725');
await call('GET cnpj/:cnpj', 'GET', '/api/cnpj/11222333000181');
await call('GET cpf/:cpf inválido', 'GET', '/api/cpf/11111111112');
await call('POST cpf/enrich sem auth', 'POST', '/api/cpf/enrich', { cpf: '52998224725' }, { 'Content-Type': 'application/json' });
