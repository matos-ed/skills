// Third-party HTTP stub: answers 200 {} to everything and logs each call.
// Usage: node stub.js [port] [rules.json]
// rules.json: [{ "method": "GET", "path": "^/api/cities", "status": 200, "body": {...} }] — first match wins.
const http = require('http');
const fs = require('fs');

const port = Number(process.argv[2] || 4010);
const rules = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : [];

http
  .createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const rule = rules.find(
        (r) => (!r.method || r.method === req.method) && new RegExp(r.path).test(req.url),
      );
      console.log(`${new Date().toISOString()} ${req.method} ${req.url} ${body.slice(0, 300)}${rule ? ' [rule]' : ''}`);
      res.writeHead(rule?.status ?? 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rule?.body ?? {}));
    });
  })
  .listen(port, () => console.log(`stub on ${port}`));
