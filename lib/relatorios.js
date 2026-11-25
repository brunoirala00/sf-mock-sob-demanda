// "Senior de mentira": gera os 3 relatórios sob demanda com dados FICTÍCIOS,
// sempre os mesmos para a mesma matrícula (determinístico), para o teste ser repetível.
const { buildPdf } = require('./pdf');

const TIPOS = {
  'declaracao-vinculo': 'Declaração de Vínculo Empregatício',
  'saldo-banco-horas': 'Relatório de Saldo de Banco de Horas',
  'horarios-jornada': 'Relatório de Horários da Jornada',
};

// Hash simples e estável a partir de um texto.
function hash(s) {
  let h = 2166136261;
  for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

// Converte o userId do SF numa matrícula fictícia do Senior (no real, o CPI consulta uma tabela de-para).
function matriculaDe(userId) {
  return String(100000 + (hash(userId) % 900000));
}

function pad(n) { return String(n).padStart(2, '0'); }
function dataBR(d) { return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; }
function hhmm(min) { const s = min < 0 ? '-' : ''; min = Math.abs(min); return `${s}${pad(Math.floor(min / 60))}:${pad(min % 60)}`; }

function cabecalho(items, titulo, dados, agora) {
  items.push({ type: 'text', x: 50, y: 790, size: 9, text: 'AMBIENTE DE TESTE - DADOS FICTÍCIOS - SEM VALOR LEGAL' });
  items.push({ type: 'text', x: 50, y: 760, size: 16, bold: true, text: titulo });
  items.push({ type: 'line', x1: 50, y1: 748, x2: 545, y2: 748 });
  const linhas = [
    ['Empresa', 'Empresa Exemplo S.A. (teste)'],
    ['Colaborador (userId SF)', dados.userId],
    ['Matrícula Senior', dados.matricula],
    ['Gerado em', `${dataBR(agora)} ${pad(agora.getHours())}:${pad(agora.getMinutes())} (gerado na hora, não armazenado)`],
  ];
  let y = 725;
  for (const [k, v] of linhas) {
    items.push({ type: 'text', x: 50, y, size: 10, bold: true, text: `${k}:` });
    items.push({ type: 'text', x: 200, y, size: 10, text: v });
    y -= 18;
  }
  items.push({ type: 'line', x1: 50, y1: y + 4, x2: 545, y2: y + 4 });
  return y - 20;
}

function gerar(tipo, userId, agora = new Date()) {
  // horário de Brasília, independente do fuso do servidor
  agora = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const titulo = TIPOS[tipo];
  if (!titulo) return null;
  const matricula = matriculaDe(userId);
  const h = hash(userId);
  const items = [];
  let y = cabecalho(items, titulo, { userId, matricula }, agora);

  if (tipo === 'declaracao-vinculo') {
    const admissao = new Date(2015 + (h % 9), h % 12, 1 + (h % 27));
    const cargos = ['Analista de RH', 'Engenheiro de Produto', 'Técnico de Manutenção', 'Assistente Administrativo'];
    const texto = [
      'Declaramos, para os devidos fins, que o(a) colaborador(a) identificado(a) acima',
      `mantém vínculo empregatício com esta empresa desde ${dataBR(admissao)},`,
      `ocupando atualmente o cargo de ${cargos[h % cargos.length]}, em regime CLT,`,
      'com jornada de 44 horas semanais.',
      '',
      'Esta declaração foi emitida eletronicamente a pedido do(a) colaborador(a).',
    ];
    for (const l of texto) { items.push({ type: 'text', x: 50, y, size: 11, text: l }); y -= 18; }
    y -= 40;
    items.push({ type: 'line', x1: 50, y1: y, x2: 260, y2: y });
    items.push({ type: 'text', x: 50, y: y - 14, size: 9, text: 'Departamento de Pessoal (teste)' });
  }

  if (tipo === 'saldo-banco-horas') {
    items.push({ type: 'text', x: 50, y, size: 10, bold: true, text: 'Mês' });
    items.push({ type: 'text', x: 200, y, size: 10, bold: true, text: 'Créditos' });
    items.push({ type: 'text', x: 300, y, size: 10, bold: true, text: 'Débitos' });
    items.push({ type: 'text', x: 400, y, size: 10, bold: true, text: 'Saldo acumulado' });
    y -= 6; items.push({ type: 'line', x1: 50, y1: y, x2: 545, y2: y }); y -= 16;
    let saldo = 0;
    for (let i = 5; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const cred = (hash(userId + i) % 600);
      const deb = (hash(userId + 'd' + i) % 480);
      saldo += cred - deb;
      items.push({ type: 'text', x: 50, y, size: 10, text: `${pad(d.getMonth() + 1)}/${d.getFullYear()}` });
      items.push({ type: 'text', x: 200, y, size: 10, text: hhmm(cred) });
      items.push({ type: 'text', x: 300, y, size: 10, text: hhmm(deb) });
      items.push({ type: 'text', x: 400, y, size: 10, text: hhmm(saldo) });
      y -= 18;
    }
    y -= 10;
    items.push({ type: 'text', x: 50, y, size: 11, bold: true, text: `Saldo atual: ${hhmm(saldo)} horas` });
  }

  if (tipo === 'horarios-jornada') {
    const escalas = [['07:00', '11:30', '12:30', '16:48'], ['08:00', '12:00', '13:00', '17:48'], ['06:00', '10:00', '11:00', '14:20']];
    const e = escalas[h % escalas.length];
    items.push({ type: 'text', x: 50, y, size: 10, bold: true, text: `Escala: ${e[0]} às ${e[3]}, intervalo ${e[1]} às ${e[2]}` });
    y -= 24;
    items.push({ type: 'text', x: 50, y, size: 10, bold: true, text: 'Data' });
    items.push({ type: 'text', x: 150, y, size: 10, bold: true, text: 'Entrada' });
    items.push({ type: 'text', x: 240, y, size: 10, bold: true, text: 'Saída almoço' });
    items.push({ type: 'text', x: 340, y, size: 10, bold: true, text: 'Volta almoço' });
    items.push({ type: 'text', x: 440, y, size: 10, bold: true, text: 'Saída' });
    y -= 6; items.push({ type: 'line', x1: 50, y1: y, x2: 545, y2: y }); y -= 16;
    let d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 14);
    for (let n = 0; n < 15; n++, d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const v = (k) => { const [hh, mm] = e[k].split(':').map(Number); return hhmm(hh * 60 + mm + (hash(userId + d.toDateString() + k) % 11) - 5); };
      items.push({ type: 'text', x: 50, y, size: 10, text: dataBR(d) });
      items.push({ type: 'text', x: 150, y, size: 10, text: v(0) });
      items.push({ type: 'text', x: 240, y, size: 10, text: v(1) });
      items.push({ type: 'text', x: 340, y, size: 10, text: v(2) });
      items.push({ type: 'text', x: 440, y, size: 10, text: v(3) });
      y -= 18;
    }
  }

  items.push({ type: 'text', x: 50, y: 40, size: 8, text: `Mock do serviço sob demanda (Senior simulado). Tipo: ${tipo}` });
  return { titulo, matricula, pdf: buildPdf(items, titulo) };
}

module.exports = { TIPOS, gerar, matriculaDe };
