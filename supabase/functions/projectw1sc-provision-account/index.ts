// Provisionamento de contas autorizado por membership administrativa ativa.
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const allowedOrigins = new Set([
 'https://quitacao-get.vercel.app',
 'https://quitacao-get-git-projectw1sc-crm-kawpk.vercel.app',
 'https://quitacao-h0561mu1s-kawpk.vercel.app'
]);
const baseHeaders = {
 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
 'Access-Control-Allow-Methods':'POST, OPTIONS',
 'Content-Type':'application/json;charset=utf-8',
 'Cache-Control':'no-store',
 'Vary':'Origin'
};
const headersFor = origin => ({
 ...baseHeaders,
 ...(origin && allowedOrigins.has(origin)
  ? {'Access-Control-Allow-Origin':origin}
  : {'Access-Control-Allow-Origin':'https://quitacao-get.vercel.app'})
});
const reply=(body,status=200,origin=null)=>new Response(JSON.stringify(body),{status,headers:headersFor(origin)});

Deno.serve(async request=>{
 const origin=request.headers.get('origin');
 if(origin&&!allowedOrigins.has(origin))return reply({ok:false,error:'Origem não autorizada.'},403,origin);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:headersFor(origin)});
 if(request.method!=='POST')return reply({ok:false,error:'Método não permitido.'},405,origin);

 const jwt=(request.headers.get('authorization')||'').replace(/^Bearer\\s+/i,'');
 if(!jwt)return reply({ok:false,error:'Entre como administrador antes de cadastrar usuários.'},401,origin);
 const url=Deno.env.get('SUPABASE_URL');
 const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!key)return reply({ok:false,error:'Serviço de autenticação indisponível.'},503,origin);

 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:identity,error:identityError}=await admin.auth.getUser(jwt);
 if(identityError||!identity.user)return reply({ok:false,error:'Sessão inválida ou expirada.'},401,origin);

 const {data:membership,error:membershipError}=await admin.from('crm_memberships')
  .select('role,enabled').eq('user_id',identity.user.id).maybeSingle();
 if(membershipError||!membership||membership.enabled!==true||membership.role!=='admin')
  return reply({ok:false,error:'Somente administradores ativos podem criar contas.'},403,origin);

 let body;
 try{body=await request.json()}catch{return reply({ok:false,error:'Dados inválidos.'},400,origin)}
 const email=String(body?.email||'').trim().toLowerCase();
 const password=body?.password;
 const role=body?.role==='operator'?'operator':'admin';
 if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))return reply({ok:false,error:'Informe um e-mail válido.'},400,origin);
 if(typeof password!=='string'||password.length<8||password.length>128)return reply({ok:false,error:'A senha precisa ter de 8 a 128 caracteres.'},400,origin);

 // A senha só é encaminhada ao Auth e jamais registrada em tabelas ou logs.
 const {data:created,error:createError}=await admin.auth.admin.createUser({email,password,email_confirm:true});
 if(createError)return reply({ok:false,error:createError.message||'Não foi possível criar o usuário.'},400,origin);
 const user=created?.user;
 if(!user?.id)return reply({ok:false,error:'O Auth não confirmou o cadastro.'},502,origin);

 const {error:saveMembershipError}=await admin.from('crm_memberships')
  .upsert({user_id:user.id,role,enabled:true},{onConflict:'user_id'});
 if(saveMembershipError){
  await admin.auth.admin.deleteUser(user.id);
  return reply({ok:false,error:'Falha ao autorizar a carteira. Nenhum acesso foi liberado.'},503,origin);
 }
 return reply({ok:true,email:user.email,role},200,origin);
});
