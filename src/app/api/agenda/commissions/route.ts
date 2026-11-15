import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAgendaTables } from '@/lib/agenda-db';

export async function POST(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const body = await req.json();
    const { action = 'mark_paid', commissionId, professionalId, organizationId } = body;

    let orgId = organizationId;
    if (!orgId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId)) {
      const orgRes = await query('SELECT id FROM organizations LIMIT 1;');
      orgId = orgRes.rows[0]?.id;
    }

    if (action === 'mark_paid') {
      if (commissionId) {
        await query(
          "UPDATE commissions SET status = 'pago', paid_at = NOW() WHERE id = $1 AND organization_id = $2;",
          [commissionId, orgId]
        );
      } else if (professionalId) {
        // Quitar todas as comissões pendentes desse profissional
        await query(
          "UPDATE commissions SET status = 'pago', paid_at = NOW() WHERE professional_id = $1 AND organization_id = $2 AND status = 'pendente';",
          [professionalId, orgId]
        );
      }
      return NextResponse.json({ success: true });
    }

    // Lançamento manual de comissão
    const {
      description,
      baseAmount = 0,
      commissionPct = 0,
      commissionAmount,
      type = 'servico',
    } = body;

    const base = parseFloat(String(baseAmount)) || 0;
    const pct = parseFloat(String(commissionPct)) || 0;
    const totalComm = commissionAmount ? parseFloat(String(commissionAmount)) : (base * pct) / 100;

    await query(
      `INSERT INTO commissions (
         organization_id, professional_id, type, description,
         base_amount, commission_pct, commission_amount, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendente');`,
      [orgId, professionalId, type, description.trim(), base, pct, totalComm]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Agenda Commissions API] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
