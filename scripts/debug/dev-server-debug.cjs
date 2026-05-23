// Dev server wrapper that injects the debug logger when ?debug=1 is present.
// Mirrors scripts/dev-server.cjs API (port 5173) but rewrites battle.html on
// the fly to append <script src="/scripts/debug/debug-logger.js"></script>
// before </body>. Original battle.html is never modified on disk.

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.PORT || 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

function injectDebugScript(html) {
  const tag = '<script src="/scripts/debug/debug-logger.js"></script>';
  if (html.indexOf('</body>') >= 0) return html.replace('</body>', tag + '\n</body>');
  return html + '\n' + tag + '\n';
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsed.pathname || '/');
  if (pathname === '/') pathname = '/battle.html';
  const abs = path.join(ROOT, pathname);
  if (!abs.startsWith(ROOT)) {
    res.writeHead(403); res.end('forbidden'); return;
  }
  fs.stat(abs, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404); res.end('not found'); return;
    }
    const ext = path.extname(abs).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    if (ext === '.html' && (parsed.query.debug === '1' || parsed.query.debug === 'true')) {
      const html = fs.readFileSync(abs, 'utf8');
      const out = injectDebugScript(html);
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': 'no-cache',
        'X-Debug-Logger': 'injected',
      });
      res.end(out);
      return;
    }

    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    fs.createReadStream(abs).pipe(res);
  });
});

server.listen(PORT, () => {
  process.stdout.write(`[dev-server-debug] http://localhost:${PORT}/battle.html?debug=1 — debug logger injected when ?debug=1\n`);
});
