import { NextResponse } from 'next/server';
import { asaasService } from '@/lib/asaas';
import { whmService } from '@/lib/whm';
import { SAAS_PLANS } from '@/types/pricing';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const domain = searchParams.get('domain');
    const planId = searchParams.get('planId');
    const email = searchParams.get('email');
    const name = searchParams.get('name');

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId é obrigatório' }, { status: 400 });
    }

    const payment = await asaasService.getPayment(paymentId);

    // No Asaas: RECEIVED ou CONFIRMED indicam liquidação confirmada
    const isPaid = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED';

    let provisioning = null;
    if (isPaid && domain && planId) {
      const plan = SAAS_PLANS[planId];
      if (plan && plan.module === 'hospedagem') {
        try {
          provisioning = await whmService.createAccount({
            domain,
            contactemail: email || `contato@${domain}`,
            planId: plan.id,
            customerName: name || undefined,
          });
        } catch (provErr: any) {
          console.error('[API Checkout Status] Erro ao provisionar WHM pós-PIX:', provErr);
        }
      }
    }

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      isPaid,
      value: payment.value,
      clientPaymentDate: payment.clientPaymentDate,
      provisioning,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
