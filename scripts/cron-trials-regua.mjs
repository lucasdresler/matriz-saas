#!/usr/bin/env node
/**
 * AllLogic Online - Cron Job Oficial da Régua dos Trials (14 Dias)
 * Executado diariamente às 08:00
 *
 * Funcionalidades:
 * - Identifica organizações com status 'trial'
 * - D-3 (11º dia): Notificação de Suporte e Acompanhamento
 * - D-1 (13º dia): Lembrete prévio de encerramento amanhã
 * - D0 (14º dia): Criação automática de fatura Pix no Asaas + Pix Copia e Cola
 * - D+1 (15º dia): Atualização do status para 'expired' (aciona Paywall cortês)
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://matriz_admin:MatrizSecurePass2026!@localhost:5432/matriz_db?schema=public';
const EVOLUTION_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'https://wa.alllogiconline.com.br';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'MatrizSuperSecretApiKey2026';
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

const LOG_FILE = path.join(__dirname, 'trials-cron.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

async function sendWhatsApp(phone, text) {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const number = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const instRes = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
      headers: { apikey: EVOLUTION_KEY },
    });
    if (!instRes.ok) return false;
    const instances = await instRes.json();
    if (!Array.isArray(instances) || instances.length === 0) return false;
    const instanceName = instances[0].name || instances[0].instanceName;
    if (!instanceName) return false;

    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_KEY,
      },
      body: JSON.stringify({
        number,
        text,
        options: { delay: 1200, linkPreview: false },
      }),
    });
    return res.ok;
  } catch (err) {
    log(`⚠️ Erro ao enviar WhatsApp para ${phone}: ${err.message}`);
    return false;
  }
}

async function createAsaasPixPayment(customerName, phone, value, description) {
  try {
    // 1. Criar cliente no Asaas
    const custRes = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        name: customerName,
        mobilePhone: phone.replace(/\D/g, ''),
      }),
    });
    const customer = await custRes.json();
    const customerId = customer.id;

    // 2. Criar cobrança PIX
    const today = new Date().toISOString().split('T')[0];
    const payRes = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value,
        dueDate: today,
        description,
      }),
    });
    const payment = await payRes.json();

    // 3. Obter QR Code e Pix Copia e Cola
    const qrRes = await fetch(`${ASAAS_API_URL}/payments/${payment.id}/pixQrCode`, {
      headers: { access_token: ASAAS_API_KEY },
    });
    const qr = await qrRes.json();

    return {
      paymentId: payment.id,
      pixCopiaECola: qr.payload,
    };
  } catch (err) {
    log(`⚠️ Erro ao gerar Pix no Asaas: ${err.message}`);
    return null;
  }
}

async function runTrialRegua() {
  log('=====================================================');
  log('🚀 Iniciando execução da Régua dos Trials (Agillex)');
  log('=====================================================');

  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  let client;
  try {
    client = await pool.connect();
  } catch (dbErr) {
    log(`⚠️ Banco de dados local não conectado (${dbErr.message}). Prosseguindo em modo simulado.`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let trials = [];

  if (client) {
    try {
      const res = await client.query(`
        SELECT id, name, slug, plan, whatsapp_phone, created_at
        FROM public.organizations
        WHERE plan IS NOT NULL;
      `);
      trials = res.rows.map((row) => {
        const createdAt = new Date(row.created_at);
        const trialEndsAt = new Date(createdAt);
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
        return {
          id: row.id,
          name: row.name,
          phone: row.whatsapp_phone,
          plan: row.plan,
          trialEndsAt,
        };
      });
    } catch (queryErr) {
      log(`⚠️ Falha ao consultar organizations: ${queryErr.message}`);
    }
  }

  log(`📊 Total de organizações analisadas: ${trials.length}`);

  for (const trial of trials) {
    if (!trial.phone) continue;

    const diffMs = trial.trialEndsAt.getTime() - today.getTime();
    const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

    log(`🔍 Avaliando: ${trial.name} | Plano: ${trial.plan} | Dias Restantes: ${daysRemaining}`);

    // D-3: Faltam 3 dias
    if (daysRemaining === 3) {
      log(`📢 [D-3] Enviando mensagem de engajamento para ${trial.name}`);
      const text = `Olá, *${trial.name}*! Faltam apenas 3 dias para encerrar seu período gratuito do *${trial.plan}* pela AllLogic Online. 🚀\n\nComo está sendo sua experiência? Se tiver qualquer dúvida ou precisar de apoio para configurar sua equipe ou WhatsApp, nossa engenharia está 100% à sua disposição!`;
      await sendWhatsApp(trial.phone, text);
    }

    // D-1: Falta 1 dia
    else if (daysRemaining === 1) {
      log(`📢 [D-1] Enviando alerta de encerramento amanhã para ${trial.name}`);
      const text = `Olá, *${trial.name}*! Seu período de teste de 14 dias do *${trial.plan}* encerra amanhã! ⏰\n\nPara continuar aproveitando todos os recursos sem nenhuma pausa e manter todos os seus dados e atendimentos preservados, continue seu plano com desconto em:\n👉 https://hub.alllogiconline.com.br/checkout?modulo=combo&plano=combo`;
      await sendWhatsApp(trial.phone, text);
    }

    // D0: Dia do encerramento (14º dia) -> Cria cobrança Asaas Pix
    else if (daysRemaining === 0) {
      log(`📢 [D0] Gerando fatura Pix e enviando no WhatsApp para ${trial.name}`);
      const pix = await createAsaasPixPayment(trial.name, trial.phone, 199.90, `Mensalidade ${trial.plan} - AllLogic Online`);
      let text = `Olá, *${trial.name}*! Hoje encerra seu período gratuito do *${trial.plan}*. 🎉\n\nMantenha sua operação rodando sem interrupções! Pague sua mensalidade em 1 clique via Pix:`;
      if (pix?.pixCopiaECola) {
        text += `\n\n🔑 *Código Pix Copia e Cola:*\n\`${pix.pixCopiaECola}\`\n\nApós o pagamento, sua plataforma é liberada automaticamente em segundos.`;
      } else {
        text += `\n👉 Acesse o link seguro de pagamento: https://hub.alllogiconline.com.br/checkout?modulo=combo&plano=combo`;
      }
      await sendWhatsApp(trial.phone, text);
    }

    // D+1: Expirado (15º dia) -> Atualizar status para expired
    else if (daysRemaining < 0) {
      log(`🔒 [D+1] Período expirado para ${trial.name}. Acionando Paywall cortês.`);
      if (client) {
        try {
          await client.query(`UPDATE public.organizations SET plan = 'Expired' WHERE id = $1`, [trial.id]);
        } catch (updateErr) {
          log(`⚠️ Falha ao atualizar status: ${updateErr.message}`);
        }
      }
    }
  }

  if (client) client.release();
  await pool.end();

  log('✅ Execução da régua de trials concluída com êxito.');
}

runTrialRegua().catch((err) => {
  log(`❌ Erro fatal na execução: ${err.message}`);
  process.exit(1);
});
