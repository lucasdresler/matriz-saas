import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAgendaTables } from '@/lib/agenda-db';
import { getSchedulerPool } from '@/lib/scheduler-sync';
import { Appointment } from '@/types';

async function resolveOrganization(rawOrgId: string | null) {
  if (!rawOrgId || rawOrgId === 'org-alllogic') {
    const orgRes = await query("SELECT id, slug, name FROM organizations WHERE slug = 'alllogic' OR id = 'a0000000-0000-0000-0000-000000000001' LIMIT 1;");
    if (orgRes.rows[0]) return orgRes.rows[0];
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawOrgId || '')) {
    const orgRes = await query('SELECT id, slug, name FROM organizations WHERE id = $1 LIMIT 1;', [rawOrgId]);
    if (orgRes.rows[0]) return orgRes.rows[0];
  }
  const orgRes = await query(
    'SELECT id, slug, name FROM organizations WHERE slug = $1 OR id::text = $1 LIMIT 1;',
    [rawOrgId]
  );
  return orgRes.rows[0] || null;
}

export async function GET(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const { searchParams } = new URL(req.url);
    const rawOrgId = searchParams.get('orgId') || searchParams.get('org_id') || searchParams.get('organizationId');
    const org = await resolveOrganization(rawOrgId);

    if (!org) {
      return NextResponse.json({ success: true, appointments: [] });
    }

    const appointments: Appointment[] = [];

    // 1. Consultar motor da Agenda (alllogic_scheduler)
    try {
      const schedulerPool = getSchedulerPool();
      const estabRes = await schedulerPool.query(
        'SELECT id FROM estabelecimento WHERE slug = $1 LIMIT 1;',
        [org.slug]
      );
      const estabId = estabRes.rows[0]?.id;

      if (estabId) {
        const agRes = await schedulerPool.query(
          `SELECT 
             a.id,
             a.cliente_nome,
             a.cliente_telefone,
             a.data,
             a.hora,
             a.status,
             a.token_acesso,
             COALESCE(a.profissional_nome_snapshot, p.nome, 'Especialista') AS profissional_nome,
             COALESCE(string_agg(COALESCE(ags.nome_servico, s.nome), ', '), 'Atendimento') AS servicos_nomes,
             COALESCE(sum(COALESCE(ags.duracao_minutos, s.duracao_minutos, 30)), 30)::int AS duracao_minutos
           FROM agendamento a
           LEFT JOIN profissional p ON p.id = a.profissional_id
           LEFT JOIN agendamento_servico ags ON ags.agendamento_id = a.id
           LEFT JOIN servico s ON s.id = ags.servico_id
           WHERE a.estabelecimento_id = $1
           GROUP BY a.id, a.cliente_nome, a.cliente_telefone, a.data, a.hora, a.status, a.token_acesso, a.profissional_nome_snapshot, p.nome
           ORDER BY a.data DESC, a.hora DESC;`,
          [estabId]
        );

        for (const r of agRes.rows) {
          let mappedStatus: 'confirmed' | 'pending' | 'canceled' = 'confirmed';
          const rawStatus = (r.status || '').toLowerCase();
          if (rawStatus === 'cancelado') mappedStatus = 'canceled';
          else if (rawStatus === 'pendente') mappedStatus = 'pending';
          else mappedStatus = 'confirmed';

          appointments.push({
            id: String(r.id),
            orgId: org.id,
            leadId: String(r.id),
            leadName: r.cliente_nome || 'Cliente',
            serviceName: r.servicos_nomes || 'Atendimento',
            date: r.data || '',
            time: r.hora ? r.hora.substring(0, 5) : '09:00',
            durationMinutes: r.duracao_minutos || 30,
            status: mappedStatus,
            googleSynced: false,
            location: r.profissional_nome || 'Especialista',
          });
        }
      }
    } catch (schedErr: any) {
      console.warn('[Agenda Appointments API] Falha ao consultar scheduler:', schedErr?.message || schedErr);
    }

    // 2. Consultar agendamentos locais (matriz_db.appointments)
    try {
      const localRes = await query(
        `SELECT 
           a.id,
           a.organization_id,
           a.lead_id,
           COALESCE(l.name, 'Cliente') as lead_name,
           a.service_name,
           a.appointment_date::text as date,
           to_char(a.appointment_time, 'HH24:MI') as time,
           COALESCE(a.duration_minutes, 30) as duration_minutes,
           a.status,
           COALESCE(a.google_synced, false) as google_synced,
           a.location
         FROM appointments a
         LEFT JOIN leads l ON l.id = a.lead_id
         WHERE a.organization_id = $1
         ORDER BY a.appointment_date DESC, a.appointment_time DESC;`,
        [org.id]
      );

      for (const r of localRes.rows) {
        let mappedStatus: 'confirmed' | 'pending' | 'canceled' = 'confirmed';
        const rawStatus = (r.status || '').toLowerCase();
        if (rawStatus === 'canceled' || rawStatus === 'cancelado') mappedStatus = 'canceled';
        else if (rawStatus === 'pending' || rawStatus === 'pendente') mappedStatus = 'pending';
        else mappedStatus = 'confirmed';

        appointments.push({
          id: r.id,
          orgId: org.id,
          leadId: r.lead_id || r.id,
          leadName: r.lead_name || 'Cliente',
          serviceName: r.service_name || 'Atendimento',
          date: r.date || '',
          time: r.time || '09:00',
          durationMinutes: r.duration_minutes || 30,
          status: mappedStatus,
          googleSynced: !!r.google_synced,
          location: r.location || 'Consultório Principal',
        });
      }
    } catch (locErr: any) {
      console.warn('[Agenda Appointments API] Falha ao consultar matriz_db.appointments:', locErr?.message || locErr);
    }

    return NextResponse.json({
      success: true,
      appointments,
    });
  } catch (error: any) {
    console.error('[Agenda Appointments API] Erro no GET:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureAgendaTables();
    const body = await req.json();
    const { action = 'update_status', appointmentId, status, date, time, notes = '' } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'ID do agendamento obrigatório' }, { status: 400 });
    }

    const isSchedulerId = /^\d+$/.test(String(appointmentId).trim());

    if (action === 'reschedule') {
      if (!date || !time) {
        return NextResponse.json({ error: 'Nova data e horário são obrigatórios' }, { status: 400 });
      }

      if (isSchedulerId) {
        const pool = getSchedulerPool();
        await pool.query(
          `UPDATE agendamento
           SET data = $1, hora = $2, status = 'agendado'
           WHERE id = $3;`,
          [date, time, parseInt(appointmentId, 10)]
        );
      } else {
        await query(
          `UPDATE appointments
           SET appointment_date = $1,
               appointment_time = $2,
               status = 'confirmed',
               notes = COALESCE(notes, '') || ' [Reagendado para ' || $1 || ' ' || $2 || ']'
           WHERE id = $3;`,
          [date, time, appointmentId]
        );
      }

      return NextResponse.json({ success: true });
    }

    // Atualizar status (confirmed, completed, canceled, pending)
    if (isSchedulerId) {
      let schedulerStatus = 'agendado';
      if (status === 'canceled') schedulerStatus = 'cancelado';
      else if (status === 'completed') schedulerStatus = 'concluido';
      else if (status === 'confirmed') schedulerStatus = 'confirmado';

      const pool = getSchedulerPool();
      await pool.query(
        `UPDATE agendamento
         SET status = $1
         WHERE id = $2;`,
        [schedulerStatus, parseInt(appointmentId, 10)]
      );
    } else {
      await query(
        `UPDATE appointments
         SET status = $1
         WHERE id = $2;`,
        [status || 'confirmed', appointmentId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Agenda Appointments API] Erro no POST:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
