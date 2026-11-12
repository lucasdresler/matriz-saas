import { connection, NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { SAAS_PLANS } from '@/types/pricing';

export async function GET(request: NextRequest) {
  await connection();
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (typeof session?.userId !== 'string') {
      return NextResponse.json({ error: 'Entre na sua conta para consultar a contratação.' }, { status: 401 });
    }

    const intentId = request.nextUrl.searchParams.get('intentId');
    if (!intentId) {
      return NextResponse.json({ error: 'intentId é obrigatório.' }, { status: 400 });
    }

    const result = await query(
      `SELECT i.status, i.plan_id
       FROM public.agillex_checkout_intents i
       JOIN public.organizations o ON o.id = i.organization_id
       JOIN public.organization_members om
         ON om.organization_id = i.organization_id AND om.user_id = i.user_id
       WHERE i.id = $1
         AND i.user_id = $2
         AND o.slug <> 'alllogic';`,
      [intentId, session.userId]
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: 'Contratação não encontrada.' }, { status: 404 });
    }
    const plan = SAAS_PLANS[result.rows[0].plan_id];
    if (!plan) {
      return NextResponse.json({ error: 'O plano desta contratação não está disponível.' }, { status: 500 });
    }
    return NextResponse.json({ status: result.rows[0].status, plan: plan.name });
  } catch (error) {
    console.error('[Checkout Upgrade Status] Falha ao consultar contratação:', error);
    return NextResponse.json({ error: 'Não foi possível consultar a contratação.' }, { status: 500 });
  }
}
