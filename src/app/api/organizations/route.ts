import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

function getModules(category: string | null, slug: string, plan?: string | null) {
  if (slug === 'alllogic') {
    return { agenda: true, atendimento: true, crm: true, cobranca: true, reputacao: true, ged: true };
  }

  const p = (plan || '').toLowerCase();
  const c = (category || '').toLowerCase();

  const isCombo = c === 'combo' || p.includes('combo') || p.includes('pro') || p.includes('enterprise');
  const isAgenda = isCombo || c === 'agenda' || p.includes('agenda') || slug === 'salao-bonitao';
  const isAtendimento = isCombo || c === 'atendimento' || p.includes('atende') || p.includes('whatsapp');
  const isCrm = isAgenda || isAtendimento || isCombo || c === 'crm';
  const isCobranca = isCombo || c === 'cobranca' || p.includes('cobranca') || p.includes('cobrança') || p.includes('asaas');
  const isReputacao = isCombo || c === 'reputacao' || p.includes('reputacao') || p.includes('reputação');
  const isGed = isCombo || c === 'ged' || p.includes('ged') || p.includes('documento');

  return {
    agenda: isAgenda,
    atendimento: isAtendimento,
    crm: isCrm,
    cobranca: isCobranca,
    reputacao: isReputacao,
    ged: isGed,
  };
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;
  if (!user?.userId || !user.role) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const isSuperAdmin = user.role === 'super_admin';
    const organizationsRes = isSuperAdmin
      ? await query(
          `SELECT o.id, o.name, o.slug, o.category, o.plan, o.whatsapp_phone,
                  o.whatsapp_status, o.ai_active,
                  COUNT(DISTINCT l.id)::int AS total_leads
           FROM public.organizations o
           LEFT JOIN public.leads l ON l.organization_id = o.id
           GROUP BY o.id
           ORDER BY CASE WHEN o.slug = 'alllogic' THEN 0 ELSE 1 END, o.name;`
        )
      : await query(
          `SELECT o.id, o.name, o.slug, o.category, o.plan, o.whatsapp_phone,
                  o.whatsapp_status, o.ai_active,
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
      modules: getModules(row.category, row.slug, row.plan),
    }));

    return NextResponse.json({ success: true, organizations });
  } catch (error) {
    console.error('[Organizations API] Falha ao carregar workspaces:', error);
    return NextResponse.json({ error: 'Não foi possível carregar as empresas.' }, { status: 500 });
  }
}
