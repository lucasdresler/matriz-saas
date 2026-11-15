import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAgendaTables } from '@/lib/agenda-db';

export async function POST(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const body = await req.json();
    const { action = 'update_status', appointmentId, status, date, time, notes = '' } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'ID do agendamento obrigatório' }, { status: 400 });
    }

    if (action === 'reschedule') {
      if (!date || !time) {
        return NextResponse.json({ error: 'Nova data e horário são obrigatórios' }, { status: 400 });
      }

      await query(
        `UPDATE appointments
         SET appointment_date = $1,
             appointment_time = $2,
             status = 'confirmed',
             notes = COALESCE(notes, '') || ' [Reagendado para ' || $1 || ' ' || $2 || ']'
         WHERE id = $3;`,
        [date, time, appointmentId]
      );

      return NextResponse.json({ success: true });
    }

    // Atualizar status (confirmed, completed, canceled, pending)
    await query(
      `UPDATE appointments
       SET status = $1
       WHERE id = $2;`,
      [status || 'confirmed', appointmentId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Agenda Appointments API] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
