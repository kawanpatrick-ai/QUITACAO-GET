import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('the GET identity is rendered from clean vector assets at every large display size',()=>{
 const shell=read('components/crm-shell.jsx');
 const auth=read('components/professional-auth.jsx');
 assert.match(shell,/get-crm-symbol\.svg/);
 assert.match(shell,/get-crm-wordmark\.svg/);
 assert.match(auth,/get-crm-wordmark\.svg/);
 assert.match(auth,/get-crm-wordmark-light\.svg/);
 for(const path of [
  'public/branding/get-crm-symbol.svg',
  'public/branding/get-crm-wordmark.svg',
  'public/branding/get-crm-wordmark-light.svg'
 ]) assert.ok(existsSync(new URL('../'+path,import.meta.url)),path+' missing');
});

test('the desktop sidebar uses a translucent glass surface without hard divider edges',()=>{
 const css=read('app/corporate-design.css');
 const sidebar=css.match(/\.app-sidebar\s*\{([^}]*)\}/)?.[1]||'';
 const identity=css.match(/\.app-identity\s*\{([^}]*)\}/)?.[1]||'';
 const footer=css.match(/\.app-nav-footer\s*\{([^}]*)\}/)?.[1]||'';
 assert.match(sidebar,/rgba\(/i);
 assert.match(sidebar,/backdrop-filter:\s*blur\(/i);
 assert.match(sidebar,/border-right:\s*0(?:!important)?/i);
 assert.doesNotMatch(identity,/border-bottom:\s*1px/i);
 assert.doesNotMatch(footer,/border-top:\s*1px/i);
 assert.match(css,/@supports[^{}]*backdrop-filter/i);
});

test('motion is short, GPU-friendly and respects reduced-motion preferences',()=>{
 const css=read('app/corporate-design.css');
 assert.match(css,/--motion-fast:\s*1\d{2}ms/);
 assert.match(css,/--motion-standard:\s*1\d{2}ms/);
 assert.match(css,/--motion-enter:\s*1\d{2}ms/);
 assert.match(css,/scroll-behavior:\s*auto/i);
 assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
 assert.doesNotMatch(css,/transition:\s*all\b/i);
});
