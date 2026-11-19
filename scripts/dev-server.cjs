'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('node:stream');
const { createGzip } = require('node:zlib');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT || 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

function sendAsset(req, res, contentType, data) {
  res.setHeader('Content-Type', contentType);
  if (process.env.BATTLE_STATIC_COMPRESSION === '1' && data.length >= 1024 && /^(text\/|application\/json|image\/svg)/.test(contentType)) {
    res.setHeader('Vary', 'Accept-Encoding');
    const encodings = req.headers['accept-encoding'] || '';
    const acceptsGzip = encodings.split(',').some(encoding => {
      const [name, quality] = encoding.trim().toLowerCase().split(/\s*;\s*/);
      return name === 'gzip' && (quality === undefined || Number(quality.replace(/^q\s*=\s*/, '')) > 0);
    });
    if (acceptsGzip) {
      res.setHeader('Content-Encoding', 'gzip');
      if (req.method === 'HEAD') return res.end();
      const gzip = createGzip({ level: 5 });
      pipeline(gzip, res, () => {});
      gzip.end(data);
      return;
    }
  }
  res.end(data);
}

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
    const contentType = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    if (!err && st.isFile() && contentType.startsWith('audio/')) {
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
      pipeline(fs.createReadStream(file), res, () => {});
      return;
    }
    fs.readFile(file, (readErr, data) => {
      if (!readErr) {
        sendAsset(req, res, contentType, data);
        return;
      }
      // Support extensionless HTML paths such as /battle -> /battle.html
      if (!path.extname(file)) {
        const htmlFile = file + '.html';
        fs.readFile(htmlFile, (htmlErr, htmlData) => {
          if (htmlErr) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          sendAsset(req, res, MIME['.html'], htmlData);
        });
        return;
      }
      res.writeHead(404);
      res.end('Not found');
    });
  });
});

server.listen(PORT, () => {
  console.log('Local: http://localhost:' + PORT + '/');
});
