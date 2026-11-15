import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAgendaTables } from '@/lib/agenda-db';
import { syncProfessionalToScheduler } from '@/lib/scheduler-sync';

export async function POST(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const body = await req.json();
    const {
      id,
      organizationId,
      name,
      specialty = 'Especialista',
      phone = '',
      email = '',
      serviceCommissionPct = 0,
      productCommissionPct = 0,
      availability = [],
      serviceIds = [],
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'O nome do profissional é obrigatório' }, { status: 400 });
    }

    // Resolver orgId
    let orgId = organizationId;
    if (!orgId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId)) {
      const orgRes = await query('SELECT id FROM organizations LIMIT 1;');
      orgId = orgRes.rows[0]?.id;
    }

    const sCommission = parseFloat(String(serviceCommissionPct)) || 0;
    const pCommission = parseFloat(String(productCommissionPct)) || 0;

    let profId = id;
    if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      // Atualizar existente
      await query(
        `UPDATE professionals
         SET name = $1, specialty = $2, phone = $3, email = $4,
             service_commission_pct = $5, product_commission_pct = $6
         WHERE id = $7 AND organization_id = $8;`,
        [name.trim(), specialty.trim(), phone.trim(), email.trim(), sCommission, pCommission, id, orgId]
      );
    } else {
      // Criar novo profissional
      const insRes = await query(
        `INSERT INTO professionals (
           organization_id, name, specialty, phone, email,
           service_commission_pct, product_commission_pct, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         RETURNING id;`,
        [orgId, name.trim(), specialty.trim(), phone.trim(), email.trim(), sCommission, pCommission]
      );
      profId = insRes.rows[0]?.id;
    }

    // Salvar disponibilidade semanal se enviada
    if (availability && Array.isArray(availability) && availability.length > 0 && profId) {
      for (const item of availability) {
        const day = parseInt(String(item.day_of_week), 10);
        const start = item.start_time || '09:00';
        const end = item.end_time || '19:00';
        const breakStart = item.break_start || '12:00';
        const breakEnd = item.break_end || '13:00';
        const isActive = item.is_active !== false;

        await query(
          `INSERT INTO professional_availability (
             professional_id, day_of_week, start_time, end_time, break_start, break_end, is_active
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (professional_id, day_of_week)
           DO UPDATE SET start_time = EXCLUDED.start_time,
                         end_time = EXCLUDED.end_time,
                         break_start = EXCLUDED.break_start,
                         break_end = EXCLUDED.break_end,
                         is_active = EXCLUDED.is_active;`,
          [profId, day, start, end, breakStart, breakEnd, isActive]
        );
      }
    }

    // 1. Atualizar serviços vinculados (professional_services)
    if (profId) {
      await query('DELETE FROM professional_services WHERE professional_id = $1::uuid;', [profId]);
      if (Array.isArray(serviceIds) && serviceIds.length > 0) {
        for (const srvId of serviceIds) {
          if (srvId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(srvId)) {
            await query(
              `INSERT INTO professional_services (professional_id, service_id)
               VALUES ($1::uuid, $2::uuid)
               ON CONFLICT DO NOTHING;`,
              [profId, srvId]
            );
          }
        }
      }
    }

    // 2. Buscar nomes dos serviços vinculados para sincronizar com alllogic_scheduler
    let serviceNames: string[] | undefined = undefined;
    if (Array.isArray(serviceIds)) {
      if (serviceIds.length > 0) {
        const sRes = await query(
          'SELECT name FROM services WHERE id = ANY($1::uuid[]);',
          [serviceIds]
        );
        serviceNames = sRes.rows.map((r: any) => r.name);
      } else {
        serviceNames = [];
      }
    }

    // Sincronizar automaticamente com a agenda pública (alllogic_scheduler)
    try {
      const orgSlugRes = await query('SELECT slug FROM organizations WHERE id = $1 LIMIT 1;', [orgId]);
      const orgSlug = orgSlugRes.rows[0]?.slug;
      if (orgSlug) {
        await syncProfessionalToScheduler(orgSlug, {
          name: name.trim(),
          specialty: specialty.trim(),
          phone: phone.trim(),
          email: email.trim(),
          isActive: true,
          serviceNames,
        });
      }
    } catch (syncErr) {
      console.warn('[Professionals API] Falha na sincronização com scheduler:', syncErr);
    }

    return NextResponse.json({ success: true, professionalId: profId });
  } catch (error: any) {
    console.error('[Agenda Professionals API] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID do profissional obrigatório' }, { status: 400 });
    }

    await query('UPDATE professionals SET is_active = false WHERE id = $1::uuid;', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Agenda Professionals DELETE] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
