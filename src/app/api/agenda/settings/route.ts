import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAgendaTables } from '@/lib/agenda-db';
import { syncOrganizationToScheduler } from '@/lib/scheduler-sync';

export async function POST(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const body = await req.json();
    const {
      organizationId,
      name,
      responsibleName = '',
      tradeName = '',
      corporateName = '',
      cnpjCpf = '',
      street = '',
      number = '',
      complement = '',
      neighborhood = '',
      address = '',
      city = '',
      state = '',
      zipCode = '',
      phone = '',
      whatsappPhone = '',
      businessEmail = '',
      instagram = '',
      brandColor = '#2563EB',
      secondaryColor = '#E5C78B',
      bgColor = '#F6F1E8',
      logoUrl = '',
      bannerUrl = '',
      bio = '',
      openingTime = '09:00',
      closingTime = '19:00',
      workDays = '1,2,3,4,5,6',
      slotIntervalMinutes = 30,
      maxAdvanceDays = 30,
      minCancelHours = 2,
      requirePixDeposit = false,
      pixModel = 'sinal',
      pixDepositAmount = 0,
      pixDepositPercent = 0,
      pixKeyType = 'cpf_cnpj',
      pixKey = '',
    } = body;

    let orgId = organizationId;
    if (!orgId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId)) {
      const orgRes = await query('SELECT id, slug, name FROM organizations LIMIT 1;');
      orgId = orgRes.rows[0]?.id;
    }

    const slotInterval = parseInt(String(slotIntervalMinutes), 10) || 30;
    const maxDays = parseInt(String(maxAdvanceDays), 10) || 30;
    const minHours = parseInt(String(minCancelHours), 10) || 2;
    const reqPix = requirePixDeposit === true || requirePixDeposit === 'true';
    const pixAmount = parseFloat(String(pixDepositAmount)) || 0;
    const pixPct = parseFloat(String(pixDepositPercent)) || 0;

    // Montar endereco textual padrao se rua e numero existirem
    let fullAddress = address.trim();
    if (!fullAddress && (street || city)) {
      const parts: string[] = [];
      if (street) parts.push(number ? `${street.trim()}, ${number.trim()}` : street.trim());
      if (complement) parts.push(complement.trim());
      if (neighborhood) parts.push(neighborhood.trim());
      if (city || state) parts.push(city && state ? `${city.trim()} - ${state.trim()}` : (city || state || '').trim());
      if (zipCode) parts.push(`CEP ${zipCode.trim()}`);
      fullAddress = parts.join(' - ');
    }

    await query(
      `UPDATE organizations
       SET name = COALESCE(NULLIF($1, ''), name),
           responsible_name = $2,
           trade_name = $3,
           corporate_name = $4,
           cnpj_cpf = $5,
           street = $6,
           number = $7,
           complement = $8,
           neighborhood = $9,
           address = $10,
           city = $11,
           state = $12,
           zip_code = $13,
           phone = $14,
           whatsapp_phone = $15,
           business_email = $16,
           instagram = $17,
           brand_color = $18,
           secondary_color = $19,
           bg_color = $20,
           logo_url = $21,
           banner_url = $22,
           bio = $23,
           opening_time = $24,
           closing_time = $25,
           work_days = $26,
           slot_interval_minutes = $27,
           max_advance_days = $28,
           min_cancel_hours = $29,
           require_pix_deposit = $30,
           pix_model = $31,
           pix_deposit_amount = $32,
           pix_deposit_percent = $33,
           pix_key_type = $34,
           pix_key = $35
       WHERE id = $36;`,
      [
        name ? name.trim() : null,
        responsibleName.trim(),
        tradeName.trim(),
        corporateName.trim(),
        cnpjCpf.trim(),
        street.trim(),
        number.trim(),
        complement.trim(),
        neighborhood.trim(),
        fullAddress,
        city.trim(),
        state.trim(),
        zipCode.trim(),
        phone.trim(),
        whatsappPhone.trim(),
        businessEmail.trim(),
        instagram.trim(),
        brandColor.trim() || '#2563EB',
        secondaryColor.trim() || '#E5C78B',
        bgColor.trim() || '#F6F1E8',
        logoUrl.trim(),
        bannerUrl.trim(),
        bio.trim(),
        openingTime.trim() || '09:00',
        closingTime.trim() || '19:00',
        workDays.trim() || '1,2,3,4,5,6',
        slotInterval,
        maxDays,
        minHours,
        reqPix,
        pixModel.trim() || 'sinal',
        pixAmount,
        pixPct,
        pixKeyType.trim() || 'cpf_cnpj',
        pixKey.trim(),
        orgId,
      ]
    );

    // Sincronizar com alllogic_scheduler (estabelecimento)
    try {
      const orgSlugRes = await query('SELECT slug FROM organizations WHERE id = $1 LIMIT 1;', [orgId]);
      const orgSlug = orgSlugRes.rows[0]?.slug;
      if (orgSlug) {
        await syncOrganizationToScheduler(orgSlug, {
          name,
          responsibleName,
          tradeName,
          corporateName,
          cnpjCpf,
          phone,
          whatsappPhone,
          businessEmail,
          instagram,
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          zipCode,
          address: fullAddress,
          logoUrl,
          bannerUrl,
          bio,
          brandColor,
          secondaryColor,
          bgColor,
          openingTime,
          closingTime,
          workDays,
          slotIntervalMinutes: slotInterval,
          maxAdvanceDays: maxDays,
          requirePixDeposit: reqPix,
          pixModel,
          pixDepositAmount: pixAmount,
          pixKeyType,
          pixKey,
        });
      }
    } catch (syncErr) {
      console.warn('[Agenda Settings API] Falha na sincronização com scheduler:', syncErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Agenda Settings API] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
