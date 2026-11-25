// Tela de apoio do teste: lista, insere e exclui lançamentos na tabela de banco de horas do "Senior simulado".
// GET    /api/banco-horas?userId=...            -> lançamentos + saldo
// POST   /api/banco-horas  {userId, data, minutos, motivo}
// DELETE /api/banco-horas?userId=...&id=...
const db = require('../../lib/db');
const { matriculaDe } = require('../../lib/relatorios');

function json(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

function lerCorpo(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((ok) => {
    let s = '';
    req.on('data', (c) => (s += c));
    req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch { ok({}); } });
  });
}

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, 'http://local');
    if (req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) return json(res, 400, { erro: 'Informe userId' });
      const matricula = matriculaDe(userId);
      const lancamentos = await db.listar(matricula);
      const saldo = lancamentos.reduce((s, l) => s + l.minutos, 0);
      return json(res, 200, { userId, matricula, saldoMinutos: saldo, lancamentos, banco: db.temBanco() });
    }
    if (req.method === 'POST') {
      const b = await lerCorpo(req);
      const minutos = Number(b.minutos);
      if (!b.userId || !/^\d{4}-\d{2}-\d{2}$/.test(b.data || '') || !Number.isInteger(minutos) || minutos === 0 || !b.motivo) {
        return json(res, 400, { erro: 'Informe userId, data (AAAA-MM-DD), minutos (inteiro diferente de zero) e motivo' });
      }
      const id = await db.inserir({ matricula: matriculaDe(b.userId), data: b.data, minutos, motivo: String(b.motivo).slice(0, 80) });
      return json(res, 201, { id });
    }
    if (req.method === 'DELETE') {
      const userId = url.searchParams.get('userId');
      const id = Number(url.searchParams.get('id'));
      if (!userId || !id) return json(res, 400, { erro: 'Informe userId e id' });
      await db.excluir(id, matriculaDe(userId));
      return json(res, 200, { ok: true });
    }
    return json(res, 405, { erro: 'Método não suportado' });
  } catch (e) {
    return json(res, 500, { erro: e.message });
  }
};
