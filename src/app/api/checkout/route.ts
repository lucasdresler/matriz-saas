import { NextResponse } from 'next/server';
import { asaasService } from '@/lib/asaas';
import { SAAS_PLANS } from '@/types/pricing';
import { whmService } from '@/lib/whm';
import { notificationService } from '@/lib/notifications';
import { generateTemporaryPassword, hashPassword } from '@/lib/auth';
import { withTransaction } from '@/lib/db';

class TrialAccountAlreadyExistsError extends Error {}

const CHECKOUT_CORS_ORIGINS = new Set([
  'https://agillex.com.br',
  'https://www.agillex.com.br',
]);

function withCheckoutCors(response: NextResponse, request: Request): NextResponse {
  const origin = request.headers.get('origin');
  if (origin && CHECKOUT_CORS_ORIGINS.has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Access-Control-Max-Age', '600');
    response.headers.append('Vary', 'Origin');
  }
  return response;
}

function checkoutJson(request: Request, body: unknown, init?: ResponseInit): NextResponse {
  return withCheckoutCors(NextResponse.json(body, init), request);
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && !CHECKOUT_CORS_ORIGINS.has(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return withCheckoutCors(new NextResponse(null, { status: 204 }), request);
}

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
      return checkoutJson(request,
        { error: 'Nome, e-mail e telefone são obrigatórios.' },
        { status: 400 }
      );
    }

    const plan =
      typeof planId === 'string' && Object.prototype.hasOwnProperty.call(SAAS_PLANS, planId)
        ? SAAS_PLANS[planId]
        : undefined;
    if (!plan) {
      return checkoutJson(request,
        { error: 'Plano inválido ou indisponível.' },
        { status: 400 }
      );
    }

    // Fluxo de ativação de teste gratuito (14 dias)
    if (isTrial) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return checkoutJson(request,
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
      let isExistingAccount = false;
      let existingCompanyName = targetCompanyName;

      try {
        const account = await withTransaction(async (client) => {
          // 1. Verifica se já existe uma conta ou organização vinculada a este e-mail, telefone ou slug da empresa
          const existingCheck = await client.query(
            `SELECT o.id AS org_id, o.name AS org_name, o.slug, o.category, o.plan, o.created_at, o.enabled_modules,
                    u.id AS user_id, u.name AS user_name, u.email
             FROM public.organizations o
             JOIN public.organization_members om ON om.organization_id = o.id
             JOIN auth.users u ON u.id = om.user_id
             WHERE o.slug <> 'alllogic'
               AND (
                 LOWER(u.email) = $1
                 OR o.whatsapp_phone = $2
                 OR o.slug = $3
               )
             ORDER BY o.created_at ASC
             LIMIT 1
             FOR UPDATE OF o;`,
            [cleanEmail, cleanPhone, tenantSlug]
          );

          if (existingCheck.rows.length > 0) {
            const existing = existingCheck.rows[0];
            const orgCreatedAt = new Date(existing.created_at);
            const diffDays = (Date.now() - orgCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
            const isTrialExpired = diffDays >= 14;

            // Se os 14 dias expiraram: bloqueio estrito com os mesmos dados de acesso
            if (isTrialExpired) {
              const expDate = new Date(orgCreatedAt.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
              throw new Error(`TRIAL_EXPIRED:${expDate}`);
            }

            // Ainda dentro do período de 14 dias: permite adicionar o novo módulo sem qualquer intervenção
            let currentModules: string[] = Array.isArray(existing.enabled_modules) && existing.enabled_modules.length > 0
              ? [...existing.enabled_modules]
              : [];

            if (currentModules.length === 0) {
              if (existing.category === 'combo') {
                currentModules = ['agenda', 'atendimento', 'crm', 'cobranca', 'reputacao', 'ged'];
              } else if (existing.category === 'agenda' || existing.slug === 'salao-bonitao') {
                currentModules = ['agenda'];
              } else if (existing.category) {
                currentModules = [existing.category];
              } else {
                currentModules = ['agenda'];
              }
            }

            const requestedModule = (plan.module || 'agenda').toLowerCase().trim();
            if (requestedModule === 'combo') {
              currentModules = ['agenda', 'atendimento', 'crm', 'cobranca', 'reputacao', 'ged'];
            } else {
              if (!currentModules.includes(requestedModule)) {
                currentModules.push(requestedModule);
              }
              if (requestedModule === 'atendimento' && !currentModules.includes('crm')) {
                currentModules.push('crm');
              }
            }

            await client.query(
              `UPDATE public.organizations
               SET enabled_modules = $1, updated_at = NOW()
               WHERE id = $2;`,
              [currentModules, existing.org_id]
            );

            // Registra novo lead / histórico
            await client.query(
              `INSERT INTO public.leads (organization_id, name, phone, whatsapp, email, status, service_interest)
               VALUES ($1, $2, $3, $3, $4, 'novo', $5);`,
              [existing.org_id, name, cleanPhone, cleanEmail, `Trial 14 dias - Adição de Módulo: ${plan.name}`]
            );

            return {
              userId: existing.user_id,
              organizationCreatedAt: orgCreatedAt,
              isExistingAccount: true,
              companyName: existing.org_name,
            };
          }

          // 2. Se NÃO existe conta anterior: cria o novo usuário e a nova organização
          let userResult = await client.query(
            `INSERT INTO auth.users (email, password_hash, name, role)
             VALUES ($1, $2, $3, 'owner')
             ON CONFLICT (email) DO UPDATE
             SET name = EXCLUDED.name, updated_at = NOW()
             RETURNING id;`,
            [cleanEmail, passwordHash, name]
          );
          let user = userResult.rows[0];

          let finalSlug = tenantSlug;
          const existingSlug = await client.query('SELECT id FROM public.organizations WHERE slug = $1 LIMIT 1;', [finalSlug]);
          if (existingSlug.rows.length > 0) {
            let counter = 2;
            while (true) {
              const candidate = `${tenantSlug}-${counter}`;
              const check = await client.query('SELECT id FROM public.organizations WHERE slug = $1 LIMIT 1;', [candidate]);
              if (check.rows.length === 0) {
                finalSlug = candidate;
                break;
              }
              counter++;
            }
          }

          const initialModules = plan.module === 'combo'
            ? ['agenda', 'atendimento', 'crm', 'cobranca', 'reputacao', 'ged']
            : (plan.module === 'atendimento' ? ['atendimento', 'crm'] : [plan.module || 'agenda']);

          const orgRes = await client.query(
            `INSERT INTO public.organizations (name, slug, category, plan, whatsapp_phone, enabled_modules)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, created_at;`,
            [targetCompanyName, finalSlug, plan.module, plan.name, cleanPhone, initialModules]
          );
          const orgId = orgRes.rows[0]?.id;
          const orgCreatedAt = orgRes.rows[0]?.created_at;

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

          return {
            userId: user.id,
            organizationCreatedAt: orgCreatedAt,
            isExistingAccount: false,
            companyName: targetCompanyName,
          };
        });

        userId = account.userId;
        organizationCreatedAt = account.organizationCreatedAt;
        isExistingAccount = account.isExistingAccount;
        existingCompanyName = account.companyName;
      } catch (dbErr: any) {
        if (dbErr.message && dbErr.message.startsWith('TRIAL_EXPIRED:')) {
          const expDate = dbErr.message.split(':')[1];
          return checkoutJson(request,
            { error: `O período de testes gratuito de 14 dias para esta conta encerrou em ${expDate}. Acesse o painel (https://hub.agillex.com.br) para assinar um plano definitivo.` },
            { status: 403 }
          );
        }
        if (dbErr instanceof TrialAccountAlreadyExistsError) {
          return checkoutJson(request,
            { error: 'Não foi possível iniciar um novo cadastro com esses dados. Confira as informações ou procure o suporte.' },
            { status: 409 }
          );
        }
        throw dbErr;
      }

      const trialEndDate = new Date(organizationCreatedAt);
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      if (isExistingAccount) {
        // Cliente já cadastrado dentro do teste: notifica adição do módulo e mantém senha atual
        await notificationService.notifyTrialModuleAdded({
          customerName: name,
          phone,
          email: cleanEmail,
          planName: plan.name,
          trialEndDate: trialEndDate.toISOString(),
          companyName: existingCompanyName,
        });

        await notificationService.notifyNewTrialLead({
          customerName: name,
          companyName: existingCompanyName,
          phone,
          email: cleanEmail,
          planName: `${plan.name} (Adicionado ao Teste)`,
          trialEndDate: trialEndDate.toISOString(),
        });

        return checkoutJson(request, {
          success: true,
          status: 'trial',
          isExistingAccount: true,
          plan: plan.name,
          companyName: existingCompanyName,
          trialEndDate: trialEndDate.toISOString(),
          message: `Módulo ${plan.name} ativado com sucesso no seu período de testes! Acesse com seu login habitual em https://hub.agillex.com.br.`,
        });
      }

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

        return checkoutJson(request,
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

      return checkoutJson(request, {
        success: true,
        status: 'trial',
        plan: plan.name,
        companyName: targetCompanyName,
        trialEndDate: trialEndDate.toISOString(),
        tempPassword,
        message: 'Teste gratuito ativado! Enviamos sua senha provisória pelo WhatsApp informado.',
      });
    }

    if (!cpfCnpj) {
      return checkoutJson(request,
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
        return checkoutJson(request,
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
        } catch (provisionErr: unknown) {
          console.error('[API Checkout] Erro no provisionamento WHM pós-cartão:', provisionErr);
        }
      }

      return checkoutJson(request, {
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

      return checkoutJson(request, {
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

      return checkoutJson(request, {
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

    return checkoutJson(request,
      { error: 'Forma de pagamento não suportada.' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('[API Checkout] Erro no processamento:', error);
    return checkoutJson(request,
      { error: error instanceof Error ? error.message : 'Erro interno ao processar pagamento.' },
      { status: 500 }
    );
  }
}
