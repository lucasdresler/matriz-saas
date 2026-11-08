import { NextResponse } from 'next/server';
import { asaasService } from '@/lib/asaas';
import { SAAS_PLANS } from '@/types/pricing';
import { whmService } from '@/lib/whm';
import { notificationService } from '@/lib/notifications';
import { query } from '@/lib/db';

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

      const targetCompanyName = companyName || name;
      const cleanPhone = phone.replace(/\D/g, '');
      const tenantSlug = (companyName || name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `empresa-${Date.now()}`;

      // 1. Tentar persistir organização e lead no PostgreSQL
      try {
        const orgRes = await query(
          `INSERT INTO public.organizations (name, slug, category, plan, whatsapp_phone)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
           RETURNING id;`,
          [targetCompanyName, `${tenantSlug}-${Date.now().toString().slice(-4)}`, plan.module, plan.name, cleanPhone]
        );

        if (orgRes && orgRes.rows && orgRes.rows[0]) {
          const orgId = orgRes.rows[0].id;
          await query(
            `INSERT INTO public.leads (organization_id, name, phone, whatsapp, email, status, service_interest)
             VALUES ($1, $2, $3, $4, $5, 'novo', $6);`,
            [orgId, name, cleanPhone, cleanPhone, email, `Trial 14 dias - ${plan.name}`]
          );
        }
      } catch (dbErr: any) {
        console.warn('[API Checkout Trial] Aviso: persistência em banco isolado:', dbErr.message);
      }

      // 2. Disparar WhatsApp de boas-vindas com credenciais para o cliente
      await notificationService.notifyTrialWelcome({
        customerName: name,
        phone,
        email,
        planName: plan.name,
        trialEndDate: trialEndDate.toISOString(),
      });

      // 3. Disparar notificação operacional interna para o WhatsApp da equipe AllLogic
      await notificationService.notifyNewTrialLead({
        customerName: name,
        companyName: targetCompanyName,
        phone,
        email,
        planName: plan.name,
        trialEndDate: trialEndDate.toISOString(),
      });

      return NextResponse.json({
        success: true,
        status: 'trial',
        plan: plan.name,
        companyName: targetCompanyName,
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
