import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAgendaTables } from '@/lib/agenda-db';

async function resolveOrganizationId(rawOrgId: string | null) {
  if (!rawOrgId) {
    const orgRes = await query('SELECT id FROM organizations LIMIT 1;');
    return orgRes.rows[0]?.id;
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawOrgId)) {
    return rawOrgId;
  }
  const orgRes = await query(
    'SELECT id FROM organizations WHERE slug = $1 OR id::text = $1 LIMIT 1;',
    [rawOrgId]
  );
  return orgRes.rows[0]?.id;
}

export async function GET(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const { searchParams } = new URL(req.url);
    const rawOrgId = searchParams.get('orgId') || searchParams.get('org_id');
    const orgId = await resolveOrganizationId(rawOrgId);

    if (!orgId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    const clientsRes = await query(
      `SELECT 
         l.id, l.name, l.phone, l.email, l.status,
         l.created_at,
         COUNT(a.id) as total_appointments
       FROM leads l
       LEFT JOIN appointments a ON a.lead_id = l.id
       WHERE l.organization_id = $1
       GROUP BY l.id, l.name, l.phone, l.email, l.status, l.created_at
       ORDER BY l.created_at DESC;`,
      [orgId]
    );

    return NextResponse.json({ success: true, clients: clientsRes.rows });
  } catch (error: any) {
    console.error('[Agenda Clients GET] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const body = await req.json();
    const { id, organizationId, name, phone = '', email = '' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'O nome do cliente é obrigatório' }, { status: 400 });
    }

    const orgId = await resolveOrganizationId(organizationId);
    if (!orgId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      // Atualizar cliente / lead existente
      const updateRes = await query(
        `UPDATE leads
         SET name = $1,
             phone = $2,
             whatsapp = COALESCE(NULLIF($2, ''), whatsapp),
             email = $3,
             updated_at = NOW()
         WHERE id = $4 AND organization_id = $5
         RETURNING id, name, phone, email;`,
        [cleanName, cleanPhone, cleanEmail, id, orgId]
      );

      if (updateRes.rows.length === 0) {
        return NextResponse.json({ error: 'Cliente não encontrado neste workspace' }, { status: 404 });
      }

      return NextResponse.json({ success: true, client: updateRes.rows[0] });
    } else {
      // Criar novo cliente / lead
      const insertRes = await query(
        `INSERT INTO leads (
           organization_id, name, phone, whatsapp, email, status, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $3, $4, 'cliente', NOW(), NOW()
         )
         RETURNING id, name, phone, email;`,
        [orgId, cleanName, cleanPhone, cleanEmail]
      );

      return NextResponse.json({ success: true, client: insertRes.rows[0] });
    }
  } catch (error: any) {
    console.error('[Agenda Clients POST] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const rawOrgId = searchParams.get('orgId') || searchParams.get('org_id');
    const orgId = await resolveOrganizationId(rawOrgId);

    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'ID do cliente inválido ou obrigatório' }, { status: 400 });
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    // Deletar mensagens e agendamentos relacionados preventivamente caso cascata não esteja configurada
    try {
      await query('DELETE FROM appointments WHERE lead_id = $1::uuid;', [id]);
    } catch (_) {}

    try {
      await query('DELETE FROM chat_messages WHERE lead_id = $1::uuid;', [id]);
    } catch (_) {}

    const deleteRes = await query(
      'DELETE FROM leads WHERE id = $1::uuid AND organization_id = $2 RETURNING id;',
      [id, orgId]
    );

    if (deleteRes.rows.length === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado neste workspace' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('[Agenda Clients DELETE] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
