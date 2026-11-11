import {calculateNextReturn} from './return-date.mjs';

export const CLIENT_EDITABLE_FIELDS = [
  'name','doc_digits','phone','consultant','sale_amount','sale_date',
  'sheet_reference_date','contract_age_days','homologation_signed','last_contact',
  'waiting_business_days','next_return','institution','debtor_balance',
  'estimated_amount','current_amount','info_document_date','source_observations',
  'contacted_party','last_financial_negotiation','overdue_installments',
  'operational_status_code','operational_status_description','source_month',
  'source_status','notes','stage','evidence_status','evidence_url','priority_level'
];

const nullableText = value => {
  const text = String(value ?? '').trim();
  return text || null;
};
const nullableNumber = (value, field) => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(number)) throw new Error(`O campo ${field} precisa ser numérico.`);
  return number;
};
const nullableInteger = (value, field) => {
  const number = nullableNumber(value, field);
  if (number !== null && !Number.isInteger(number)) throw new Error(`O campo ${field} precisa ser um número inteiro.`);
  return number;
};

export function buildClientPatch(draft) {
  if (!draft || !String(draft.name ?? '').trim()) throw new Error('Informe o nome do cliente.');
  const document = String(draft.doc_digits ?? '').replace(/\D/g, '');
  if (![11,14].includes(document.length)) throw new Error('Informe CPF/CNPJ com 11 ou 14 dígitos.');
  const lastContact = nullableText(draft.last_contact);
  const waitingBusinessDays = nullableInteger(draft.waiting_business_days, 'Tempo de espera');
  const patch = {
    name: String(draft.name).trim(),
    doc_digits: document || null,
    phone: nullableText(draft.phone),
    consultant: nullableText(draft.consultant),
    sale_amount: nullableNumber(draft.sale_amount, 'Valor da venda'),
    sale_date: nullableText(draft.sale_date),
    sheet_reference_date: nullableText(draft.sheet_reference_date),
    contract_age_days: nullableInteger(draft.contract_age_days, 'Tempo'),
    homologation_signed: draft.homologation_signed === '' || draft.homologation_signed == null ? null : draft.homologation_signed === true || draft.homologation_signed === 'true',
    last_contact: lastContact,
    waiting_business_days: waitingBusinessDays,
    next_return: calculateNextReturn(lastContact, waitingBusinessDays) ?? nullableText(draft.next_return),
    institution: nullableText(draft.institution),
    debtor_balance: nullableNumber(draft.debtor_balance, 'Saldo devedor'),
    estimated_amount: nullableNumber(draft.estimated_amount, 'Estimado'),
    current_amount: nullableNumber(draft.current_amount, 'Valor atual'),
    info_document_date: nullableText(draft.info_document_date),
    source_observations: nullableText(draft.source_observations),
    contacted_party: nullableText(draft.contacted_party),
    last_financial_negotiation: nullableText(draft.last_financial_negotiation),
    overdue_installments: nullableInteger(draft.overdue_installments, 'Atraso'),
    operational_status_code: nullableText(draft.operational_status_code)?.toUpperCase() ?? null,
    operational_status_description: nullableText(draft.operational_status_description),
    source_month: nullableText(draft.source_month),
    source_status: nullableText(draft.source_status),
    notes: nullableText(draft.notes),
    stage: nullableText(draft.stage),
    evidence_status: nullableText(draft.evidence_status),
    evidence_url: nullableText(draft.evidence_url),
    priority_level: nullableText(draft.priority_level) || 'normal'
  };
  return patch;
}
