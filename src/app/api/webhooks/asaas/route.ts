import { NextResponse } from 'next/server';
import { whmService } from '@/lib/whm';
import { agillexCobrancaService } from '@/lib/cobranca';
import { activatePaidTrialUpgrade } from '@/lib/trial-upgrade';

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
    const externalReference = payment?.externalReference || subscription?.externalReference;
    const isTrialUpgrade = typeof externalReference === 'string'
      && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(externalReference);
    if (isTrialUpgrade && !webhookToken) {
      console.error('[Asaas Webhook] ASAAS_WEBHOOK_TOKEN é obrigatório para reativar workspaces.');
      return NextResponse.json({ error: 'Webhook sem autenticação configurada.' }, { status: 503 });
    }

    console.log(`[Asaas Webhook] Evento recebido: ${event}`, {
      paymentId: payment?.id,
      subscriptionId: subscription?.id || payment?.subscription,
      value: payment?.value,
      billingType: payment?.billingType,
    });

    const customerPhone = payment?.mobilePhone || payment?.phone || '';
    const customerName = payment?.customerName || payment?.clientName || 'Cliente';

    switch (event) {
      case 'PAYMENT_CREATED':
      case 'PAYMENT_DUEDATE_WARNING': {
        const stage = event === 'PAYMENT_CREATED' ? 'preventivo' : 'vencimento';
        console.log(`[Asaas Webhook] Disparando régua preventiva/vencimento (${stage}) para fatura: ${payment?.id}`);

        if (customerPhone && payment?.id) {
          await agillexCobrancaService.processNotification({
            customerName,
            customerPhone,
            paymentId: payment.id,
            value: payment.value || 0,
            dueDate: payment.dueDate,
            description: payment.description || 'Assinatura AllLogic',
            stage,
          });
        }
        break;
      }

      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        console.log(`[Asaas Webhook] Pagamento liquidado com sucesso: ${payment?.id}`);

        if (isTrialUpgrade) {
          await activatePaidTrialUpgrade({
            externalReference,
            subscriptionId: payment?.subscription,
            customerId: payment?.customer,
          });
        }

        // 1. Notificação de confirmação e agradecimento via WhatsApp
        if (customerPhone && payment?.id) {
          await agillexCobrancaService.processNotification({
            customerName,
            customerPhone,
            paymentId: payment.id,
            value: payment.value || 0,
            dueDate: payment.dueDate,
            description: payment.description || 'Serviço AllLogic',
            stage: 'confirmado',
          });
        }

        // 2. Provisionamento automático de hospedagem se o pagamento for de plano de hospedagem
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
      }

      case 'PAYMENT_OVERDUE': {
        console.log(`[Asaas Webhook] Pagamento em atraso: ${payment?.id}. Disparando régua de recuperação amigável...`);
        if (customerPhone && payment?.id) {
          await agillexCobrancaService.processNotification({
            customerName,
            customerPhone,
            paymentId: payment.id,
            value: payment.value || 0,
            dueDate: payment.dueDate,
            description: payment.description || 'Fatura AllLogic',
            stage: 'recuperacao',
          });
        }
        break;
      }

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
  } catch (error: unknown) {
    console.error('[Asaas Webhook] Erro ao processar:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido ao processar o webhook.' },
      { status: 500 }
    );
  }
}
