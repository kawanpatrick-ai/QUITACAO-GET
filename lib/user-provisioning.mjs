export const CRM_MEMBER_ROLES = Object.freeze(['admin','operator']);

export function normalizeNewMemberInput(input = {}) {
  const email = String(input.email ?? '').trim().toLowerCase();
  const password = input.password;
  const role = input.role ?? 'operator';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new Error('Informe um endereço de e-mail válido.');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new Error('A senha inicial precisa ter de 8 a 128 caracteres.');
  }
  if (!CRM_MEMBER_ROLES.includes(role)) {
    throw new Error('Perfil de acesso inválido.');
  }

  return { email, password, role };
}

export function normalizeMembershipChange(input = {}, actorId) {
  const userId = String(input.user_id ?? '').trim();
  const role = input.role;
  const enabled = input.enabled;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error('Identificador de usuário inválido.');
  }
  if (!CRM_MEMBER_ROLES.includes(role)) {
    throw new Error('Perfil de acesso inválido.');
  }
  if (typeof enabled !== 'boolean') {
    throw new Error('Informe se o acesso deve ficar ativo ou suspenso.');
  }
  if (userId === actorId && (role !== 'admin' || enabled !== true)) {
    throw new Error('Você não pode remover ou suspender seu próprio acesso administrativo.');
  }

  return { user_id: userId, role, enabled };
}
