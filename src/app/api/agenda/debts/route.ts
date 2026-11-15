import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAgendaTables } from '@/lib/agenda-db';

export async function POST(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const body = await req.json();
    const { action = 'create_debt' } = body;

    let orgId = body.organizationId;
    if (!orgId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId)) {
      const orgRes = await query('SELECT id FROM organizations LIMIT 1;');
      orgId = orgRes.rows[0]?.id;
    }

    if (action === 'pay_debt') {
      // Registrar pagamento / abatimento de fiado
      const { debtId, amount, paymentMethod = 'pix', notes = '' } = body;
      const numAmount = parseFloat(String(amount)) || 0;

      if (!debtId || numAmount <= 0) {
        return NextResponse.json({ error: 'ID do débito e valor válido são obrigatórios' }, { status: 400 });
      }

      await query(
        `INSERT INTO debt_payments (debt_id, amount, payment_method, notes)
         VALUES ($1, $2, $3, $4);`,
        [debtId, numAmount, paymentMethod, notes.trim()]
      );

      // Atualizar o paid_amount e o status no debt_records
      const debtRes = await query('SELECT total_amount, paid_amount FROM debt_records WHERE id = $1;', [debtId]);
      if (debtRes.rows.length > 0) {
        const total = parseFloat(debtRes.rows[0].total_amount) || 0;
        const currentPaid = parseFloat(debtRes.rows[0].paid_amount) || 0;
        const newPaid = currentPaid + numAmount;
        const newStatus = newPaid >= total ? 'quitado' : 'parcial';

        await query(
          'UPDATE debt_records SET paid_amount = $1, status = $2 WHERE id = $3;',
          [newPaid, newStatus, debtId]
        );
      }

      return NextResponse.json({ success: true });
    }

    // Criar novo registro de fiado
    const { clientName, clientPhone = '', description, totalAmount } = body;

    if (!clientName || !clientName.trim() || !description || !description.trim()) {
      return NextResponse.json({ error: 'Nome do cliente e descrição são obrigatórios' }, { status: 400 });
    }

    const numTotal = parseFloat(String(totalAmount)) || 0;

    const insRes = await query(
      `INSERT INTO debt_records (
         organization_id, client_name, client_phone, description, total_amount, paid_amount, status
       ) VALUES ($1, $2, $3, $4, $5, 0.00, 'aberto')
       RETURNING id;`,
      [orgId, clientName.trim(), clientPhone.trim(), description.trim(), numTotal]
    );

    return NextResponse.json({ success: true, debtId: insRes.rows[0]?.id });
  } catch (error: any) {
    console.error('[Agenda Debts API] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
