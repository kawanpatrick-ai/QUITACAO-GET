import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNewMemberInput,normalizeMembershipChange} from '../lib/user-provisioning.mjs';

test('novo usuário recebe perfil operador por padrão e e-mail normalizado',()=>{
 const value=normalizeNewMemberInput({email:'  Operador@Empresa.com ',password:'senha inicial 123'});
 assert.deepEqual(value,{email:'operador@empresa.com',password:'senha inicial 123',role:'operator'});
});

test('administrador pode criar explicitamente outro administrador',()=>{
 const value=normalizeNewMemberInput({email:'admin@empresa.com',password:'senha inicial 123',role:'admin'});
 assert.equal(value.role,'admin');
});

test('novo usuário rejeita e-mail inválido, senha curta e perfil desconhecido',()=>{
 assert.throws(()=>normalizeNewMemberInput({email:'sem-arroba',password:'senha 123'}),/e-mail válido/);
 assert.throws(()=>normalizeNewMemberInput({email:'a@b.com',password:'123'}),/8 a 128/);
 assert.throws(()=>normalizeNewMemberInput({email:'a@b.com',password:'senha 123',role:'owner'}),/Perfil/);
});

test('administrador pode suspender ou mudar o perfil de outro usuário',()=>{
 const value=normalizeMembershipChange({user_id:'c3b8d8e4-2f3a-4b69-9e30-17a31d7091d1',role:'operator',enabled:false},'493a4e63-342c-4325-a76a-2cd87dbcd36c');
 assert.deepEqual(value,{user_id:'c3b8d8e4-2f3a-4b69-9e30-17a31d7091d1',role:'operator',enabled:false});
});

test('não permite remover o próprio acesso administrativo',()=>{
 const self='493a4e63-342c-4325-a76a-2cd87dbcd36c';
 assert.throws(()=>normalizeMembershipChange({user_id:self,role:'operator',enabled:true},self),/próprio acesso/);
 assert.throws(()=>normalizeMembershipChange({user_id:self,role:'admin',enabled:false},self),/próprio acesso/);
});

test('rejeita identificador, perfil e estado inválidos ao administrar usuários',()=>{
 assert.throws(()=>normalizeMembershipChange({user_id:'not-a-uuid',role:'operator',enabled:true},'admin'),/Identificador/);
 assert.throws(()=>normalizeMembershipChange({user_id:'c3b8d8e4-2f3a-4b69-9e30-17a31d7091d1',role:'viewer',enabled:true},'admin'),/Perfil/);
 assert.throws(()=>normalizeMembershipChange({user_id:'c3b8d8e4-2f3a-4b69-9e30-17a31d7091d1',role:'operator',enabled:'false'},'admin'),/ativo ou suspenso/);
});
