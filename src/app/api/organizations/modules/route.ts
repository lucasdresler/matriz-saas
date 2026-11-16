import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;
  if (!user?.userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orgId, module: targetModule, enabled } = body;

    if (!orgId || !targetModule) {
      return NextResponse.json({ error: 'Organização e módulo são obrigatórios.' }, { status: 400 });
    }

    // Valida se o usuário tem permissão sobre a organização
    const isSuperAdmin = user.role === 'super_admin';
    const memberCheck = await query(
      `SELECT om.role, o.id, o.name, o.slug, o.created_at, o.category, o.plan, o.enabled_modules
       FROM public.organizations o
       LEFT JOIN public.organization_members om ON om.organization_id = o.id AND om.user_id = $1
       WHERE o.id = $2
       LIMIT 1;`,
      [user.userId, orgId]
    );

    if (memberCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Organização não encontrada.' }, { status: 404 });
    }

    const org = memberCheck.rows[0];
    if (!isSuperAdmin && !org.role) {
      return NextResponse.json({ error: 'Permissão negada para esta organização.' }, { status: 403 });
    }

    // Regra dos 14 dias: se a conta for de teste e já tiver passado de 14 dias, não permite ativar novos módulos
    const orgCreatedAt = new Date(org.created_at);
    const diffDays = (Date.now() - orgCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
    const isTrialExpired = diffDays >= 14;

    if (isTrialExpired && !isSuperAdmin && org.slug !== 'alllogic') {
      const expirationDate = new Date(orgCreatedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
      return NextResponse.json({
        error: `O período de testes gratuito de 14 dias encerrou em ${expirationDate.toLocaleDateString('pt-BR')}. Acesse os Planos para contratar uma assinatura definitiva.`,
        expired: true,
      }, { status: 403 });
    }

    // Determina a lista base de módulos
    let currentModules: string[] = Array.isArray(org.enabled_modules) && org.enabled_modules.length > 0
      ? [...org.enabled_modules]
      : [];

    if (currentModules.length === 0) {
      if (org.category === 'combo') {
        currentModules = ['agenda', 'atendimento', 'crm', 'cobranca', 'reputacao', 'ged'];
      } else if (org.category === 'agenda' || org.slug === 'salao-bonitao') {
        currentModules = ['agenda'];
      } else if (org.category) {
        currentModules = [org.category];
      } else {
        currentModules = ['agenda'];
      }
    }

    const modKey = String(targetModule).toLowerCase().trim();
    if (enabled) {
      if (!currentModules.includes(modKey)) {
        currentModules.push(modKey);
      }
      if (modKey === 'atendimento' && !currentModules.includes('crm')) {
        currentModules.push('crm');
      }
    } else {
      currentModules = currentModules.filter((m) => m !== modKey);
    }

    await query(
      `UPDATE public.organizations
       SET enabled_modules = $1, updated_at = NOW()
       WHERE id = $2;`,
      [currentModules, orgId]
    );

    // Registra o evento de ativação no histórico de leads/auditoria
    await query(
      `INSERT INTO public.leads (organization_id, name, phone, email, status, service_interest)
       VALUES ($1, $2, '0000000000', $3, 'qualificado', $4);`,
      [
        orgId,
        user.email || 'Cliente',
        user.email || 'cliente@agillex.com.br',
        `Módulo ${modKey.toUpperCase()} ${enabled ? 'ativado' : 'desativado'} pelo cliente no painel`,
      ]
    );

    return NextResponse.json({
      success: true,
      enabledModules: currentModules,
      message: `Módulo ${targetModule} ${enabled ? 'ativado' : 'desativado'} com sucesso!`,
    });
  } catch (error) {
    console.error('[Organizations Modules API] Falha ao atualizar módulos:', error);
    return NextResponse.json({ error: 'Falha interna ao atualizar módulos.' }, { status: 500 });
  }
}
