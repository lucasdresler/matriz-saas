import { Pool } from 'pg';

let schedulerPool: Pool | null = null;

export function getSchedulerPool(): Pool {
  if (!schedulerPool) {
    const rawUrl = process.env.DATABASE_URL || 'postgresql://matriz_admin:MatrizSecurePass2026!@postgres:5432/matriz_db?schema=public';
    // Troca o banco matriz_db por alllogic_scheduler no mesmo host/porta/credenciais
    const schedulerUrl = process.env.SCHEDULER_DATABASE_URL || rawUrl.replace('/matriz_db', '/alllogic_scheduler');
    schedulerPool = new Pool({
      connectionString: schedulerUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 4000,
    });
  }
  return schedulerPool;
}

export async function syncServiceToScheduler(
  orgSlug: string,
  service: {
    name: string;
    price: number;
    durationMinutes: number;
    description?: string;
    isActive?: boolean;
  }
) {
  if (!orgSlug) return;
  try {
    const pool = getSchedulerPool();
    const estRes = await pool.query(
      'SELECT id FROM estabelecimento WHERE slug = $1 LIMIT 1;',
      [orgSlug]
    );
    const estId = estRes.rows[0]?.id;
    if (!estId) return;

    const isActive = service.isActive !== false;
    const desc = service.description || '';

    // Desativar qualquer placeholder genérico remanescente
    await pool.query(
      "UPDATE servico SET ativo = false WHERE estabelecimento_id = $1 AND nome = 'Atendimento / Serviço';",
      [estId]
    );

    // Upsert do serviço na base pública da Agenda
    const checkServ = await pool.query(
      'SELECT id FROM servico WHERE estabelecimento_id = $1 AND LOWER(TRIM(nome)) = LOWER(TRIM($2)) LIMIT 1;',
      [estId, service.name]
    );

    let servId: number;
    if (checkServ.rows.length > 0) {
      servId = checkServ.rows[0].id;
      await pool.query(
        `UPDATE servico
         SET preco = $1, duracao_minutos = $2, descricao = $3, ativo = $4
         WHERE id = $5;`,
        [service.price, service.durationMinutes, desc, isActive, servId]
      );
    } else {
      const insRes = await pool.query(
        `INSERT INTO servico (estabelecimento_id, nome, preco, duracao_minutos, descricao, ativo)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id;`,
        [estId, service.name.trim(), service.price, service.durationMinutes, desc, isActive]
      );
      servId = insRes.rows[0]?.id;
    }

    // Vincular aos profissionais ativos do estabelecimento
    if (servId && isActive) {
      const profs = await pool.query(
        'SELECT id FROM profissional WHERE estabelecimento_id = $1 AND ativo = true;',
        [estId]
      );
      for (const p of profs.rows) {
        await pool.query(
          `INSERT INTO profissional_servico (profissional_id, servico_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING;`,
          [p.id, servId]
        );
      }
    }
  } catch (err: any) {
    console.warn('[SchedulerSync] Aviso ao sincronizar serviço:', err?.message || err);
  }
}

export async function deleteServiceFromScheduler(orgSlug: string, serviceName: string) {
  if (!orgSlug || !serviceName) return;
  try {
    const pool = getSchedulerPool();
    const estRes = await pool.query(
      'SELECT id FROM estabelecimento WHERE slug = $1 LIMIT 1;',
      [orgSlug]
    );
    const estId = estRes.rows[0]?.id;
    if (!estId) return;

    await pool.query(
      'UPDATE servico SET ativo = false WHERE estabelecimento_id = $1 AND LOWER(TRIM(nome)) = LOWER(TRIM($2));',
      [estId, serviceName]
    );
  } catch (err: any) {
    console.warn('[SchedulerSync] Aviso ao desativar serviço no scheduler:', err?.message || err);
  }
}

