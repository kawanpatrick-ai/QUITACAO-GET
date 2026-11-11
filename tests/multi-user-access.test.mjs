import test from 'node:test';
import assert from 'node:assert/strict';
import {signInWithPassword,sendRecovery,ADMIN_EMAIL} from '../lib/login.mjs';
import {checkCrmAccess} from '../lib/crm-access.mjs';

test('login usa como padrão o administrador inicial cadastrado no Supabase',async()=>{
 const calls=[];
 const auth={signInWithPassword:async input=>{calls.push(input);return {data:{session:{user:{email:input.email}}},error:null}}};
 await signInWithPassword(auth,'senha de teste 123');
 assert.equal(ADMIN_EMAIL,'patrickkawan719@gmail.com');
 assert.equal(calls[0].email,ADMIN_EMAIL);
});

test('login aceita outro e-mail quando informado explicitamente',async()=>{
 const calls=[];
 const auth={signInWithPassword:async input=>{calls.push(input);return {data:{session:{user:{email:input.email}}},error:null}}};
 await signInWithPassword(auth,'senha de teste 123','outro@exemplo.com');
 assert.equal(calls[0].email,'outro@exemplo.com');
});

test('recuperação usa o e-mail escolhido na tela de entrada',async()=>{
 let email;
 const auth={resetPasswordForEmail:async value=>{email=value;return {error:null}}};
 await sendRecovery(auth,'https://quitacao-get.vercel.app','outro@exemplo.com');
 assert.equal(email,'outro@exemplo.com');
});

test('administrador e operador só recebem acesso quando possuem membership ativa',async()=>{
 let queriedUser;
 const db={from:table=>{assert.equal(table,'crm_memberships');return {
  select:()=>({eq:(field,value)=>{if(field==='user_id')queriedUser=value;return {eq:()=>({maybeSingle:async()=>({data:{enabled:true,role:'admin'},error:null})})}}})
 }}};
 assert.equal(await checkCrmAccess(db,{id:'admin-id',email:ADMIN_EMAIL}),true);
 assert.equal(queriedUser,'admin-id');
 assert.equal(await checkCrmAccess(db,{id:'operator-id',email:'operador@exemplo.com'}),true);
 assert.equal(queriedUser,'operator-id');
});

test('usuário sem membership, desativado ou com perfil inválido não obtém acesso',async()=>{
 const makeDb=result=>({from:()=>({select:()=>({eq:()=>({eq:()=>({maybeSingle:async()=>result})})})})});
 assert.equal(await checkCrmAccess(makeDb({data:null,error:null}),{id:'1',email:ADMIN_EMAIL}),false);
 assert.equal(await checkCrmAccess(makeDb({data:{enabled:false,role:'admin'},error:null}),{id:'1',email:'x@y.com'}),false);
 assert.equal(await checkCrmAccess(makeDb({data:{enabled:true,role:'viewer'},error:null}),{id:'1',email:'x@y.com'}),false);
 assert.equal(await checkCrmAccess(makeDb({data:null,error:{message:'offline'}}),{id:'1',email:'x@y.com'}),false);
 assert.equal(await checkCrmAccess(null,{id:'x',email:ADMIN_EMAIL}),false);
 assert.equal(await checkCrmAccess(makeDb({data:null,error:null}),null),false);
});
