import { NextResponse } from 'next/server';
import { asaasService } from '@/lib/asaas';
import { SAAS_PLANS } from '@/types/pricing';
import { whmService } from '@/lib/whm';
import { notificationService } from '@/lib/notifications';
import { generateTemporaryPassword, hashPassword } from '@/lib/auth';
import { withTransaction } from '@/lib/db';

class TrialAccountAlreadyExistsError extends Error {}

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
    if (
      typeof name !== 'string' || !name.trim()
      || typeof email !== 'string' || !email.trim()
      || typeof phone !== 'string' || !phone.trim()
    ) {
      return NextResponse.json(
        { error: 'Nome, e-mail e telefone são obrigatórios.' },
        { status: 400 }
      );
    }

    const plan = SAAS_PLANS[planId] || SAAS_PLANS['pro'];

    // Fluxo de ativação de teste gratuito (14 dias)
    if (isTrial) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json(
          { error: 'Informe um endereço de e-mail válido.' },
          { status: 400 }
        );
      }

      const targetCompanyName = companyName || name;
      const cleanPhone = phone.replace(/\D/g, '');
      const tenantSlug = (companyName || name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `empresa-${Date.now()}`;
      const tempPassword = generateTemporaryPassword();
      const passwordHash = hashPassword(tempPassword);
      let userId: string;

      let organizationCreatedAt: Date;
      try {
        const account = await withTransaction(async (client) => {
          let userResult = await client.query(
            `SELECT id, password_hash
             FROM auth.users
             WHERE LOWER(email) = $1
             LIMIT 1
             FOR UPDATE;`,
            [cleanEmail]
          );
          let user = userResult.rows[0];

          if (user?.password_hash) {
            throw new TrialAccountAlreadyExistsError();
          }

          if (!user) {
            userResult = await client.query(
              `INSERT INTO auth.users (email, password_hash, name, role)
               VALUES ($1, $2, $3, 'owner')
               ON CONFLICT DO NOTHING
               RETURNING id, password_hash;`,
              [cleanEmail, passwordHash, name]
            );
            user = userResult.rows[0];

            if (!user) {
              userResult = await client.query(
                `SELECT id, password_hash
                 FROM auth.users
                 WHERE LOWER(email) = $1
                 LIMIT 1
                 FOR UPDATE;`,
                [cleanEmail]
              );
              user = userResult.rows[0];
            }
          }

          if (!user) {
            throw new Error('Não foi possível criar o usuário do teste.');
          }

          if (user.password_hash) {
            throw new TrialAccountAlreadyExistsError();
          }

          await client.query(
            `UPDATE auth.users
             SET name = $1, role = 'owner', password_hash = $2, updated_at = NOW()
             WHERE id = $3;`,
            [name, passwordHash, user.id]
          );

          const membership = await client.query(
            `SELECT o.id, o.created_at
             FROM public.organization_members AS om
             JOIN public.organizations AS o ON o.id = om.organization_id
             WHERE om.user_id = $1
             ORDER BY om.created_at DESC
             LIMIT 1
             FOR UPDATE OF o;`,
            [user.id]
          );

          let orgId = membership.rows[0]?.id;
          let orgCreatedAt: Date | undefined = membership.rows[0]?.created_at;
          if (!orgId) {
            const previousTrial = await client.query(
              `SELECT o.id, o.created_at
               FROM public.leads AS l
               JOIN public.organizations AS o ON o.id = l.organization_id
               WHERE LOWER(l.email) = $1 AND l.service_interest LIKE 'Trial 14 dias - %'
               ORDER BY l.created_at DESC
               LIMIT 1
               FOR UPDATE OF o;`,
              [cleanEmail]
            );

            orgId = previousTrial.rows[0]?.id;
            orgCreatedAt = previousTrial.rows[0]?.created_at;
            if (orgId) {
              await client.query(
                `INSERT INTO public.organization_members (organization_id, user_id, role)
                 VALUES ($1, $2, 'owner')
                 ON CONFLICT (organization_id, user_id) DO NOTHING;`,
                [orgId, user.id]
              );
            } else {
              const orgRes = await client.query(
                `INSERT INTO public.organizations (name, slug, category, plan, whatsapp_phone)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, created_at;`,
                [targetCompanyName, `${tenantSlug}-${Date.now().toString().slice(-4)}`, plan.module, plan.name, cleanPhone]
              );
              orgId = orgRes.rows[0]?.id;
              orgCreatedAt = orgRes.rows[0]?.created_at;

              if (!orgId || !orgCreatedAt) {
                throw new Error('Não foi possível criar a organização do teste.');
              }

              await client.query(
                `INSERT INTO public.organization_members (organization_id, user_id, role)
                 VALUES ($1, $2, 'owner')
                 ON CONFLICT (organization_id, user_id) DO NOTHING;`,
                [orgId, user.id]
              );

              await client.query(
                `INSERT INTO public.leads (organization_id, name, phone, whatsapp, email, status, service_interest)
                 VALUES ($1, $2, $3, $3, $4, 'novo', $5);`,
                [orgId, name, cleanPhone, cleanEmail, `Trial 14 dias - ${plan.name}`]
              );
            }
          }

          if (!orgCreatedAt) {
            throw new Error('Não foi possível determinar a data de início do teste.');
          }

          return { userId: user.id, organizationCreatedAt: orgCreatedAt };
        });
        userId = account.userId;
        organizationCreatedAt = account.organizationCreatedAt;
      } catch (dbErr) {
        if (dbErr instanceof TrialAccountAlreadyExistsError) {
          return NextResponse.json(
            { error: 'Não foi possível iniciar um novo cadastro com esses dados. Confira as informações ou procure o suporte.' },
            { status: 409 }
          );
        }
        throw dbErr;
      }

      const trialEndDate = new Date(organizationCreatedAt);
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const whatsappDelivered = await notificationService.notifyTrialWelcome({
        customerName: name,
        phone,
        email: cleanEmail,
        planName: plan.name,
        trialEndDate: trialEndDate.toISOString(),
        tempPassword,
      });

      if (!whatsappDelivered) {
        try {
          await withTransaction(async (client) => {
            await client.query(
              `UPDATE auth.users
               SET password_hash = NULL, updated_at = NOW()
               WHERE id = $1 AND password_hash = $2;`,
              [userId, passwordHash]
            );
          });
        } catch (resetError) {
          console.error('[API Checkout Trial] Não foi possível invalidar a senha não entregue:', resetError);
          throw new Error('Falha ao entregar o acesso e invalidar a senha provisória.');
        }

        return NextResponse.json(
          { error: 'Seu cadastro foi salvo, mas não conseguimos enviar a senha provisória pelo WhatsApp. Verifique o número e tente novamente.' },
          { status: 502 }
        );
      }

      await notificationService.notifyNewTrialLead({
        customerName: name,
        companyName: targetCompanyName,
        phone,
        email: cleanEmail,
        planName: plan.name,
        trialEndDate: trialEndDate.toISOString(),
      });

      return NextResponse.json({
        success: true,
        status: 'trial',
        plan: plan.name,
        companyName: targetCompanyName,
        trialEndDate: trialEndDate.toISOString(),
        message: 'Teste gratuito ativado! Enviamos a senha provisória pelo WhatsApp informado.',
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
