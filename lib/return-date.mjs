const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidISODate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Adds business days (Monday-Friday) to the last-contact date. */
export function calculateNextReturn(lastContact, waitingBusinessDays) {
  if (!lastContact || waitingBusinessDays === '' || waitingBusinessDays === null || waitingBusinessDays === undefined) return null;
  if (!isValidISODate(lastContact)) throw new Error('Informe uma data válida para o último contato.');

  const days = Number(waitingBusinessDays);
  if (!Number.isInteger(days)) throw new Error('O tempo de espera precisa ser um número inteiro.');
  if (days < 0) throw new Error('O tempo de espera não pode ser negativo.');

  const date = new Date(`${lastContact}T12:00:00.000Z`);
  let added = 0;
  while (added < days) {
    date.setUTCDate(date.getUTCDate() + 1);
    const weekday = date.getUTCDay();
    if (weekday !== 0 && weekday !== 6) added += 1;
  }
  return date.toISOString().slice(0, 10);
}
