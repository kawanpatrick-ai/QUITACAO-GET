'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';

const starterClients = [
  { id: 'demo-1', name: 'Camila Alves', institution: 'Banco Aurora', stage: 'Aguardando retorno', nextStep: 'Confirmar recebimento da proposta', due: 'Há 2 dias', overdue: true, completed: false },
  { id: 'demo-2', name: 'Diego Ribeiro', institution: 'Financeira Horizonte', stage: 'Documento recebido', nextStep: 'Conferir documentação', due: 'Hoje', overdue: false, completed: false },
  { id: 'demo-3', name: 'Júlia Martins', institution: 'Banco Vale', stage: 'Em análise', nextStep: 'Acompanhar análise', due: 'Amanhã', overdue: false, completed: false },
  { id: 'demo-4', name: 'Pedro Nunes', institution: 'Cooperativa Prisma', stage: 'Concluído', nextStep: 'Acompanhamento encerrado', due: 'Concluído', overdue: false, completed: true },
  { id: 'demo-5', name: 'Ana Clara Souza', institution: 'Banco Aurora', stage: 'Aguardando cliente', nextStep: 'Solicitar documento pendente', due: 'Há 1 dia', overdue: true, completed: false },
];

const sections = [
  { id: 'overview', label: 'Visão geral', Icon: LayoutDashboard },
  { id: 'tasks', label: 'Tarefas', Icon: ClipboardList },
  { id: 'clients', label: 'Clientes', Icon: Users },
];

