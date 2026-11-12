import { withTransaction } from '@/lib/db';
import { SAAS_PLANS } from '@/types/pricing';

const UPGRADE_REFERENCE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function activatePaidTrialUpgrade(input: {
  externalReference?: string;
  subscriptionId?: string;
  customerId?: string;
}): Promise<boolean> {
  const intentId = input.externalReference?.match(UPGRADE_REFERENCE_PATTERN)?.[0];
  if (!intentId && !input.subscriptionId) return false;

  return withTransaction(async (client) => {
    const result = await client.query(
      `SELECT i.id, i.organization_id, i.user_id, i.asaas_customer_id, i.plan_id, i.status,
              o.slug, l.email
       FROM public.agillex_checkout_intents i
       JOIN public.organizations o ON o.id = i.organization_id
       JOIN public.organization_members om
         ON om.organization_id = i.organization_id AND om.user_id = i.user_id
       JOIN public.leads l
         ON l.organization_id = i.organization_id
        AND LOWER(l.email) = LOWER((SELECT email FROM auth.users WHERE id = i.user_id))
       WHERE ($1::uuid IS NOT NULL AND i.id = $1::uuid)
          OR ($2::varchar IS NOT NULL AND i.asaas_subscription_id = $2)
       ORDER BY i.created_at DESC
       LIMIT 1
       FOR UPDATE OF i, o;`,
      [intentId || null, input.subscriptionId || null]
    );
    const intent = result.rows[0];
    if (!intent) return false;
    if (intent.slug === 'alllogic') {
      throw new Error('Uma assinatura de trial não pode reativar o workspace AllLogic.');
    }
    if (!input.customerId || input.customerId !== intent.asaas_customer_id) {
      throw new Error('O cliente do pagamento não corresponde à intenção de checkout.');
    }

    if (intent.status === 'active') return true;

    const plan = SAAS_PLANS[intent.plan_id];
    if (!plan || plan.module === 'hospedagem' || plan.module === 'dominio') {
      throw new Error('O plano associado à intenção de checkout não é elegível para trial.');
    }

    const leadResult = await client.query(
      `UPDATE public.leads
       SET service_interest = $1, updated_at = NOW()
       WHERE organization_id = $2
         AND LOWER(email) = LOWER($3)
         AND service_interest LIKE 'Trial 14 dias - %'
       RETURNING id;`,
      [`Assinatura Ativa - ${plan.name}`, intent.organization_id, intent.email]
    );
    if (!leadResult.rowCount) {
      throw new Error('Não foi possível localizar o lead de trial para reativar a conta.');
    }

    await client.query(
      `UPDATE public.organizations
       SET plan = $1, updated_at = NOW()
       WHERE id = $2 AND slug <> 'alllogic';`,
      [plan.name, intent.organization_id]
    );
    await client.query(
      `UPDATE public.agillex_checkout_intents
       SET status = 'active', activated_at = COALESCE(activated_at, NOW())
       WHERE id = $1;`,
      [intent.id]
    );

    return true;
  });
}
