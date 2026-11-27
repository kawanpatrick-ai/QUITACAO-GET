'use client';
import {ShieldCheck,ChartNoAxesCombined,History,LockKeyhole} from 'lucide-react';

export default function ProfessionalAuth({eyebrow='ÁREA RESTRITA',title='Acesse o Controle de Quitação',description='Entre com seu acesso autorizado.',children}){
 return <main className="w1-auth-screen"><div className="w1-auth-frame">
  <section className="w1-auth-hero" aria-label="Apresentação do Controle de Quitação">
   <div className="w1-auth-hero-top">
    <img className="w1-auth-hero-logo" src="/branding/get-crm-wordmark.svg" alt="GET Assessoria Financeira" width="340" height="76" decoding="async" loading="eager" fetchPriority="high"/>
    <div className="w1-auth-hero-tag"><i/> GESTÃO DE QUITAÇÃO</div>
   </div>
   <div className="w1-auth-hero-content">
    <span>CONTROLE DE QUITAÇÃO · GET ASSESSORIA</span>
    <h2>Quitações organizadas. Decisões mais claras.</h2>
    <p>Clientes, negociações, retornos e histórico de atendimento em um ambiente único, seguro e preparado para a operação.</p>
    <div className="w1-auth-capabilities">
     <div><span><ChartNoAxesCombined size={19}/></span><div><strong>Carteira centralizada</strong><small>Acompanhamento de clientes e negociações</small></div></div>
     <div><span><History size={19}/></span><div><strong>Histórico rastreável</strong><small>Contatos, retornos e tarefas organizados</small></div></div>
     <div><span><ShieldCheck size={19}/></span><div><strong>Acesso seguro</strong><small>Autenticação e permissões controladas</small></div></div>
    </div>
   </div>
   <div className="w1-auth-hero-footer"><span>GET ASSESSORIA FINANCEIRA</span><span>CONTROLE DE QUITAÇÃO · © 2026</span></div>
  </section>
  <section className="w1-auth-panel" aria-label="Acesso ao Controle de Quitação">
   <div className="w1-auth-panel-top">
    <div className="w1-auth-panel-brand">
     <img src="/branding/get-crm-wordmark-light.svg" alt="GET Assessoria Financeira" width="340" height="76"/>
     <span>CONTROLE DE QUITAÇÃO</span>
    </div>
    <span className="w1-auth-lock"><LockKeyhole size={14}/> Acesso privado</span>
   </div>
   <div className="w1-auth-panel-center"><div className="w1-auth-heading"><span className="w1-auth-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children}</div>
   <div className="w1-auth-panel-footer"><ShieldCheck size={15}/> Protegido por autenticação e políticas de acesso · GET Assessoria Financeira</div>
  </section>
 </div></main>;
}
