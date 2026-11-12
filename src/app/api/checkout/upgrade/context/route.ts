import { connection, NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await connection();
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (typeof session?.userId !== 'string' || typeof session.email !== 'string') {
      return NextResponse.json({ error: 'Entre na sua conta para continuar.' }, { status: 401 });
    }

    const result = await query(
      `SELECT o.id, o.name AS company_name, o.whatsapp_phone, u.name, u.email
       FROM public.organization_members om
       JOIN public.organizations o ON o.id = om.organization_id
       JOIN auth.users u ON u.id = om.user_id
       WHERE om.user_id = $1
         AND om.role = 'owner'
         AND o.slug <> 'alllogic'
         AND EXISTS (
           SELECT 1
           FROM public.leads l
           WHERE l.organization_id = o.id
             AND LOWER(l.email) = LOWER(u.email)
             AND l.service_interest LIKE 'Trial 14 dias - %'
         )
       ORDER BY o.created_at DESC
       LIMIT 2;`,
      [session.userId]
    );

    if (result.rows.length > 1) {
      return NextResponse.json(
        { error: 'Esta conta possui mais de um workspace de teste. Fale com o suporte para concluir a contratação.' },
        { status: 409 }
      );
    }
    const account = result.rows[0];
    if (!account) {
      return NextResponse.json({ error: 'Não encontramos um workspace de teste para esta conta.' }, { status: 404 });
    }

    return NextResponse.json({
      account: {
        companyName: account.company_name,
        phone: account.whatsapp_phone || '',
        name: account.name || '',
        email: account.email,
      },
    });
  } catch (error) {
    console.error('[Checkout Upgrade Context] Falha ao consultar a conta:', error);
    return NextResponse.json({ error: 'Não foi possível carregar os dados da conta.' }, { status: 500 });
  }
}
