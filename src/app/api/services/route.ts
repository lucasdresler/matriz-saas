import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { initialServices } from '@/lib/mockData';

export async function GET(req: NextRequest) {
  try {
    const orgRes = await query('SELECT id FROM organizations LIMIT 1;');
    const orgId = orgRes.rows[0]?.id || 'a0000000-0000-0000-0000-000000000001';

    let servicesRes = await query(
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

    // Se o banco ainda não tiver serviços cadastrados, popular com os serviços padrão da AllLogic
    if (servicesRes.rows.length === 0) {
      for (const srv of initialServices) {
        await query(
          `INSERT INTO services (
             organization_id, name, price, duration_minutes, description, is_active, created_at
           ) VALUES ($1, $2, $3, $4, $5, true, NOW());`,
          [orgId, srv.name, srv.price, srv.durationMinutes, srv.description]
        );
      }

      servicesRes = await query(
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
    }

    return NextResponse.json({
      success: true,
      services: servicesRes.rows.map((s: any) => ({
        ...s,
        orgId: 'org-alllogic',
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
    const { id, name, price, durationMinutes = 30, description = '' } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'O nome do serviço é obrigatório' }, { status: 400 });
    }

    const orgRes = await query('SELECT id FROM organizations LIMIT 1;');
    const orgId = orgRes.rows[0]?.id || 'a0000000-0000-0000-0000-000000000001';

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
      // Criar novo serviço
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

    if (!id) {
      return NextResponse.json({ error: 'ID do serviço é obrigatório' }, { status: 400 });
    }

    await query('UPDATE services SET is_active = false WHERE id = $1::uuid;', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Services API] Erro ao desativar serviço:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
