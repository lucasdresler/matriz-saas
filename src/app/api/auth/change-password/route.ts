import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME, verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const payload = await verifySessionToken(token);
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'A nova senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'A confirmação de senha não confere com a nova senha' },
        { status: 400 }
      );
    }

    const userEmail = payload.email.trim().toLowerCase();

    // 1. Buscar usuário no banco
    const res = await query(
      'SELECT id, email, password_hash FROM auth.users WHERE LOWER(email) = $1 LIMIT 1;',
      [userEmail]
    );

    const userRow = res.rows[0];
    let isCurrentValid = false;

    if (userRow?.password_hash) {
      isCurrentValid = verifyPassword(currentPassword, userRow.password_hash);
    }

    // Fallback: se for a senha mestra padrão
    const masterEmail = (process.env.ADMIN_EMAIL || 'lucasdresler@live.com').toLowerCase();
    const masterPass = process.env.ADMIN_PASSWORD || 'AllLogic2026!';
    if (!isCurrentValid && userEmail === masterEmail && currentPassword === masterPass) {
      isCurrentValid = true;
    }

    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 400 }
      );
    }

    // 2. Gerar novo hash e atualizar banco
    const newHash = hashPassword(newPassword);

    await query(`
      INSERT INTO auth.users (id, email, password_hash, name, role, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = $3, updated_at = NOW();
    `, [
      userRow?.id || payload.userId || 'a0000000-0000-0000-0000-000000000001',
      userEmail,
      newHash,
      payload.name || 'Lucas Dresler',
      payload.role || 'super_admin'
    ]);

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso!',
    });
  } catch (error: any) {
    console.error('[Change Password Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao alterar senha' },
      { status: 500 }
    );
  }
}
