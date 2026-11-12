import test from 'node:test';
import assert from 'node:assert/strict';
import {isAllowedAppOrigin,corsHeadersFor} from '../supabase/functions/projectw1sc-provision-account/_shared/cors.mjs';

test('CORS accepts the production hostname and the active Vercel preview hostname',()=>{
 assert.equal(isAllowedAppOrigin('https://quitacao-get.vercel.app'),true);
 assert.equal(isAllowedAppOrigin('https://quitacao-get-4g56.vercel.app'),true);
 assert.equal(isAllowedAppOrigin('https://quitacao-get-git-projectw1sc-crm-kawpk.vercel.app'),true);
});

test('CORS rejects unrelated projects, unencrypted origins, and malformed origin URLs',()=>{
 assert.equal(isAllowedAppOrigin('https://other-crm-4g56.vercel.app'),false);
 assert.equal(isAllowedAppOrigin('https://quitacao-get.evil.example'),false);
 assert.equal(isAllowedAppOrigin('http://quitacao-get-4g56.vercel.app'),false);
 assert.equal(isAllowedAppOrigin('https://quitacao-get-4g56.vercel.app/path'),false);
 assert.equal(isAllowedAppOrigin('not-an-origin'),false);
});

test('CORS allows an explicitly configured future preview origin without allowing all Vercel apps',()=>{
 const extra='https://quitacao-get-preview-special.vercel.app, https://crm.internal.example';
 assert.equal(isAllowedAppOrigin('https://crm.internal.example',extra),true);
 assert.equal(isAllowedAppOrigin('https://other-preview.vercel.app',extra),false);
});

test('CORS echoes only authorized origins and includes the Supabase SDK preflight headers',()=>{
 const allowed=corsHeadersFor('https://quitacao-get-4g56.vercel.app');
 assert.equal(allowed['Access-Control-Allow-Origin'],'https://quitacao-get-4g56.vercel.app');
 assert.match(allowed['Access-Control-Allow-Headers'],/authorization/i);
 assert.match(allowed['Access-Control-Allow-Headers'],/apikey/i);
 assert.match(allowed['Access-Control-Allow-Headers'],/x-retry-count/i);
 assert.match(allowed['Access-Control-Allow-Headers'],/traceparent/i);
 assert.equal(allowed['Access-Control-Allow-Methods'],'POST, OPTIONS');
 assert.equal(allowed.Vary,'Origin');
 const denied=corsHeadersFor('https://unrelated-app.vercel.app');
 assert.equal(Object.hasOwn(denied,'Access-Control-Allow-Origin'),false);
});
