# Mock do serviço de documentos sob demanda

Simula o fluxo sob demanda do projeto "Meus documentos" (WEG), só com dados fictícios:
clique no link → serviço identifica o usuário → "Senior" gera o PDF na hora → PDF volta ao navegador, sem gravar nada.

## Endpoints

| Endpoint | Papel no desenho real | Retorno |
| --- | --- | --- |
| `GET /sob-demanda/<tipo>?userId=<userId SF>` | App Router + CPI (o que o link do SF chama) | PDF inline |
| `GET /api/senior/relatorio?tipo=<tipo>&userId=<userId SF>` | Web service do Senior | JSON com o PDF em base64 |

Tipos: `declaracao-vinculo`, `saldo-banco-horas`, `horarios-jornada`.

Os dados são fictícios e determinísticos: o mesmo userId sempre gera a mesma matrícula e os mesmos números.

**Só para teste:** o userId vai na URL porque o mock não tem login. No desenho real ele vem do token do IAS e nunca da URL.

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
