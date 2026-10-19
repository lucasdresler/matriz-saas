import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Lead, ChatMessage } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const leadsRes = await query(`
      SELECT 
        id,
        organization_id as "orgId",
        name,
        phone,
        email,
        COALESCE(avatar_url, '') as avatar,
        status,
        COALESCE(tags, ARRAY[]::text[]) as tags,
        COALESCE(service_interest, '') as "serviceInterest",
        COALESCE(last_message, '') as "lastMessage",
        to_char(last_message_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') as "lastMessageTime",
        ai_paused as "aiPaused",
        unread_count as "unreadCount",
        estimated_value as "estimatedValue",
        created_at as "createdAt"
      FROM leads
      ORDER BY last_message_at DESC NULLS LAST, created_at DESC;
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
    const { lead, syncAll } = body;

    // Obter ID da organização padrão
    const orgRes = await query('SELECT id FROM organizations LIMIT 1;');
    const orgId = orgRes.rows[0]?.id || 'a0000000-0000-0000-0000-000000000001';

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
