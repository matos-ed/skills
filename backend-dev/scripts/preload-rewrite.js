// Redirects third-party hosts hardcoded in the service to a local stub.
// Usage: STUB_REWRITES="https://maps.googleapis.com/=http://localhost:4010/google/,https://viacep.com.br/=http://localhost:4010/viacep/" \
//        node -r <path>/preload-rewrite.js dist/src/server.js
const path = require('path');

const rewrites = (process.env.STUB_REWRITES || '')
  .split(',')
  .filter(Boolean)
  .map((pair) => pair.split('='));

const qdPackages = require(require.resolve('@querodelivery/qd-packages', {
  paths: [process.cwd(), path.dirname(process.argv[1] || '.')],
}));

const rewrite = (target) => {
  if (typeof target !== 'string') return target;
  const match = rewrites.find(([from]) => target.startsWith(from));
  return match ? match[1] + target.slice(match[0].length) : target;
};

for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
  const original = qdPackages.HttpClient.prototype[method];
  if (!original) continue;
  qdPackages.HttpClient.prototype[method] = function patched(name, params = {}) {
    return original.call(this, name, { ...params, path: rewrite(params.path) });
  };
}
