// Faz o papel do CPI (+ App Router): recebe o clique, identifica o usuário,
// "chama o Senior", e devolve o PDF direto ao navegador, sem gravar nada.
// GET /sob-demanda/<tipo>?userId=<userId do SF>
//
// ATENÇÃO (só teste): aqui o userId vem na URL porque não há login.
// No desenho real, o userId vem do token do IAS e NUNCA da URL.
const { gerar, TIPOS } = require('../../lib/relatorios');

module.exports = (req, res) => {
  const url = new URL(req.url, 'http://local');
  const tipo = (req.query && req.query.tipo) || url.pathname.split('/').filter(Boolean).pop();
  const userId = url.searchParams.get('userId');

  if (!TIPOS[tipo]) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end(`Tipo de documento desconhecido: ${tipo}. Use: ${Object.keys(TIPOS).join(', ')}`);
  }
  if (!userId) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('Usuário não identificado (no real, viria do login IAS).');
  }

  const r = gerar(tipo, userId);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${tipo}-${r.matricula}.pdf"`);
  res.setHeader('Cache-Control', 'no-store');
  res.end(r.pdf);
};
