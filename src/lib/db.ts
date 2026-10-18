import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://matriz_admin:MatrizSecurePass2026!@postgres:5432/matriz_db?schema=public';
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const p = getDbPool();
  return p.query(text, params);
}
