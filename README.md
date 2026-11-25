# Mock do serviço de documentos sob demanda

Simula o fluxo sob demanda do projeto "Meus documentos" (WEG), só com dados fictícios:
clique no link → serviço identifica o usuário → "Senior" gera o PDF na hora → PDF volta ao navegador, sem gravar nada.

## Endpoints

| Endpoint | Papel no desenho real | Retorno |
| --- | --- | --- |
| `GET /sob-demanda/<tipo>?userId=<userId SF>` | App Router + CPI (o que o link do SF chama) | PDF inline |
| `GET /api/senior/relatorio?tipo=<tipo>&userId=<userId SF>` | Web service do Senior | JSON com o PDF em base64 |

Tipos: `declaracao-vinculo`, `saldo-banco-horas`, `horarios-jornada`.

Os dados são fictícios. Declaração e horários são determinísticos (o mesmo userId gera sempre os mesmos números).

O **saldo do banco de horas** vem da tabela `banco_horas` (Postgres Neon, ligado pelo Vercel), consultada a cada clique.
Na primeira chamada o serviço cria a tabela e carrega os lançamentos de exemplo de `data/banco-horas.json`.
Sem banco configurado, o mock usa esse arquivo em modo só leitura.

Tela para incluir e excluir lançamentos: `/banco-horas?userId=<userId SF>`.

| Endpoint | Uso |
| --- | --- |
| `GET /api/banco-horas?userId=` | lista os lançamentos e o saldo |
| `POST /api/banco-horas` `{userId, data, minutos, motivo}` | inclui (minutos negativos = débito) |
| `DELETE /api/banco-horas?userId=&id=` | exclui |

**Só para teste:** o userId vai na URL porque o mock não tem login. No desenho real ele vem do token do IAS e nunca da URL.
A tela de lançamentos não tem login; use só dados fictícios.

## Ligar o banco no Vercel (uma vez)

1. No projeto `sf-mock-sob-demanda` do Vercel, abra a aba **Storage** e clique em **Create Database**.
2. Escolha **Neon (Serverless Postgres)**, plano **Free**, região **São Paulo (sa-east-1)** e crie.
3. Em **Connect Project**, selecione `sf-mock-sob-demanda`, todos os ambientes, e conecte. O Vercel cria a variável `DATABASE_URL`.
4. Faça um novo deploy (Deployments > ... > Redeploy, ou qualquer push no main): variáveis novas só valem em deploy novo.

## Rodar local

```
node server.js        # http://localhost:3000/sob-demanda/declaracao-vinculo?userId=teste
```

## Publicar no Vercel (projeto separado)

```
cd mock-sob-demanda
npx vercel            # faz login no navegador e cria o projeto (aceite os padrões)
npx vercel --prod     # publica em produção e mostra a URL
```

## Testar a partir do SF

No pai `cust_myDocumentsUser`, um campo String 255 com Display As = Hyperlink Field (URL), Read Only,
preenchido por regra ao salvar:

```
Concatenate("https://<url-do-vercel>/sob-demanda/declaracao-vinculo?userId=", externalCode)
```
