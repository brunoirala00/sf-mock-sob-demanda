// Simula o web service do Senior: recebe tipo + matrícula/userId e devolve o PDF em base64 (JSON).
// GET /api/senior/relatorio?tipo=declaracao-vinculo&userId=xxx
const { gerar, TIPOS } = require('../../lib/relatorios');

module.exports = (req, res) => {
  const url = new URL(req.url, 'http://local');
  const tipo = url.searchParams.get('tipo');
  const userId = url.searchParams.get('userId');
  if (!tipo || !TIPOS[tipo] || !userId) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ erro: 'Informe tipo e userId', tipos: Object.keys(TIPOS) }));
  }
  const r = gerar(tipo, userId);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ tipo, matricula: r.matricula, nomeArquivo: `${tipo}-${r.matricula}.pdf`, pdfBase64: r.pdf.toString('base64') }));
};
