# Publicação do GET CRM no Cloudflare Workers

O app usa Next.js 15 e o adaptador OpenNext para Cloudflare Workers. O Worker alvo é `get-crm`; o script `ancient-credit-decb` existente na conta não deve ser reutilizado.

## Build

- Node.js de build: 22 LTS (`NODE_VERSION=22`).
- Comando de build: `npm run cf:build`.
- Comando de deploy: `npx wrangler deploy`.
- Runtime: Workers com `nodejs_compat`.
- Assets: `.open-next/assets`.

## Supabase

O `wrangler.jsonc` já aponta para o projeto Supabase ativo `projectw1sc-crm` e define as variáveis públicas de URL e publishable key. Essas credenciais podem ser expostas no browser e não concedem acesso administrativo ao banco.

Configurar como **Worker Secrets** antes de liberar a produção:

- `SUPABASE_SERVICE_ROLE_KEY` — necessária apenas para as rotas de servidor que usam privilégios administrativos, incluindo a sync atual.
- `GOOGLE_SERVICE_ACCOUNT_JSON` — credencial da conta de serviço compartilhada apenas com as planilhas autorizadas; ou, alternativamente, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN`.
- `GOOGLE_SHEETS_IDS` — IDs das planilhas autorizadas, separados por vírgula.
- `CRON_SECRET` — opcional, para proteger chamadas automatizadas da sync.
- `DATAJUD_API_KEY` — opcional, caso a chave pública definida no código seja substituída.

Nunca commitar esses segredos nem colocá-los em variáveis `NEXT_PUBLIC_*`.

## Workers Builds

A conexão GitHub deve usar o repositório `kawanpatrick-ai/QUITACAO-GET`, branch `main`, Worker `get-crm`, build `npm run cf:build` e deploy `npx wrangler deploy`. Definir `NODE_VERSION=22` para o ambiente de build. Configurar as variáveis públicas de build correspondentes às variáveis de `wrangler.jsonc`.

O preview deve ser testado antes de associar o domínio de produção. O domínio deve ser ligado apenas depois de confirmar DNS, domínio e Worker de destino.

## Verificação pós-publicação

1. Abrir a URL de preview e testar login, consulta de carteira e edição de cliente.
2. Testar a sync do Google Sheets e confirmar que campos operacionais editados permanecem inalterados.
3. Testar a função de upload de logos com conta admin e confirmar que usuário sem membership recebe negação.
4. Conferir logs de runtime e rotas de API antes de associar o domínio principal.
