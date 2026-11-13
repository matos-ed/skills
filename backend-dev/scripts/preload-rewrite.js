// Redirects third-party hosts hardcoded in the service to a local stub by patching
// the shared HTTP client class (each method receives `(name, { path, ... })`).
// Usage: HTTP_CLIENT_PACKAGE=<package exporting the client> \
//        STUB_REWRITES="https://maps.googleapis.com/=http://localhost:4010/google/,https://viacep.com.br/=http://localhost:4010/viacep/" \
//        node -r <path>/preload-rewrite.js dist/src/server.js
// Optional: HTTP_CLIENT_EXPORT (default HttpClient).
const path = require('path');

const clientPackage = process.env.HTTP_CLIENT_PACKAGE;
if (!clientPackage) {
  throw new Error('preload-rewrite: set HTTP_CLIENT_PACKAGE to the package that exports the HTTP client');
}
const clientExport = process.env.HTTP_CLIENT_EXPORT || 'HttpClient';

const rewrites = (process.env.STUB_REWRITES || '')
  .split(',')
  .filter(Boolean)
  .map((pair) => pair.split('='));

const HttpClient = require(require.resolve(clientPackage, {
  paths: [process.cwd(), path.dirname(process.argv[1] || '.')],
}))[clientExport];

const rewrite = (target) => {
  if (typeof target !== 'string') return target;
  const match = rewrites.find(([from]) => target.startsWith(from));
  return match ? match[1] + target.slice(match[0].length) : target;
};

for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
  const original = HttpClient.prototype[method];
  if (!original) continue;
  HttpClient.prototype[method] = function patched(name, params = {}) {
    return original.call(this, name, { ...params, path: rewrite(params.path) });
  };
}
