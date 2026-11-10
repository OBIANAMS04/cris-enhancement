// A small local web server for the Command Center, with no dependencies:
//   node scripts/serve.mjs [port]
// The page fetches .colaberry/*.json at runtime, which a browser refuses for a file opened straight from disk,
// so it has to be served. GitHub Pages does this job once the repo is online.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.argv[2] ?? 4321);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.md': 'text/markdown; charset=utf-8' };

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(join(root, normalize(path)));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  } catch (err) {
    const missing = err.code === 'ENOENT' || err.code === 'ENOTDIR';
    if (!missing) console.error(err);
    res.writeHead(missing ? 404 : 500).end(missing ? 'Not found' : 'Server error');
  }
}).listen(port, '127.0.0.1', () => console.log(`Command Center at http://localhost:${port}/`));
