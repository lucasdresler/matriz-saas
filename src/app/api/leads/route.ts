import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Lead, ChatMessage } from '@/types';
import { notificationService } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const leadsRes = await query(`
      SELECT 
        l.id,
        l.organization_id as "orgId",
        l.name,
        l.phone,
        l.email,
        COALESCE(l.avatar_url, '') as avatar,
        l.status,
        COALESCE(l.tags, ARRAY[]::text[]) as tags,
        COALESCE(l.service_interest, '') as "serviceInterest",
        COALESCE(l.last_message, '') as "lastMessage",
        to_char(COALESCE((SELECT MAX(created_at) FROM chat_messages WHERE lead_id = l.id), l.last_message_at, l.created_at) AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') as "lastMessageTime",
        COALESCE((SELECT MAX(created_at) FROM chat_messages WHERE lead_id = l.id), l.last_message_at, l.created_at) as "lastMessageAt",
        l.ai_paused as "aiPaused",
        l.unread_count as "unreadCount",
        l.estimated_value as "estimatedValue",
        l.created_at as "createdAt"
      FROM leads l
      ORDER BY COALESCE((SELECT MAX(created_at) FROM chat_messages WHERE lead_id = l.id), l.last_message_at, l.created_at) ASC, l.created_at ASC, l.id ASC;
    `);

    const messagesRes = await query(`
      SELECT 
        id,
        lead_id as "leadId",
        sender,
        content,
        to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') as timestamp,
        status,
        COALESCE(message_type, 'text') as type
      FROM chat_messages
      ORDER BY created_at ASC;
    `);

    const leads: Lead[] = leadsRes.rows.map((r: any) => ({
      id: r.id,
      orgId: 'org-alllogic',
      name: r.name,
      phone: r.phone,
      email: r.email || undefined,
      avatar: r.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces`,
      status: r.status,
      tags: Array.isArray(r.tags) ? r.tags : [],
      serviceInterest: r.serviceInterest || 'Atendimento WhatsApp',
      lastMessage: r.lastMessage || '',
      lastMessageTime: r.lastMessageTime || '',
      lastMessageAt: r.lastMessageAt ? new Date(r.lastMessageAt).toISOString() : undefined,
      aiPaused: Boolean(r.aiPaused),
      unreadCount: Number(r.unreadCount || 0),
      estimatedValue: Number(r.estimatedValue || 0),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));

    const messagesMap: Record<string, ChatMessage[]> = {};
    for (const msg of messagesRes.rows) {
      if (!messagesMap[msg.leadId]) {
        messagesMap[msg.leadId] = [];
      }
      messagesMap[msg.leadId].push({
        id: msg.id,
        leadId: msg.leadId,
        sender: msg.sender as any,
        content: msg.content,
        timestamp: msg.timestamp || 'Agora',
        status: (msg.status as any) || 'delivered',
        type: (msg.type as any) || 'text',
      });
    }

    return NextResponse.json({
      success: true,
      leads,
      messages: messagesMap,
    });
  } catch (error: any) {
    console.error('[Leads API] Erro ao buscar leads:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead, syncAll, message } = body;

    // Obter ID da organização padrão
    const orgRes = await query('SELECT id FROM organizations LIMIT 1;');
    const orgId = orgRes.rows[0]?.id || 'a0000000-0000-0000-0000-000000000001';

    // Gravar mensagem avulsa de chat (ex: abordagem inicial no WhatsApp ou resposta no Live Chat)
    if (message && message.leadId && message.content) {
      const msgRes = await query(
        `INSERT INTO chat_messages (
           organization_id, lead_id, sender, content, message_type, status, created_at
         ) VALUES ($1, $2::uuid, $3, $4, $5, 'delivered', NOW())
         RETURNING id;`,
        [orgId, message.leadId, message.sender || 'human', message.content, message.type || 'text']
      );

      // Também sincroniza a última mensagem do lead
      await query(
        `UPDATE leads 
         SET last_message = $1, last_message_at = NOW(), updated_at = NOW() 
         WHERE id = $2::uuid;`,
        [message.content, message.leadId]
      );

      // Tentar entregar via WhatsApp (Evolution API) se for mensagem de atendente humano
      if ((message.sender === 'human' || !message.sender) && message.leadId) {
        try {
          const leadPhoneRes = await query('SELECT phone FROM leads WHERE id = $1::uuid LIMIT 1;', [message.leadId]);
          const phone = leadPhoneRes.rows[0]?.phone;
          if (phone) {
            notificationService.sendWhatsAppText(phone, message.content).catch(() => {});
          }
        } catch {
          // Continua normalmente se a Evolution API não estiver pareada
        }
      }

      return NextResponse.json({ success: true, messageId: msgRes.rows[0]?.id });
    }

    // Suporte para sincronização em lote (ex: leads minerados do prospector)
    if (syncAll && Array.isArray(syncAll)) {
      for (const item of syncAll) {
        await query(
          `INSERT INTO leads (
             id, organization_id, name, phone, email, status, tags, service_interest, last_message, unread_count, estimated_value, created_at, updated_at
           ) VALUES (
             COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
           )
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             phone = EXCLUDED.phone,
             email = EXCLUDED.email,
             status = EXCLUDED.status,
             tags = EXCLUDED.tags,
             service_interest = EXCLUDED.service_interest,
             last_message = EXCLUDED.last_message,
             estimated_value = EXCLUDED.estimated_value,
             updated_at = NOW();`,
          [
            item.id && item.id.includes('-') && item.id.length === 36 ? item.id : null,
            orgId,
            item.name,
            item.phone,
            item.email || null,
            item.status || 'novo',
            item.tags || [],
            item.serviceInterest || '',
            item.lastMessage || '',
            item.unreadCount || 0,
            item.estimatedValue || 0,
          ]
        );
      }
      return NextResponse.json({ success: true, count: syncAll.length });
    }

    if (!lead) {
      return NextResponse.json({ error: 'Lead data is required' }, { status: 400 });
    }

    const leadId = lead.id && lead.id.includes('-') && lead.id.length === 36 ? lead.id : null;

    const res = await query(
      `INSERT INTO leads (
         id, organization_id, name, phone, email, status, tags, service_interest, last_message, unread_count, estimated_value, created_at, updated_at
       ) VALUES (
         COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
       )
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         status = EXCLUDED.status,
         tags = EXCLUDED.tags,
         service_interest = EXCLUDED.service_interest,
         last_message = EXCLUDED.last_message,
         estimated_value = EXCLUDED.estimated_value,
         updated_at = NOW()
       RETURNING id;`,
      [
        leadId,
        orgId,
        lead.name,
        lead.phone,
        lead.email || null,
        lead.status || 'novo',
        lead.tags || [],
        lead.serviceInterest || '',
        lead.lastMessage || '',
        lead.unreadCount || 0,
        lead.estimatedValue || 0,
      ]
    );

    return NextResponse.json({ success: true, leadId: res.rows[0]?.id });
  } catch (error: any) {
    console.error('[Leads API] Erro ao salvar lead:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await query('DELETE FROM leads WHERE id = $1::uuid;', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Leads API] Erro ao deletar lead:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
