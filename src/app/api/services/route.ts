import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { initialServices } from '@/lib/mockData';

async function resolveOrganizationId(rawOrgId: string | null) {
  if (!rawOrgId || rawOrgId === 'org-alllogic') {
    const orgRes = await query("SELECT id FROM organizations WHERE slug = 'alllogic' OR id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;");
    return orgRes.rows[0]?.id || 'a0000000-0000-0000-0000-000000000001';
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawOrgId)) {
    return rawOrgId;
  }
  const orgRes = await query(
    'SELECT id FROM organizations WHERE slug = $1 OR id::text = $1 LIMIT 1;',
    [rawOrgId]
  );
  return orgRes.rows[0]?.id || 'a0000000-0000-0000-0000-000000000001';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawOrgId = searchParams.get('orgId') || searchParams.get('org_id') || searchParams.get('organizationId');
    const orgId = await resolveOrganizationId(rawOrgId);

    // Se for o workspace administrativo AllLogic, garantir serviços padrão do catálogo oficial
    if (orgId === 'a0000000-0000-0000-0000-000000000001') {
      for (const srv of initialServices) {
        await query(
          `INSERT INTO services (
             organization_id, name, price, duration_minutes, description, is_active, created_at
           )
           SELECT $1, $2, $3, $4, $5, true, NOW()
           WHERE NOT EXISTS (
             SELECT 1 FROM services WHERE organization_id = $1 AND name = $2 AND is_active = true
           );`,
          [orgId, srv.name, srv.price, srv.durationMinutes, srv.description]
        );
      }
    }

    const servicesRes = await query(
      `SELECT 
         id,
         organization_id as "orgId",
         name,
         price::float as price,
         COALESCE(duration_minutes, 30) as "durationMinutes",
         COALESCE(description, '') as description,
         is_active as "isActive"
       FROM services
       WHERE organization_id = $1 AND is_active = true
       ORDER BY created_at ASC;`,
      [orgId]
    );

    return NextResponse.json({
      success: true,
      services: servicesRes.rows.map((s: any) => ({
        ...s,
        orgId: s.orgId || orgId,
      })),
    });
  } catch (error: any) {
    console.error('[Services API] Erro ao buscar serviços:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, price, durationMinutes = 30, description = '', orgId: rawOrgId, organizationId } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'O nome do serviço é obrigatório' }, { status: 400 });
    }

    const orgId = await resolveOrganizationId(organizationId || rawOrgId);

    const numPrice = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const numDuration = parseInt(String(durationMinutes), 10) || 30;

    let res;
    if (id && id.length === 36 && id.includes('-')) {
      // Atualizar serviço existente
      res = await query(
        `UPDATE services
         SET name = $1,
             price = $2,
             duration_minutes = $3,
             description = $4
         WHERE id = $5 AND organization_id = $6
         RETURNING id;`,
        [name.trim(), numPrice, numDuration, description.trim(), id, orgId]
      );
    } else {
      // Criar novo serviço vinculado à organização ativa
      res = await query(
        `INSERT INTO services (
           organization_id, name, price, duration_minutes, description, is_active, created_at
         ) VALUES ($1, $2, $3, $4, $5, true, NOW())
         RETURNING id;`,
        [orgId, name.trim(), numPrice, numDuration, description.trim()]
      );
    }

    return NextResponse.json({
      success: true,
      serviceId: res.rows[0]?.id,
    });
  } catch (error: any) {
    console.error('[Services API] Erro ao salvar serviço:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const rawOrgId = searchParams.get('orgId') || searchParams.get('org_id') || searchParams.get('organizationId');
    const orgId = await resolveOrganizationId(rawOrgId);

    if (!id) {
      return NextResponse.json({ error: 'ID do serviço é obrigatório' }, { status: 400 });
    }

    await query(
      'UPDATE services SET is_active = false WHERE id = $1::uuid AND ($2::uuid IS NULL OR organization_id = $2::uuid);',
      [id, orgId]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Services API] Erro ao desativar serviço:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
