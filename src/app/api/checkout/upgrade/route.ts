import { NextRequest, NextResponse } from 'next/server';
import { asaasService } from '@/lib/asaas';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { query, withTransaction } from '@/lib/db';
import { SAAS_PLANS } from '@/types/pricing';

const BILLING_CYCLES = new Set(['monthly', 'yearly']);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (typeof session?.userId !== 'string' || typeof session.email !== 'string') {
      return NextResponse.json({ error: 'Entre na sua conta para contratar um plano.' }, { status: 401 });
    }
    if (!asaasService.hasCredentials()) {
      return NextResponse.json({ error: 'A contratação está temporariamente indisponível.' }, { status: 503 });
    }

    const body = await request.json();
    const planId = typeof body.planId === 'string' ? body.planId : '';
    const cycle = typeof body.cycle === 'string' ? body.cycle : 'monthly';
    const cpfCnpj = typeof body.cpfCnpj === 'string' ? body.cpfCnpj.trim() : '';
    const postalCode = typeof body.postalCode === 'string' ? body.postalCode.trim() : '';
    const addressNumber = typeof body.addressNumber === 'string' ? body.addressNumber.trim() : '';
    const creditCard = body.creditCard;
    const plan = SAAS_PLANS[planId];

    if (!plan || plan.module === 'hospedagem' || plan.module === 'dominio') {
      return NextResponse.json({ error: 'Plano inválido ou indisponível para esta contratação.' }, { status: 400 });
    }
    if (!BILLING_CYCLES.has(cycle)) {
      return NextResponse.json({ error: 'Ciclo de cobrança inválido.' }, { status: 400 });
    }
    if (!cpfCnpj || postalCode.replace(/\D/g, '').length !== 8 || !addressNumber
      || typeof creditCard?.number !== 'string' || !creditCard.number.trim()
      || typeof creditCard?.holderName !== 'string' || !creditCard.holderName.trim()
      || typeof creditCard?.expiryMonth !== 'string' || !creditCard.expiryMonth.trim()
      || typeof creditCard?.expiryYear !== 'string' || !creditCard.expiryYear.trim()
      || typeof creditCard?.ccv !== 'string' || !creditCard.ccv.trim()) {
      return NextResponse.json({ error: 'Informe CPF/CNPJ, CEP, número do endereço e todos os dados do cartão.' }, { status: 400 });
    }

    const accountResult = await query(
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
    if (accountResult.rows.length > 1) {
      return NextResponse.json(
        { error: 'Esta conta possui mais de um workspace de teste. Fale com o suporte para concluir a contratação.' },
        { status: 409 }
      );
    }
    const account = accountResult.rows[0];
    if (!account || account.email.toLowerCase() !== session.email.toLowerCase()) {
      return NextResponse.json({ error: 'Não encontramos o workspace de teste desta conta.' }, { status: 404 });
    }

    const phone = typeof body.phone === 'string' ? body.phone.trim() : account.whatsapp_phone || '';
    if (phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Informe um telefone com DDD para os dados do titular.' }, { status: 400 });
    }

    const customer = await asaasService.createOrUpdateCustomer({
      name: account.name || account.company_name,
      email: account.email,
      cpfCnpj,
      phone,
      companyName: account.company_name,
    });

    const intent = await withTransaction(async (client) => {
      await client.query('SELECT id FROM public.organizations WHERE id = $1 FOR UPDATE;', [account.id]);
      const pending = await client.query(
        `SELECT id
         FROM public.agillex_checkout_intents
         WHERE organization_id = $1 AND status IN ('creating', 'pending')
         LIMIT 1;`,
        [account.id]
      );
      if (pending.rowCount) {
        throw new Error('Já existe uma contratação aguardando confirmação para este workspace.');
      }

      const created = await client.query(
        `INSERT INTO public.agillex_checkout_intents
           (organization_id, user_id, asaas_customer_id, plan_id, billing_cycle, status)
         VALUES ($1, $2, $3, $4, $5, 'creating')
         RETURNING id;`,
        [account.id, session.userId, customer.id, planId, cycle]
      );
      return created.rows[0];
    });

    try {
      const subscription = await asaasService.createSubscription({
        customer: customer.id,
        billingType: 'CREDIT_CARD',
        value: cycle === 'yearly' ? plan.annualTotal : plan.priceMonthly,
        nextDueDate: new Date().toISOString().slice(0, 10),
        cycle: cycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
        description: `Assinatura ${plan.name} (${cycle === 'yearly' ? 'Anual' : 'Mensal'}) - Agillex`,
        externalReference: intent.id,
        creditCard,
        creditCardHolderInfo: {
          name: account.name || account.company_name,
          email: account.email,
          cpfCnpj,
          postalCode,
          addressNumber,
          phone,
        },
      });

      await query(
        `UPDATE public.agillex_checkout_intents
         SET asaas_subscription_id = $1,
             status = CASE WHEN status = 'active' THEN status ELSE 'pending' END
         WHERE id = $2;`,
        [subscription.id, intent.id]
      );

      return NextResponse.json({
        success: true,
        upgrade: true,
        status: 'pending',
        intentId: intent.id,
        plan: plan.name,
        message: 'A assinatura foi enviada para processamento. O acesso será liberado após a confirmação do pagamento.',
      });
    } catch (error) {
      await query(
        `UPDATE public.agillex_checkout_intents
         SET status = 'failed'
         WHERE id = $1 AND status = 'creating';`,
        [intent.id]
      );
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível iniciar a contratação.';
    if (message.includes('Já existe uma contratação aguardando')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    console.error('[Checkout Upgrade] Falha ao criar assinatura:', error);
    return NextResponse.json({ error: 'Não foi possível processar a contratação. Tente novamente.' }, { status: 502 });
  }
}
