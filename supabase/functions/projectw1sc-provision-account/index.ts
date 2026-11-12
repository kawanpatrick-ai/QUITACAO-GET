// Administra contas do CRM. A autorização é conferida pela membership ativa no banco.
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import {
  normalizeNewMemberInput,
  normalizeMembershipChange,
} from './_shared/user-provisioning.mjs';
import { corsHeadersFor, isAllowedAppOrigin } from './_shared/cors.mjs';

function additionalAllowedOrigins() {
  return Deno.env.get('CORS_ALLOWED_ORIGINS') || '';
}

function headersFor(origin: string | null) {
  return corsHeadersFor(origin, additionalAllowedOrigins());
}

function reply(body: Record<string, unknown>, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), { status, headers: headersFor(origin) });
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  if (!isAllowedAppOrigin(origin, additionalAllowedOrigins())) return reply({ ok: false, error: 'Origem não autorizada.' }, 403, origin);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: headersFor(origin) });
  if (request.method !== 'POST') return reply({ ok: false, error: 'Método não permitido.' }, 405, origin);

  const jwt = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return reply({ ok: false, error: 'Entre como administrador antes de administrar usuários.' }, 401, origin);

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return reply({ ok: false, error: 'Serviço de autenticação indisponível.' }, 503, origin);

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: identityData, error: identityError } = await admin.auth.getUser(jwt);
  const actor = identityData?.user;
  if (identityError || !actor) return reply({ ok: false, error: 'Sessão inválida ou expirada.' }, 401, origin);

  const { data: actorMembership, error: membershipError } = await admin
    .from('crm_memberships')
    .select('role,enabled')
    .eq('user_id', actor.id)
    .maybeSingle();

  if (membershipError || actorMembership?.role !== 'admin' || actorMembership.enabled !== true) {
    return reply({ ok: false, error: 'Somente administradores ativos podem administrar usuários.' }, 403, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return reply({ ok: false, error: 'Dados inválidos.' }, 400, origin);
  }

  const action = String(body.action || 'create');

  if (action === 'list') {
    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return reply({ ok: false, error: 'Não foi possível consultar as contas: ' + usersError.message }, 502, origin);

    const users = usersData?.users || [];
    const ids = users.map((user) => user.id);
    const { data: membershipRows, error: rowsError } = ids.length
      ? await admin.from('crm_memberships').select('user_id,role,enabled,created_at').in('user_id', ids)
      : { data: [], error: null };

    if (rowsError) return reply({ ok: false, error: 'Não foi possível consultar as permissões.' }, 502, origin);

    const memberships = new Map((membershipRows || []).map((row) => [row.user_id, row]));
    const result = users
      .map((user) => {
        const membership = memberships.get(user.id);
        return {
          id: user.id,
          email: user.email || '',
          role: membership?.role || null,
          enabled: membership?.enabled === true,
          created_at: user.created_at || null,
          last_sign_in_at: user.last_sign_in_at || null,
          email_confirmed_at: user.email_confirmed_at || null,
        };
      })
      .sort((a, b) => a.email.localeCompare(b.email));

    return reply({ ok: true, users: result }, 200, origin);
  }

  if (action === 'set_membership') {
    let change;
    try {
      change = normalizeMembershipChange(body, actor.id);
    } catch (error) {
      return reply({ ok: false, error: error instanceof Error ? error.message : 'Dados inválidos.' }, 400, origin);
    }

    const { data: target, error: targetError } = await admin.auth.admin.getUserById(change.user_id);
    if (targetError || !target?.user) return reply({ ok: false, error: 'Conta não encontrada no Supabase Auth.' }, 404, origin);

    const { data: currentRows, error: currentError } = await admin
      .from('crm_memberships')
      .select('user_id,role,enabled');

    if (currentError) return reply({ ok: false, error: 'Não foi possível validar as permissões atuais.' }, 502, origin);

    const current = (currentRows || []).find((row) => row.user_id === change.user_id);
    const removesActiveAdmin = current?.role === 'admin' && current.enabled === true
      && (change.role !== 'admin' || change.enabled !== true);
    if (removesActiveAdmin) {
      const activeAdmins = (currentRows || []).filter((row) => row.role === 'admin' && row.enabled === true);
      if (activeAdmins.length <= 1) {
        return reply({ ok: false, error: 'A carteira precisa manter pelo menos um administrador ativo.' }, 409, origin);
      }
    }

    const { error: saveError } = await admin
      .from('crm_memberships')
      .upsert({ user_id: change.user_id, role: change.role, enabled: change.enabled }, { onConflict: 'user_id' });

    if (saveError) return reply({ ok: false, error: 'Não foi possível salvar a permissão: ' + saveError.message }, 502, origin);
    return reply({ ok: true, user_id: change.user_id, role: change.role, enabled: change.enabled }, 200, origin);
  }

  if (action === 'create') {
    let input;
    try {
      input = normalizeNewMemberInput(body);
    } catch (error) {
      return reply({ ok: false, error: error instanceof Error ? error.message : 'Dados inválidos.' }, 400, origin);
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });
    if (createError) return reply({ ok: false, error: createError.message || 'Não foi possível criar o usuário.' }, 400, origin);

    const newUser = created?.user;
    if (!newUser?.id) return reply({ ok: false, error: 'O Auth não confirmou o cadastro.' }, 502, origin);

    const { error: saveMembershipError } = await admin
      .from('crm_memberships')
      .insert({ user_id: newUser.id, role: input.role, enabled: true });

    if (saveMembershipError) {
      await admin.auth.admin.deleteUser(newUser.id);
      return reply({ ok: false, error: 'Falha ao autorizar a conta. Nenhum acesso foi liberado.' }, 503, origin);
    }

    return reply({ ok: true, email: newUser.email, role: input.role }, 200, origin);
  }

  return reply({ ok: false, error: 'Ação de administração desconhecida.' }, 400, origin);
});
