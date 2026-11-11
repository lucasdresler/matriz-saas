import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const SESSION_COOKIE_NAME = 'agillex_session';
const AUTH_SECRET = process.env.AUTH_SECRET || 'AllLogicAgillexHubSecretKey2026MasterKey!';

type SessionPayload = {
  userId?: string;
  email?: string;
  role?: string;
  exp?: number;
};

async function verifyEdgeToken(token: string): Promise<SessionPayload | null> {
  try {
    if (!token || !token.includes('.')) return null;
    const [b64Data, b64Sig] = token.split('.');
    if (!b64Data || !b64Sig) return null;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(AUTH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBuf = Buffer.from(b64Sig, 'base64url');
    const isValid = await crypto.subtle.verify('HMAC', key, sigBuf, enc.encode(b64Data));
    if (!isValid) return null;

    const payload = JSON.parse(Buffer.from(b64Data, 'base64url').toString('utf-8')) as SessionPayload;

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Se o usuário já está autenticado e tenta acessar /login, redireciona para a home ou página solicitada
  if (pathname === '/login') {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = sessionCookie ? await verifyEdgeToken(sessionCookie) : null;
    if (req.nextUrl.searchParams.get('switch') === 'true') {
      return NextResponse.next();
    }
    if (session) {
      const redirectPath = req.nextUrl.searchParams.get('redirect') || '/';
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }
    return NextResponse.next();
  }

  // 2. Rotas estáticas e públicas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/webhooks') || // Webhooks WhatsApp e Asaas usam suas próprias chaves
    pathname.startsWith('/checkout') || // Checkout público de clientes
    pathname.startsWith('/trial-expired') ||
    pathname.startsWith('/api/checkout') ||
    pathname.startsWith('/api/auth') // Rotas de login/logout
  ) {
    return NextResponse.next();
  }

  // 3. Autenticação por x-api-key para integrações internas (n8n, Evolution, Agentes)
  const apiKey = req.headers.get('x-api-key');
  if (apiKey && apiKey === (process.env.API_SECRET_KEY || 'MatrizSuperSecretApiKey2026')) {
    return NextResponse.next();
  }

  // 4. Permitir GET /api/agent-config para sincronização do n8n / Agentes
  if (pathname === '/api/agent-config' && req.method === 'GET') {
    return NextResponse.next();
  }

  // 3. Verificar cookie de sessão para rotas protegidas
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifyEdgeToken(sessionCookie) : null;

  if (!session) {
    // Se for uma requisição de API interna, retorna 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Redireciona para /login preservando a URL de destino
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (session.role !== 'super_admin' && session.userId && session.email) {
    try {
      const accessResult = await query(
        `SELECT
           EXISTS (
             SELECT 1
             FROM public.organization_members om
             JOIN public.organizations o ON o.id = om.organization_id
             WHERE om.user_id = $1
               AND o.slug <> 'alllogic'
               AND (
                 NOT EXISTS (
                   SELECT 1
                   FROM public.leads l
                   WHERE l.organization_id = o.id
                     AND LOWER(l.email) = LOWER($2)
                     AND l.service_interest LIKE 'Trial 14 dias - %'
                 )
                 OR o.created_at > NOW() - INTERVAL '14 days'
               )
           ) AS has_access,
           EXISTS (
             SELECT 1
             FROM public.organization_members om
             JOIN public.organizations o ON o.id = om.organization_id
             JOIN public.leads l ON l.organization_id = o.id
             WHERE om.user_id = $1
               AND o.slug <> 'alllogic'
               AND LOWER(l.email) = LOWER($2)
               AND l.service_interest LIKE 'Trial 14 dias - %'
               AND o.created_at <= NOW() - INTERVAL '14 days'
           ) AS has_expired_trial;`,
        [session.userId, session.email]
      );
      const { has_access: hasAccess, has_expired_trial: hasExpiredTrial } = accessResult.rows[0] as {
        has_access: boolean;
        has_expired_trial: boolean;
      };

      if (hasExpiredTrial && !hasAccess) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'TRIAL_EXPIRED', message: 'O período de teste terminou. Seus dados continuam preservados.' },
            { status: 402 }
          );
        }
        return NextResponse.redirect(new URL('/trial-expired', req.url));
      }
    } catch (error) {
      console.error('[Trial Access] Falha ao verificar validade do teste:', error);
      return pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Não foi possível verificar o status da conta.' }, { status: 503 })
        : new NextResponse('Não foi possível verificar o status da conta. Tente novamente em instantes.', { status: 503 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware em todas as rotas exceto arquivos estáticos
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
