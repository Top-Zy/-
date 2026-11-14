/**
 * 武陵山区果园管理系统 · 零依赖本地静态服务器
 * 运行：node server.js
 * 默认地址：http://localhost:8080
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8080;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  try {
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ ok: true, app: 'wuling-orchard', time: new Date().toISOString() }));
      return;
    }
    const requestUrl = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === '/') pathname = '/index.html';
    if (pathname.endsWith('/')) pathname += 'index.html';
    const filePath = path.resolve(ROOT, '.' + pathname);
    if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<meta charset="utf-8"><h1>404</h1><p>页面不存在，<a href="/index.html">返回首页</a></p>');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff'
      });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Server Error');
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('  武陵山区果园管理系统已启动');
  console.log(`  前台：http://localhost:${PORT}/index.html`);
  console.log(`  后台：http://localhost:${PORT}/admin/login.html`);
  console.log('  按 Ctrl+C 停止服务');
  console.log('');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请设置 PORT 环境变量后重试，例如：set PORT=8081 && node server.js`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
