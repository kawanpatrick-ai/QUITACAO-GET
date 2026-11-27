'use client';
import {useEffect,useRef,useState} from 'react';
import {ClipboardList,LayoutDashboard,Users,CheckCircle2,Landmark,LogOut,KeyRound,NotebookPen,Bell,Mail,BarChart3,PanelLeftOpen,PanelLeftClose,Settings2,Gavel} from 'lucide-react';
import {CRM_AREAS} from '../lib/crm-navigation.mjs';
import {getClient} from '../lib/supabase-client';
import {PROFILE_BUCKET,ownerAvatarPath} from '../lib/profile-settings.mjs';

const icons={'Visão geral':LayoutDashboard,'Tarefas':ClipboardList,'Clientes':Users,'Finalizados':CheckCircle2,'Instituições':Landmark,'Minhas atividades':NotebookPen,'Relatórios':BarChart3,'Configurações':Settings2,'Processos':Gavel};
export default function CrmShell({active='Visão geral',email='',onNavigate,onSignOut,onPassword,overdueCount=0,children}){
 const [sidebarExpanded,setSidebarExpanded]=useState(false);
 const [profile,setProfile]=useState({display_name:'',avatar_path:''});
 const [avatarUrl,setAvatarUrl]=useState('');
 useEffect(()=>{
  const db=getClient();if(!db)return;
  let alive=true;
  let request=0;
  async function refreshProfile(){
   const current=++request;
   const {data,error}=await db.auth.getUser();
   if(!alive||current!==request||error||!data?.user)return;
   const user=data.user,metadata=user.user_metadata||{};
   setProfile({display_name:String(metadata.display_name||metadata.full_name||''),avatar_path:String(metadata.avatar_path||'')});
   const photo=ownerAvatarPath(user.id,metadata.avatar_path)
    ?await db.storage.from(PROFILE_BUCKET).createSignedUrl(metadata.avatar_path,3600)
    :{data:null,error:null};
   if(!alive||current!==request)return;
   setAvatarUrl(photo.error?'':photo.data?.signedUrl||'');
  }
  function scheduleRefresh(){window.setTimeout(refreshProfile,0)}
  const {data:{subscription}}=db.auth.onAuthStateChange(()=>{scheduleRefresh()});
  window.addEventListener('projectw1sc:profile-change',scheduleRefresh);
  refreshProfile();
  return()=>{alive=false;subscription.unsubscribe();window.removeEventListener('projectw1sc:profile-change',scheduleRefresh);};
 },[]);
  const sidebarRef=useRef(null);
 useEffect(()=>{
  function onPointerDown(event){
   if(!sidebarRef.current?.contains(event.target))setSidebarExpanded(false);
  }
  function onKeyDown(event){
   if(event.key==='Escape')setSidebarExpanded(false);
  }
  document.addEventListener('pointerdown',onPointerDown,true);
  document.addEventListener('keydown',onKeyDown);
  return()=>{
   document.removeEventListener('pointerdown',onPointerDown,true);
   document.removeEventListener('keydown',onKeyDown);
  };
 },[]);
 const shrinkIfUnfocused=()=>{
  const active=document.activeElement;
  const keyboardFocus=Boolean(
   sidebarRef.current?.contains(active)&&active instanceof HTMLElement&&active.matches(':focus-visible')
  );
  if(!keyboardFocus)setSidebarExpanded(false);
 };
 return <div className={'app-shell '+(sidebarExpanded?'sidebar-expanded':'sidebar-collapsed')}>
  <a className="app-skip-link" href="#conteudo">Pular para o conteúdo</a>
  <aside ref={sidebarRef} className="app-sidebar"
    onMouseEnter={()=>setSidebarExpanded(true)}
    onMouseLeave={shrinkIfUnfocused}
    onFocusCapture={()=>setSidebarExpanded(true)}
    onBlurCapture={event=>{
     if(!event.currentTarget.contains(event.relatedTarget))setSidebarExpanded(false);
    }}>
   <div className="app-identity">
    <button type="button" className="app-sidebar-toggle" aria-label={sidebarExpanded?'Recolher menu lateral':'Expandir menu lateral'} aria-expanded={sidebarExpanded} onClick={()=>setSidebarExpanded(x=>!x)}>{sidebarExpanded?<PanelLeftClose size={19}/>:<PanelLeftOpen size={19}/>}</button>
    <a className="app-brand-link" href="/" aria-label="Controle de Quitação — Visão geral" title="Controle de Quitação">
     <img className="app-brand-compact" src="/branding/get-crm-symbol.svg" alt="GET" width="64" height="64" decoding="async"/>
     <span className="app-brand-lockup">
      <img className="app-brand-full" src="/branding/get-crm-wordmark.svg" alt="GET Assessoria Financeira" width="340" height="76" decoding="async"/>
      <small className="app-brand-product">Controle de Quitação</small>
     </span>
    </a>
   </div>
   <div className="app-mobile-account">
    {onPassword?<button type="button" onClick={onPassword} aria-label="Alterar senha"><KeyRound size={16}/></button>:<a href="/?senha=1" aria-label="Alterar senha"><KeyRound size={16}/></a>}
    <button type="button" onClick={onSignOut} aria-label="Sair da conta"><LogOut size={16}/></button>
   </div>
   <div className="app-section-name">ÁREA DE TRABALHO</div>
   <nav aria-label="Navegação principal" className="app-nav">
    {CRM_AREAS.map(item=>{
     const Icon=icons[item.label];
     return <a key={item.key} href={item.path} aria-current={active===item.label?'page':undefined} className={'app-nav-link '+(active===item.label?'active':'')} title={sidebarExpanded?undefined:item.label} aria-label={item.label} onClick={e=>{
       if(onNavigate&&!['Tarefas','Minhas atividades','Relatórios','Configurações','Processos'].includes(item.label)&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){
        e.preventDefault();onNavigate(item.label);setSidebarExpanded(false);
       }
      }}><Icon size={17} aria-hidden="true"/><span>{item.label}</span></a>;
    })}
   </nav>
   <footer className="app-nav-footer">
    <div className="app-private"><span>Dados privados, rastreáveis e<br/>vinculados à origem.</span></div>
    <small className="app-account-email" title={email}><Mail size={14}/><span><strong className="app-profile-label">{profile.display_name||'Meu perfil'}</strong>{email}</span></small>
    <div className="app-account-actions">
     {onPassword?<button onClick={onPassword} type="button"><KeyRound size={14}/> Alterar senha</button>:<a href="/?senha=1"><KeyRound size={14}/> Alterar senha</a>}
     <button onClick={onSignOut} type="button"><LogOut size={14}/> Sair</button>
    </div>
    <small className="app-copyright" aria-label="Direitos autorais da GET Assessoria">© 2026 GET Assessoria Financeira · Controle de Quitação</small>
   </footer>
  </aside>
  <div className="app-content"><div className="reference-top-tools">
   
   <a href="/tarefas?fila=vencidos" aria-label="Ver retornos vencidos" title="Ver retornos vencidos" className="reference-top-alert"><Bell size={20}/>{overdueCount>0&&<span className="reference-notification-dot"/>}</a><span className="reference-top-divider"/><a className="reference-top-avatar" href="/configuracoes" title={profile.display_name||'Configurações do perfil'} aria-label="Abrir configurações do perfil">{avatarUrl?<img src={avatarUrl} alt="Foto do perfil" width="36" height="36" decoding="async"/>:(profile.display_name||email||'W').charAt(0).toLocaleUpperCase('pt-BR')}</a></div><div id="conteudo" tabIndex="-1">{children}</div></div>
 </div>;
}
