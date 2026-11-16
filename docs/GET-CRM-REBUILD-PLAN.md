# GET CRM — plano de reconstrução integral

## Direção do produto

Reconstruir o CRM como uma plataforma operacional e gerencial da GET Assessoria Financeira. A reconstrução inclui arquitetura, código, experiência do usuário, regras de negócio, segurança, dados, relatórios e operação — não apenas a identidade visual.

### Identidade visual

- Marca própria GET Assessoria Financeira.
- Interface corporativa, sóbria, contemporânea e responsiva.
- Paleta fixa: azul-marinho, verde-petróleo e neutros claros.
- Sem Naruto, Sasuke, Madara, Sharingan, artes de anime, wallpapers ou seletores de personagens.
- Contraste WCAG AA, navegação por teclado, estados de foco visíveis e suporte a movimento reduzido.
- Componentes consistentes para botões, formulários, tabelas, filtros, diálogos, indicadores e estados vazios.

### Stack alvo

- TypeScript estrito para frontend, backend e contratos.
- Next.js App Router e React.
- Supabase Auth, PostgreSQL, Storage e Row Level Security.
- Zod para validação de entradas e fronteiras de integração.
- Vitest ou Node Test Runner para testes unitários; Playwright para fluxos críticos.
- Vercel para preview e produção.
- Python somente como serviço complementar futuro para análise de dados ou processamento documental, quando houver necessidade comprovada.

## Módulos funcionais

1. **Visão gerencial:** KPIs, alertas, distribuição da carteira, prazos, produtividade e indicadores com filtros por período e responsável.
2. **Clientes e carteira:** cadastro, identificação, contatos, contratos, veículos, financiamentos, origem do registro, situação e histórico.
3. **Quitação:** fila operacional, financeira responsável, saldo, valores estimados e negociados, propostas, contatos, retornos, evidências, homologação e encerramento.
4. **Atendimentos e tarefas:** filas, agenda de retorno, prioridade, responsável, SLA, tarefas, registro de contato e trilha de auditoria.
5. **Processos:** número CNJ, partes, tribunal, eventos, consultas a fontes oficiais, documentos e histórico de atualização.
6. **Finalizados:** encerramento operacional separado da comprovação financeira, motivo, documentos e reabertura auditável.
7. **Instituições e parceiros:** financeiras, bancos, assessorias, escritórios, contatos, canais e dados de relacionamento.
8. **Documentos:** armazenamento privado, classificação, vínculo com cliente/operação/processo, metadados e controle de acesso.
9. **Relatórios e BI:** indicadores operacionais, financeiros, produtividade, aging, conversão e exportação.
10. **Administração:** usuários, papéis, permissões, parâmetros, integrações, logs e auditoria.

## Arquitetura de aplicação

Separar responsabilidades por domínio:

- `app/`: rotas, layouts e composição de páginas.
- `features/<dominio>/`: componentes, schemas, tipos e casos de uso de cada módulo.
- `server/`: serviços exclusivamente server-side e integrações privilegiadas.
- `lib/`: utilitários transversais pequenos e sem regras de domínio.
- `types/`: contratos compartilhados e tipos derivados do banco.
- `supabase/migrations/`: evolução versionada do esquema e políticas.
- `tests/` e `e2e/`: testes unitários, integração e fluxos ponta a ponta.

Regras:
- Componentes de interface não devem concentrar consultas, regras de negócio e autorização.
- Toda entrada externa deve ser validada na fronteira.
- A autorização deve existir no servidor e no banco via RLS; esconder botões não é controle de acesso.
- Listagens devem ter paginação, filtros e ordenação consistentes.
- Erros devem usar contratos previsíveis, sem expor detalhes internos.
- Toda ação sensível deve preservar ator, data, registro afetado e justificativa.
- Não criar dados fictícios em ambientes conectados a carteiras reais.

## Plano de execução

### Etapa 0 — Segurança e baseline
- Congelar a referência da branch principal.
- Mapear rotas, componentes, serviços, tabelas, views, RPCs, Edge Functions, policies, buckets e integrações.
- Registrar os fluxos reais antes de refatorar.
- Executar testes, typecheck e build e registrar falhas preexistentes.
- Criar ambiente de preview e estratégia de rollback.

### Etapa 1 — Fundação técnica e identidade
- Adotar TypeScript estrito de forma incremental.
- Definir design tokens e biblioteca visual corporativa.
- Remover a identidade anime e as opções de temas personalizados.
- Padronizar shell, navegação, autenticação, formulários, tabelas, alertas e feedback.
- Adicionar testes de regressão visual e acessibilidade.

### Etapa 2 — Domínio e dados
- Gerar tipos a partir do esquema real do Supabase.
- Documentar entidades, relacionamentos, estados e transições.
- Criar serviços por domínio e validação Zod.
- Revisar índices, constraints, RLS e políticas de Storage.
- Não executar migrações destrutivas na base de produção.

### Etapa 3 — Reconstrução funcional
- Refatorar os módulos na ordem: Clientes e Carteira; Quitação; Tarefas e Atendimentos; Processos; Finalizados; Instituições; Documentos; Relatórios; Administração.
- Manter compatibilidade com os dados atuais.
- Cobrir cada regra crítica com testes antes de substituir a implementação.

### Etapa 4 — Inteligência operacional
- Definir catálogo de KPIs com fórmula, fonte, periodicidade e responsável.
- Construir painéis com filtros consistentes e rastreabilidade até os registros.
- Implementar automações com idempotência, logs, retries e tratamento de falhas.
- Integrar IA somente com limites, trilhas de auditoria e revisão humana.

### Etapa 5 — Homologação e produção
- Testar papéis e permissões com contas distintas.
- Testar fluxos completos com dados controlados.
- Executar análise de acessibilidade, responsividade e desempenho.
- Conferir backup, recuperação, logs e rollback.
- Publicar primeiro em preview; produção somente após aprovação dos testes.

## Critérios de conclusão

- Nenhum módulo crítico depende de lógica não tipada sem justificativa.
- Typecheck, testes e build aprovados no CI.
- Nenhuma regressão em autenticação, RLS, Storage ou trilhas de auditoria.
- Fluxos críticos de quitação testados ponta a ponta.
- Interface coerente em desktop e celular, sem conflitos de contraste.
- Indicadores reconciliáveis com os registros de origem.
- Preview validado antes de qualquer promoção para produção.

## Situação atual

- Inventário inicial do repositório realizado.
- Migração inicial para TypeScript preparada em branch separada.
- Branch de reconstrução criada a partir dessa base.
- Identidade corporativa GET iniciada.
- Camadas de tema anime removidas do carregamento principal.
- Seletor de temas e personalização de wallpaper removidos de Configurações.
- Nenhuma migração SQL ou dado de produção alterado nesta etapa.
