const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const requestedPort = Number(process.env.PORT || 3000);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.webp': 'image/webp',
};

const server = http.createServer((req, res) => {
  if (req.url === '/api/order' || req.url === '/Process_order.php') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          order_id: `ABI-GH-${Math.floor(100000 + Math.random() * 900000)}`,
          message: "Inquiry successfully submitted to Abigail Amoah at Abi's Bakery!",
          timestamp: new Date().toISOString(),
        }));
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "Abi's Bakery API is operational" }));
    return;
  }

  const requested = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = requested === '/' ? 'Index.html' : requested.slice(1);
  const filePath = path.resolve(root, file);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

function listenOnAvailablePort(port) {
  const probe = require('node:net').createServer();
  probe.once('error', (error) => {
    probe.close();
    if (error.code === 'EADDRINUSE' && !process.env.PORT) {
      console.warn(`Port ${port} is busy; trying ${port + 1}...`);
      listenOnAvailablePort(port + 1);
      return;
    }
    throw error;
  });
  probe.listen(port, () => {
    probe.close(() => server.listen(port, () => {
      console.log(`Abi's Bakery running at http://localhost:${port}`);
    }));
  });
}

listenOnAvailablePort(requestedPort);
