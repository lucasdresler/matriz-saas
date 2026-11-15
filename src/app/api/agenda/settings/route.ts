import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAgendaTables } from '@/lib/agenda-db';

export async function POST(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const body = await req.json();
    const {
      organizationId,
      brandColor = '#2563EB',
      logoUrl = '',
      bannerUrl = '',
      bio = '',
      address = '',
      city = '',
      state = '',
      zipCode = '',
      slotIntervalMinutes = 30,
      maxAdvanceDays = 30,
      minCancelHours = 2,
      requirePixDeposit = false,
      pixDepositAmount = 0,
      pixDepositPercent = 0,
    } = body;

    let orgId = organizationId;
    if (!orgId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId)) {
      const orgRes = await query('SELECT id FROM organizations LIMIT 1;');
      orgId = orgRes.rows[0]?.id;
    }

    const slotInterval = parseInt(String(slotIntervalMinutes), 10) || 30;
    const maxDays = parseInt(String(maxAdvanceDays), 10) || 30;
    const minHours = parseInt(String(minCancelHours), 10) || 2;
    const reqPix = requirePixDeposit === true || requirePixDeposit === 'true';
    const pixAmount = parseFloat(String(pixDepositAmount)) || 0;
    const pixPct = parseFloat(String(pixDepositPercent)) || 0;

    await query(
      `UPDATE organizations
       SET brand_color = $1,
           logo_url = $2,
           banner_url = $3,
           bio = $4,
           address = $5,
           city = $6,
           state = $7,
           zip_code = $8,
           slot_interval_minutes = $9,
           max_advance_days = $10,
           min_cancel_hours = $11,
           require_pix_deposit = $12,
           pix_deposit_amount = $13,
           pix_deposit_percent = $14
       WHERE id = $15;`,
      [
        brandColor.trim(),
        logoUrl.trim(),
        bannerUrl.trim(),
        bio.trim(),
        address.trim(),
        city.trim(),
        state.trim(),
        zipCode.trim(),
        slotInterval,
        maxDays,
        minHours,
        reqPix,
        pixAmount,
        pixPct,
        orgId,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Agenda Settings API] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
