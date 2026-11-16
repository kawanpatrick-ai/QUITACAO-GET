# Publicação do GET CRM no Cloudflare Workers

O app usa Next.js 15 e o adaptador OpenNext para Cloudflare Workers. O Worker alvo é `get-crm`; o script `ancient-credit-decb` existente na conta não deve ser reutilizado.

## Build e deploy

- Node.js de build: 22 LTS (definido em `.node-version`, `.nvmrc` e CI).
- Build: `npm run cf:build`.
- Deploy após build: `npx wrangler deploy --config wrangler.jsonc`.
- Runtime: Workers com `nodejs_compat`.
- Assets: `.open-next/assets`.

### Ativar deploy automático pelo GitHub Actions

No repositório `kawanpatrick-ai/QUITACAO-GET`, abrir **Settings → Secrets and variables → Actions** e cadastrar:

**Repository secret**
- `CLOUDFLARE_API_TOKEN`: token de usuário da Cloudflare com acesso de edição a Workers Scripts para a conta GET.

**Repository variables**
- `CLOUDFLARE_ACCOUNT_ID`: `205c65bf86a1a463f4f642ffcf45f81d`.
- `CLOUDFLARE_DEPLOY_ENABLED`: `true` para habilitar o deploy automático em pushes na branch `main`.

O token deve ser criado em **Cloudflare → My Profile → API Tokens**, com o modelo **Edit Cloudflare Workers**, limitado à conta correta. Não colar o token em issues, PRs, arquivos do repositório ou nesta conversa. A conexão OAuth do ChatGPT não substitui esse token no pipeline do Wrangler.

Com a variável `CLOUDFLARE_DEPLOY_ENABLED` ausente ou diferente de `true`, o CI executa os testes e builds, mas não publica. Com ela em `true`, a ausência do segredo ou do account ID faz o job falhar explicitamente.

## Segredos de runtime do Worker

No painel Cloudflare: **Workers & Pages → get-crm → Settings → Variables and Secrets → Production**. Cadastrar como **Secrets**, nunca como texto público:

- `SUPABASE_SERVICE_ROLE_KEY` — necessária para a rota de sync que executa operações administrativas no servidor.
- `GOOGLE_SERVICE_ACCOUNT_JSON` — credencial da conta de serviço compartilhada somente com as planilhas autorizadas; ou, como alternativa, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN`.
- `CRON_SECRET` — opcional, para proteger chamadas automatizadas da sync.
- `DATAJUD_API_KEY` — opcional.

Cadastrar também como variável de runtime não secreta:
- `GOOGLE_SHEETS_IDS` — IDs das planilhas autorizadas, separados por vírgula.

O `wrangler.jsonc` já contém os valores públicos do projeto Supabase ativo `projectw1sc-crm` (URL e publishable key). A publishable key pode estar no navegador; a service role key nunca pode estar em `NEXT_PUBLIC_*`.

## Supabase

O backend ativo é `ntkvwdyifxayoksihjih`, região `sa-east-1`. A aplicação depende de autenticação Supabase e RLS; não usar a chave `service_role` no navegador.

Ainda falta desabilitar o cadastro público em **Supabase → Authentication → Providers → Email → Allow new users to sign up**. Isso é uma alteração do painel Auth, não da tabela SQL.

## Verificação pós-publicação

1. Abrir a URL `https://get-crm.patrickkawan719.workers.dev` e testar login.
2. Testar consulta da carteira, edição de cliente e criação manual.
3. Testar a sync do Google Sheets e confirmar que campos operacionais editados permanecem inalterados.
4. Testar logos com conta admin e confirmar que usuário sem membership recebe negação.
5. Conferir logs de runtime e rotas de API antes de associar domínio personalizado ou substituir qualquer destino anterior.

Não associar domínio de produção até passar esses testes. O Worker `ancient-credit-decb` deve permanecer intacto.
