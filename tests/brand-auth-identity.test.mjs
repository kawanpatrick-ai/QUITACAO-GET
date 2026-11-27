import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('the supplied GET logo files are included for light and dark backgrounds',()=>{
 for(const path of ['public/branding/get-logo.png','public/branding/get-logo-white.png','public/branding/get-symbol.png']) assert.ok(existsSync(new URL('../'+path,import.meta.url)),path+' missing');
});
test('sidebar uses the supplied compact symbol and white GET wordmark',()=>{
 const shell=file('components/crm-shell.jsx');
 assert.ok(shell.includes('get-symbol.png'));assert.ok(shell.includes('get-logo-white.png'));assert.ok(shell.includes('Controle de Quitação'));
 assert.ok(shell.includes('app-brand-compact'));assert.ok(shell.includes('app-brand-full'));
});
test('login uses both provided GET logo variants and preserves authentication handlers',()=>{
 const home=file('app/page.jsx'),auth=file('components/professional-auth.jsx');
 assert.ok(auth.includes('get-logo-white.png'));assert.ok(auth.includes('get-logo.png'));
 assert.ok(home.includes('onSubmit={signIn}'));assert.ok(home.includes('onClick={recover}'));assert.ok(home.includes('onSubmit={saveRecoveredPassword}'));
 assert.ok(home.includes('ProfessionalAuth'));assert.ok(auth.includes('w1-auth-screen'));assert.ok(file('app/layout.jsx').includes('brand-auth.css'));
});
