// Compares two scenario outputs: { results: [{ name, status, body }], docs?: [...] }.
// Usage: node ab-diff.js branch.json base.json
const [, , branchFile, baseFile] = process.argv;
const branch = require(require('path').resolve(branchFile));
const base = require(require('path').resolve(baseFile));

const normalize = (value) =>
  JSON.parse(
    JSON.stringify(value)
      .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '<jwt>')
      .replace(/https:\/\/[^"]*X-Amz-[^"]*/g, '<signed-url>')
      .replace(/\b[0-9a-f]{24}\b/g, '<id>')
      .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<date>'),
  );

let differences = 0;
const walk = (a, b, at) => {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[key], b[key], `${at}.${key}`);
    return;
  }
  differences += 1;
  console.log(`${at}\n  branch: ${JSON.stringify(a)}\n  base:   ${JSON.stringify(b)}`);
};

branch.results.forEach((result, i) => walk(normalize(result), normalize(base.results[i]), `call[${result.name}]`));
if (branch.docs || base.docs) walk(normalize(branch.docs), normalize(base.docs), 'db');

const empty = branch.results.filter((r) => Array.isArray(r.body) && r.body.length === 0).map((r) => r.name);
console.log(`\n${differences} difference(s) across ${branch.results.length} calls`);
if (empty.length) console.log(`warning: empty array responses (not evidence of parity): ${empty.join(', ')}`);
process.exit(differences ? 1 : 0);
