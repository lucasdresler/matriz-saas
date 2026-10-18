import { NextResponse } from 'next/server';
import { asaasService } from '@/lib/asaas';
import { SAAS_PLANS } from '@/types/pricing';
import { whmService } from '@/lib/whm';
import { notificationService } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      cpfCnpj,
      companyName,
      planId,
      cycle = 'monthly',
      billingMethod = 'PIX',
      creditCard,
      isTrial = false,
      domain = '',
    } = body;

    // Validações básicas
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Nome, e-mail e telefone são obrigatórios.' },
        { status: 400 }
      );
    }

    const plan = SAAS_PLANS[planId] || SAAS_PLANS['pro'];

    // Fluxo de ativação de teste gratuito (14 dias)
    if (isTrial) {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      return NextResponse.json({
        success: true,
        status: 'trial',
        plan: plan.name,
        companyName: companyName || name,
        trialEndDate: trialEndDate.toISOString(),
        message: 'Teste gratuito de 14 dias ativado com sucesso! Seja bem-vindo ao Agillex.',
      });
    }

    if (!cpfCnpj) {
      return NextResponse.json(
        { error: 'CPF ou CNPJ é obrigatório para emissão da cobrança/assinatura.' },
        { status: 400 }
      );
    }

    // 1. Criar ou localizar o cliente no Asaas
    const customer = await asaasService.createOrUpdateCustomer({
      name,
      email,
      cpfCnpj,
      phone,
      companyName: companyName || name,
    });

    const isYearly = cycle === 'yearly';
    const amount = isYearly ? plan.annualTotal : plan.priceMonthly;
    const description =
      plan.module === 'hospedagem'
        ? `Hospedagem AllLogic - ${plan.name} (${isYearly ? 'Anual' : 'Mensal'})${domain ? ` - Domínio: ${domain}` : ''}`
        : `Assinatura ${plan.name} (${isYearly ? 'Anual' : 'Mensal'}) - AllLogic Online`;

    // 2. Processar de acordo com a forma de pagamento
    if (billingMethod === 'CREDIT_CARD') {
      if (!creditCard || !creditCard.number || !creditCard.holderName) {
        return NextResponse.json(
          { error: 'Dados do cartão de crédito incompletos.' },
          { status: 400 }
        );
      }

      const nextDueDate = new Date().toISOString().split('T')[0];

      const subscription = await asaasService.createSubscription({
        customer: customer.id,
        billingType: 'CREDIT_CARD',
        value: amount,
        nextDueDate,
        cycle: isYearly ? 'YEARLY' : 'MONTHLY',
        description,
        creditCard,
        creditCardHolderInfo: {
          name,
          email,
          cpfCnpj,
          phone,
        },
      });

      // Se for plano de hospedagem, provisiona imediatamente no WHM/cPanel
      let provisioning = null;
      if (plan.module === 'hospedagem' && domain) {
        try {
          provisioning = await whmService.createAccount({
            domain,
            contactemail: email,
            planId: plan.id,
            customerName: name,
          });

          // Disparar notificação operacional da equipe AllLogic e boas-vindas ao cliente
          await notificationService.notifyNewHostingOrder({
            customerName: name,
            companyName,
            cpfCnpj,
            email,
            phone,
            domain,
            planName: plan.name,
            cycle,
            amount,
            billingMethod: 'Cartão de Crédito',
            provisioning,
          });
        } catch (provisionErr: any) {
          console.error('[API Checkout] Erro no provisionamento WHM pós-cartão:', provisionErr);
        }
      }

      return NextResponse.json({
        success: true,
        status: 'active',
        billingMethod: 'CREDIT_CARD',
        subscriptionId: subscription.id,
        plan: plan.name,
        amount,
        domain: domain || undefined,
        provisioning,
        message: provisioning
          ? 'Assinatura confirmada e sua hospedagem foi ativada com sucesso!'
          : 'Assinatura confirmada com sucesso no cartão de crédito!',
      });
    }

    if (billingMethod === 'PIX') {
      const today = new Date().toISOString().split('T')[0];

      const payment = await asaasService.createPayment({
        customer: customer.id,
        billingType: 'PIX',
        value: amount,
        dueDate: today,
        description,
      });

      const qr = await asaasService.getPixQrCode(payment.id);

      return NextResponse.json({
        success: true,
        status: 'pending',
        billingMethod: 'PIX',
        paymentId: payment.id,
        plan: plan.name,
        planId: plan.id,
        domain: domain || undefined,
        amount,
        qrCodeBase64: qr.encodedImage,
        copyPaste: qr.payload,
        expirationDate: qr.expirationDate,
        message: 'Código PIX gerado com sucesso! Realize o pagamento para ativar instantaneamente.',
      });
    }

    if (billingMethod === 'BOLETO') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const payment = await asaasService.createPayment({
        customer: customer.id,
        billingType: 'BOLETO',
        value: amount,
        dueDate: dueDateStr,
        description,
      });

      return NextResponse.json({
        success: true,
        status: 'pending',
        billingMethod: 'BOLETO',
        paymentId: payment.id,
        plan: plan.name,
        amount,
        bankSlipUrl: payment.bankSlipUrl,
        invoiceUrl: payment.invoiceUrl,
        message: 'Boleto bancário gerado com sucesso!',
      });
    }

    return NextResponse.json(
      { error: 'Forma de pagamento não suportada.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[API Checkout] Erro no processamento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar pagamento.' },
      { status: 500 }
    );
  }
}
