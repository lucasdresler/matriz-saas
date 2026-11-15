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

    // 1. Configurações da organização
    const orgRes = await query(
      `SELECT 
         id, name, slug, brand_color, secondary_color, bg_color, logo_url, banner_url, bio,
         responsible_name, trade_name, corporate_name, cnpj_cpf,
         street, number, complement, neighborhood, address, city, state, zip_code,
         phone, business_email, instagram, whatsapp_phone,
         opening_time, closing_time, work_days,
         slot_interval_minutes, max_advance_days, min_cancel_hours,
         require_pix_deposit, pix_model, pix_deposit_amount, pix_deposit_percent,
         pix_key_type, pix_key, asaas_wallet_id
       FROM organizations
       WHERE id = $1 LIMIT 1;`,
      [orgId]
    );
    const settings = orgRes.rows[0] || {};

    // 2. Profissionais
    const profsRes = await query(
      `SELECT 
         id, name, specialty, phone, email, avatar_url,
         service_commission_pct::float as service_commission_pct,
         product_commission_pct::float as product_commission_pct,
         is_active, created_at
       FROM professionals
       WHERE organization_id = $1 AND is_active = true
       ORDER BY created_at ASC;`,
      [orgId]
    );

    const professionals = profsRes.rows;

    // Buscar disponibilidade e serviços de cada profissional
    const profIds = professionals.map((p: any) => p.id);
    let availability: any[] = [];
    let profServices: any[] = [];
    if (profIds.length > 0) {
      const availRes = await query(
        `SELECT professional_id, day_of_week, start_time, end_time, break_start, break_end, is_active
         FROM professional_availability
         WHERE professional_id = ANY($1::uuid[])
         ORDER BY day_of_week ASC;`,
        [profIds]
      );
      availability = availRes.rows;

      const servRes = await query(
        `SELECT professional_id, service_id
         FROM professional_services
         WHERE professional_id = ANY($1::uuid[]);`,
        [profIds]
      );
      profServices = servRes.rows;
    }

    const professionalsWithSchedule = professionals.map((p: any) => ({
      ...p,
      availability: availability.filter((a: any) => a.professional_id === p.id),
      service_ids: profServices.filter((s: any) => s.professional_id === p.id).map((s: any) => s.service_id),
    }));

    // 3. Pacotes de Serviços
    const packagesRes = await query(
      `SELECT 
         id, name, description, price::float as price, validity_days, sessions_count, is_active, created_at
       FROM service_packages
       WHERE organization_id = $1 AND is_active = true
       ORDER BY created_at ASC;`,
      [orgId]
    );

    // 4. Produtos de Balcão
    const productsRes = await query(
      `SELECT 
         id, name, category, price::float as price, cost_price::float as cost_price,
         stock_quantity, min_stock_alert, commission_pct::float as commission_pct,
         photo_url, is_active, created_at
       FROM products
       WHERE organization_id = $1 AND is_active = true
       ORDER BY name ASC;`,
      [orgId]
    );

    // 5. Vendas Recentes de Balcão
    const salesRes = await query(
      `SELECT 
         id, client_name, product_name, quantity,
         unit_price::float as unit_price, total_amount::float as total_amount,
         commission_amount::float as commission_amount, payment_method, notes, created_at
       FROM product_sales
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT 30;`,
      [orgId]
    );

    // 6. Controle de Fiados
    const debtsRes = await query(
      `SELECT 
         id, client_name, client_phone, description,
         total_amount::float as total_amount, paid_amount::float as paid_amount,
         status, created_at
       FROM debt_records
       WHERE organization_id = $1
       ORDER BY created_at DESC;`,
      [orgId]
    );

    // 7. Comissões
    const commissionsRes = await query(
      `SELECT 
         c.id, c.professional_id, p.name as professional_name,
         c.type, c.description, c.base_amount::float as base_amount,
         c.commission_pct::float as commission_pct,
         c.commission_amount::float as commission_amount,
         c.status, c.paid_at, c.created_at
       FROM commissions c
       JOIN professionals p ON p.id = c.professional_id
       WHERE c.organization_id = $1
       ORDER BY c.created_at DESC
       LIMIT 50;`,
      [orgId]
    );

    // 8. Clientes da Agenda (consolidados de leads e agendamentos)
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

    return NextResponse.json({
      success: true,
      settings,
      professionals: professionalsWithSchedule,
      packages: packagesRes.rows,
      products: productsRes.rows,
      sales: salesRes.rows,
      debts: debtsRes.rows,
      commissions: commissionsRes.rows,
      clients: clientsRes.rows,
    });
  } catch (error: any) {
    console.error('[Agenda Overview API] Erro ao carregar dados:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