function Initials({ name }) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function ClientRow({ client, onSelect, onComplete }) {
  return (
    <article className="mvp-client-row">
      <button className="mvp-client-summary" type="button" onClick={() => onSelect(client)}>
        <span className="mvp-avatar" aria-hidden="true"><Initials name={client.name} /></span>
        <span className="mvp-client-copy">
          <strong>{client.name}</strong>
          <span>{client.institution}</span>
        </span>
        <span className={`mvp-status ${client.completed ? 'is-complete' : ''}`}>
          {client.completed ? 'Concluído' : client.stage}
        </span>
        <span className={`mvp-due ${client.overdue && !client.completed ? 'is-overdue' : ''}`}>
          {!client.completed && client.overdue ? <ArrowDownRight aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
          {client.completed ? 'Encerrado' : client.due}
        </span>
        <ChevronRight className="mvp-row-chevron" aria-hidden="true" />
      </button>
      {!client.completed && (
        <button className="mvp-complete-button" type="button" aria-label={`Concluir tarefa de ${client.name}`} onClick={() => onComplete(client.id)}>
          <Check aria-hidden="true" />
        </button>
      )}
    </article>
  );
}

export default function MvpDemo() {
  const [clients, setClients] = useState(starterClients);
  const [active, setActive] = useState('overview');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [notice, setNotice] = useState('');

  const pending = useMemo(() => clients.filter((client) => !client.completed), [clients]);
  const overdue = pending.filter((client) => client.overdue).length;
  const visibleClients = useMemo(() => {
    const source = active === 'tasks' ? pending : clients;
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return source.filter((client) => !normalizedQuery || `${client.name} ${client.institution} ${client.stage}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery));
  }, [active, clients, pending, query]);

  function completeTask(id) {
    setClients((current) => current.map((client) => client.id === id ? { ...client, completed: true } : client));
    if (selected?.id === id) setSelected((client) => ({ ...client, completed: true }));
    setNotice('Tarefa concluída nesta demonstração. A alteração não será salva.');
  }

  function addClient(event) {
    event.preventDefault();
    const client = {
      id: `demo-${Date.now()}`,
      name: name.trim(),
      institution: institution.trim(),
      stage: 'Novo cadastro',
      nextStep: 'Definir próximo acompanhamento',
      due: 'Hoje',
      overdue: false,
      completed: false,
    };
    setClients((current) => [client, ...current]);
    setActive('clients');
    setQuery('');
    setSelected(client);
    setName('');
    setInstitution('');
    setShowForm(false);
    setNotice('Cadastro incluído apenas durante esta sessão de demonstração.');
  }

  const activeSection = sections.find((section) => section.id === active);
  const title = active === 'overview' ? 'Visão geral' : activeSection.label;

  return (
    <div className="mvp-app">
      <aside className="mvp-sidebar">
        <a className="mvp-brand" href="#inicio" onClick={() => setActive('overview')} aria-label="W1 Capital CRM — início">
          <span className="mvp-brand-mark">W1</span>
          <span><strong>W1 Capital</strong><small>GESTÃO DE QUITAÇÕES</small></span>
        </a>
        <p className="mvp-nav-label">ÁREA DE TRABALHO</p>
        <nav className="mvp-nav" aria-label="Navegação principal">
          {sections.map(({ id, label, Icon }) => (
            <button key={id} type="button" className={active === id ? 'is-active' : ''} aria-current={active === id ? 'page' : undefined} onClick={() => { setActive(id); setQuery(''); setSelected(null); }}>
              <Icon aria-hidden="true" />{label}
            </button>
          ))}
        </nav>
        <div className="mvp-sidebar-note">
          <span className="mvp-note-icon"><CircleHelp aria-hidden="true" /></span>
          <strong>Uma rotina mais clara</strong>
          <p>Acompanhe cada caso, prioridade e próximo passo em um só lugar.</p>
        </div>
        <div className="mvp-profile"><span className="mvp-avatar mvp-profile-avatar">D</span><span><strong>Conta de demonstração</strong><small>Acesso temporário</small></span></div>
      </aside>

      <main className="mvp-main" id="inicio">
        <header className="mvp-topbar">
          <div className="mvp-breadcrumb"><span>W1 Capital</span><ChevronRight aria-hidden="true" /><strong>{title}</strong></div>
          <div className="mvp-top-actions"><span className="mvp-demo-pill"><span /> DEMONSTRAÇÃO</span><button className="mvp-icon-button" type="button" aria-label={overdue === 1 ? '1 tarefa vencida' : `${overdue} tarefas vencidas`} onClick={() => setActive('tasks')}><Bell aria-hidden="true" />{overdue > 0 && <span className="mvp-alert-dot" />}</button></div>
        </header>

        <div className="mvp-content">
          <div className="mvp-demo-notice"><span>Dados fictícios · temporários · não salvos</span><span>Esta demonstração não usa o Supabase.</span></div>
          <div className="mvp-heading-row">
            <div><p className="mvp-eyebrow">OPERAÇÃO EM FOCO</p><h1>{title}</h1><p className="mvp-subtitle">Acompanhe retornos e mantenha cada negociação em movimento.</p></div>
            <button className="mvp-primary-button" type="button" onClick={() => { setShowForm((value) => !value); setNotice(''); }}><Plus aria-hidden="true" /> Novo cliente</button>
          </div>

          {notice && <p className="mvp-feedback" role="status">{notice}</p>}

          {showForm && (
            <form className="mvp-new-client" onSubmit={addClient}>
              <div className="mvp-form-heading"><div><p className="mvp-eyebrow">NOVO REGISTRO</p><h2>Adicionar cliente à demonstração</h2></div><button className="mvp-icon-button" type="button" aria-label="Fechar formulário" onClick={() => setShowForm(false)}><X aria-hidden="true" /></button></div>
              <div className="mvp-form-fields">
                <label>Nome do cliente<input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Maria Oliveira" /></label>
                <label>Instituição<input required maxLength={100} value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder="Ex.: Banco Central" /></label>
                <button className="mvp-primary-button" type="submit">Adicionar à demo <ArrowRight aria-hidden="true" /></button>
              </div>
            </form>
          )}

          {active === 'overview' && (
            <>
              <section className="mvp-metrics" aria-label="Resumo da carteira">
                <article className="mvp-metric-card"><span className="mvp-metric-icon"><Users aria-hidden="true" /></span><span className="mvp-metric-label">Em acompanhamento</span><strong>{pending.length}</strong><small>casos ativos na demonstração</small></article>
                <article className="mvp-metric-card is-priority"><span className="mvp-metric-icon"><Clock3 aria-hidden="true" /></span><span className="mvp-metric-label">Retornos vencidos</span><strong>{overdue}</strong><small>pedem atenção da equipe</small></article>
                <article className="mvp-metric-card"><span className="mvp-metric-icon"><CheckCircle2 aria-hidden="true" /></span><span className="mvp-metric-label">Concluídos</span><strong>{clients.filter((client) => client.completed).length}</strong><small>com acompanhamento encerrado</small></article>
              </section>
              <section className="mvp-workspace-panel">
                <div className="mvp-panel-header"><div><p className="mvp-eyebrow">PRÓXIMOS PASSOS</p><h2>Fila de acompanhamento</h2><p>Priorize o que precisa de retorno.</p></div><button className="mvp-text-button" type="button" onClick={() => setActive('tasks')}>Ver todas <ArrowRight aria-hidden="true" /></button></div>
                <div className="mvp-client-list">{visibleClients.filter((client) => !client.completed).slice(0, 4).map((client) => <ClientRow key={client.id} client={client} onSelect={setSelected} onComplete={completeTask} />)}</div>
                {pending.length === 0 && <div className="mvp-empty-state"><CheckCircle2 aria-hidden="true" /><strong>Tudo em dia</strong><span>Não há tarefas pendentes nesta demonstração.</span></div>}
              </section>
            </>
          )}

          {active !== 'overview' && (
            <section className="mvp-workspace-panel mvp-list-panel">
              <div className="mvp-panel-header"><div><p className="mvp-eyebrow">{active === 'tasks' ? 'ROTINA DIÁRIA' : 'CARTEIRA'}</p><h2>{active === 'tasks' ? 'Acompanhamentos' : 'Clientes cadastrados'}</h2><p>{active === 'tasks' ? `${pending.length} tarefas em aberto` : `${clients.length} registros nesta sessão`}</p></div><label className="mvp-search"><Search aria-hidden="true" /><span className="sr-only">Buscar cliente</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente" /></label></div>
              <div className="mvp-client-list">{visibleClients.map((client) => <ClientRow key={client.id} client={client} onSelect={setSelected} onComplete={completeTask} />)}</div>
              {visibleClients.length === 0 && <div className="mvp-empty-state"><Search aria-hidden="true" /><strong>Nenhum resultado</strong><span>Tente outro nome ou instituição.</span></div>}
            </section>
          )}

          {selected && (
            <section className="mvp-detail-panel" aria-labelledby="mvp-detail-title">
              <div className="mvp-detail-head"><div><p className="mvp-eyebrow">DETALHES DO CASO</p><h2 id="mvp-detail-title">{selected.name}</h2></div><button className="mvp-icon-button" type="button" aria-label="Fechar detalhes" onClick={() => setSelected(null)}><X aria-hidden="true" /></button></div>
              <dl className="mvp-detail-list"><div><dt>Instituição</dt><dd>{selected.institution}</dd></div><div><dt>Etapa atual</dt><dd>{selected.completed ? 'Concluído' : selected.stage}</dd></div><div><dt>Próxima ação</dt><dd>{selected.nextStep}</dd></div><div><dt>Prazo de retorno</dt><dd>{selected.completed ? 'Encerrado' : selected.due}</dd></div></dl>
              {!selected.completed && <button className="mvp-primary-button" type="button" onClick={() => completeTask(selected.id)}><Check aria-hidden="true" /> Marcar tarefa como concluída</button>}
            </section>
          )}

          <footer className="mvp-footer"><span>W1 CAPITAL · CRM</span><span>Modo de demonstração. Nenhuma alteração é persistida.</span></footer>
        </div>
      </main>
    </div>
  );
}
