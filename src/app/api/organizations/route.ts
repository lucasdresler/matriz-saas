import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

function getModules(category: string | null, slug: string) {
  if (slug === 'alllogic') {
    return { agenda: true, atendimento: true, crm: true, cobranca: true, reputacao: true, ged: true };
  }

  switch (category) {
    case 'combo':
      return { agenda: true, atendimento: true, crm: true, cobranca: true, reputacao: false, ged: false };
    case 'agenda':
      return { agenda: true, atendimento: false, crm: false, cobranca: false, reputacao: false, ged: false };
    case 'atendimento':
      return { agenda: false, atendimento: true, crm: false, cobranca: false, reputacao: false, ged: false };
    case 'cobranca':
      return { agenda: false, atendimento: false, crm: false, cobranca: true, reputacao: false, ged: false };
    case 'reputacao':
      return { agenda: false, atendimento: false, crm: false, cobranca: false, reputacao: true, ged: false };
    case 'ged':
      return { agenda: false, atendimento: false, crm: false, cobranca: false, reputacao: false, ged: true };
    default:
      return { agenda: false, atendimento: false, crm: false, cobranca: false, reputacao: false, ged: false };
  }
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
      modules: getModules(row.category, row.slug),
    }));

    return NextResponse.json({ success: true, organizations });
  } catch (error) {
    console.error('[Organizations API] Falha ao carregar workspaces:', error);
    return NextResponse.json({ error: 'Não foi possível carregar as empresas.' }, { status: 500 });
  }
}
