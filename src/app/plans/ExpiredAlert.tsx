'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ExpiredAlert() {
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  if (!isExpired) {
    return (
      <Link href="/" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.85rem' }}>
        ← Voltar ao Hub
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.85rem' }}>
        ← Fazer Login
      </Link>
      <div
        style={{
          maxWidth: '820px',
          margin: '28px auto 0',
          padding: '20px 24px',
          borderRadius: '16px',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          textAlign: 'left',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ fontSize: '2rem' }}>⏳</div>
        <div>
          <div style={{ color: '#F59E0B', fontWeight: 800, fontSize: '1.05rem', marginBottom: '4px' }}>
            Período de Teste Gratuito de 14 Dias Concluído
          </div>
          <div style={{ color: '#CBD5E1', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Todos os seus dados, cadastros e histórico continuam <strong>100% seguros e preservados</strong>.
            Escolha abaixo o produto ideal da Família Agillex para reativar seu acesso instantaneamente.
          </div>
        </div>
      </div>
    </>
  );
}
