import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAgendaTables } from '@/lib/agenda-db';
import { syncPackageToScheduler } from '@/lib/scheduler-sync';

export async function POST(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const body = await req.json();
    const {
      id,
      organizationId,
      name,
      description = '',
      price,
      validityDays = 30,
      sessionsCount = 4,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'O nome do pacote é obrigatório' }, { status: 400 });
    }

    let orgId = organizationId;
    if (!orgId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId)) {
      const orgRes = await query('SELECT id FROM organizations LIMIT 1;');
      orgId = orgRes.rows[0]?.id;
    }

    const numPrice = parseFloat(String(price)) || 0;
    const numDays = parseInt(String(validityDays), 10) || 30;
    const numSessions = parseInt(String(sessionsCount), 10) || 4;

    let pkgId = id;
    if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      await query(
        `UPDATE service_packages
         SET name = $1, description = $2, price = $3,
             validity_days = $4, sessions_count = $5
         WHERE id = $6 AND organization_id = $7;`,
        [name.trim(), description.trim(), numPrice, numDays, numSessions, id, orgId]
      );
    } else {
      const insRes = await query(
        `INSERT INTO service_packages (
           organization_id, name, description, price, validity_days, sessions_count, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id;`,
        [orgId, name.trim(), description.trim(), numPrice, numDays, numSessions]
      );
      pkgId = insRes.rows[0]?.id;
    }

    // Sincronizar automaticamente com a agenda pública (alllogic_scheduler)
    try {
      const orgSlugRes = await query('SELECT slug FROM organizations WHERE id = $1 LIMIT 1;', [orgId]);
      const orgSlug = orgSlugRes.rows[0]?.slug;
      if (orgSlug) {
        await syncPackageToScheduler(orgSlug, {
          name: name.trim(),
          description: description.trim(),
          price: numPrice,
          sessionsCount: numSessions,
          validityDays: numDays,
          isActive: true,
        });
      }
    } catch (syncErr) {
      console.warn('[Packages API] Falha na sincronização com scheduler:', syncErr);
    }

    return NextResponse.json({ success: true, packageId: pkgId });
  } catch (error: any) {
    console.error('[Agenda Packages API] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID do pacote obrigatório' }, { status: 400 });
    }

    await query('UPDATE service_packages SET is_active = false WHERE id = $1::uuid;', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Agenda Packages DELETE] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
