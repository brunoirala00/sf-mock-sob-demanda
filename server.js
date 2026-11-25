// Servidor local para testar sem Vercel: node server.js  ->  http://localhost:3000
// Sem DATABASE_URL usa data/banco-horas.json (só leitura). Com DATABASE_URL usa o Postgres.
const http = require('http');
const fs = require('fs');
const path = require('path');
const docs = require('./api/docs/[tipo].js');
const senior = require('./api/senior/relatorio.js');
const banco = require('./api/banco-horas/index.js');

http.createServer((req, res) => {
  const p = new URL(req.url, 'http://local').pathname;
  if (p.startsWith('/sob-demanda/') || p.startsWith('/api/docs/')) return docs(req, res);
  if (p === '/api/senior/relatorio') return senior(req, res);
  if (p === '/api/banco-horas') return banco(req, res);
  if (p === '/banco-horas') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(fs.readFileSync(path.join(__dirname, 'public', 'banco-horas.html')));
  }
  res.statusCode = 404; res.end('not found');
}).listen(process.env.PORT || 3000, () => console.log('mock em http://localhost:' + (process.env.PORT || 3000)));
