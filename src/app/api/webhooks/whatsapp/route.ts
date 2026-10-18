import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function formatPhoneDisplay(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    const num = digits.slice(4);
    if (num.length === 9) {
      return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
    }
    return `(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;
  }
  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const num = digits.slice(2);
    return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
  }
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    const num = digits.slice(2);
    return `(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;
  }
  return rawPhone;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      phone,
      name,
      message,
      sender = 'lead',
      isGroup = false,
      isSaved = false,
      mediaType = 'text',
      mediaUrl = null,
      secret,
    } = body;

    // Validação de token de segurança se configurado
    const validSecret = process.env.EVOLUTION_API_KEY || 'MatrizSuperSecretApiKey2026';
    const headerSecret = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    if (secret !== validSecret && headerSecret !== validSecret) {
      console.warn('[WhatsApp Webhook] Requisição com token inválido.');
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
    }

    // Regra 1: Grupos NUNCA devem aparecer no Hub
    if (isGroup === true || (phone && (phone.includes('@g.us') || phone.includes('-')))) {
      return NextResponse.json({
        success: false,
        ignored: true,
        reason: 'group_ignored',
        message: 'Grupos do WhatsApp são ignorados conforme diretriz do Hub.',
      });
    }

    if (!phone) {
      return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 });
    }

    const rawDigits = phone.replace(/\D/g, '');
    if (rawDigits.length < 8) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }

    // Regra 2: Contatos salvos na agenda do telefone NUNCA devem aparecer no Hub
    let isSavedContact = isSaved === true;

    // Se não veio explicitamente marcado como salvo ou não-salvo, consultar Evolution API
    if (!isSavedContact) {
      try {
        const evoUrl = process.env.EVOLUTION_API_URL || 'https://evolution.alllogiconline.com.br';
        const evoKey = '2b138828125e9650036c54b84df09d66783e138053a3291bc165f54fdf17406a';
        const remoteJid = rawDigits.startsWith('55') ? `${rawDigits}@s.whatsapp.net` : `55${rawDigits}@s.whatsapp.net`;

        const checkRes = await fetch(`${evoUrl}/chat/findContacts/agillex-homologacao`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evoKey,
          },
          body: JSON.stringify({
            where: { remoteJid },
          }),
        });

        if (checkRes.ok) {
          const contacts = await checkRes.json();
          if (Array.isArray(contacts) && contacts.length > 0 && contacts[0]?.isSaved === true) {
            isSavedContact = true;
          }
        }
      } catch (checkErr) {
        console.warn('[WhatsApp Webhook] Falha ao checar findContacts:', checkErr);
      }
    }

    if (isSavedContact) {
      return NextResponse.json({
        success: false,
        ignored: true,
        reason: 'saved_contact_ignored',
        message: 'Contatos já salvos na agenda são ignorados para separar contatos pessoais da empresa.',
      });
    }

    // Obter ID da organização padrão
    const orgRes = await query('SELECT id FROM organizations LIMIT 1;');
    const orgId = orgRes.rows[0]?.id || 'a0000000-0000-0000-0000-000000000001';

    // Buscar se o lead já existe pelo final do telefone (últimos 8 dígitos)
    const suffix = rawDigits.slice(-8);
    const existingLeadRes = await query(
      `SELECT id, organization_id, status, tags, unread_count 
       FROM leads 
       WHERE phone LIKE $1 OR phone LIKE $2
       LIMIT 1;`,
      [`%${suffix}`, `%${rawDigits}%`]
    );

    let leadId: string;
    let action = 'created';

    if (existingLeadRes.rows.length > 0) {
      const existing = existingLeadRes.rows[0];
      leadId = existing.id;
      action = 'updated';

      // Atualizar lead existente
      const newStatus = existing.status === 'novo' ? 'em_atendimento' : existing.status;
      const unreadIncrement = sender === 'lead' ? (existing.unread_count || 0) + 1 : (existing.unread_count || 0);

      await query(
        `UPDATE leads 
         SET last_message = $1,
             last_message_at = NOW(),
             status = $2,
             unread_count = $3,
             updated_at = NOW()
         WHERE id = $4;`,
        [message || '', newStatus, unreadIncrement, leadId]
      );
    } else {
      // Criar novo lead direto na coluna 'em_atendimento'
      const displayName = name?.trim() || `WhatsApp (${rawDigits.slice(-4)})`;
      const formattedPhone = formatPhoneDisplay(rawDigits);
      const defaultTags = ['WhatsApp', 'Inbound', 'Atendimento IA'];

      const insertRes = await query(
        `INSERT INTO leads (
           organization_id,
           name,
           phone,
           status,
           tags,
           service_interest,
           last_message,
           last_message_at,
           unread_count,
           created_at,
           updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, NOW(), NOW())
         RETURNING id;`,
        [
          orgId,
          displayName,
          formattedPhone,
          'em_atendimento',
          defaultTags,
          'Atendimento WhatsApp',
          message || '',
          sender === 'lead' ? 1 : 0,
        ]
      );

      leadId = insertRes.rows[0].id;
    }

    // Registrar a mensagem na tabela chat_messages
    if (message && message.trim()) {
      const messageSender = sender === 'ai' ? 'ai' : sender === 'human' ? 'human' : 'lead';
      await query(
        `INSERT INTO chat_messages (
           organization_id,
           lead_id,
           sender,
           content,
           message_type,
           media_url,
           status,
           created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, 'delivered', NOW());`,
        [orgId, leadId, messageSender, message.trim(), mediaType, mediaUrl]
      );
    }

    return NextResponse.json({
      success: true,
      leadId,
      action,
      phone: formatPhoneDisplay(rawDigits),
    });
  } catch (error: any) {
    console.error('[WhatsApp Webhook] Erro ao processar:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
