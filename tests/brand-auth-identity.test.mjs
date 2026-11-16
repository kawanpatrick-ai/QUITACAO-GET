import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('GET brand assets are included in the repository as original SVG marks',()=>{
 for(const path of ['public/branding/get-crm-symbol.svg','public/branding/get-crm-wordmark.svg']) {
  assert.ok(existsSync(new URL('../'+path,import.meta.url)),path+' missing');
  assert.match(file(path),/<svg/);
  assert.match(file(path),/GET/);
 }
});

test('sidebar uses compact and extended GET brand marks',()=>{
 const shell=file('components/crm-shell.jsx');
 assert.match(shell,/get-crm-symbol\.svg/);
 assert.match(shell,/get-crm-wordmark\.svg/);
 assert.match(shell,/app-brand-compact/);
 assert.match(shell,/app-brand-full/);
});

test('login and recovery retain the same authentication handlers with a shared professional layout',()=>{
 const home=file('app/page.jsx');
 const auth=file('components/professional-auth.jsx');
 assert.match(home,/onSubmit=\{signIn\}/);
 assert.match(home,/onClick=\{recover\}/);
 assert.match(home,/onSubmit=\{saveRecoveredPassword\}/);
 assert.match(home,/ProfessionalAuth/);
 assert.match(auth,/w1-auth-screen/);
 assert.match(file('app/layout.jsx'),/brand-auth\.css/);
});
