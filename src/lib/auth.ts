import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'agillex_session';
const AUTH_SECRET = process.env.AUTH_SECRET || 'AllLogicAgillexHubSecretKey2026MasterKey!';

/**
 * Cria hash seguro da senha com scrypt e salt criptográfico
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifica se a senha corresponde ao hash armazenado
 */
export function verifyPassword(password: string, combined: string): boolean {
  try {
    const [salt, key] = combined.split(':');
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuf = Buffer.from(key, 'hex');
    if (keyBuf.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(keyBuf, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Gera token assinado com HMAC-SHA256 (compatível com Edge Runtime e Node.js)
 */
export async function signSessionToken(payload: Record<string, any>): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const payloadString = JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 dias
  });

  const b64Data = Buffer.from(payloadString).toString('base64url');
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(b64Data));
  const b64Sig = Buffer.from(signature).toString('base64url');

  return `${b64Data}.${b64Sig}`;
}

/**
 * Valida o token de sessão e retorna o payload decodificado
 */
export async function verifySessionToken(token: string): Promise<Record<string, any> | null> {
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

    const jsonStr = Buffer.from(b64Data, 'base64url').toString('utf-8');
    const payload = JSON.parse(jsonStr);

    // Checar expiração
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
