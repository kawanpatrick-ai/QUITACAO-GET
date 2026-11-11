import test from 'node:test';
import assert from 'node:assert/strict';
import {buildClientPatch} from '../lib/client-edit.mjs';

test('builds an editable patch for all operational columns and CRM fields', () => {
  const patch = buildClientPatch({
    name:'Lafaiete',doc_digits:'123.456.789-01',sale_amount:'3157,19',
    contract_age_days:'12',homologation_signed:'true',operational_status_code:'and',
    debtor_balance:'20000.50',overdue_installments:'3',stage:'em_negociacao'
  });
  assert.equal(patch.doc_digits,'12345678901');
  assert.equal(patch.sale_amount,3157.19);
  assert.equal(patch.contract_age_days,12);
  assert.equal(patch.homologation_signed,true);
  assert.equal(patch.operational_status_code,'AND');
  assert.equal(patch.debtor_balance,20000.5);
  assert.equal(patch.overdue_installments,3);
  assert.equal(patch.stage,'em_negociacao');
});

test('allows blank optional fields without writing empty strings', () => {
  const patch = buildClientPatch({name:'Cliente',phone:'',sale_amount:'',homologation_signed:''});
  assert.equal(patch.phone,null);
  assert.equal(patch.sale_amount,null);
  assert.equal(patch.homologation_signed,null);
});

test('rejects malformed CPF/CNPJ and non-numeric operational values', () => {
  assert.throws(()=>buildClientPatch({name:'Cliente',doc_digits:'123'}),/CPF\/CNPJ/);
  assert.throws(()=>buildClientPatch({name:'Cliente',contract_age_days:'um'}),/numérico/);
  assert.throws(()=>buildClientPatch({name:'Cliente',overdue_installments:'1.5'}),/inteiro/);
});
