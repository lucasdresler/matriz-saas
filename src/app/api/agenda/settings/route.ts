import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAgendaTables } from '@/lib/agenda-db';
import { syncOrganizationToScheduler } from '@/lib/scheduler-sync';

function cleanStr(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  return String(val).trim();
}

function cleanNum(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
}

function cleanBool(val: any): boolean {
  return val === true || val === 'true' || val === 1 || val === '1';
}

export async function POST(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const body = await req.json();

    let orgId = body.organizationId;
    if (!orgId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId)) {
      const orgRes = await query('SELECT id, slug, name FROM organizations LIMIT 1;');
      orgId = orgRes.rows[0]?.id;
    }

    const cleanName = cleanStr(body.name);
    const cleanResponsible = cleanStr(body.responsibleName);
    const cleanTrade = cleanStr(body.tradeName);
    const cleanCorporate = cleanStr(body.corporateName);
    const cleanCnpj = cleanStr(body.cnpjCpf);
    const cleanCategory = cleanStr(body.category) || 'Salão de Beleza';
    const cleanStreet = cleanStr(body.street);
    const cleanNumber = cleanStr(body.number);
    const cleanComplement = cleanStr(body.complement);
    const cleanNeighborhood = cleanStr(body.neighborhood);
    let cleanAddress = cleanStr(body.address);
    const cleanCity = cleanStr(body.city);
    const cleanState = cleanStr(body.state);
    const cleanZip = cleanStr(body.zipCode);
    const cleanPhone = cleanStr(body.phone);
    const cleanWhatsapp = cleanStr(body.whatsappPhone);
    const cleanEmail = cleanStr(body.businessEmail);
    const cleanInstagram = cleanStr(body.instagram);
    const cleanBrandColor = cleanStr(body.brandColor) || '#2563EB';
    const cleanSecondaryColor = cleanStr(body.secondaryColor) || '#E5C78B';
    const cleanBgColor = cleanStr(body.bgColor) || '#F6F1E8';
    const cleanLogoUrl = cleanStr(body.logoUrl);
    const cleanBannerUrl = cleanStr(body.bannerUrl);
    const cleanBio = cleanStr(body.bio);
    const cleanOpeningTime = cleanStr(body.openingTime) || '09:00';
    const cleanClosingTime = cleanStr(body.closingTime) || '19:00';
    const cleanWorkDays = cleanStr(body.workDays) || '1,2,3,4,5,6';
    const cleanSlotInterval = cleanNum(body.slotIntervalMinutes, 30);
    const cleanMaxDays = cleanNum(body.maxAdvanceDays, 30);
    const cleanMinHours = cleanNum(body.minCancelHours, 2);
    const cleanReqPix = cleanBool(body.requirePixDeposit);
    const cleanPixModel = cleanStr(body.pixModel) || 'sinal';
    const cleanPixAmount = cleanNum(body.pixDepositAmount, 0);
    const cleanPixPct = cleanNum(body.pixDepositPercent, 0);
    const cleanPixKeyType = cleanStr(body.pixKeyType) || 'cpf_cnpj';
    const cleanPixKey = cleanStr(body.pixKey);

    // Montar endereco textual padrao se rua e numero existirem
    if (!cleanAddress && (cleanStreet || cleanCity)) {
      const parts: string[] = [];
      if (cleanStreet) parts.push(cleanNumber ? `${cleanStreet}, ${cleanNumber}` : cleanStreet);
      if (cleanComplement) parts.push(cleanComplement);
      if (cleanNeighborhood) parts.push(cleanNeighborhood);
      if (cleanCity || cleanState) parts.push(cleanCity && cleanState ? `${cleanCity} - ${cleanState}` : (cleanCity || cleanState));
      if (cleanZip) parts.push(`CEP ${cleanZip}`);
      cleanAddress = parts.join(' - ');
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
           pix_key = $35,
           business_segment = $36
       WHERE id = $37;`,
      [
        cleanName || null,
        cleanResponsible,
        cleanTrade,
        cleanCorporate,
        cleanCnpj,
        cleanStreet,
        cleanNumber,
        cleanComplement,
        cleanNeighborhood,
        cleanAddress,
        cleanCity,
        cleanState,
        cleanZip,
        cleanPhone,
        cleanWhatsapp,
        cleanEmail,
        cleanInstagram,
        cleanBrandColor,
        cleanSecondaryColor,
        cleanBgColor,
        cleanLogoUrl,
        cleanBannerUrl,
        cleanBio,
        cleanOpeningTime,
        cleanClosingTime,
        cleanWorkDays,
        cleanSlotInterval,
        cleanMaxDays,
        cleanMinHours,
        cleanReqPix,
        cleanPixModel,
        cleanPixAmount,
        cleanPixPct,
        cleanPixKeyType,
        cleanPixKey,
        cleanCategory,
        orgId,
      ]
    );

    // Sincronizar com alllogic_scheduler (estabelecimento)
    try {
      const orgSlugRes = await query('SELECT slug FROM organizations WHERE id = $1 LIMIT 1;', [orgId]);
      const orgSlug = orgSlugRes.rows[0]?.slug;
      if (orgSlug) {
        await syncOrganizationToScheduler(orgSlug, {
          name: cleanName,
          responsibleName: cleanResponsible,
          tradeName: cleanTrade,
          corporateName: cleanCorporate,
          cnpjCpf: cleanCnpj,
          phone: cleanPhone,
          whatsappPhone: cleanWhatsapp,
          businessEmail: cleanEmail,
          instagram: cleanInstagram,
          street: cleanStreet,
          number: cleanNumber,
          complement: cleanComplement,
          neighborhood: cleanNeighborhood,
          city: cleanCity,
          state: cleanState,
          zipCode: cleanZip,
          address: cleanAddress,
          logoUrl: cleanLogoUrl,
          bannerUrl: cleanBannerUrl,
          bio: cleanBio,
          brandColor: cleanBrandColor,
          secondaryColor: cleanSecondaryColor,
          bgColor: cleanBgColor,
          openingTime: cleanOpeningTime,
          closingTime: cleanClosingTime,
          workDays: cleanWorkDays,
          slotIntervalMinutes: cleanSlotInterval,
          maxAdvanceDays: cleanMaxDays,
          requirePixDeposit: cleanReqPix,
          pixModel: cleanPixModel,
          pixDepositAmount: cleanPixAmount,
          pixKeyType: cleanPixKeyType,
          pixKey: cleanPixKey,
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
