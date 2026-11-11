import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'agillex_session';
const AUTH_SECRET = process.env.AUTH_SECRET || 'AllLogicAgillexHubSecretKey2026MasterKey!';

async function verifyEdgeToken(token: string): Promise<boolean> {
  try {
    if (!token || !token.includes('.')) return false;
    const [b64Data, b64Sig] = token.split('.');
    if (!b64Data || !b64Sig) return false;

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
    if (!isValid) return false;

    const jsonStr = Buffer.from(b64Data, 'base64url').toString('utf-8');
    const payload = JSON.parse(jsonStr);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Se o usuário já está autenticado e tenta acessar /login, redireciona para a home ou página solicitada
  if (pathname === '/login') {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const isAuthenticated = sessionCookie ? await verifyEdgeToken(sessionCookie) : false;
    if (req.nextUrl.searchParams.get('switch') === 'true') {
      return NextResponse.next();
    }
    if (isAuthenticated) {
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
  const isAuthenticated = sessionCookie ? await verifyEdgeToken(sessionCookie) : false;

  if (!isAuthenticated) {
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
