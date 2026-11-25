// "Banco do Senior simulado": tabela de lançamentos de banco de horas.
// Com DATABASE_URL (Neon, criado pelo Vercel) usa Postgres de verdade.
// Sem DATABASE_URL (rodando local) usa o arquivo data/banco-horas.json, só leitura.
const fs = require('fs');
const path = require('path');

const ARQ = path.join(__dirname, '..', 'data', 'banco-horas.json');
const URL_DB = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let sql = null;
let pronto = null;

function seed() {
  return JSON.parse(fs.readFileSync(ARQ, 'utf8')).lancamentos;
}

// Cria a tabela na primeira chamada e, se estiver vazia, carrega os lançamentos de exemplo.
async function garantirTabela() {
  if (!URL_DB) return;
  if (!sql) sql = require('@neondatabase/serverless').neon(URL_DB);
  if (!pronto) {
    pronto = (async () => {
      await sql.query(`create table if not exists banco_horas (
        id serial primary key,
        matricula text not null,
        data date not null,
        minutos integer not null,
        motivo text not null,
        criado_em timestamptz not null default now()
      )`);
      const [{ n }] = await sql.query('select count(*)::int as n from banco_horas');
      if (n === 0) {
        for (const l of seed()) {
          await sql.query('insert into banco_horas (matricula, data, minutos, motivo) values ($1, $2, $3, $4)',
            [l.matricula, l.data, l.minutos, l.motivo]);
        }
      }
    })().catch((e) => { pronto = null; throw e; });
  }
  await pronto;
}

async function listar(matricula) {
  if (!URL_DB) {
    return seed().filter((l) => l.matricula === matricula).map((l, i) => ({ id: i + 1, ...l }));
  }
  await garantirTabela();
  const rows = await sql.query(
    "select id, matricula, to_char(data, 'YYYY-MM-DD') as data, minutos, motivo from banco_horas where matricula = $1 order by data, id",
    [matricula]);
  return rows;
}

async function inserir({ matricula, data, minutos, motivo }) {
  if (!URL_DB) throw new Error('Banco não configurado (DATABASE_URL ausente).');
  await garantirTabela();
  const [r] = await sql.query(
    "insert into banco_horas (matricula, data, minutos, motivo) values ($1, $2, $3, $4) returning id",
    [matricula, data, minutos, motivo]);
  return r.id;
}

async function excluir(id, matricula) {
  if (!URL_DB) throw new Error('Banco não configurado (DATABASE_URL ausente).');
  await garantirTabela();
  await sql.query('delete from banco_horas where id = $1 and matricula = $2', [id, matricula]);
}

module.exports = { listar, inserir, excluir, temBanco: () => !!URL_DB };
