// Read routes against one build. Usage: node <this file> <port>
const [port] = process.argv.slice(2);
const auth = { Authorization: 'Basic local-cities-token' };
const routes = [
  ['GET /cities/:id (delivery)', '/api/cities/6af7c0000000000000000001', auth],
  ['GET /cities/:id/status (delivery)', '/api/cities/6af7c0000000000000000001/status', auth],
  ['GET /cities/:id/status (sem delivery)', '/api/cities/6af7c0000000000000000002/status', auth],
  ['GET /cities/:id/status (inexistente)', '/api/cities/6af7c0000000000000000003/status', auth],
  ['GET /cities/:id/status (id inválido)', '/api/cities/abc/status', auth],
  ['GET /cities/:id/status (sem auth)', '/api/cities/6af7c0000000000000000001/status', {}],
  ['GET /cities/ids', '/api/cities/ids', auth],
];
for (const [name, route, headers] of routes) {
  const response = await fetch(`http://localhost:${port}${route}`, { headers });
  const text = await response.text();
  const body = text.length > 160 ? `${text.slice(0, 160)}… (${text.length} B)` : text;
  console.log(`${String(response.status).padEnd(4)} ${name}  ${body}`);
}