export async function syncProfessionalToScheduler(
  orgSlug: string,
  prof: {
    name: string;
    specialty?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
    serviceNames?: string[];
  }
) {
  if (!orgSlug) return;
  try {
    const pool = getSchedulerPool();
    const estRes = await pool.query(
      'SELECT id FROM estabelecimento WHERE slug = $1 LIMIT 1;',
      [orgSlug]
    );
    const estId = estRes.rows[0]?.id;
    if (!estId) return;

    const isActive = prof.isActive !== false;
    const specialty = prof.specialty || 'Especialista';

    const checkProf = await pool.query(
      'SELECT id FROM profissional WHERE estabelecimento_id = $1 AND LOWER(TRIM(nome)) = LOWER(TRIM($2)) LIMIT 1;',
      [estId, prof.name]
    );

    let profId: number;
    if (checkProf.rows.length > 0) {
      profId = checkProf.rows[0].id;
      await pool.query(
        `UPDATE profissional
         SET especialidade = $1, telefone = $2, email = $3, ativo = $4
         WHERE id = $5;`,
        [specialty, prof.phone || '', prof.email || '', isActive, profId]
      );
    } else {
      const insRes = await pool.query(
        `INSERT INTO profissional (estabelecimento_id, nome, especialidade, telefone, email, ativo)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id;`,
        [estId, prof.name.trim(), specialty, prof.phone || '', prof.email || '', isActive]
      );
      profId = insRes.rows[0]?.id;
    }

    // Vincular aos serviços configurados ou a todos os ativos se não especificado
    if (profId && isActive) {
      if (Array.isArray(prof.serviceNames)) {
        // Remover vínculos anteriores e re-vincular apenas os selecionados
        await pool.query('DELETE FROM profissional_servico WHERE profissional_id = $1;', [profId]);
        if (prof.serviceNames.length > 0) {
          const servs = await pool.query(
            'SELECT id, nome FROM servico WHERE estabelecimento_id = $1 AND ativo = true;',
            [estId]
          );
          const targetNames = prof.serviceNames.map((n) => n.trim().toLowerCase());
          for (const s of servs.rows) {
            if (targetNames.includes(s.nome.trim().toLowerCase())) {
              await pool.query(
                `INSERT INTO profissional_servico (profissional_id, servico_id)
                 VALUES ($1, $2)
                 ON CONFLICT DO NOTHING;`,
                [profId, s.id]
              );
            }
          }
        }
      } else {
        // Modo padrão: vincular a todos os serviços ativos
        const servs = await pool.query(
          'SELECT id FROM servico WHERE estabelecimento_id = $1 AND ativo = true;',
          [estId]
        );
        for (const s of servs.rows) {
          await pool.query(
            `INSERT INTO profissional_servico (profissional_id, servico_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING;`,
            [profId, s.id]
          );
        }
      }

      // Garantir grade semanal padrão ativa (0 a 6: Domingo a Sábado, 09:00 - 19:00)
      for (let d = 0; d <= 6; d++) {
        await pool.query(
          `INSERT INTO profissional_disponibilidade (profissional_id, dia_semana, horario_entrada, horario_saida, ativo)
           VALUES ($1, $2, '09:00', '19:00', true)
           ON CONFLICT DO NOTHING;`,
          [profId, d]
        );
      }
    }
  } catch (err: any) {
    console.warn('[SchedulerSync] Aviso ao sincronizar profissional:', err?.message || err);
  }
}

export async function syncPackageToScheduler(
  orgSlug: string,
  pkg: {
    name: string;
    description?: string;
    price: number;
    sessionsCount: number;
    validityDays: number;
    isActive?: boolean;
  }
) {
  if (!orgSlug) return;
  try {
    const pool = getSchedulerPool();
    const estRes = await pool.query(
      'SELECT id FROM estabelecimento WHERE slug = $1 LIMIT 1;',
      [orgSlug]
    );
    const estId = estRes.rows[0]?.id;
    if (!estId) return;

    // Buscar o primeiro servico ativo do estabelecimento para vincular ao pacote
    const srvRes = await pool.query(
      'SELECT id FROM servico WHERE estabelecimento_id = $1 AND ativo = true ORDER BY id ASC LIMIT 1;',
      [estId]
    );
    const servicoId = srvRes.rows[0]?.id || null;

    const isActive = pkg.isActive !== false;
    const desc = pkg.description || '';

    const checkPkg = await pool.query(
      'SELECT id FROM pacote WHERE estabelecimento_id = $1 AND LOWER(TRIM(nome)) = LOWER(TRIM($2)) LIMIT 1;',
      [estId, pkg.name]
    );

    if (checkPkg.rows.length > 0) {
      await pool.query(
        `UPDATE pacote
         SET preco = $1, quantidade_sessoes = $2, validade_dias = $3, descricao = $4, ativo = $5, servico_id = COALESCE($6, servico_id)
         WHERE id = $7;`,
        [pkg.price, pkg.sessionsCount, pkg.validityDays, desc, isActive, servicoId, checkPkg.rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO pacote (estabelecimento_id, nome, descricao, servico_id, quantidade_sessoes, preco, validade_dias, ativo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [estId, pkg.name.trim(), desc, servicoId, pkg.sessionsCount, pkg.price, pkg.validityDays, isActive]
      );
    }
  } catch (err: any) {
    console.warn('[SchedulerSync] Aviso ao sincronizar pacote:', err?.message || err);
  }
}
