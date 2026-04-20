'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT || 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

function resolveFile(urlPath) {
  let p = decodeURIComponent((urlPath || '/').split('?')[0]);
  if (p.includes('\0')) return null;
  if (!p.startsWith('/')) p = '/' + p;
  const rel = path.normalize(p.slice(1));
  const full = path.resolve(path.join(ROOT, rel));
  const rootNorm = path.resolve(ROOT);
  const relFromRoot = path.relative(rootNorm, full);
  if (relFromRoot.startsWith('..') || path.isAbsolute(relFromRoot)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  let file = resolveFile(req.url);
  if (!file) {
    res.writeHead(400);
    res.end('Bad path');
    return;
  }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) {
      file = path.join(file, 'index.html');
    }
    fs.readFile(file, (readErr, data) => {
      if (readErr) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(file).toLowerCase();
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log('Local: http://localhost:' + PORT + '/battle.html');
});
