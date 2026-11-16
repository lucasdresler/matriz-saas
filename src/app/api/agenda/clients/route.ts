import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAgendaTables } from '@/lib/agenda-db';
import { getSchedulerPool } from '@/lib/scheduler-sync';

async function resolveOrganization(rawOrgId: string | null) {
  if (!rawOrgId || rawOrgId === 'org-alllogic') {
    const orgRes = await query("SELECT id, slug, name FROM organizations WHERE slug = 'alllogic' OR id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;");
    if (orgRes.rows[0]) return orgRes.rows[0];
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawOrgId || '')) {
    const orgRes = await query('SELECT id, slug, name FROM organizations WHERE id = $1 LIMIT 1;', [rawOrgId]);
    if (orgRes.rows[0]) return orgRes.rows[0];
  }
  const orgRes = await query(
    'SELECT id, slug, name FROM organizations WHERE slug = $1 OR id::text = $1 LIMIT 1;',
    [rawOrgId]
  );
  return orgRes.rows[0] || null;
}

export async function GET(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const { searchParams } = new URL(req.url);
    const rawOrgId = searchParams.get('orgId') || searchParams.get('org_id');
    const org = await resolveOrganization(rawOrgId);

    if (!org) {
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
      [org.id]
    );

    const clients = [...clientsRes.rows];

    // Mesclar clientes da base scheduler
    try {
      if (org.slug) {
        const pool = getSchedulerPool();
        const estRes = await pool.query('SELECT id FROM estabelecimento WHERE slug = $1 LIMIT 1;', [org.slug]);
        const estId = estRes.rows[0]?.id;
        if (estId) {
          const cliRes = await pool.query(
            `SELECT 
               c.id::text as id,
               c.nome as name,
               c.telefone as phone,
               COALESCE(c.email, '') as email,
               'ativo' as status,
               c.criado_em as created_at,
               COUNT(a.id) as total_appointments
             FROM cliente c
             LEFT JOIN agendamento a ON a.cliente_id = c.id
             WHERE c.estabelecimento_id = $1
             GROUP BY c.id, c.nome, c.telefone, c.email, c.criado_em
             ORDER BY c.criado_em DESC;`,
            [estId]
          );

          const existingPhones = new Set(clients.map((cl: any) => (cl.phone || '').replace(/\D/g, '')));
          for (const sCli of cliRes.rows) {
            const cleanPhone = (sCli.phone || '').replace(/\D/g, '');
            if (!cleanPhone || !existingPhones.has(cleanPhone)) {
              clients.push(sCli);
              if (cleanPhone) existingPhones.add(cleanPhone);
            }
          }
        }
      }
    } catch (schedErr) {
      console.warn('[Agenda Clients GET] Aviso ao buscar scheduler:', schedErr);
    }

    return NextResponse.json({ success: true, clients });
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

    const org = await resolveOrganization(organizationId);
    if (!org) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const isNumericId = /^\d+$/.test(String(id || '').trim());
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || '').trim());

    if (isNumericId) {
      try {
        const pool = getSchedulerPool();
        const estRes = await pool.query('SELECT id FROM estabelecimento WHERE slug = $1 LIMIT 1;', [org.slug]);
        const estId = estRes.rows[0]?.id;
        if (estId) {
          await pool.query(
            `UPDATE cliente
             SET nome = $1, telefone = $2, email = $3
             WHERE id = $4 AND estabelecimento_id = $5;`,
            [cleanName, cleanPhone, cleanEmail, parseInt(id, 10), estId]
          );
        }
      } catch (err: any) {
        console.warn('[Agenda Clients POST] Falha ao atualizar scheduler:', err?.message || err);
      }
      return NextResponse.json({ success: true, client: { id, name: cleanName, phone: cleanPhone, email: cleanEmail } });
    } else if (isUuid) {
      const updateRes = await query(
        `UPDATE leads
         SET name = $1,
             phone = $2,
             whatsapp = COALESCE(NULLIF($2, ''), whatsapp),
             email = $3,
             updated_at = NOW()
         WHERE id = $4 AND organization_id = $5
         RETURNING id, name, phone, email;`,
        [cleanName, cleanPhone, cleanEmail, id, org.id]
      );

      if (updateRes.rows.length === 0) {
        return NextResponse.json({ error: 'Cliente não encontrado neste workspace' }, { status: 404 });
      }

      return NextResponse.json({ success: true, client: updateRes.rows[0] });
    } else {
      // Criar novo cliente / lead em matriz_db
      const insertRes = await query(
        `INSERT INTO leads (
           organization_id, name, phone, whatsapp, email, status, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $3, $4, 'cliente', NOW(), NOW()
         )
         RETURNING id, name, phone, email;`,
        [org.id, cleanName, cleanPhone, cleanEmail]
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
    const id = (searchParams.get('id') || '').trim();
    const rawOrgId = searchParams.get('orgId') || searchParams.get('org_id');
    const org = await resolveOrganization(rawOrgId);

    if (!id) {
      return NextResponse.json({ error: 'ID do cliente inválido ou obrigatório' }, { status: 400 });
    }

    if (!org) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    const isNumericId = /^\d+$/.test(id);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let clientPhone = '';
    let clientEmail = '';

    // 1. Se for UUID (matriz_db.leads)
    if (isUuid) {
      const leadRes = await query(
        'SELECT phone, email FROM leads WHERE id = $1::uuid AND organization_id = $2 LIMIT 1;',
        [id, org.id]
      );
      if (leadRes.rows[0]) {
        clientPhone = leadRes.rows[0].phone || '';
        clientEmail = leadRes.rows[0].email || '';
      }

      try {
        await query('DELETE FROM appointments WHERE lead_id = $1::uuid;', [id]);
      } catch (_) {}

      try {
        await query('DELETE FROM chat_messages WHERE lead_id = $1::uuid;', [id]);
      } catch (_) {}

      await query(
        'DELETE FROM leads WHERE id = $1::uuid AND organization_id = $2;',
        [id, org.id]
      );
    }

    // 2. Se for ID numérico (alllogic_scheduler.cliente) ou tivermos o telefone
    try {
      const schedulerPool = getSchedulerPool();
      const estRes = await schedulerPool.query(
        'SELECT id FROM estabelecimento WHERE slug = $1 LIMIT 1;',
        [org.slug]
      );
      const estId = estRes.rows[0]?.id;

      if (estId) {
        if (isNumericId) {
          const cliRes = await schedulerPool.query(
            'SELECT telefone, email FROM cliente WHERE id = $1 AND estabelecimento_id = $2 LIMIT 1;',
            [parseInt(id, 10), estId]
          );
          if (cliRes.rows[0]) {
            clientPhone = cliRes.rows[0].telefone || clientPhone;
            clientEmail = cliRes.rows[0].email || clientEmail;
          }

          // Remover agendamentos vinculados ao cliente no scheduler
          await schedulerPool.query(
            `DELETE FROM agendamento_servico 
             WHERE agendamento_id IN (
               SELECT id FROM agendamento WHERE (cliente_id = $1 OR cliente_telefone = $2) AND estabelecimento_id = $3
             );`,
            [parseInt(id, 10), clientPhone, estId]
          );

          await schedulerPool.query(
            'DELETE FROM agendamento WHERE (cliente_id = $1 OR cliente_telefone = $2) AND estabelecimento_id = $3;',
            [parseInt(id, 10), clientPhone, estId]
          );

          await schedulerPool.query(
            'DELETE FROM cliente WHERE id = $1 AND estabelecimento_id = $2;',
            [parseInt(id, 10), estId]
          );
        } else if (clientPhone) {
          // Se for UUID mas identificamos o telefone, limpar também do scheduler
          await schedulerPool.query(
            `DELETE FROM agendamento_servico 
             WHERE agendamento_id IN (
               SELECT id FROM agendamento WHERE cliente_telefone = $1 AND estabelecimento_id = $2
             );`,
            [clientPhone, estId]
          );

          await schedulerPool.query(
            'DELETE FROM agendamento WHERE cliente_telefone = $1 AND estabelecimento_id = $2;',
            [clientPhone, estId]
          );

          await schedulerPool.query(
            'DELETE FROM cliente WHERE telefone = $1 AND estabelecimento_id = $2;',
            [clientPhone, estId]
          );
        }
      }
    } catch (schedErr: any) {
      console.warn('[Agenda Clients DELETE] Falha ao excluir no scheduler:', schedErr?.message || schedErr);
    }

    // 3. Se for ID numérico e tivermos o telefone, remover também de matriz_db.leads
    if (isNumericId && clientPhone) {
      try {
        const cleanPhone = clientPhone.replace(/\D/g, '');
        const matchingLeads = await query(
          `SELECT id FROM leads 
           WHERE organization_id = $1 
             AND (phone = $2 OR regexp_replace(phone, '\\D', '', 'g') = $3);`,
          [org.id, clientPhone, cleanPhone]
        );
        for (const ml of matchingLeads.rows) {
          await query('DELETE FROM appointments WHERE lead_id = $1::uuid;', [ml.id]);
          await query('DELETE FROM chat_messages WHERE lead_id = $1::uuid;', [ml.id]);
          await query('DELETE FROM leads WHERE id = $1::uuid;', [ml.id]);
        }
      } catch (_) {}
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('[Agenda Clients DELETE] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
