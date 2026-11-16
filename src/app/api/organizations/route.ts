import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { ensureAgendaTables } from '@/lib/agenda-db';

function getModules(category: string | null, slug: string, plan?: string | null, enabledModules?: string[] | null) {
  // O workspace master AllLogic possui todos os módulos para gestão corporativa
  if (slug === 'alllogic') {
    return { agenda: true, atendimento: true, crm: true, cobranca: true, reputacao: true, ged: true };
  }

  // 1. Prioridade absoluta para módulos habilitados individualmente pelo cliente ou admin
  if (Array.isArray(enabledModules) && enabledModules.length > 0) {
    const list = enabledModules.map((m) => String(m).toLowerCase().trim());
    const isCombo = list.includes('combo') || list.includes('all') || list.includes('enterprise');
    if (isCombo) {
      return { agenda: true, atendimento: true, crm: true, cobranca: true, reputacao: true, ged: true };
    }
    return {
      agenda: list.includes('agenda'),
      atendimento: list.includes('atendimento') || list.includes('atende'),
      crm: list.includes('crm') || list.includes('atendimento') || list.includes('atende'),
      cobranca: list.includes('cobranca') || list.includes('cobrança'),
      reputacao: list.includes('reputacao') || list.includes('reputação'),
      ged: list.includes('ged'),
    };
  }

  const p = (plan || '').toLowerCase();
  const c = (category || '').toLowerCase();

  // Verifica se é plano combo (plano unificado / pacote completo com múltiplos módulos)
  const isCombo = c === 'combo' || /\b(combo|enterprise|unificado)\b/i.test(p);

  if (isCombo) {
    return { agenda: true, atendimento: true, crm: true, cobranca: true, reputacao: true, ged: true };
  }

  // Se contratou exclusivamente Agillex Agenda (ou slug salao-bonitao)
  if (c === 'agenda' || p.includes('agenda') || slug === 'salao-bonitao') {
    return {
      agenda: true,
      atendimento: false,
      crm: false,
      cobranca: false,
      reputacao: false,
      ged: false,
    };
  }

  // Se contratou exclusivamente Agillex Atende
  if (c === 'atendimento' || p.includes('atende')) {
    return {
      agenda: false,
      atendimento: true,
      crm: true, // Atendimento usa CRM Kanban para leads do WhatsApp
      cobranca: false,
      reputacao: false,
      ged: false,
    };
  }

  // Se contratou exclusivamente Cobrança
  if (c === 'cobranca' || p.includes('cobranca') || p.includes('cobrança')) {
    return {
      agenda: false,
      atendimento: false,
      crm: false,
      cobranca: true,
      reputacao: false,
      ged: false,
    };
  }

  // Se contratou exclusivamente Reputação
  if (c === 'reputacao' || p.includes('reputacao') || p.includes('reputação')) {
    return {
      agenda: false,
      atendimento: false,
      crm: false,
      cobranca: false,
      reputacao: true,
      ged: false,
    };
  }

  // Se contratou exclusivamente GED
  if (c === 'ged' || p.includes('ged')) {
    return {
      agenda: false,
      atendimento: false,
      crm: false,
      cobranca: false,
      reputacao: false,
      ged: true,
    };
  }

  // Fallback padrão seguro para Agenda única
  return {
    agenda: true,
    atendimento: false,
    crm: false,
    cobranca: false,
    reputacao: false,
    ged: false,
  };
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;
  if (!user?.userId || !user.role) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    await ensureAgendaTables();
    const isSuperAdmin = user.role === 'super_admin';
    const organizationsRes = isSuperAdmin
      ? await query(
          `SELECT o.id, o.name, o.slug, o.category, o.plan, o.whatsapp_phone,
                  o.whatsapp_status, o.ai_active, o.created_at, o.enabled_modules,
                  COUNT(DISTINCT l.id)::int AS total_leads
           FROM public.organizations o
           LEFT JOIN public.leads l ON l.organization_id = o.id
           GROUP BY o.id
           ORDER BY CASE WHEN o.slug = 'alllogic' THEN 0 ELSE 1 END, o.name;`
        )
      : await query(
          `SELECT o.id, o.name, o.slug, o.category, o.plan, o.whatsapp_phone,
                  o.whatsapp_status, o.ai_active, o.created_at, o.enabled_modules,
                  COUNT(DISTINCT l.id)::int AS total_leads
           FROM public.organization_members om
           JOIN public.organizations o ON o.id = om.organization_id
           LEFT JOIN public.leads l ON l.organization_id = o.id
           WHERE om.user_id = $1
           GROUP BY o.id
           ORDER BY o.name;`,
          [user.userId]
        );

    const organizations = organizationsRes.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      category: row.category || '',
      plan: row.plan || 'Starter',
      logoColor: row.slug === 'alllogic' ? '#1F6FFF' : '#F59E0B',
      whatsappPhone: row.whatsapp_phone || '',
      whatsappStatus: row.whatsapp_status || 'disconnected',
      aiActive: Boolean(row.ai_active),
      totalLeads: Number(row.total_leads || 0),
      createdAt: row.created_at,
      enabledModules: row.enabled_modules || null,
      modules: getModules(row.category, row.slug, row.plan, row.enabled_modules),
    }));

    return NextResponse.json({ success: true, organizations });
  } catch (error) {
    console.error('[Organizations API] Falha ao carregar workspaces:', error);
    return NextResponse.json({ error: 'Não foi possível carregar as empresas.' }, { status: 500 });
  }
}
