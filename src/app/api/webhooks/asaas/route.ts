import { NextResponse } from 'next/server';
import { whmService } from '@/lib/whm';

export async function POST(request: Request) {
  try {
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    const headerToken = request.headers.get('asaas-access-token');

    // Validação de token de segurança se configurado
    if (webhookToken && headerToken !== webhookToken) {
      console.warn('[Asaas Webhook] Tentativa de acesso com token inválido.');
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
    }

    const payload = await request.json();
    const { event, payment, subscription } = payload;

    console.log(`[Asaas Webhook] Evento recebido: ${event}`, {
      paymentId: payment?.id,
      subscriptionId: subscription?.id || payment?.subscription,
      value: payment?.value,
      billingType: payment?.billingType,
    });

    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        console.log(`[Asaas Webhook] Pagamento liquidado com sucesso: ${payment?.id}`);

        // Provisionamento automático de hospedagem se o pagamento for de plano de hospedagem
        if (payment?.description && payment.description.includes('Hospedagem AllLogic')) {
          const domainMatch = payment.description.match(/Domínio:\s*([a-zA-Z0-9.-]+)/);
          const domain = domainMatch ? domainMatch[1].trim() : '';
          if (domain) {
            try {
              console.log(`[Asaas Webhook] Provisionando hospedagem automaticamente para ${domain}...`);
              await whmService.createAccount({
                domain,
                contactemail: payment.clientEmail || `contato@${domain}`,
                planId: 'profissional',
              });
            } catch (whmErr) {
              console.error('[Asaas Webhook] Erro ao provisionar WHM via webhook:', whmErr);
            }
          }
        }
        break;

      case 'PAYMENT_OVERDUE':
        console.log(`[Asaas Webhook] Pagamento em atraso: ${payment?.id}`);
        // Aqui marca o status para 'overdue' e pode disparar alerta amigável
        break;

      case 'PAYMENT_REFUNDED':
        console.log(`[Asaas Webhook] Pagamento estornado: ${payment?.id}`);
        break;

      case 'SUBSCRIPTION_CANCELED':
        console.log(`[Asaas Webhook] Assinatura cancelada: ${subscription?.id}`);
        break;

      default:
        console.log(`[Asaas Webhook] Evento não mapeado: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Asaas Webhook] Erro ao processar:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
