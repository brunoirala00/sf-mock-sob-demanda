// Servidor local para testar sem Vercel: node server.js  ->  http://localhost:3000
const http = require('http');
const docs = require('./api/docs/[tipo].js');
const senior = require('./api/senior/relatorio.js');

http.createServer((req, res) => {
  const path = new URL(req.url, 'http://local').pathname;
  if (path.startsWith('/sob-demanda/') || path.startsWith('/api/docs/')) return docs(req, res);
  if (path === '/api/senior/relatorio') return senior(req, res);
  res.statusCode = 404; res.end('not found');
}).listen(process.env.PORT || 3000, () => console.log('mock em http://localhost:' + (process.env.PORT || 3000)));
