// Gerador de PDF mínimo, sem dependências (uma página A4, texto e linhas).
// Texto em Latin-1 (WinAnsiEncoding) para aceitar acentos do português.

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * items: [{ type: 'text', x, y, size, bold, text } | { type: 'line', x1, y1, x2, y2 }]
 * Coordenadas em pontos, origem no canto inferior esquerdo (A4 = 595 x 842).
 */
function buildPdf(items, title = 'Documento') {
  let content = '';
  for (const it of items) {
    if (it.type === 'line') {
      content += `0.6 w ${it.x1} ${it.y1} m ${it.x2} ${it.y2} l S\n`;
    } else {
      const font = it.bold ? 'F2' : 'F1';
      content += `BT /${font} ${it.size || 11} Tf ${it.x} ${it.y} Td (${esc(it.text)}) Tj ET\n`;
    }
  }
  const contentBuf = Buffer.from(content, 'latin1');

  const objs = [];
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>');
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  objs.push(null); // stream, montado abaixo
  objs.push(`<< /Title (${esc(title)}) /Producer (mock-sob-demanda) >>`);

  const chunks = [];
  let offset = 0;
  const push = (b) => { const buf = Buffer.isBuffer(b) ? b : Buffer.from(b, 'latin1'); chunks.push(buf); offset += buf.length; };
  const xref = [];

  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  objs.forEach((o, i) => {
    xref.push(offset);
    if (o === null) {
      push(`${i + 1} 0 obj\n<< /Length ${contentBuf.length} >>\nstream\n`);
      push(contentBuf);
      push('\nendstream\nendobj\n');
    } else {
      push(`${i + 1} 0 obj\n${o}\nendobj\n`);
    }
  });
  const xrefStart = offset;
  let x = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const o of xref) x += `${String(o).padStart(10, '0')} 00000 n \n`;
  push(x);
  push(`trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${objs.length} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);
  return Buffer.concat(chunks);
}

module.exports = { buildPdf };
