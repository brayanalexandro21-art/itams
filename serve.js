const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5173;
const API_PORT = 3001;
const DIST = path.join(__dirname, 'frontend/dist');
const UPLOADS = path.join(__dirname, 'backend/uploads');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);

  // Proxy API requests to backend
  if (parsed.pathname.startsWith('/api')) {
    const proxyReq = http.request({
      hostname: 'localhost', port: API_PORT,
      path: req.url, method: req.method,
      headers: { ...req.headers, host: `localhost:${API_PORT}` },
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', () => {
      res.writeHead(502);
      res.end('Backend offline');
    });
    req.pipe(proxyReq);
    return;
  }

  // Serve uploaded files from backend/uploads
  if (parsed.pathname.startsWith('/uploads/')) {
    const filePath = path.join(UPLOADS, parsed.pathname.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const mime = MIME[ext] || 'application/octet-stream';
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'public, max-age=86400' });
      res.end(content);
      return;
    }
  }

  // Serve static files
  let filePath = path.join(DIST, parsed.pathname === '/' ? 'index.html' : parsed.pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html'); // SPA fallback
  }

  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  } catch (e) {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ITAMS: http://localhost:${PORT}`);
});
