import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('a aplicação não renderiza mais clientes fictícios quando o Supabase está ausente',async()=>{
 const page=await readFile(new URL('../app/page.jsx',import.meta.url),'utf8');
 assert.doesNotMatch(page,/MvpDemo|mvp-demo/);
 assert.match(page,/Banco de dados não configurado/);
 assert.match(page,/NEXT_PUBLIC_SUPABASE_URL/);
});

test('os metadados não identificam a aplicação como demonstração ou MVP descartável',async()=>{
 const layout=await readFile(new URL('../app/layout.jsx',import.meta.url),'utf8');
 assert.doesNotMatch(layout,/Demonstração|CRM MVP/);
 assert.match(layout,/CRM de Quitações/);
});
