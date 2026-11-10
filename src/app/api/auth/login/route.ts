import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, signSessionToken, SESSION_COOKIE_NAME, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe = true } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Buscar usuário no banco de dados
    let userRow: any = null;
    try {
      const res = await query(
        'SELECT id, email, password_hash, name, role FROM auth.users WHERE LOWER(email) = $1 LIMIT 1;',
        [cleanEmail]
      );
      if (res.rows.length > 0) {
        userRow = res.rows[0];
      }
    } catch (dbErr) {
      console.warn('[Auth Login] Erro ao consultar tabela auth.users:', dbErr);
    }

    let isValid = false;
    let userData = {
      id: userRow?.id || 'a0000000-0000-0000-0000-000000000001',
      email: cleanEmail,
      name: userRow?.name || 'Administrador',
      role: userRow?.role || 'admin',
    };

    if (userRow && userRow.password_hash) {
      isValid = verifyPassword(password, userRow.password_hash);
    }

    // 2. Fallback de Administrador Master se o banco estiver vazio ou credenciais master
    const masterEmail = (process.env.ADMIN_EMAIL || 'lucasdresler@live.com').toLowerCase();
    const masterPass = process.env.ADMIN_PASSWORD || 'AllLogic2026!';

    if (!isValid && cleanEmail === masterEmail && password === masterPass) {
      isValid = true;
      userData = {
        id: 'a0000000-0000-0000-0000-000000000001',
        email: masterEmail,
        name: 'Lucas Dresler',
        role: 'super_admin',
      };

      // Grava ou atualiza no banco auth.users para garantir persistência
      try {
        const hashed = hashPassword(masterPass);
        await query(`
          INSERT INTO auth.users (id, email, password_hash, name, role, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (email) DO UPDATE SET password_hash = $3, updated_at = NOW();
        `, [userData.id, masterEmail, hashed, userData.name, userData.role]);
      } catch (upsertErr) {
        console.warn('[Auth Login] Não foi possível persistir master admin no banco:', upsertErr);
      }
    }

    // 3. Fallback adicional para login com "admin@alllogiconline.com.br" e "admin@agillex.com.br"
    if (!isValid && (cleanEmail === 'admin@alllogiconline.com.br' || cleanEmail === 'admin@agillex.com.br') && password === masterPass) {
      isValid = true;
      userData = {
        id: 'a0000000-0000-0000-0000-000000000001',
        email: cleanEmail,
        name: 'Administrador Agillex',
        role: 'super_admin',
      };
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos. Verifique suas credenciais.' },
        { status: 401 }
      );
    }

    // 4. Gerar Token de Sessão Assinado
    const token = await signSessionToken({
      userId: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    });

    const response = NextResponse.json({
      success: true,
      user: userData,
    });

    // 5. Configurar Cookie HTTP-only
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 dias ou 24h
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (error: any) {
    console.error('[Auth Login] Erro interno:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno no servidor de autenticação' },
      { status: 500 }
    );
  }
}
