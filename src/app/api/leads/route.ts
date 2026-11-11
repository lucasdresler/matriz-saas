import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Lead, LeadStatus, ChatMessage } from '@/types';
import { notificationService } from '@/lib/notifications';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

type SessionUser = { userId: string; role: string };
type LeadQueryRow = {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  avatar: string | null;
  status: string;
  tags: string[] | null;
  serviceInterest: string | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
  lastMessageAt: Date | string | null;
  aiPaused: boolean;
  unreadCount: number | null;
  estimatedValue: number | string | null;
  createdAt: Date | string | null;
};
type MessageQueryRow = {
  id: string;
  leadId: string;
  sender: string;
  content: string;
  timestamp: string | null;
  status: string | null;
  type: string | null;
};

async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;
  return user?.userId && user.role ? { userId: user.userId, role: user.role } : null;
}

async function resolveOrganizationId(user: SessionUser, requestedOrgId?: string | null): Promise<string | null> {
  if (user.role === 'super_admin') {
    if (requestedOrgId && requestedOrgId !== 'org-alllogic') {
      const organization = await query(
        'SELECT id FROM public.organizations WHERE id::text = $1 OR slug = $1 LIMIT 1;',
        [requestedOrgId]
      );
      return (organization.rows[0]?.id as string) || null;
    }

    const organization = await query(
      `SELECT id FROM public.organizations
       ORDER BY CASE WHEN slug = 'alllogic' THEN 0 ELSE 1 END, name
       LIMIT 1;`
    );
    return (organization.rows[0]?.id as string) || null;
  }

  if (requestedOrgId === 'org-alllogic') return null;
  const organization = await query(
    `SELECT o.id
     FROM public.organization_members om
     JOIN public.organizations o ON o.id = om.organization_id
     WHERE om.user_id = $1
       AND ($2::text IS NULL OR o.id::text = $2 OR o.slug = $2)
     ORDER BY o.name
     LIMIT 1;`,
    [user.userId, requestedOrgId || null]
  );
  return (organization.rows[0]?.id as string) || null;
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = await resolveOrganizationId(user, searchParams.get('orgId'));
    if (!orgId) {
      return NextResponse.json({ error: 'Workspace não encontrado ou sem acesso.' }, { status: 403 });
    }

    const leadsRes = await query(`
      SELECT 
        l.id,
        l.organization_id as "orgId",
        l.name,
        l.phone,
        l.whatsapp,
        l.email,
        COALESCE(l.avatar_url, '') as avatar,
        l.status,
        COALESCE(l.tags, ARRAY[]::text[]) as tags,
        COALESCE(l.service_interest, '') as "serviceInterest",
        COALESCE(l.last_message, '') as "lastMessage",
        to_char(COALESCE((SELECT MAX(created_at) FROM public.chat_messages WHERE lead_id = l.id AND organization_id = $1), l.last_message_at, l.created_at) AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') as "lastMessageTime",
        COALESCE((SELECT MAX(created_at) FROM public.chat_messages WHERE lead_id = l.id AND organization_id = $1), l.last_message_at, l.created_at) as "lastMessageAt",
        l.ai_paused as "aiPaused",
        l.unread_count as "unreadCount",
        l.estimated_value as "estimatedValue",
        l.created_at as "createdAt"
      FROM public.leads l
      WHERE l.organization_id = $1
      ORDER BY COALESCE((SELECT MAX(created_at) FROM public.chat_messages WHERE lead_id = l.id AND organization_id = $1), l.last_message_at, l.created_at) ASC, l.created_at ASC, l.id ASC;
    `, [orgId]);

    const messagesRes = await query(
      `SELECT
         cm.id,
         cm.lead_id as "leadId",
         cm.sender,
         cm.content,
         to_char(cm.created_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') as timestamp,
         cm.status,
         COALESCE(cm.message_type, 'text') as type
       FROM public.chat_messages cm
       JOIN public.leads l ON l.id = cm.lead_id AND l.organization_id = cm.organization_id
       WHERE cm.organization_id = $1
       ORDER BY cm.created_at ASC;`,
      [orgId]
    );

    const leads: Lead[] = leadsRes.rows.map((r: LeadQueryRow) => ({
      id: r.id,
      orgId: String(r.orgId),
      name: r.name,
      phone: r.phone,
      whatsapp: r.whatsapp || undefined,
      email: r.email || undefined,
      avatar: r.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces`,
      status: r.status as LeadStatus,
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
    for (const msg of messagesRes.rows as MessageQueryRow[]) {
      if (!messagesMap[msg.leadId]) {
        messagesMap[msg.leadId] = [];
      }
      messagesMap[msg.leadId].push({
        id: msg.id,
        leadId: msg.leadId,
        sender: msg.sender as ChatMessage['sender'],
        content: msg.content,
        timestamp: msg.timestamp || 'Agora',
        status: (msg.status as ChatMessage['status']) || 'delivered',
        type: (msg.type as ChatMessage['type']) || 'text',
      });
    }

    return NextResponse.json({
      success: true,
      leads,
      messages: messagesMap,
    });
  } catch (error: unknown) {
    console.error('[Leads API] Erro ao buscar leads:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const body = await req.json();
    const { lead, syncAll, message } = body;
    const requestedOrgId = body.orgId || lead?.orgId || message?.orgId || syncAll?.[0]?.orgId || null;
    const orgId = await resolveOrganizationId(user, requestedOrgId);
    if (!orgId) {
      return NextResponse.json({ error: 'Workspace não encontrado ou sem acesso.' }, { status: 403 });
    }

    // Gravar mensagem avulsa de chat (ex: abordagem inicial no WhatsApp ou resposta no Live Chat)
    if (message && message.leadId && message.content) {
      const leadRes = await query(
        'SELECT phone, whatsapp FROM public.leads WHERE id = $1::uuid AND organization_id = $2 LIMIT 1;',
        [message.leadId, orgId]
      );
      if (!leadRes.rows[0]) {
        return NextResponse.json({ error: 'Lead não encontrado neste workspace.' }, { status: 404 });
      }

      const msgRes = await query(
        `INSERT INTO chat_messages (
           organization_id, lead_id, sender, content, message_type, status, created_at
         ) VALUES ($1, $2::uuid, $3, $4, $5, 'delivered', NOW())
         RETURNING id;`,
        [orgId, message.leadId, message.sender || 'human', message.content, message.type || 'text']
      );

      // Também sincroniza a última mensagem do lead e avança de 'novo' para 'em_atendimento'
      await query(
        `UPDATE leads 
         SET last_message = $1, 
             last_message_at = NOW(), 
             status = CASE WHEN status = 'novo' THEN 'em_atendimento' ELSE status END,
             updated_at = NOW() 
         WHERE id = $2::uuid AND organization_id = $3;`,
        [message.content, message.leadId, orgId]
      );

      // Tentar entregar via WhatsApp (Evolution API) se for mensagem de atendente humano
      if ((message.sender === 'human' || !message.sender) && message.leadId) {
        try {
          const phone = leadRes.rows[0]?.whatsapp || leadRes.rows[0]?.phone;
          if (phone) {
            await notificationService.sendWhatsAppText(phone, message.content);
          }
        } catch (err: unknown) {
          console.error(
            '[API Leads] Erro ao disparar mensagem WhatsApp do atendente humano:',
            err instanceof Error ? err.message : err
          );
        }
      }

      return NextResponse.json({ success: true, messageId: msgRes.rows[0]?.id });
    }

    // Suporte para sincronização em lote (ex: leads minerados do prospector)
    if (syncAll && Array.isArray(syncAll)) {
      const existingIds = syncAll.map((item: Lead) => item.id).filter(isUuid);
      if (existingIds.length > 0) {
        const foreignLeads = await query(
          `SELECT id FROM public.leads
           WHERE id = ANY($1::uuid[]) AND organization_id <> $2
           LIMIT 1;`,
          [existingIds, orgId]
        );
        if (foreignLeads.rows.length > 0) {
          return NextResponse.json({ error: 'Um ou mais leads pertencem a outro workspace.' }, { status: 403 });
        }
      }

      for (const item of syncAll) {
        await query(
          `INSERT INTO leads (
             id, organization_id, name, phone, whatsapp, email, status, tags, service_interest, last_message, unread_count, estimated_value, created_at, updated_at
           ) VALUES (
             COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
           )
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             phone = EXCLUDED.phone,
             whatsapp = COALESCE(EXCLUDED.whatsapp, leads.whatsapp),
             email = EXCLUDED.email,
             status = EXCLUDED.status,
             tags = EXCLUDED.tags,
             service_interest = EXCLUDED.service_interest,
             last_message = EXCLUDED.last_message,
             estimated_value = EXCLUDED.estimated_value,
             updated_at = NOW()
           WHERE leads.organization_id = EXCLUDED.organization_id;`,
          [
            isUuid(item.id) ? item.id : null,
            orgId,
            item.name,
            item.phone,
            item.whatsapp || null,
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

    const leadId = isUuid(lead.id) ? lead.id : null;
    if (leadId) {
      const existingLead = await query('SELECT organization_id FROM public.leads WHERE id = $1::uuid LIMIT 1;', [leadId]);
      if (existingLead.rows[0] && String(existingLead.rows[0].organization_id) !== orgId) {
        return NextResponse.json({ error: 'Lead pertence a outro workspace.' }, { status: 403 });
      }
    }

    const res = await query(
      `INSERT INTO leads (
         id, organization_id, name, phone, whatsapp, email, status, tags, service_interest, last_message, unread_count, estimated_value, created_at, updated_at
       ) VALUES (
         COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
       )
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         whatsapp = EXCLUDED.whatsapp,
         email = EXCLUDED.email,
         status = EXCLUDED.status,
         tags = EXCLUDED.tags,
         service_interest = EXCLUDED.service_interest,
         last_message = EXCLUDED.last_message,
         estimated_value = EXCLUDED.estimated_value,
         updated_at = NOW()
       WHERE leads.organization_id = EXCLUDED.organization_id
       RETURNING id;`,
      [
        leadId,
        orgId,
        lead.name,
        lead.phone,
        lead.whatsapp || null,
        lead.email || null,
        lead.status || 'novo',
        lead.tags || [],
        lead.serviceInterest || '',
        lead.lastMessage || '',
        lead.unreadCount || 0,
        lead.estimatedValue || 0,
      ]
    );

    if (!res.rows[0]) {
      return NextResponse.json({ error: 'Lead pertence a outro workspace.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, leadId: res.rows[0]?.id });
  } catch (error: unknown) {
    console.error('[Leads API] Erro ao salvar lead:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const orgId = await resolveOrganizationId(user, searchParams.get('orgId'));
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    if (!orgId) {
      return NextResponse.json({ error: 'Workspace não encontrado ou sem acesso.' }, { status: 403 });
    }

    const deleted = await query('DELETE FROM public.leads WHERE id = $1::uuid AND organization_id = $2 RETURNING id;', [id, orgId]);
    if (deleted.rows.length === 0) {
      return NextResponse.json({ error: 'Lead não encontrado neste workspace.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[Leads API] Erro ao deletar lead:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 });
  }
}
